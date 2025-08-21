-- WhoHub Database Schema
-- This schema supports the full OSINT investigation pipeline

-- Users table for authentication and account management
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  subscription_tier TEXT DEFAULT 'free', -- free, basic, premium
  credits_remaining INTEGER DEFAULT 0,
  stripe_customer_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Investigation requests - main table for OSINT investigations
CREATE TABLE IF NOT EXISTS investigations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  investigation_type TEXT NOT NULL, -- 'simple' ($19.99) or 'full' ($49.99)
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  
  -- Input data
  target_name TEXT,
  target_email TEXT,
  target_phone TEXT,
  submitted_images TEXT, -- JSON array of image URLs/paths
  dating_platform TEXT,
  additional_info TEXT,
  
  -- Payment information
  payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'pending', -- pending, paid, failed, refunded
  amount_aud DECIMAL(10,2),
  
  -- Results and confidence
  confidence_score INTEGER, -- 1-100
  red_flags_count INTEGER DEFAULT 0,
  report_url TEXT, -- URL to generated PDF report
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- OSINT findings - detailed results from various sources
CREATE TABLE IF NOT EXISTS osint_findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  investigation_id INTEGER NOT NULL,
  finding_type TEXT NOT NULL, -- 'image_search', 'breach_check', 'social_profile', 'conviction', 'ai_detection', etc.
  source TEXT NOT NULL, -- 'pimeyes', 'google_vision', 'haveibeenpwned', 'yandex', etc.
  
  -- Finding data (stored as JSON for flexibility)
  raw_data TEXT, -- JSON data from API responses
  processed_data TEXT, -- Cleaned/processed data
  confidence REAL, -- 0.0-1.0 confidence score
  is_red_flag BOOLEAN DEFAULT FALSE,
  
  -- Specific fields for common finding types
  image_url TEXT,
  matched_url TEXT,
  social_platform TEXT,
  profile_url TEXT,
  username TEXT,
  breach_name TEXT,
  breach_date DATE,
  conviction_type TEXT,
  conviction_date DATE,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (investigation_id) REFERENCES investigations(id)
);

-- Image analysis results
CREATE TABLE IF NOT EXISTS image_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  investigation_id INTEGER NOT NULL,
  original_image_url TEXT NOT NULL,
  
  -- AI/Deepfake detection
  is_ai_generated BOOLEAN,
  ai_confidence REAL, -- 0.0-1.0
  deepfake_probability REAL, -- 0.0-1.0
  
  -- Reverse image search results
  reverse_search_matches INTEGER DEFAULT 0,
  earliest_appearance DATE,
  most_common_source TEXT,
  
  -- Face/person analysis
  estimated_age INTEGER,
  detected_gender TEXT,
  face_count INTEGER,
  
  -- Technical analysis
  metadata_stripped BOOLEAN,
  creation_date DATETIME,
  camera_model TEXT,
  location_data TEXT, -- JSON lat/lng if available
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (investigation_id) REFERENCES investigations(id)
);

-- Social media profiles found
CREATE TABLE IF NOT EXISTS social_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  investigation_id INTEGER NOT NULL,
  platform TEXT NOT NULL, -- facebook, instagram, linkedin, twitter, etc.
  profile_url TEXT,
  username TEXT,
  display_name TEXT,
  profile_image_url TEXT,
  
  -- Profile data
  bio TEXT,
  follower_count INTEGER,
  following_count INTEGER,
  post_count INTEGER,
  verified BOOLEAN DEFAULT FALSE,
  account_created DATE,
  last_activity DATE,
  
  -- Analysis flags
  suspicious_activity BOOLEAN DEFAULT FALSE,
  fake_followers BOOLEAN DEFAULT FALSE,
  stock_photos BOOLEAN DEFAULT FALSE,
  
  -- Match confidence
  match_confidence REAL, -- 0.0-1.0 how likely this is the same person
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (investigation_id) REFERENCES investigations(id)
);

-- Data breaches and security incidents
CREATE TABLE IF NOT EXISTS breach_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  investigation_id INTEGER NOT NULL,
  email TEXT,
  phone TEXT,
  breach_name TEXT NOT NULL,
  breach_date DATE,
  breach_description TEXT,
  data_types TEXT, -- JSON array of compromised data types
  verified BOOLEAN DEFAULT FALSE,
  severity TEXT, -- low, medium, high, critical
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (investigation_id) REFERENCES investigations(id)
);

-- Criminal/court records
CREATE TABLE IF NOT EXISTS conviction_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  investigation_id INTEGER NOT NULL,
  full_name TEXT,
  conviction_type TEXT, -- fraud, assault, theft, etc.
  court_name TEXT,
  case_number TEXT,
  conviction_date DATE,
  sentence TEXT,
  jurisdiction TEXT, -- AU, NZ, etc.
  source_url TEXT,
  confidence REAL, -- 0.0-1.0 confidence this is the same person
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (investigation_id) REFERENCES investigations(id)
);

-- Report generation tracking
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  investigation_id INTEGER NOT NULL,
  report_type TEXT NOT NULL, -- 'simple', 'full'
  
  -- Report content sections
  executive_summary TEXT,
  image_analysis_summary TEXT,
  social_profiles_summary TEXT,
  red_flags_summary TEXT,
  breach_summary TEXT,
  conviction_summary TEXT,
  
  -- Report metadata
  total_pages INTEGER,
  generation_time_seconds INTEGER,
  pdf_file_path TEXT,
  pdf_file_size INTEGER,
  
  -- Security and privacy
  redacted BOOLEAN DEFAULT TRUE,
  retention_expires_at DATETIME, -- Auto-delete reports after retention period
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (investigation_id) REFERENCES investigations(id)
);

-- API usage tracking and rate limiting
CREATE TABLE IF NOT EXISTS api_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  investigation_id INTEGER,
  api_provider TEXT NOT NULL, -- 'pimeyes', 'openai', 'google_vision', etc.
  endpoint TEXT,
  request_cost DECIMAL(10,4), -- Cost in USD/credits
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (investigation_id) REFERENCES investigations(id)
);

-- System configuration and settings
CREATE TABLE IF NOT EXISTS system_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_investigations_user_id ON investigations(user_id);
CREATE INDEX IF NOT EXISTS idx_investigations_status ON investigations(status);
CREATE INDEX IF NOT EXISTS idx_investigations_created_at ON investigations(created_at);

CREATE INDEX IF NOT EXISTS idx_osint_findings_investigation_id ON osint_findings(investigation_id);
CREATE INDEX IF NOT EXISTS idx_osint_findings_type ON osint_findings(finding_type);
CREATE INDEX IF NOT EXISTS idx_osint_findings_source ON osint_findings(source);

CREATE INDEX IF NOT EXISTS idx_image_analysis_investigation_id ON image_analysis(investigation_id);

CREATE INDEX IF NOT EXISTS idx_social_profiles_investigation_id ON social_profiles(investigation_id);
CREATE INDEX IF NOT EXISTS idx_social_profiles_platform ON social_profiles(platform);

CREATE INDEX IF NOT EXISTS idx_breach_records_investigation_id ON breach_records(investigation_id);
CREATE INDEX IF NOT EXISTS idx_breach_records_email ON breach_records(email);

CREATE INDEX IF NOT EXISTS idx_conviction_records_investigation_id ON conviction_records(investigation_id);

CREATE INDEX IF NOT EXISTS idx_reports_investigation_id ON reports(investigation_id);

CREATE INDEX IF NOT EXISTS idx_api_usage_investigation_id ON api_usage(investigation_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_provider ON api_usage(api_provider);