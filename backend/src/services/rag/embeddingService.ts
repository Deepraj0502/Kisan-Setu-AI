/**
 * Embedding Service
 * Handles vector embedding generation and storage for RAG
 * Ready for Amazon Bedrock Titan Embeddings integration
 */

import { getPool } from "../../db/client";
import {
  BedrockRuntimeClient,
  InvokeModelCommand
} from "@aws-sdk/client-bedrock-runtime";
import type {
  CreateEmbeddingInput,
  KnowledgeEmbedding,
  SimilaritySearchResult,
  EmbeddingSourceType,
  LanguageCode
} from "../../types/rag";

// Target dimension must match the pgvector column definition in 001_rag_schema.sql
const VECTOR_DIMENSIONS = 1536;

/**
 * Generate embedding vector from text using Amazon Bedrock.
 * Normalises the output length to VECTOR_DIMENSIONS so it is always
 * compatible with the pgvector(1536) column, even if the underlying
 * model returns a different dimension (e.g. 1024 for Titan v2).
 */
export async function generateEmbedding(
  text: string,
  language: LanguageCode = "en"
): Promise<number[]> {
  const useBedrock = process.env.USE_BEDROCK_RAG === "true";
  const modelId = process.env.BEDROCK_EMBEDDING_MODEL_ID;
  const region = process.env.AWS_REGION || "us-east-1";

  if (useBedrock && modelId) {
    try {
      const client = new BedrockRuntimeClient({ region });
      const body = JSON.stringify({
        inputText: text
      });

      const command = new InvokeModelCommand({
        modelId,
        contentType: "application/json",
        accept: "application/json",
        body
      });

      const response = await client.send(command);
      const rawBody = response.body;

      let textBody = "";
      if (typeof rawBody === "string") {
        textBody = rawBody;
      } else if (rawBody instanceof Uint8Array) {
        textBody = new TextDecoder("utf-8").decode(rawBody);
      } else if (rawBody && (rawBody as any).transformToString) {
        textBody = await (rawBody as any).transformToString();
      } else {
        textBody = String(rawBody ?? "");
      }

      const parsed = JSON.parse(textBody);
      const embeddingRaw: unknown =
        parsed.embedding ?? parsed.embeddings ?? parsed.vector;

      if (Array.isArray(embeddingRaw)) {
        let embedding = (embeddingRaw as unknown[]).map((v) => Number(v) || 0);

        const originalLength = embedding.length;
        if (originalLength !== VECTOR_DIMENSIONS) {
          // Adjust length to match pgvector schema
          if (originalLength > VECTOR_DIMENSIONS) {
            embedding = embedding.slice(0, VECTOR_DIMENSIONS);
          } else {
            const padded = new Array(VECTOR_DIMENSIONS).fill(0);
            for (let i = 0; i < originalLength; i++) {
              padded[i] = embedding[i];
            }
            embedding = padded;
          }
          console.warn(
            `Embedding length ${originalLength} adjusted to ${VECTOR_DIMENSIONS} to match pgvector schema.`
          );
        }

        return embedding;
      }

      console.warn(
        "Unexpected embedding response shape from Bedrock, falling back to mock vector"
      );
    } catch (error) {
      console.error(
        "Error calling Bedrock embedding model, falling back to mock vector",
        error
      );
    }
  }

  // Fallback: return deterministic-length zero vector so the rest of the
  // pipeline keeps working even if Bedrock/env is not configured.
  console.warn(
    "⚠️ Using mock embedding vector. Configure USE_BEDROCK_RAG=true and BEDROCK_EMBEDDING_MODEL_ID to enable real embeddings."
  );
  return new Array(VECTOR_DIMENSIONS).fill(0);
}

/**
 * Store an embedding in the database
 */
export async function storeEmbedding(
  input: CreateEmbeddingInput
): Promise<KnowledgeEmbedding> {
  const pool = getPool();
  
  const result = await pool.query<KnowledgeEmbedding>(
    `INSERT INTO knowledge_embeddings 
     (source_type, source_id, content_text, language, embedding, metadata)
     VALUES ($1, $2, $3, $4, $5::vector, $6::jsonb)
     RETURNING *`,
    [
      input.source_type,
      input.source_id || null,
      input.content_text,
      input.language || "en",
      JSON.stringify(input.embedding), // pgvector expects array as JSON string
      input.metadata ? JSON.stringify(input.metadata) : null
    ]
  );
  
  return result.rows[0];
}

/**
 * Perform similarity search using cosine distance
 * 
 * @param queryEmbedding - Query vector (1536 dimensions)
 * @param options - Search options
 * @returns Array of similar embeddings with scores
 */
export async function similaritySearch(
  queryEmbedding: number[],
  options: {
    top_k?: number;
    source_types?: EmbeddingSourceType[];
    language?: LanguageCode;
    min_similarity?: number;
  } = {}
): Promise<SimilaritySearchResult[]> {
  const pool = getPool();
  const top_k = options.top_k || 5;
  const min_similarity = options.min_similarity || 0.5;
  
  // Build WHERE clause dynamically
  const conditions: string[] = [];
  const params: unknown[] = [JSON.stringify(queryEmbedding), top_k];
  let paramIndex = 3;
  
  if (options.source_types && options.source_types.length > 0) {
    conditions.push(`source_type = ANY($${paramIndex}::text[])`);
    params.push(options.source_types);
    paramIndex++;
  }
  
  if (options.language) {
    conditions.push(`language = $${paramIndex}`);
    params.push(options.language);
    paramIndex++;
  }
  
  const whereClause = conditions.length > 0 
    ? `WHERE ${conditions.join(" AND ")}`
    : "";
  
  // Use cosine similarity (1 - cosine_distance)
  const query = `
    SELECT 
      *,
      1 - (embedding <=> $1::vector) as similarity_score
    FROM knowledge_embeddings
    ${whereClause}
    ORDER BY embedding <=> $1::vector
    LIMIT $2
  `;
  
  const result = await pool.query<KnowledgeEmbedding & { similarity_score: number }>(
    query,
    params
  );
  
  // Filter by minimum similarity and map to result type
  return result.rows
    .filter(row => row.similarity_score >= min_similarity)
    .map(row => ({
      embedding: {
        id: row.id,
        source_type: row.source_type,
        source_id: row.source_id || undefined,
        content_text: row.content_text,
        language: row.language,
        embedding: [], // Don't return full vector in results
        metadata: row.metadata as Record<string, unknown> | undefined,
        created_at: row.created_at
      },
      similarity_score: row.similarity_score
    }));
}

/**
 * Batch store embeddings (useful for bulk ingestion)
 */
export async function batchStoreEmbeddings(
  inputs: CreateEmbeddingInput[]
): Promise<KnowledgeEmbedding[]> {
  const pool = getPool();
  const results: KnowledgeEmbedding[] = [];
  
  // Use a transaction for batch insert
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    for (const input of inputs) {
      const result = await client.query<KnowledgeEmbedding>(
        `INSERT INTO knowledge_embeddings 
         (source_type, source_id, content_text, language, embedding, metadata)
         VALUES ($1, $2, $3, $4, $5::vector, $6::jsonb)
         RETURNING *`,
        [
          input.source_type,
          input.source_id || null,
          input.content_text,
          input.language || "en",
          JSON.stringify(input.embedding),
          input.metadata ? JSON.stringify(input.metadata) : null
        ]
      );
      results.push(result.rows[0]);
    }
    
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  
  return results;
}

/**
 * Delete embeddings by source (useful for updating content)
 */
export async function deleteEmbeddingsBySource(
  source_type: EmbeddingSourceType,
  source_id: string
): Promise<number> {
  const pool = getPool();
  const result = await pool.query(
    `DELETE FROM knowledge_embeddings 
     WHERE source_type = $1 AND source_id = $2`,
    [source_type, source_id]
  );
  
  return result.rowCount || 0;
}
