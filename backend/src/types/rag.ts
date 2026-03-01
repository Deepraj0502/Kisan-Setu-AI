/**
 * TypeScript types for RAG domain models
 * These types match the database schema defined in migrations
 */

// ============================================
// Farmer Profile Types
// ============================================
export type LanguageCode = "mr" | "hi" | "en";

export interface FarmerProfile {
  id: string;
  phone_number: string;
  name?: string;
  language_preference: LanguageCode;
  location_geometry?: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  district?: string;
  state?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateFarmerProfileInput {
  phone_number: string;
  name?: string;
  language_preference?: LanguageCode;
  latitude?: number;
  longitude?: number;
  district?: string;
  state?: string;
}

// ============================================
// Soil Health Card Types
// ============================================
export interface SoilHealthCard {
  id: string;
  farmer_id?: string;
  card_number?: string;
  ocr_text: string;
  s3_image_url?: string;
  ph_value?: number;
  organic_carbon?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  issue_date?: Date;
  lab_name?: string;
  created_at: Date;
}

export interface CreateSoilCardInput {
  farmer_id?: string;
  card_number?: string;
  ocr_text: string;
  s3_image_url?: string;
  ph_value?: number;
  organic_carbon?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  issue_date?: Date;
  lab_name?: string;
}

// ============================================
// Government Scheme Types
// ============================================
export interface EligibilityCriteria {
  land_ownership?: boolean;
  age_min?: number;
  age_max?: number;
  registration_required?: boolean;
  land_size_min_hectares?: number;
  exclusions?: string[];
  [key: string]: unknown; // Allow flexible criteria
}

export interface GovernmentScheme {
  id: string;
  scheme_code: string;
  name_english: string;
  name_marathi?: string;
  name_hindi?: string;
  description_english?: string;
  description_marathi?: string;
  description_hindi?: string;
  eligibility_criteria: EligibilityCriteria;
  benefits_summary?: string;
  eligible_states?: string[];
  eligible_districts?: string[];
  start_date?: Date;
  end_date?: Date;
  is_active: boolean;
  source_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSchemeInput {
  scheme_code: string;
  name_english: string;
  name_marathi?: string;
  name_hindi?: string;
  description_english?: string;
  description_marathi?: string;
  description_hindi?: string;
  eligibility_criteria: EligibilityCriteria;
  benefits_summary?: string;
  eligible_states?: string[];
  eligible_districts?: string[];
  start_date?: Date;
  end_date?: Date;
  is_active?: boolean;
  source_url?: string;
}

// ============================================
// Mandi Data Types
// ============================================
export interface MandiData {
  id: string;
  mandi_name: string;
  mandi_code?: string;
  location_geometry?: {
    type: "Point";
    coordinates: [number, number];
  };
  district?: string;
  state?: string;
  commodity_name: string;
  commodity_category?: string;
  variety?: string;
  min_price?: number;
  max_price?: number;
  modal_price?: number;
  price_date: Date;
  unit: string;
  source?: string;
  created_at: Date;
}

export interface CreateMandiDataInput {
  mandi_name: string;
  mandi_code?: string;
  latitude?: number;
  longitude?: number;
  district?: string;
  state?: string;
  commodity_name: string;
  commodity_category?: string;
  variety?: string;
  min_price?: number;
  max_price?: number;
  modal_price?: number;
  price_date: Date;
  unit?: string;
  source?: string;
}

// ============================================
// Knowledge Embedding Types (RAG Core)
// ============================================
export type EmbeddingSourceType = 
  | "soil_card" 
  | "scheme" 
  | "mandi" 
  | "general_knowledge"
  | "crop_advisory"
  | "pest_disease";

export interface KnowledgeEmbedding {
  id: string;
  source_type: EmbeddingSourceType;
  source_id?: string;
  content_text: string;
  language: LanguageCode;
  embedding: number[]; // Vector of 1536 dimensions (Bedrock Titan)
  metadata?: Record<string, unknown>;
  created_at: Date;
}

export interface CreateEmbeddingInput {
  source_type: EmbeddingSourceType;
  source_id?: string;
  content_text: string;
  language?: LanguageCode;
  embedding: number[];
  metadata?: Record<string, unknown>;
}

export interface SimilaritySearchResult {
  embedding: KnowledgeEmbedding;
  similarity_score: number; // Cosine similarity (0-1)
}

// ============================================
// Query History Types
// ============================================
export interface QueryHistory {
  id: string;
  farmer_id?: string;
  question_text: string;
  language: LanguageCode;
  retrieved_context_ids?: string[];
  answer_text?: string;
  response_time_ms?: number;
  created_at: Date;
}

export interface CreateQueryHistoryInput {
  farmer_id?: string;
  question_text: string;
  language: LanguageCode;
  retrieved_context_ids?: string[];
  answer_text?: string;
  response_time_ms?: number;
}

// ============================================
// Scheme Match Types
// ============================================
export interface SchemeMatch {
  id: string;
  farmer_id: string;
  scheme_id: string;
  match_score?: number;
  match_reason?: string;
  farmer_notified: boolean;
  farmer_applied: boolean;
  matched_at: Date;
  notified_at?: Date;
  applied_at?: Date;
}

export interface CreateSchemeMatchInput {
  farmer_id: string;
  scheme_id: string;
  match_score?: number;
  match_reason?: string;
}

// ============================================
// RAG Query Types
// ============================================
export interface RAGQueryInput {
  question: string;
  language: LanguageCode;
  farmer_id?: string;
  top_k?: number; // Number of similar embeddings to retrieve
  source_types?: EmbeddingSourceType[]; // Filter by source type
  min_similarity?: number; // Minimum cosine similarity threshold
}

export interface RAGQueryResult {
  question: string;
  retrieved_contexts: SimilaritySearchResult[];
  answer: string; // Generated by Bedrock Claude
  metadata?: {
    response_time_ms: number;
    tokens_used?: number;
  };
}
