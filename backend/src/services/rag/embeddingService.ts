/**
 * Embedding Service
 * Handles vector embedding generation and storage for RAG
 * Ready for Amazon Bedrock Titan Embeddings integration
 */

import { getPool } from "../../db/client";
import type {
  CreateEmbeddingInput,
  KnowledgeEmbedding,
  SimilaritySearchResult,
  EmbeddingSourceType,
  LanguageCode
} from "../../types/rag";

/**
 * Generate embedding vector from text using Amazon Bedrock
 * TODO: Integrate with Amazon Bedrock Titan Embeddings model
 * 
 * @param text - Text to embed
 * @param language - Language of the text
 * @returns Vector embedding (1536 dimensions)
 */
export async function generateEmbedding(
  text: string,
  language: LanguageCode = "en"
): Promise<number[]> {
  // TODO: Replace with actual Bedrock Titan Embeddings API call
  // For now, return a mock vector (all zeros) - this will be replaced
  // when AWS credits are available
  
  console.warn("⚠️  Mock embedding generation - replace with Bedrock Titan Embeddings");
  
  // Mock: Return a zero vector of correct dimensions
  // In production, this will call:
  // const bedrock = new BedrockRuntimeClient({ region: 'us-east-1' });
  // const response = await bedrock.send(new InvokeModelCommand({
  //   modelId: 'amazon.titan-embed-text-v1',
  //   body: JSON.stringify({ inputText: text })
  // }));
  // return JSON.parse(response.body.transformToString()).embedding;
  
  return new Array(1536).fill(0);
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
