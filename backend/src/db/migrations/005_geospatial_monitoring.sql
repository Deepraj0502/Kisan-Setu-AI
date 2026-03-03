-- Geospatial Monitoring Schema
-- Adds satellite monitoring and proactive alert capabilities

-- Ensure PostGIS extension is available
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- 1. Land Parcels
-- ============================================
CREATE TABLE IF NOT EXISTS land_parcels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmer_profiles(id) ON DELETE CASCADE,
  parcel_name VARCHAR(255),
  -- Geospatial boundary (polygon in WGS84)
  boundary GEOMETRY(POLYGON, 4326) NOT NULL,
  -- Centroid for quick lookups
  centroid GEOMETRY(POINT, 4326),
  -- Area in hectares
  area_hectares DECIMAL(10,4),
  -- Crop information
  current_crop VARCHAR(100),
  planting_date DATE,
  expected_harvest_date DATE,
  -- Monitoring preferences
  monitoring_enabled BOOLEAN DEFAULT true,
  alert_threshold_ndvi DECIMAL(3,2) DEFAULT 0.4,
  alert_threshold_ndwi DECIMAL(3,2) DEFAULT 0.2,
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_land_parcels_farmer ON land_parcels(farmer_id);
CREATE INDEX IF NOT EXISTS idx_land_parcels_boundary ON land_parcels USING GIST(boundary);
CREATE INDEX IF NOT EXISTS idx_land_parcels_centroid ON land_parcels USING GIST(centroid);
CREATE INDEX IF NOT EXISTS idx_land_parcels_monitoring ON land_parcels(monitoring_enabled) WHERE monitoring_enabled = true;

-- ============================================
-- 2. Satellite Observations
-- ============================================
CREATE TABLE IF NOT EXISTS satellite_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id UUID REFERENCES land_parcels(id) ON DELETE CASCADE,
  -- Observation metadata
  satellite_source VARCHAR(50) NOT NULL, -- 'sentinel-2', 'landsat-8', 'modis'
  observation_date DATE NOT NULL,
  cloud_cover_percent DECIMAL(5,2),
  -- Vegetation indices
  ndvi_mean DECIMAL(5,4), -- -1 to 1
  ndvi_std DECIMAL(5,4),
  ndvi_min DECIMAL(5,4),
  ndvi_max DECIMAL(5,4),
  -- Water indices
  ndwi_mean DECIMAL(5,4), -- -1 to 1
  ndwi_std DECIMAL(5,4),
  -- Soil moisture (if available)
  soil_moisture_percent DECIMAL(5,2),
  -- Crop health score (0-100)
  crop_health_score INTEGER,
  -- Raw data reference
  s3_raster_url TEXT,
  sagemaker_job_arn TEXT,
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_satellite_obs_parcel ON satellite_observations(parcel_id, observation_date DESC);
CREATE INDEX IF NOT EXISTS idx_satellite_obs_date ON satellite_observations(observation_date DESC);
CREATE INDEX IF NOT EXISTS idx_satellite_obs_source ON satellite_observations(satellite_source);

-- ============================================
-- 3. Geospatial Alerts
-- ============================================
CREATE TABLE IF NOT EXISTS geospatial_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id UUID REFERENCES land_parcels(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES farmer_profiles(id) ON DELETE CASCADE,
  -- Alert details
  alert_type VARCHAR(50) NOT NULL, -- 'moisture_stress', 'pest_outbreak', 'crop_health', 'drought_risk', 'flood_risk'
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  title_english TEXT NOT NULL,
  title_marathi TEXT,
  title_hindi TEXT,
  message_english TEXT NOT NULL,
  message_marathi TEXT,
  message_hindi TEXT,
  -- Recommendations
  recommendations_english TEXT[],
  recommendations_marathi TEXT[],
  recommendations_hindi TEXT[],
  -- Data that triggered alert
  trigger_data JSONB,
  observation_id UUID REFERENCES satellite_observations(id),
  -- Alert status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'acknowledged', 'resolved'
  sent_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geospatial_alerts_farmer ON geospatial_alerts(farmer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_geospatial_alerts_status ON geospatial_alerts(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_geospatial_alerts_type ON geospatial_alerts(alert_type, severity);
CREATE INDEX IF NOT EXISTS idx_geospatial_alerts_parcel ON geospatial_alerts(parcel_id);

-- ============================================
-- 4. Regional Pest Outbreaks
-- ============================================
CREATE TABLE IF NOT EXISTS regional_pest_outbreaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Location
  district VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  affected_area GEOMETRY(POLYGON, 4326),
  -- Pest information
  pest_name_english VARCHAR(255) NOT NULL,
  pest_name_marathi VARCHAR(255),
  pest_name_hindi VARCHAR(255),
  affected_crops TEXT[],
  -- Severity
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  affected_area_hectares DECIMAL(10,2),
  -- Timeline
  first_detected_date DATE NOT NULL,
  last_updated_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'contained', 'resolved'
  -- Data source
  source VARCHAR(100), -- 'satellite', 'government', 'farmer_reports'
  source_url TEXT,
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pest_outbreaks_location ON regional_pest_outbreaks(district, state);
CREATE INDEX IF NOT EXISTS idx_pest_outbreaks_area ON regional_pest_outbreaks USING GIST(affected_area);
CREATE INDEX IF NOT EXISTS idx_pest_outbreaks_status ON regional_pest_outbreaks(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_pest_outbreaks_date ON regional_pest_outbreaks(last_updated_date DESC);

-- ============================================
-- 5. Alert Delivery Log
-- ============================================
CREATE TABLE IF NOT EXISTS alert_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES geospatial_alerts(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES farmer_profiles(id) ON DELETE CASCADE,
  -- Delivery details
  delivery_channel VARCHAR(20) NOT NULL, -- 'whatsapp', 'sms', 'app', 'voice'
  delivery_status VARCHAR(20) NOT NULL, -- 'sent', 'delivered', 'read', 'failed'
  delivery_provider VARCHAR(50), -- 'twilio', 'aws_pinpoint', etc.
  -- Response
  farmer_response TEXT,
  response_timestamp TIMESTAMP WITH TIME ZONE,
  -- Metadata
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_alert_delivery_farmer ON alert_delivery_log(farmer_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_delivery_alert ON alert_delivery_log(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_delivery_status ON alert_delivery_log(delivery_status);

-- ============================================
-- Triggers
-- ============================================

-- Update updated_at timestamp
DROP TRIGGER IF EXISTS update_land_parcels_updated_at ON land_parcels;
CREATE TRIGGER update_land_parcels_updated_at
  BEFORE UPDATE ON land_parcels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_regional_pest_outbreaks_updated_at ON regional_pest_outbreaks;
CREATE TRIGGER update_regional_pest_outbreaks_updated_at
  BEFORE UPDATE ON regional_pest_outbreaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate centroid when boundary is inserted/updated
CREATE OR REPLACE FUNCTION calculate_parcel_centroid()
RETURNS TRIGGER AS $$
BEGIN
  NEW.centroid = ST_Centroid(NEW.boundary);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_centroid_on_insert ON land_parcels;
CREATE TRIGGER calculate_centroid_on_insert
  BEFORE INSERT OR UPDATE OF boundary ON land_parcels
  FOR EACH ROW EXECUTE FUNCTION calculate_parcel_centroid();

-- ============================================
-- Sample Data (for testing)
-- ============================================

-- Insert sample pest outbreak
INSERT INTO regional_pest_outbreaks (
  district, state, pest_name_english, pest_name_marathi, pest_name_hindi,
  affected_crops, severity, first_detected_date, last_updated_date, status, source
) VALUES (
  'Pune', 'Maharashtra', 'Fall Armyworm', 'फॉल आर्मीवर्म', 'फॉल आर्मीवर्म',
  ARRAY['maize', 'sorghum', 'sugarcane'], 'high',
  CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE, 'active', 'government'
) ON CONFLICT DO NOTHING;

-- Grant permissions (if needed)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO your_app_user;
