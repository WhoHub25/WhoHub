-- WhoHub Seed Data
-- System configuration and initial data

-- System configuration
INSERT OR IGNORE INTO system_config (config_key, config_value, description) VALUES 
  ('simple_report_price_aud', '19.99', 'Price for simple OSINT report in AUD'),
  ('full_report_price_aud', '49.99', 'Price for full OSINT report in AUD'),
  ('report_retention_days', '30', 'Days to retain generated reports'),
  ('max_images_per_investigation', '5', 'Maximum images allowed per investigation'),
  ('ai_confidence_threshold', '0.7', 'Minimum confidence for AI-generated image detection'),
  ('red_flag_threshold', '3', 'Number of red flags to mark as high risk'),
  ('api_rate_limit_per_hour', '100', 'API requests per hour limit'),
  ('stripe_webhook_secret', '', 'Stripe webhook endpoint secret'),
  ('openai_api_key', '', 'OpenAI API key for AI analysis'),
  ('google_vision_api_key', '', 'Google Vision API key'),
  ('haveibeenpwned_api_key', '', 'HaveIBeenPwned API key'),
  ('pimeyes_api_key', '', 'PimEyes API key'),
  ('enable_debug_logging', 'true', 'Enable debug logging for development');

-- Test user (for development only)
INSERT OR IGNORE INTO users (email, name, subscription_tier, credits_remaining) VALUES 
  ('test@whohub.dev', 'Test User', 'premium', 10);

-- Sample investigation types and pricing
-- These will be used by the frontend for display
INSERT OR IGNORE INTO system_config (config_key, config_value, description) VALUES 
  ('simple_report_features', '["Reverse image search", "Basic AI detection", "Breach check", "Social media scan", "Confidence score"]', 'Features included in simple report'),
  ('full_report_features', '["Everything in Simple", "Deep social profiling", "Criminal record search", "Advanced AI analysis", "Detailed timeline", "Professional PDF report"]', 'Features included in full report');