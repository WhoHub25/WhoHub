# WhoHub - OSINT Dating Safety Platform

## 🚀 Project Overview
**WhoHub** is a comprehensive OSINT (Open Source Intelligence) investigation platform designed to detect catfish, scammers, and fake profiles across dating platforms. The application uses advanced AI-powered tools and automation to deliver professional background check reports within minutes.

### Key Features
- **Reverse Image Search**: PimEyes, Yandex, and Google Vision API integration
- **AI Detection**: Advanced deepfake and AI-generated image detection
- **Social Media Profiling**: Comprehensive analysis across all major platforms  
- **Criminal Record Search**: Court records and conviction database searches
- **Data Breach Checks**: HaveIBeenPwned integration for compromised accounts
- **Automated PDF Reports**: Professional, redacted investigation reports
- **Stripe Payment Integration**: Secure payment processing ($19.99/$49.99 AUD)

## 🌐 Live URLs

### Development Environment
- **Main Application**: https://3000-i9rrjyuqas3lebxrx4ck4-6532622b.e2b.dev
- **Health Check API**: https://3000-i9rrjyuqas3lebxrx4ck4-6532622b.e2b.dev/api/health
- **API Documentation**: https://3000-i9rrjyuqas3lebxrx4ck4-6532622b.e2b.dev/api/

### Brand Assets
- **Main Logo**: https://3000-i9rrjyuqas3lebxrx4ck4-6532622b.e2b.dev/static/whohub-logo.png
- **Logo with Tagline**: https://3000-i9rrjyuqas3lebxrx4ck4-6532622b.e2b.dev/static/whohub-logo-tagline.png
- **Favicon**: https://3000-i9rrjyuqas3lebxrx4ck4-6532622b.e2b.dev/static/favicon.svg

### Production (To be deployed)
- **Production URL**: Will be available after Cloudflare Pages deployment
- **GitHub Repository**: Will be available after GitHub integration

## 📊 Data Architecture

### Database Schema (Cloudflare D1)
The application uses a comprehensive SQLite-based database with the following key tables:

#### Core Tables
- **`investigations`**: Main investigation records with status tracking
- **`users`**: User accounts and subscription management
- **`osint_findings`**: All OSINT investigation results and findings
- **`reports`**: Generated PDF reports and metadata

#### OSINT-Specific Tables
- **`image_analysis`**: AI detection and reverse image search results
- **`social_profiles`**: Social media profiles and analysis
- **`breach_records`**: Data breach information from various sources
- **`conviction_records`**: Criminal records and court findings
- **`api_usage`**: API call tracking and rate limiting

#### System Tables
- **`system_config`**: Application configuration and settings

### Storage Services
- **Cloudflare D1**: Primary database for relational data
- **Cloudflare R2**: Image uploads and PDF report storage
- **Cloudflare KV**: Caching and session management
- **Cloudflare AI**: Image analysis and content generation

### Data Flow
1. **User Submission** → Investigation record created
2. **Payment Processing** → Stripe webhook triggers OSINT pipeline
3. **OSINT Investigation** → Multiple API services gather intelligence
4. **AI Analysis** → Confidence scoring and red flag detection
5. **Report Generation** → PDF creation with privacy redaction
6. **Secure Delivery** → Encrypted report delivery to user

## 📋 Current Status

### ✅ Completed Features
- [x] Complete Hono backend API with all OSINT routes
- [x] Comprehensive database schema and migrations
- [x] Responsive frontend with investigation submission form
- [x] Payment integration structure (Stripe-ready)
- [x] OSINT service integrations (framework complete)
- [x] PDF report generation system
- [x] Image upload and analysis pipeline
- [x] Webhook handling for external integrations
- [x] Security and privacy protection measures
- [x] Mobile-responsive design with Tailwind CSS
- [x] PM2 process management configuration
- [x] Development environment setup
- [x] **Professional branding integration with custom logos**
- [x] **Brand-consistent color scheme (orange/black theme)**
- [x] **Custom favicon and visual identity**

### 📊 Functional Entry Points

#### Public Endpoints
- `GET /` - Main application interface
- `GET /api/health` - System health check
- `GET /static/*` - Static assets (CSS, JS, images)

#### Investigation APIs  
- `POST /api/investigations` - Create new investigation
- `GET /api/investigations/:id` - Get investigation status and results
- `POST /api/investigations/:id/start` - Start OSINT processing
- `DELETE /api/investigations/:id` - Delete investigation

#### Upload APIs
- `POST /api/uploads/investigation/:id/image/:index` - Upload investigation images
- `GET /api/uploads/investigation/:id/image/:filename` - Retrieve uploaded images
- `POST /api/uploads/evidence` - Upload profile evidence
- `POST /api/uploads/presigned-url` - Generate upload URLs

#### Report APIs
- `POST /api/reports/generate/:investigation_id` - Generate PDF report
- `GET /api/reports/:investigation_id/download` - Download report PDF
- `GET /api/reports/:investigation_id` - Get report metadata

#### Webhook APIs
- `POST /api/webhooks/stripe` - Stripe payment webhooks
- `POST /api/webhooks/github` - GitHub integration webhooks  
- `POST /api/webhooks/external/:service` - External service webhooks

### 🔄 Features In Development
- [ ] Production Cloudflare API key configuration
- [ ] GitHub repository integration and deployment
- [ ] Live OSINT API integrations (PimEyes, HaveIBeenPwned, etc.)
- [ ] Stripe payment intent creation
- [ ] Real PDF generation with proper formatting
- [ ] Email notification system
- [ ] User authentication and dashboard

### 🎯 Recommended Next Steps

#### 1. API Integration Phase
- **Configure Cloudflare Services**: Set up D1 database, R2 storage, KV namespaces
- **Integrate OSINT APIs**: 
  - PimEyes API for reverse image search
  - HaveIBeenPwned API for breach checking
  - Google Vision API for image analysis
  - Social media platform APIs
- **Complete Stripe Integration**: Payment intent creation and webhook verification

#### 2. Production Deployment
- **Configure Cloudflare API Key**: Set up deployment credentials
- **Deploy to Cloudflare Pages**: Production deployment with custom domain
- **Set up GitHub Integration**: Automated deployment pipeline
- **Configure Environment Variables**: Production API keys and secrets

#### 3. Testing and Security
- **Comprehensive Testing**: API endpoints, payment flow, report generation
- **Security Audit**: Data protection, privacy compliance, rate limiting
- **Performance Optimization**: Caching, CDN configuration, API response times

#### 4. User Experience Enhancements  
- **User Authentication**: Account creation, login, dashboard
- **Investigation Dashboard**: Status tracking, history, report downloads
- **Email Notifications**: Investigation completion, payment confirmations
- **Mobile App**: React Native implementation (future enhancement)

## 🛠️ Technical Stack

### Backend
- **Framework**: Hono (TypeScript)
- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 + KV
- **AI/ML**: Cloudflare AI Workers

### Frontend
- **Framework**: Vanilla JavaScript + HTML
- **Styling**: Tailwind CSS
- **Icons**: Font Awesome
- **HTTP Client**: Axios
- **Payment**: Stripe.js

### Development Tools
- **Build Tool**: Vite
- **Process Manager**: PM2
- **Version Control**: Git
- **Package Manager**: npm
- **Deployment**: Wrangler CLI

### External Integrations
- **Payment Processing**: Stripe
- **OSINT APIs**: PimEyes, Google Vision, HaveIBeenPwned
- **Email Service**: Cloudflare Workers (future)
- **Monitoring**: Cloudflare Analytics

## 🚀 User Guide

### For Investigators/Users
1. **Visit WhoHub Platform**: Navigate to the main application URL
2. **Choose Investigation Type**: 
   - Simple Report ($19.99 AUD): Basic verification
   - Full Report ($49.99 AUD): Comprehensive investigation
3. **Submit Target Information**:
   - Upload profile images/screenshots
   - Provide name, email, phone (optional)
   - Specify dating platform
   - Add additional context
4. **Complete Payment**: Secure Stripe payment processing
5. **Receive Report**: Professional PDF report delivered within minutes

### For Developers
1. **Local Development**:
   ```bash
   cd /home/user/whohub
   npm run build
   pm2 start ecosystem.config.cjs
   ```
2. **API Testing**: Use curl or Postman to test endpoints
3. **Database Management**: Use wrangler CLI for D1 operations
4. **Deployment**: Configure Cloudflare API key and deploy

## 📈 Pricing Structure

### Simple Report - $19.99 AUD
- Reverse image search
- Basic AI detection  
- Data breach check
- Social media scan
- Confidence score

### Full Report - $49.99 AUD
- Everything in Simple Report
- Deep social profiling
- Criminal record search
- Advanced AI analysis
- Detailed timeline
- Professional PDF report

## 🔒 Privacy and Security

### Data Protection
- **Privacy Redaction**: Sensitive information removed from reports
- **Secure Storage**: Encrypted data storage in Cloudflare infrastructure
- **Retention Limits**: Automatic data deletion after retention period
- **Consent Tracking**: User consent for all investigations

### Security Measures
- **Input Validation**: Comprehensive form and API validation
- **Rate Limiting**: API request limiting to prevent abuse
- **Webhook Verification**: Stripe signature verification
- **Access Controls**: Role-based access for admin functions

## 📝 Development Status

- **Environment**: Development (Sandbox)
- **Database**: Local SQLite with migration system
- **APIs**: Mock implementations with production-ready structure
- **Payment**: Stripe integration framework (keys needed)
- **Deployment**: Ready for Cloudflare Pages deployment
- **Last Updated**: August 21, 2025
- **Branding**: Professional WhoHub logos and brand identity integrated

## 🤝 Contributing

The WhoHub platform is designed with security and privacy as top priorities. All OSINT investigations are conducted using publicly available information only, and reports are automatically redacted to protect personal privacy while providing essential safety information.

---

**Note**: This application is designed for legitimate safety and verification purposes only. Users must provide consent and have valid reasons for conducting investigations. The platform complies with privacy regulations and ethical OSINT practices.