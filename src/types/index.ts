// WhoHub Type Definitions
export interface CloudflareBindings {
  DB: D1Database;
  R2: R2Bucket;
  KV: KVNamespace;
  AI: Ai;
}

// User and Authentication
export interface User {
  id: number;
  email: string;
  name?: string;
  subscription_tier: 'free' | 'basic' | 'premium';
  credits_remaining: number;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

// Investigation Types
export type InvestigationType = 'simple' | 'full';
export type InvestigationStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Investigation {
  id: number;
  user_id: number;
  investigation_type: InvestigationType;
  status: InvestigationStatus;
  
  // Input data
  target_name?: string;
  target_email?: string;
  target_phone?: string;
  submitted_images?: string; // JSON array
  dating_platform?: string;
  additional_info?: string;
  
  // Payment
  payment_intent_id?: string;
  payment_status: PaymentStatus;
  amount_aud: number;
  
  // Results
  confidence_score?: number;
  red_flags_count: number;
  report_url?: string;
  
  // Timestamps
  created_at: string;
  completed_at?: string;
}

// OSINT Finding Types
export type FindingType = 
  | 'image_search' 
  | 'breach_check' 
  | 'social_profile' 
  | 'conviction' 
  | 'ai_detection'
  | 'phone_analysis'
  | 'email_analysis'
  | 'name_analysis';

export type OSINTSource = 
  | 'pimeyes' 
  | 'google_vision' 
  | 'yandex_images'
  | 'haveibeenpwned' 
  | 'openai'
  | 'cloudflare_ai'
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'twitter'
  | 'tiktok'
  | 'court_records'
  | 'news_search';

export interface OSINTFinding {
  id: number;
  investigation_id: number;
  finding_type: FindingType;
  source: OSINTSource;
  
  raw_data?: string; // JSON
  processed_data?: string; // JSON
  confidence: number; // 0.0-1.0
  is_red_flag: boolean;
  
  // Specific fields
  image_url?: string;
  matched_url?: string;
  social_platform?: string;
  profile_url?: string;
  username?: string;
  breach_name?: string;
  breach_date?: string;
  conviction_type?: string;
  conviction_date?: string;
  
  created_at: string;
}

// Image Analysis
export interface ImageAnalysis {
  id: number;
  investigation_id: number;
  original_image_url: string;
  
  // AI Detection
  is_ai_generated?: boolean;
  ai_confidence?: number;
  deepfake_probability?: number;
  
  // Reverse Search
  reverse_search_matches: number;
  earliest_appearance?: string;
  most_common_source?: string;
  
  // Face Analysis
  estimated_age?: number;
  detected_gender?: string;
  face_count?: number;
  
  // Technical
  metadata_stripped?: boolean;
  creation_date?: string;
  camera_model?: string;
  location_data?: string; // JSON
  
  created_at: string;
}

// Social Media Profile
export interface SocialProfile {
  id: number;
  investigation_id: number;
  platform: string;
  profile_url?: string;
  username?: string;
  display_name?: string;
  profile_image_url?: string;
  
  bio?: string;
  follower_count?: number;
  following_count?: number;
  post_count?: number;
  verified: boolean;
  account_created?: string;
  last_activity?: string;
  
  suspicious_activity: boolean;
  fake_followers: boolean;
  stock_photos: boolean;
  match_confidence: number;
  
  created_at: string;
}

// Data Breach Record
export interface BreachRecord {
  id: number;
  investigation_id: number;
  email?: string;
  phone?: string;
  breach_name: string;
  breach_date?: string;
  breach_description?: string;
  data_types?: string; // JSON array
  verified: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

// Criminal/Court Record
export interface ConvictionRecord {
  id: number;
  investigation_id: number;
  full_name?: string;
  conviction_type?: string;
  court_name?: string;
  case_number?: string;
  conviction_date?: string;
  sentence?: string;
  jurisdiction?: string;
  source_url?: string;
  confidence: number;
  created_at: string;
}

// Report Generation
export interface Report {
  id: number;
  investigation_id: number;
  report_type: InvestigationType;
  
  executive_summary?: string;
  image_analysis_summary?: string;
  social_profiles_summary?: string;
  red_flags_summary?: string;
  breach_summary?: string;
  conviction_summary?: string;
  
  total_pages?: number;
  generation_time_seconds?: number;
  pdf_file_path?: string;
  pdf_file_size?: number;
  
  redacted: boolean;
  retention_expires_at?: string;
  created_at: string;
}

// API Request/Response Types
export interface CreateInvestigationRequest {
  investigation_type: InvestigationType;
  target_name?: string;
  target_email?: string;
  target_phone?: string;
  dating_platform?: string;
  additional_info?: string;
  // Images will be handled via separate upload endpoint
}

export interface CreateInvestigationResponse {
  success: boolean;
  investigation_id: number;
  payment_intent_client_secret?: string;
  amount_aud: number;
  upload_urls?: string[]; // Pre-signed URLs for image uploads
}

export interface InvestigationStatusResponse {
  investigation: Investigation;
  findings?: OSINTFinding[];
  image_analysis?: ImageAnalysis[];
  social_profiles?: SocialProfile[];
  breach_records?: BreachRecord[];
  conviction_records?: ConvictionRecord[];
  report?: Report;
}

// OSINT Service Interfaces
export interface ReverseImageSearchResult {
  source: OSINTSource;
  matches: Array<{
    url: string;
    similarity: number;
    source_domain: string;
    thumbnail_url?: string;
    context?: string;
  }>;
  total_matches: number;
  confidence: number;
}

export interface AIImageAnalysisResult {
  is_ai_generated: boolean;
  confidence: number;
  deepfake_probability: number;
  analysis_details: {
    artifacts_detected: string[];
    face_consistency: number;
    lighting_consistency: number;
    compression_artifacts: boolean;
  };
}

export interface BreachCheckResult {
  email?: string;
  phone?: string;
  breaches: Array<{
    name: string;
    date: string;
    description: string;
    data_types: string[];
    verified: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  total_breaches: number;
}

export interface SocialMediaSearchResult {
  platform: string;
  profiles: Array<{
    url: string;
    username: string;
    display_name: string;
    profile_image_url: string;
    match_confidence: number;
    profile_data: any; // Platform-specific data
  }>;
}

// System Configuration
export interface SystemConfig {
  id: number;
  config_key: string;
  config_value: string;
  description?: string;
  updated_at: string;
}

// Error Types
export interface APIError {
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
}

// Utility Types
export type APIResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: APIError;
};

// Webhook Types (Stripe, etc.)
export interface StripeWebhookPayload {
  id: string;
  object: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

// Rate Limiting
export interface RateLimitInfo {
  requests_remaining: number;
  reset_time: number;
  limit: number;
}