// OSINT Investigation Services
// This module handles all OSINT operations including image analysis, 
// social media searches, breach checks, and criminal record searches

import type { 
  CloudflareBindings, 
  ReverseImageSearchResult, 
  AIImageAnalysisResult, 
  BreachCheckResult, 
  SocialMediaSearchResult 
} from '../types'

export class OSINTService {
  constructor(private env: CloudflareBindings) {}

  // Main OSINT investigation pipeline
  async runFullInvestigation(investigationId: number): Promise<void> {
    console.log(`Starting OSINT investigation ${investigationId}`)
    
    try {
      // Get investigation details
      const investigation = await this.env.DB.prepare(
        `SELECT * FROM investigations WHERE id = ?`
      ).bind(investigationId).first()

      if (!investigation) {
        throw new Error('Investigation not found')
      }

      // Parse submitted images
      let imageUrls: string[] = []
      if (investigation.submitted_images) {
        try {
          imageUrls = JSON.parse(investigation.submitted_images as string)
        } catch (e) {
          imageUrls = []
        }
      }

      const promises: Promise<any>[] = []

      // 1. Image Analysis (if images provided)
      if (imageUrls.length > 0) {
        promises.push(this.analyzeImages(investigationId, imageUrls))
      }

      // 2. Email/Phone Breach Check
      if (investigation.target_email) {
        promises.push(this.checkDataBreaches(investigationId, investigation.target_email, 'email'))
      }
      if (investigation.target_phone) {
        promises.push(this.checkDataBreaches(investigationId, investigation.target_phone, 'phone'))
      }

      // 3. Social Media Search
      if (investigation.target_name) {
        promises.push(this.searchSocialMedia(investigationId, investigation.target_name, imageUrls[0]))
      }

      // 4. Criminal Records Search (Full reports only)
      if (investigation.investigation_type === 'full' && investigation.target_name) {
        promises.push(this.searchCriminalRecords(investigationId, investigation.target_name))
      }

      // 5. Name Analysis and OSINT
      if (investigation.target_name) {
        promises.push(this.analyzeNameOSINT(investigationId, investigation.target_name))
      }

      // Wait for all OSINT operations to complete
      await Promise.allSettled(promises)

      // Calculate final confidence score and red flags
      await this.calculateConfidenceScore(investigationId)

      // Update investigation status
      await this.env.DB.prepare(`
        UPDATE investigations 
        SET status = 'completed', completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(investigationId).run()

      console.log(`OSINT investigation ${investigationId} completed successfully`)

    } catch (error) {
      console.error(`OSINT investigation ${investigationId} failed:`, error)
      
      // Mark as failed
      await this.env.DB.prepare(`
        UPDATE investigations 
        SET status = 'failed'
        WHERE id = ?
      `).bind(investigationId).run()
    }
  }

  // Analyze uploaded images for AI detection and reverse search
  async analyzeImages(investigationId: number, imageUrls: string[]): Promise<void> {
    for (const imageUrl of imageUrls) {
      try {
        // AI Detection
        const aiAnalysis = await this.detectAIGeneratedImage(imageUrl)
        
        // Reverse Image Search
        const reverseSearch = await this.reverseImageSearch(imageUrl)
        
        // Store image analysis results
        await this.env.DB.prepare(`
          INSERT INTO image_analysis (
            investigation_id, original_image_url, is_ai_generated, ai_confidence,
            deepfake_probability, reverse_search_matches, earliest_appearance,
            most_common_source
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          investigationId,
          imageUrl,
          aiAnalysis.is_ai_generated,
          aiAnalysis.confidence,
          aiAnalysis.deepfake_probability,
          reverseSearch.total_matches,
          reverseSearch.matches[0]?.url || null,
          reverseSearch.matches[0]?.source_domain || null
        ).run()

        // Store individual reverse search matches
        for (const match of reverseSearch.matches.slice(0, 10)) { // Limit to top 10 matches
          await this.env.DB.prepare(`
            INSERT INTO osint_findings (
              investigation_id, finding_type, source, confidence, is_red_flag,
              image_url, matched_url, raw_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            investigationId,
            'image_search',
            reverseSearch.source,
            match.similarity,
            match.similarity > 0.8, // Red flag if >80% similarity
            imageUrl,
            match.url,
            JSON.stringify(match)
          ).run()
        }

        // Red flag for AI-generated images
        if (aiAnalysis.is_ai_generated && aiAnalysis.confidence > 0.7) {
          await this.env.DB.prepare(`
            INSERT INTO osint_findings (
              investigation_id, finding_type, source, confidence, is_red_flag,
              image_url, raw_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(
            investigationId,
            'ai_detection',
            'cloudflare_ai',
            aiAnalysis.confidence,
            true,
            imageUrl,
            JSON.stringify(aiAnalysis)
          ).run()
        }

      } catch (error) {
        console.error(`Error analyzing image ${imageUrl}:`, error)
      }
    }
  }

  // Detect AI-generated images using Cloudflare AI
  async detectAIGeneratedImage(imageUrl: string): Promise<AIImageAnalysisResult> {
    try {
      // Download image
      const response = await fetch(imageUrl)
      const imageData = await response.arrayBuffer()

      // Use Cloudflare AI for image analysis
      const result = await this.env.AI.run('@cf/microsoft/resnet-50', {
        image: [...new Uint8Array(imageData)]
      })

      // Analyze metadata and technical indicators
      const metadata = await this.analyzeImageMetadata(imageData)
      
      // Simple heuristic for AI detection (in production, use specialized models)
      const aiIndicators = this.detectAIIndicators(metadata)
      const isAIGenerated = aiIndicators.score > 0.7
      const confidence = aiIndicators.score
      const deepfakeProb = aiIndicators.deepfake_probability

      return {
        is_ai_generated: isAIGenerated,
        confidence,
        deepfake_probability: deepfakeProb,
        analysis_details: {
          artifacts_detected: aiIndicators.artifacts,
          face_consistency: aiIndicators.face_consistency,
          lighting_consistency: aiIndicators.lighting_consistency,
          compression_artifacts: aiIndicators.compression_artifacts
        }
      }

    } catch (error) {
      console.error('AI detection error:', error)
      return {
        is_ai_generated: false,
        confidence: 0,
        deepfake_probability: 0,
        analysis_details: {
          artifacts_detected: [],
          face_consistency: 0,
          lighting_consistency: 0,
          compression_artifacts: false
        }
      }
    }
  }

  // Reverse image search using multiple sources
  async reverseImageSearch(imageUrl: string): Promise<ReverseImageSearchResult> {
    const matches: any[] = []
    let totalMatches = 0

    try {
      // Google Vision API reverse search
      const googleResults = await this.googleReverseImageSearch(imageUrl)
      matches.push(...googleResults)
      totalMatches += googleResults.length

      // Yandex reverse search (if available)
      const yandexResults = await this.yandexReverseImageSearch(imageUrl)
      matches.push(...yandexResults)
      totalMatches += yandexResults.length

      // PimEyes search (if API available)
      // const pimeyesResults = await this.pimeyesReverseImageSearch(imageUrl)
      // matches.push(...pimeyesResults)

      // Sort by similarity score
      matches.sort((a, b) => b.similarity - a.similarity)

      return {
        source: 'multiple',
        matches: matches.slice(0, 20), // Top 20 matches
        total_matches: totalMatches,
        confidence: matches.length > 0 ? matches[0].similarity : 0
      }

    } catch (error) {
      console.error('Reverse image search error:', error)
      return {
        source: 'error',
        matches: [],
        total_matches: 0,
        confidence: 0
      }
    }
  }

  // Google Vision API reverse image search
  async googleReverseImageSearch(imageUrl: string): Promise<any[]> {
    try {
      // In production, use actual Google Vision API
      // For now, simulate results
      const mockResults = [
        {
          url: 'https://example.com/similar-image-1.jpg',
          similarity: 0.85,
          source_domain: 'example.com',
          thumbnail_url: 'https://example.com/thumb1.jpg',
          context: 'Social media profile'
        },
        {
          url: 'https://stock-photos.com/image-123.jpg',
          similarity: 0.92,
          source_domain: 'stock-photos.com',
          thumbnail_url: 'https://stock-photos.com/thumb123.jpg',
          context: 'Stock photography'
        }
      ]

      return mockResults

    } catch (error) {
      console.error('Google Vision API error:', error)
      return []
    }
  }

  // Yandex reverse image search
  async yandexReverseImageSearch(imageUrl: string): Promise<any[]> {
    try {
      // In production, implement Yandex API integration
      return []
    } catch (error) {
      console.error('Yandex search error:', error)
      return []
    }
  }

  // Check for data breaches using HaveIBeenPwned
  async checkDataBreaches(investigationId: number, identifier: string, type: 'email' | 'phone'): Promise<void> {
    try {
      // In production, use actual HaveIBeenPwned API
      const mockBreaches = [
        {
          name: 'LinkedIn',
          date: '2021-06-01',
          description: 'Professional networking platform breach',
          data_types: ['Email addresses', 'Names', 'Professional information'],
          verified: true,
          severity: 'high' as const
        }
      ]

      for (const breach of mockBreaches) {
        await this.env.DB.prepare(`
          INSERT INTO breach_records (
            investigation_id, ${type}, breach_name, breach_date,
            breach_description, data_types, verified, severity
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          investigationId,
          identifier,
          breach.name,
          breach.date,
          breach.description,
          JSON.stringify(breach.data_types),
          breach.verified,
          breach.severity
        ).run()

        // Add OSINT finding
        await this.env.DB.prepare(`
          INSERT INTO osint_findings (
            investigation_id, finding_type, source, confidence, is_red_flag,
            raw_data
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          investigationId,
          'breach_check',
          'haveibeenpwned',
          1.0,
          breach.severity === 'high' || breach.severity === 'critical',
          JSON.stringify(breach)
        ).run()
      }

    } catch (error) {
      console.error('Breach check error:', error)
    }
  }

  // Search social media platforms
  async searchSocialMedia(investigationId: number, name: string, profileImageUrl?: string): Promise<void> {
    const platforms = ['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok']

    for (const platform of platforms) {
      try {
        const profiles = await this.searchPlatform(platform, name, profileImageUrl)
        
        for (const profile of profiles) {
          await this.env.DB.prepare(`
            INSERT INTO social_profiles (
              investigation_id, platform, profile_url, username, display_name,
              profile_image_url, match_confidence, suspicious_activity
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            investigationId,
            platform,
            profile.url,
            profile.username,
            profile.display_name,
            profile.profile_image_url,
            profile.match_confidence,
            profile.match_confidence < 0.5 // Suspicious if low confidence
          ).run()

          // Add OSINT finding
          await this.env.DB.prepare(`
            INSERT INTO osint_findings (
              investigation_id, finding_type, source, confidence, is_red_flag,
              social_platform, profile_url, username, raw_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            investigationId,
            'social_profile',
            platform,
            profile.match_confidence,
            profile.match_confidence < 0.3, // Red flag if very low confidence
            platform,
            profile.url,
            profile.username,
            JSON.stringify(profile.profile_data)
          ).run()
        }

      } catch (error) {
        console.error(`Error searching ${platform}:`, error)
      }
    }
  }

  // Search individual social media platform
  async searchPlatform(platform: string, name: string, imageUrl?: string): Promise<any[]> {
    // In production, implement actual API integrations for each platform
    // For now, return mock data
    
    const mockProfiles = [
      {
        url: `https://${platform}.com/john_doe_123`,
        username: 'john_doe_123',
        display_name: 'John Doe',
        profile_image_url: `https://${platform}.com/avatar1.jpg`,
        match_confidence: 0.75,
        profile_data: {
          followers: 150,
          posts: 45,
          verified: false,
          account_created: '2020-01-15'
        }
      }
    ]

    return mockProfiles
  }

  // Search criminal records and court databases
  async searchCriminalRecords(investigationId: number, name: string): Promise<void> {
    try {
      // In production, search actual court record databases
      // This would include AU/NZ court records, news articles, etc.
      
      const mockRecords = [
        {
          full_name: name,
          conviction_type: 'Fraud',
          court_name: 'Sydney District Court',
          case_number: 'SDC-2020-1234',
          conviction_date: '2020-05-15',
          sentence: '6 months suspended sentence',
          jurisdiction: 'NSW, Australia',
          source_url: 'https://courts.nsw.gov.au/case/SDC-2020-1234',
          confidence: 0.65 // Moderate confidence - name match only
        }
      ]

      for (const record of mockRecords) {
        await this.env.DB.prepare(`
          INSERT INTO conviction_records (
            investigation_id, full_name, conviction_type, court_name,
            case_number, conviction_date, sentence, jurisdiction,
            source_url, confidence
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          investigationId,
          record.full_name,
          record.conviction_type,
          record.court_name,
          record.case_number,
          record.conviction_date,
          record.sentence,
          record.jurisdiction,
          record.source_url,
          record.confidence
        ).run()

        // Add OSINT finding
        await this.env.DB.prepare(`
          INSERT INTO osint_findings (
            investigation_id, finding_type, source, confidence, is_red_flag,
            conviction_type, conviction_date, raw_data
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          investigationId,
          'conviction',
          'court_records',
          record.confidence,
          true, // Always red flag
          record.conviction_type,
          record.conviction_date,
          JSON.stringify(record)
        ).run()
      }

    } catch (error) {
      console.error('Criminal records search error:', error)
    }
  }

  // Advanced name-based OSINT
  async analyzeNameOSINT(investigationId: number, name: string): Promise<void> {
    try {
      // News and media search
      await this.searchNewsArticles(investigationId, name)
      
      // Professional databases (LinkedIn, company records)
      await this.searchProfessionalDatabases(investigationId, name)
      
      // Public records and registries
      await this.searchPublicRecords(investigationId, name)

    } catch (error) {
      console.error('Name OSINT analysis error:', error)
    }
  }

  // Search news articles and media mentions
  async searchNewsArticles(investigationId: number, name: string): Promise<void> {
    // Implementation would use news APIs like NewsAPI, Google News, etc.
  }

  // Search professional databases
  async searchProfessionalDatabases(investigationId: number, name: string): Promise<void> {
    // Implementation would search LinkedIn, company registries, etc.
  }

  // Search public records
  async searchPublicRecords(investigationId: number, name: string): Promise<void> {
    // Implementation would search voter records, property records, etc.
  }

  // Calculate final confidence score based on all findings
  async calculateConfidenceScore(investigationId: number): Promise<void> {
    try {
      // Get all findings
      const findings = await this.env.DB.prepare(`
        SELECT * FROM osint_findings WHERE investigation_id = ?
      `).bind(investigationId).all()

      const redFlags = findings.results.filter(f => f.is_red_flag)
      
      // Base confidence score
      let confidenceScore = 75

      // Adjust based on red flags
      confidenceScore -= redFlags.length * 10

      // Adjust based on positive findings
      const positiveFindings = findings.results.filter(f => !f.is_red_flag && f.confidence > 0.7)
      confidenceScore += Math.min(positiveFindings.length * 5, 25)

      // Ensure score is within bounds
      confidenceScore = Math.max(0, Math.min(100, confidenceScore))

      // Update investigation
      await this.env.DB.prepare(`
        UPDATE investigations 
        SET confidence_score = ?, red_flags_count = ?
        WHERE id = ?
      `).bind(confidenceScore, redFlags.length, investigationId).run()

    } catch (error) {
      console.error('Error calculating confidence score:', error)
    }
  }

  // Helper functions
  private async analyzeImageMetadata(imageData: ArrayBuffer): Promise<any> {
    // Analyze EXIF data, compression artifacts, etc.
    return {
      hasExif: false,
      compressionArtifacts: false,
      resolution: { width: 1024, height: 768 }
    }
  }

  private detectAIIndicators(metadata: any): any {
    // AI detection heuristics
    return {
      score: 0.3,
      deepfake_probability: 0.2,
      artifacts: ['compression'],
      face_consistency: 0.8,
      lighting_consistency: 0.9,
      compression_artifacts: true
    }
  }
}

// Export convenience function
export async function runOSINTInvestigation(investigationId: number, env: CloudflareBindings): Promise<void> {
  const osintService = new OSINTService(env)
  await osintService.runFullInvestigation(investigationId)
}