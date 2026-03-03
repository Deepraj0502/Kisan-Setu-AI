-- Farmer profiles table for personalized experience
CREATE TABLE IF NOT EXISTS farmer_profiles (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(100),
    village VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(50),
    language VARCHAR(5) DEFAULT 'mr',
    
    -- Land details
    land_size_hectares DECIMAL(10, 2),
    land_type VARCHAR(20), -- irrigated, rainfed, both
    soil_type VARCHAR(50),
    
    -- Crops
    primary_crops TEXT[], -- Array of crop names
    current_season_crops TEXT[],
    
    -- Preferences
    preferred_notification_time TIME DEFAULT '07:00:00',
    notification_enabled BOOLEAN DEFAULT true,
    
    -- Profile status
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_step INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversation history table
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(15) NOT NULL,
    message_type VARCHAR(10) NOT NULL, -- 'user' or 'agent'
    message_text TEXT NOT NULL,
    message_kind VARCHAR(10) DEFAULT 'text', -- text, voice, image
    metadata JSONB, -- Additional data like image analysis, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (phone_number) REFERENCES farmer_profiles(phone_number) ON DELETE CASCADE
);

-- User preferences table
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

-- Notifications sent table
CREATE TABLE IF NOT EXISTS notifications_sent (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(15) NOT NULL,
    notification_type VARCHAR(20) NOT NULL,
    notification_text TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT 'medium', -- critical, high, medium, low
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (phone_number) REFERENCES farmer_profiles(phone_number) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_farmer_phone ON farmer_profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_farmer_district ON farmer_profiles(district);
CREATE INDEX IF NOT EXISTS idx_farmer_state ON farmer_profiles(state);
CREATE INDEX IF NOT EXISTS idx_conversations_phone ON conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_phone ON notifications_sent(phone_number);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications_sent(created_at DESC);

-- Function to update updated_at timestamp (create if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists, then create it
DROP TRIGGER IF EXISTS update_farmer_profiles_updated_at ON farmer_profiles;

CREATE TRIGGER update_farmer_profiles_updated_at 
    BEFORE UPDATE ON farmer_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
