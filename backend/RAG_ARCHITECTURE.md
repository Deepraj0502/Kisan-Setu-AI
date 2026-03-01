# RAG Architecture for Kisan Setu AI

## Overview

This document describes the Retrieval-Augmented Generation (RAG) architecture designed for the Agri-OS intelligence system. The RAG system enables the AI agent to provide contextual, data-grounded agricultural advice by retrieving relevant information from a knowledge base before generating responses.

## Architecture Components

### 1. Database Schema (PostgreSQL + pgvector + PostGIS)

#### Core Tables

- **`farmer_profiles`**: Stores farmer information including location (PostGIS), language preferences, and contact details
- **`soil_health_cards`**: OCR'd soil health card data extracted via Amazon Textract
- **`government_schemes`**: Subsidy and scheme information for proactive matching
- **`mandi_data`**: Market price data for predictive intelligence
- **`knowledge_embeddings`**: Vector embeddings (pgvector) for semantic search
- **`query_history`**: Logs all queries for analytics and learning
- **`scheme_matches`**: Tracks farmer-scheme associations for proactive notifications

#### Vector Embeddings

- **Model**: Amazon Bedrock Titan Embeddings (`amazon.titan-embed-text-v1`)
- **Dimensions**: 1536
- **Index**: HNSW (Hierarchical Navigable Small World) for fast similarity search
- **Similarity Metric**: Cosine distance

### 2. RAG Flow

```
User Question (Marathi/Hindi/English)
    ↓
Generate Query Embedding (Bedrock Titan)
    ↓
Similarity Search in knowledge_embeddings (pgvector)
    ↓
Retrieve Top-K Similar Contexts
    ↓
Build Prompt with Contexts
    ↓
Generate Answer (Bedrock Claude 3.5 Sonnet)
    ↓
Return Response to User
```

### 3. Service Layer

#### `embeddingService.ts`
- `generateEmbedding()`: Converts text to vector using Bedrock Titan
- `storeEmbedding()`: Stores embeddings in database
- `similaritySearch()`: Performs cosine similarity search
- `batchStoreEmbeddings()`: Bulk ingestion support

#### `ragService.ts`
- `performRAGQuery()`: Main RAG orchestration
- `generateAnswerWithContext()`: Generates answer using Claude with retrieved context
- `ingestContentForRAG()`: Ingests new content into knowledge base

### 4. Knowledge Sources

#### Soil Health Cards
- **Source**: Amazon Textract OCR
- **Content**: Parsed soil test results, recommendations
- **Use Case**: Personalized fertilizer and crop advice

#### Government Schemes
- **Source**: Manual curation + API ingestion
- **Content**: Scheme descriptions, eligibility, benefits
- **Use Case**: Proactive subsidy matching ("Sarkari-Mitra")

#### Mandi Data
- **Source**: Government APIs, scraping
- **Content**: Commodity prices, trends
- **Use Case**: Market forecasting ("Mandi-Predictor")

#### General Agricultural Knowledge
- **Source**: Curated datasets, extension officer notes
- **Content**: Crop management, pest control, best practices
- **Use Case**: General Q&A and advisory

## Integration Points (Ready for AWS Credits)

### Amazon Bedrock Integration

#### Titan Embeddings
```typescript
// TODO: Replace mock in embeddingService.ts
const bedrock = new BedrockRuntimeClient({ region: 'us-east-1' });
const response = await bedrock.send(new InvokeModelCommand({
  modelId: 'amazon.titan-embed-text-v1',
  body: JSON.stringify({ inputText: text })
}));
```

#### Claude 3.5 Sonnet
```typescript
// TODO: Replace mock in ragService.ts
const response = await bedrock.send(new InvokeModelCommand({
  modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  body: JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }]
  })
}));
```

### Amazon Textract Integration
- Extract structured data from Soil Health Card images
- Store OCR text and parsed fields in `soil_health_cards` table
- Generate embeddings for RAG retrieval

## Migration Guide

### Step 1: Setup RDS PostgreSQL
1. Create RDS PostgreSQL instance (with PostGIS extension support)
2. Configure connection string in `.env`:
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/kisan_setu
   ```

### Step 2: Run Migrations
```bash
cd backend
npm install
npm run migrate:db      # Ensures pgvector extension
npm run migrate:rag     # Creates all RAG tables
```

### Step 3: Verify Setup
```bash
npm run check:db        # Verifies pgvector is installed
```

### Step 4: Ingest Initial Knowledge
Once Bedrock is integrated, ingest sample data:
- Government schemes (from `002_seed_sample_data.sql`)
- Soil health card templates
- Agricultural knowledge base

## Query Example

```typescript
const result = await performRAGQuery({
  question: "माझ्या कांद्याच्या पिकावर बुरशी आली आहे, आता काय करावे?",
  language: "mr",
  farmer_id: "farmer-uuid",
  top_k: 5,
  source_types: ["soil_card", "general_knowledge"],
  min_similarity: 0.6
});
```

## Performance Considerations

- **HNSW Index**: Fast approximate nearest neighbor search (O(log n))
- **Connection Pooling**: Reuse database connections (Lambda-ready)
- **Batch Operations**: Use `batchStoreEmbeddings()` for bulk ingestion
- **Caching**: Consider caching frequent queries (future enhancement)

## Security & Privacy

- **Farmer Data**: Stored with encryption at rest (RDS)
- **PII**: Phone numbers stored securely, not in embeddings
- **Access Control**: IAM roles for Bedrock access (Lambda execution role)
- **VPC**: RDS in private subnet, Lambda in VPC for secure access

## Future Enhancements

1. **Multi-modal RAG**: Include image embeddings for crop disease detection
2. **Temporal Context**: Time-aware queries (seasonal advice)
3. **Personalization**: Farmer-specific context in embeddings metadata
4. **Feedback Loop**: Learn from query history to improve retrieval
5. **Hybrid Search**: Combine vector search with keyword search

## Troubleshooting

### pgvector not found
- Ensure PostgreSQL version >= 11
- Run `npm run migrate:db` to install extension

### Embeddings dimension mismatch
- Bedrock Titan uses 1536 dimensions
- Ensure `vector(1536)` in schema matches

### Slow similarity search
- Check HNSW index is created: `\d knowledge_embeddings`
- Consider adjusting HNSW parameters (m, ef_construction)
