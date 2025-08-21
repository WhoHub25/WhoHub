import { Hono } from 'hono'
import type { CloudflareBindings, Report } from '../types'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// Generate PDF report for completed investigation
app.post('/generate/:investigation_id', async (c) => {
  const { env } = c
  const investigationId = c.req.param('investigation_id')
  
  try {
    // Get investigation details
    const investigation = await env.DB.prepare(
      `SELECT * FROM investigations WHERE id = ? AND status = 'completed'`
    ).bind(investigationId).first()

    if (!investigation) {
      return c.json({ error: 'Investigation not found or not completed' }, 404)
    }

    // Check if report already exists
    const existingReport = await env.DB.prepare(
      `SELECT * FROM reports WHERE investigation_id = ?`
    ).bind(investigationId).first()

    if (existingReport) {
      return c.json({
        success: true,
        report_url: (existingReport as Report).pdf_file_path,
        message: 'Report already exists'
      })
    }

    // Gather all investigation data
    const [findings, imageAnalysis, socialProfiles, breachRecords, convictionRecords] = await Promise.all([
      env.DB.prepare(`SELECT * FROM osint_findings WHERE investigation_id = ?`).bind(investigationId).all(),
      env.DB.prepare(`SELECT * FROM image_analysis WHERE investigation_id = ?`).bind(investigationId).all(),
      env.DB.prepare(`SELECT * FROM social_profiles WHERE investigation_id = ?`).bind(investigationId).all(),
      env.DB.prepare(`SELECT * FROM breach_records WHERE investigation_id = ?`).bind(investigationId).all(),
      env.DB.prepare(`SELECT * FROM conviction_records WHERE investigation_id = ?`).bind(investigationId).all()
    ])

    // Generate report content using AI
    const reportContent = await generateReportContent({
      investigation,
      findings: findings.results,
      imageAnalysis: imageAnalysis.results,
      socialProfiles: socialProfiles.results,
      breachRecords: breachRecords.results,
      convictionRecords: convictionRecords.results
    }, env.AI)

    // Generate PDF
    const pdfBuffer = await generatePDF(reportContent, investigation)
    
    // Upload PDF to R2
    const timestamp = Date.now()
    const filename = `reports/${investigationId}/report_${timestamp}.pdf`
    
    await env.R2.put(filename, pdfBuffer, {
      httpMetadata: {
        contentType: 'application/pdf',
        contentDisposition: `attachment; filename="whohub_report_${investigationId}.pdf"`
      },
      customMetadata: {
        investigation_id: investigationId,
        report_type: investigation.investigation_type,
        generated_at: new Date().toISOString()
      }
    })

    const reportUrl = `https://reports.whohub.dev/${filename}`

    // Save report record
    await env.DB.prepare(`
      INSERT INTO reports (
        investigation_id, report_type, executive_summary, image_analysis_summary,
        social_profiles_summary, red_flags_summary, breach_summary, conviction_summary,
        total_pages, generation_time_seconds, pdf_file_path, pdf_file_size, redacted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      investigationId,
      investigation.investigation_type,
      reportContent.executive_summary,
      reportContent.image_analysis_summary,
      reportContent.social_profiles_summary,
      reportContent.red_flags_summary,
      reportContent.breach_summary,
      reportContent.conviction_summary,
      reportContent.total_pages,
      Math.floor((Date.now() - timestamp) / 1000),
      reportUrl,
      pdfBuffer.byteLength,
      true
    ).run()

    return c.json({
      success: true,
      report_url: reportUrl,
      filename,
      message: 'Report generated successfully'
    })

  } catch (error) {
    console.error('Error generating report:', error)
    return c.json({ error: 'Failed to generate report' }, 500)
  }
})

// Download report PDF
app.get('/:investigation_id/download', async (c) => {
  const { env } = c
  const investigationId = c.req.param('investigation_id')
  
  try {
    // Get report record
    const report = await env.DB.prepare(
      `SELECT * FROM reports WHERE investigation_id = ?`
    ).bind(investigationId).first() as Report

    if (!report) {
      return c.json({ error: 'Report not found' }, 404)
    }

    // Extract filename from URL
    const filename = report.pdf_file_path?.split('/').pop() || 'report.pdf'
    const r2Key = `reports/${investigationId}/${filename}`

    // Get PDF from R2
    const object = await env.R2.get(r2Key)
    
    if (!object) {
      return c.json({ error: 'Report file not found' }, 404)
    }

    // Return PDF with proper headers
    return new Response(object.body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="whohub_report_${investigationId}.pdf"`,
        'Content-Length': object.size.toString(),
        'Cache-Control': 'private, no-cache'
      }
    })

  } catch (error) {
    console.error('Error downloading report:', error)
    return c.json({ error: 'Failed to download report' }, 500)
  }
})

// Get report metadata
app.get('/:investigation_id', async (c) => {
  const { env } = c
  const investigationId = c.req.param('investigation_id')
  
  try {
    const report = await env.DB.prepare(
      `SELECT * FROM reports WHERE investigation_id = ?`
    ).bind(investigationId).first()

    if (!report) {
      return c.json({ error: 'Report not found' }, 404)
    }

    return c.json({
      success: true,
      report
    })

  } catch (error) {
    console.error('Error fetching report:', error)
    return c.json({ error: 'Failed to fetch report' }, 500)
  }
})

// Delete report (admin only)
app.delete('/:investigation_id', async (c) => {
  const { env } = c
  const investigationId = c.req.param('investigation_id')
  
  try {
    // Get report to delete file
    const report = await env.DB.prepare(
      `SELECT * FROM reports WHERE investigation_id = ?`
    ).bind(investigationId).first() as Report

    if (!report) {
      return c.json({ error: 'Report not found' }, 404)
    }

    // Delete PDF from R2
    if (report.pdf_file_path) {
      const filename = report.pdf_file_path.split('/').pop()
      const r2Key = `reports/${investigationId}/${filename}`
      await env.R2.delete(r2Key)
    }

    // Delete report record
    await env.DB.prepare(
      `DELETE FROM reports WHERE investigation_id = ?`
    ).bind(investigationId).run()

    return c.json({
      success: true,
      message: 'Report deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting report:', error)
    return c.json({ error: 'Failed to delete report' }, 500)
  }
})

// Helper function to generate report content using AI
async function generateReportContent(data: any, ai: Ai): Promise<any> {
  const investigation = data.investigation
  const findings = data.findings
  
  // Calculate confidence score based on findings
  const redFlags = findings.filter((f: any) => f.is_red_flag)
  let confidenceScore = 75 // Base score
  
  // Adjust based on red flags
  confidenceScore -= redFlags.length * 10
  confidenceScore = Math.max(0, Math.min(100, confidenceScore))

  // Generate AI-powered summary
  const prompt = `Generate a professional OSINT investigation summary for the following data:
  
Investigation Type: ${investigation.investigation_type}
Target: ${investigation.target_name || 'Anonymous'}
Red Flags Found: ${redFlags.length}
Total Findings: ${findings.length}

Create a concise executive summary that:
1. States the investigation purpose and scope
2. Highlights key findings and concerns
3. Provides risk assessment
4. Maintains professional, objective tone
5. Protects privacy by not revealing sensitive personal information

Keep the summary under 500 words.`

  try {
    const aiResponse = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt,
      max_tokens: 600
    })

    const executiveSummary = aiResponse.response || 'Investigation completed successfully. Detailed findings available in the full report.'

    return {
      executive_summary: executiveSummary,
      image_analysis_summary: generateImageAnalysisSummary(data.imageAnalysis),
      social_profiles_summary: generateSocialProfilesSummary(data.socialProfiles),
      red_flags_summary: generateRedFlagsSummary(redFlags),
      breach_summary: generateBreachSummary(data.breachRecords),
      conviction_summary: generateConvictionSummary(data.convictionRecords),
      total_pages: calculateTotalPages(investigation.investigation_type, findings.length),
      confidence_score: confidenceScore
    }
  } catch (error) {
    console.error('AI summary generation failed:', error)
    
    // Fallback to template-based summary
    return {
      executive_summary: `OSINT Investigation completed for ${investigation.investigation_type} report. ${findings.length} findings analyzed with ${redFlags.length} potential concerns identified.`,
      image_analysis_summary: generateImageAnalysisSummary(data.imageAnalysis),
      social_profiles_summary: generateSocialProfilesSummary(data.socialProfiles),
      red_flags_summary: generateRedFlagsSummary(redFlags),
      breach_summary: generateBreachSummary(data.breachRecords),
      conviction_summary: generateConvictionSummary(data.convictionRecords),
      total_pages: calculateTotalPages(investigation.investigation_type, findings.length),
      confidence_score: confidenceScore
    }
  }
}

// Helper functions for generating section summaries
function generateImageAnalysisSummary(imageAnalysis: any[]): string {
  if (!imageAnalysis.length) return 'No images analyzed.'
  
  const aiGenerated = imageAnalysis.filter(img => img.is_ai_generated).length
  const totalMatches = imageAnalysis.reduce((sum, img) => sum + (img.reverse_search_matches || 0), 0)
  
  return `${imageAnalysis.length} image(s) analyzed. ${aiGenerated} potentially AI-generated image(s) detected. ${totalMatches} reverse search matches found across all platforms.`
}

function generateSocialProfilesSummary(socialProfiles: any[]): string {
  if (!socialProfiles.length) return 'No social media profiles found.'
  
  const platforms = [...new Set(socialProfiles.map(p => p.platform))]
  const verified = socialProfiles.filter(p => p.verified).length
  const suspicious = socialProfiles.filter(p => p.suspicious_activity).length
  
  return `${socialProfiles.length} social media profile(s) found across ${platforms.length} platform(s): ${platforms.join(', ')}. ${verified} verified account(s), ${suspicious} showing suspicious activity.`
}

function generateRedFlagsSummary(redFlags: any[]): string {
  if (!redFlags.length) return 'No significant red flags detected.'
  
  const types = redFlags.map(f => f.finding_type)
  const uniqueTypes = [...new Set(types)]
  
  return `${redFlags.length} red flag(s) identified including: ${uniqueTypes.join(', ')}. Recommend caution and further verification.`
}

function generateBreachSummary(breachRecords: any[]): string {
  if (!breachRecords.length) return 'No data breaches found.'
  
  const totalBreaches = breachRecords.length
  const highSeverity = breachRecords.filter(b => b.severity === 'high' || b.severity === 'critical').length
  
  return `${totalBreaches} data breach(es) found. ${highSeverity} classified as high/critical severity. Account security may be compromised.`
}

function generateConvictionSummary(convictionRecords: any[]): string {
  if (!convictionRecords.length) return 'No criminal convictions found in public records.'
  
  const types = [...new Set(convictionRecords.map(c => c.conviction_type))]
  
  return `${convictionRecords.length} potential criminal record(s) found for similar names. Types include: ${types.join(', ')}. Manual verification recommended.`
}

function calculateTotalPages(investigationType: string, findingsCount: number): number {
  const basePage = investigationType === 'full' ? 8 : 4
  const additionalPages = Math.ceil(findingsCount / 10)
  return basePage + additionalPages
}

// Helper function to generate PDF (simplified version)
async function generatePDF(content: any, investigation: any): Promise<ArrayBuffer> {
  // In production, use a proper PDF generation library
  // For now, return a mock PDF buffer
  
  const pdfContent = `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(WhoHub OSINT Report - Investigation ${investigation.id}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000125 00000 n 
0000000185 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
279
%%EOF`

  return new TextEncoder().encode(pdfContent).buffer
}

export default app