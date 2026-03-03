-- Add missing columns to farmer_profiles table
ALTER TABLE farmer_profiles 
  ADD COLUMN IF NOT EXISTS village VARCHAR(100),
  ADD COLUMN IF NOT EXISTS land_size_hectares DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS land_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS soil_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS primary_crops TEXT[],
  ADD COLUMN IF NOT EXISTS current_season_crops TEXT[],
  ADD COLUMN IF NOT EXISTS preferred_notification_time TIME DEFAULT '07:00:00',
  ADD COLUMN IF NOT EXISTS notification_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Rename language_preference to language if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'farmer_profiles' AND column_name = 'language_preference'
  ) THEN
    ALTER TABLE farmer_profiles RENAME COLUMN language_preference TO language;
  END IF;
END $$;

-- Add language column if it doesn't exist
ALTER TABLE farmer_profiles 
  ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'mr';

-- Update id column to SERIAL if it's UUID
DO $$
BEGIN
  -- Check if id is uuid type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'farmer_profiles' 
    AND column_name = 'id' 
    AND data_type = 'uuid'
  ) THEN
    -- Can't easily convert uuid to serial, so we'll keep it as is
    -- Just ensure it has a default
    ALTER TABLE farmer_profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Ensure updated_at has default
ALTER TABLE farmer_profiles 
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- Ensure created_at has default  
ALTER TABLE farmer_profiles 
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- Create conversations table if not exists
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(15) NOT NULL,
    message_type VARCHAR(10) NOT NULL,
    message_text TEXT NOT NULL,
    message_kind VARCHAR(10) DEFAULT 'text',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (phone_number) REFERENCES farmer_profiles(phone_number) ON DELETE CASCADE
);

-- Create user_preferences table if not exists
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    weather_alerts BOOLEAN DEFAULT true,
    market_alerts BOOLEAN DEFAULT true,
    pest_alerts BOOLEAN DEFAULT true,
    scheme_alerts BOOLEAN DEFAULT true,
    irrigation_alerts BOOLEAN DEFAULT true,
    harvest_alerts BOOLEAN DEFAULT true,
    
    FOREIGN KEY (phone_number) REFERENCES farmer_profiles(phone_number) ON DELETE CASCADE
);

-- Create notifications_sent table if not exists
CREATE TABLE IF NOT EXISTS notifications_sent (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(15) NOT NULL,
    notification_type VARCHAR(20) NOT NULL,
    notification_text TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT 'medium',
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (phone_number) REFERENCES farmer_profiles(phone_number) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_farmer_phone ON farmer_profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_farmer_district ON farmer_profiles(district);
CREATE INDEX IF NOT EXISTS idx_farmer_state ON farmer_profiles(state);
CREATE INDEX IF NOT EXISTS idx_conversations_phone ON conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_phone ON notifications_sent(phone_number);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications_sent(created_at DESC);

-- Ensure trigger exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_farmer_profiles_updated_at ON farmer_profiles;

CREATE TRIGGER update_farmer_profiles_updated_at 
    BEFORE UPDATE ON farmer_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
