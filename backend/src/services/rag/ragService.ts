/**
 * RAG Service
 * Orchestrates retrieval-augmented generation flow:
 * 1. Generate query embedding
 * 2. Retrieve similar context from knowledge base
 * 3. Generate answer using Bedrock Claude with retrieved context
 */

import { generateEmbedding, similaritySearch } from "./embeddingService";
import {
  BedrockRuntimeClient,
  InvokeModelCommand
} from "@aws-sdk/client-bedrock-runtime";
import type {
  RAGQueryInput,
  RAGQueryResult,
  SimilaritySearchResult,
  EmbeddingSourceType
} from "../../types/rag";

/**
 * Perform RAG query: retrieve context and generate answer
 * TODO: Integrate with Amazon Bedrock Claude 3.5 Sonnet for answer generation
 * 
 * @param input - RAG query input
 * @returns Query result with answer and retrieved contexts
 */
export async function performRAGQuery(
  input: RAGQueryInput
): Promise<RAGQueryResult> {
  const startTime = Date.now();
  
  // Step 1: Generate embedding for the question
  const queryEmbedding = await generateEmbedding(input.question, input.language);
  
  // Step 2: Retrieve similar context from knowledge base
  const retrievedContexts = await similaritySearch(queryEmbedding, {
    top_k: input.top_k || 5,
    source_types: input.source_types,
    language: input.language,
    min_similarity: input.min_similarity || 0.5
  });
  
  // Step 3: Generate answer using Bedrock Claude with retrieved context
  const answer = await generateAnswerWithContext(
    input.question,
    input.language,
    retrievedContexts
  );
  
  const responseTime = Date.now() - startTime;
  
  return {
    question: input.question,
    retrieved_contexts: retrievedContexts,
    answer,
    metadata: {
      response_time_ms: responseTime
    }
  };
}

/**
 * Generate answer using Bedrock Claude 3.5 Sonnet with retrieved context
 * TODO: Replace mock with actual Bedrock API call
 * 
 * @param question - User's question
 * @param language - Response language
 * @param contexts - Retrieved similar contexts
 * @returns Generated answer text
 */
async function generateAnswerWithContext(
  question: string,
  language: string,
  contexts: SimilaritySearchResult[]
): Promise<string> {
  const useBedrock = process.env.USE_BEDROCK_RAG === "true";
  const modelId = process.env.BEDROCK_CHAT_MODEL_ID;
  const region = process.env.AWS_REGION || "us-east-1";

  const prompt = buildRAGPrompt(question, contexts, language);

  if (useBedrock && modelId) {
    try {
      const client = new BedrockRuntimeClient({ region });
      const command = new InvokeModelCommand({
        modelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 800,
          temperature: 0.3,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt
                }
              ]
            }
          ]
        })
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

      // Anthropic responses on Bedrock put text inside content[0].text
      const content = parsed.content;
      if (Array.isArray(content) && content.length > 0 && content[0].text) {
        return content[0].text as string;
      }

      if (typeof parsed.output_text === "string") {
        return parsed.output_text;
      }

      console.warn(
        "Unexpected Claude response shape from Bedrock, falling back to mock answer"
      );
    } catch (error) {
      console.error(
        "Error calling Bedrock Claude model, falling back to mock answer",
        error
      );
    }
  }

  // Fallback: previous mock implementation so the app continues to work
  console.warn(
    "⚠️ Using mock RAG answer. Configure USE_BEDROCK_RAG=true and BEDROCK_CHAT_MODEL_ID to enable real Claude responses."
  );

  const contextTexts = contexts
    .map((ctx, idx) => `[Context ${idx + 1}]: ${ctx.embedding.content_text}`)
    .join("\n\n");

  const languageLabels: Record<string, string> = {
    mr: "मराठी",
    hi: "हिंदी",
    en: "English"
  };

  return `[Mock RAG Response in ${languageLabels[language] || "English"}]\n\n` +
    `Question: ${question}\n\n` +
    `Based on ${contexts.length} relevant context(s) retrieved from the knowledge base:\n\n` +
    `${contextTexts}\n\n` +
    `[In production, Claude 3.5 Sonnet will generate a comprehensive, contextual answer here]`;
}

/**
 * Build RAG prompt for Claude (helper function for future Bedrock integration)
 */
function buildRAGPrompt(
  question: string,
  contexts: SimilaritySearchResult[],
  language: string
): string {
  const contextTexts = contexts
    .map((ctx, idx) => 
      `[Context ${idx + 1} - ${ctx.similarity_score.toFixed(2)} similarity]:\n${ctx.embedding.content_text}`
    )
    .join("\n\n");
  
  const languageInstructions: Record<string, string> = {
    mr: "कृपया संपूर्ण उत्तर मराठीत द्या. तांत्रिक शब्दांसाठी सोपी मराठी स्पष्टीकरणे वापरा.",
    hi: "कृपया पूरा उत्तर हिंदी में दें। तकनीकी शब्दों के लिए सरल हिंदी में समझाएँ।",
    en: "Please respond entirely in English, using simple language suitable for Indian farmers."
  };

  const safetyInstructions = `
Safety rules:
- Do NOT give medical, financial, or legal advice.
- If the question is not about agriculture, politely refuse and steer back to farming topics.
- If you are not sure or context is missing, say you are not fully sure and suggest contacting a local agriculture officer.
`.trim();

  return `You are Kisan Setu AI, a multilingual agricultural advisor for small and marginal farmers in India.

${languageInstructions[language] || languageInstructions.en}

${safetyInstructions}

User question:
${question}

Retrieved context from Kisan Setu knowledge base (soil cards, schemes, mandi prices, advisory notes):
${contextTexts || "[No highly similar context found; rely on your general agricultural knowledge and be explicit about uncertainty.]"}

Answering style requirements:
- Start with a 1–2 line direct answer.
- Then give 3–7 short bullet points with practical, step-by-step guidance.
- Mention any relevant scheme names or mandi details when the context includes them.
- Keep sentences short and easy to read on a mobile screen.

Now produce the final answer only. Do not repeat the question or the context.`;
}

/**
 * Ingest content into RAG knowledge base
 * Generates embeddings and stores them for future retrieval
 */
export async function ingestContentForRAG(
  content: string,
  sourceType: EmbeddingSourceType,
  sourceId?: string,
  language: string = "en",
  metadata?: Record<string, unknown>
): Promise<void> {
  // Generate embedding
  const embedding = await generateEmbedding(content, language as "mr" | "hi" | "en");
  
  // Store in database
  const { storeEmbedding } = await import("./embeddingService");
  await storeEmbedding({
    source_type: sourceType,
    source_id: sourceId,
    content_text: content,
    language: language as "mr" | "hi" | "en",
    embedding,
    metadata
  });
}
