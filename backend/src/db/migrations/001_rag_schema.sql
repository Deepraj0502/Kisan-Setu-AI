-- RAG Schema for Kisan Setu AI (Agri-OS)
-- This migration creates all tables needed for RAG-based intelligence

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- 1. Farmer Profiles
-- ============================================
CREATE TABLE IF NOT EXISTS farmer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  language_preference VARCHAR(10) DEFAULT 'mr', -- 'mr', 'hi', 'en'
  location_geometry GEOMETRY(POINT, 4326), -- PostGIS for spatial queries
  district VARCHAR(100),
  state VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_farmer_profiles_location ON farmer_profiles USING GIST(location_geometry);
CREATE INDEX idx_farmer_profiles_phone ON farmer_profiles(phone_number);

-- ============================================
-- 2. Soil Health Cards (OCR'd from Textract)
-- ============================================
CREATE TABLE IF NOT EXISTS soil_health_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmer_profiles(id) ON DELETE CASCADE,
  card_number VARCHAR(100),
  ocr_text TEXT NOT NULL, -- Full text extracted via Amazon Textract
  s3_image_url TEXT, -- S3 bucket URL for original image
  -- Parsed fields (can be extracted via Textract structured data)
  ph_value DECIMAL(4,2),
  organic_carbon DECIMAL(5,2),
  nitrogen DECIMAL(5,2),
  phosphorus DECIMAL(5,2),
  potassium DECIMAL(5,2),
  -- Metadata
  issue_date DATE,
  lab_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_soil_cards_farmer ON soil_health_cards(farmer_id);
CREATE INDEX idx_soil_cards_card_number ON soil_health_cards(card_number);

-- ============================================
-- 3. Government Schemes (Subsidy Matcher)
-- ============================================
CREATE TABLE IF NOT EXISTS government_schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_code VARCHAR(50) UNIQUE NOT NULL,
  name_english VARCHAR(255) NOT NULL,
  name_marathi TEXT,
  name_hindi TEXT,
  description_english TEXT,
  description_marathi TEXT,
  description_hindi TEXT,
  -- Eligibility criteria (stored as JSONB for flexibility)
  eligibility_criteria JSONB,
  -- Benefits
  benefits_summary TEXT,
  -- Spatial eligibility (if scheme is region-specific)
  eligible_states TEXT[], -- Array of state codes
  eligible_districts TEXT[], -- Array of district names
  -- Dates
  start_date DATE,
  end_date DATE,
  -- Status
  is_active BOOLEAN DEFAULT true,
  -- Metadata
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_schemes_active ON government_schemes(is_active) WHERE is_active = true;
CREATE INDEX idx_schemes_states ON government_schemes USING GIN(eligible_states);
CREATE INDEX idx_schemes_districts ON government_schemes USING GIN(eligible_districts);

-- ============================================
-- 4. Mandi (Market) Data
-- ============================================
CREATE TABLE IF NOT EXISTS mandi_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandi_name VARCHAR(255) NOT NULL,
  mandi_code VARCHAR(50),
  location_geometry GEOMETRY(POINT, 4326),
  district VARCHAR(100),
  state VARCHAR(100),
  -- Crop/Commodity
  commodity_name VARCHAR(255) NOT NULL,
  commodity_category VARCHAR(100), -- 'cereals', 'vegetables', 'fruits', etc.
  variety VARCHAR(255),
  -- Price data
  min_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  modal_price DECIMAL(10,2), -- Most common price
  -- Date
  price_date DATE NOT NULL,
  -- Units
  unit VARCHAR(20) DEFAULT 'quintal', -- quintal, kg, etc.
  -- Metadata
  source VARCHAR(100) DEFAULT 'government', -- 'government', 'api', 'scraped'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mandi_location ON mandi_data USING GIST(location_geometry);
CREATE INDEX idx_mandi_commodity ON mandi_data(commodity_name, price_date);
CREATE INDEX idx_mandi_date ON mandi_data(price_date DESC);

-- ============================================
-- 5. Knowledge Embeddings (RAG Core)
-- ============================================
-- This table stores vector embeddings for semantic search
CREATE TABLE IF NOT EXISTS knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Source reference (polymorphic)
  source_type VARCHAR(50) NOT NULL, -- 'soil_card', 'scheme', 'mandi', 'general_knowledge'
  source_id UUID, -- References id from source table
  -- Content
  content_text TEXT NOT NULL, -- The text that was embedded
  language VARCHAR(10) DEFAULT 'en', -- 'mr', 'hi', 'en'
  -- Vector embedding (1536 dimensions for Amazon Bedrock Titan Embeddings)
  embedding vector(1536) NOT NULL,
  -- Metadata
  metadata JSONB, -- Additional context (e.g., farmer_id, crop_type, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HNSW index for fast similarity search (pgvector)
CREATE INDEX idx_knowledge_embeddings_vector ON knowledge_embeddings 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Indexes for filtering
CREATE INDEX idx_knowledge_embeddings_source ON knowledge_embeddings(source_type, source_id);
CREATE INDEX idx_knowledge_embeddings_language ON knowledge_embeddings(language);

-- ============================================
-- 6. Query History (for learning & analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS query_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmer_profiles(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  language VARCHAR(10) NOT NULL,
  -- RAG context used
  retrieved_context_ids UUID[], -- Array of knowledge_embeddings.id
  -- Response
  answer_text TEXT,
  -- Metadata
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_query_history_farmer ON query_history(farmer_id, created_at DESC);
CREATE INDEX idx_query_history_date ON query_history(created_at DESC);

-- ============================================
-- 7. Scheme Matches (Farmer-Scheme associations)
-- ============================================
CREATE TABLE IF NOT EXISTS scheme_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmer_profiles(id) ON DELETE CASCADE,
  scheme_id UUID REFERENCES government_schemes(id) ON DELETE CASCADE,
  match_score DECIMAL(5,2), -- 0-100 score indicating match quality
  match_reason TEXT, -- Why this scheme was matched
  -- Status
  farmer_notified BOOLEAN DEFAULT false,
  farmer_applied BOOLEAN DEFAULT false,
  -- Dates
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notified_at TIMESTAMP WITH TIME ZONE,
  applied_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(farmer_id, scheme_id)
);

CREATE INDEX idx_scheme_matches_farmer ON scheme_matches(farmer_id);
CREATE INDEX idx_scheme_matches_scheme ON scheme_matches(scheme_id);

-- ============================================
-- Helper function: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_farmer_profiles_updated_at
  BEFORE UPDATE ON farmer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_government_schemes_updated_at
  BEFORE UPDATE ON government_schemes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
