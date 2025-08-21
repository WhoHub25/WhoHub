import { Hono } from 'hono'
import type { CloudflareBindings, CreateInvestigationRequest, CreateInvestigationResponse, Investigation, InvestigationStatusResponse } from '../types'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// Create a new investigation
app.post('/', async (c) => {
  const { env } = c
  const body = await c.req.json() as CreateInvestigationRequest
  
  try {
    // Validate required fields
    if (!body.investigation_type || !['simple', 'full'].includes(body.investigation_type)) {
      return c.json({ error: 'Invalid investigation type' }, 400)
    }

    // Get pricing from system config
    const priceConfig = await env.DB.prepare(
      `SELECT config_value FROM system_config WHERE config_key = ?`
    ).bind(`${body.investigation_type}_report_price_aud`).first()

    if (!priceConfig) {
      return c.json({ error: 'Pricing configuration not found' }, 500)
    }

    const amount_aud = parseFloat(priceConfig.config_value as string)

    // Create investigation record
    const investigation = await env.DB.prepare(`
      INSERT INTO investigations (
        investigation_type, status, target_name, target_email, target_phone,
        dating_platform, additional_info, payment_status, amount_aud
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `).bind(
      body.investigation_type,
      'pending',
      body.target_name || null,
      body.target_email || null,
      body.target_phone || null,
      body.dating_platform || null,
      body.additional_info || null,
      'pending',
      amount_aud
    ).first() as Investigation

    // Generate pre-signed URLs for image uploads (if needed)
    const uploadUrls: string[] = []
    const maxImages = 5 // Maximum images allowed per investigation

    for (let i = 0; i < maxImages; i++) {
      const key = `investigations/${investigation.id}/image_${i + 1}.jpg`
      // Note: In production, generate actual pre-signed URLs for R2
      uploadUrls.push(`/api/uploads/investigation/${investigation.id}/image/${i + 1}`)
    }

    const response: CreateInvestigationResponse = {
      success: true,
      investigation_id: investigation.id,
      amount_aud,
      upload_urls: uploadUrls
    }

    return c.json(response)

  } catch (error) {
    console.error('Error creating investigation:', error)
    return c.json({ error: 'Failed to create investigation' }, 500)
  }
})

// Get investigation status and results
app.get('/:id', async (c) => {
  const { env } = c
  const investigationId = c.req.param('id')
  
  try {
    // Get investigation details
    const investigation = await env.DB.prepare(
      `SELECT * FROM investigations WHERE id = ?`
    ).bind(investigationId).first() as Investigation

    if (!investigation) {
      return c.json({ error: 'Investigation not found' }, 404)
    }

    // Get all related data
    const [findings, imageAnalysis, socialProfiles, breachRecords, convictionRecords, report] = await Promise.all([
      env.DB.prepare(`SELECT * FROM osint_findings WHERE investigation_id = ?`).bind(investigationId).all(),
      env.DB.prepare(`SELECT * FROM image_analysis WHERE investigation_id = ?`).bind(investigationId).all(),
      env.DB.prepare(`SELECT * FROM social_profiles WHERE investigation_id = ?`).bind(investigationId).all(),
      env.DB.prepare(`SELECT * FROM breach_records WHERE investigation_id = ?`).bind(investigationId).all(),
      env.DB.prepare(`SELECT * FROM conviction_records WHERE investigation_id = ?`).bind(investigationId).all(),
      env.DB.prepare(`SELECT * FROM reports WHERE investigation_id = ?`).bind(investigationId).first()
    ])

    const response: InvestigationStatusResponse = {
      investigation,
      findings: findings.results,
      image_analysis: imageAnalysis.results,
      social_profiles: socialProfiles.results,
      breach_records: breachRecords.results,
      conviction_records: convictionRecords.results,
      report: report || undefined
    }

    return c.json(response)

  } catch (error) {
    console.error('Error fetching investigation:', error)
    return c.json({ error: 'Failed to fetch investigation' }, 500)
  }
})

// Start OSINT processing (after payment confirmation)
app.post('/:id/start', async (c) => {
  const { env } = c
  const investigationId = c.req.param('id')
  
  try {
    // Update investigation status to processing
    await env.DB.prepare(`
      UPDATE investigations 
      SET status = 'processing', payment_status = 'paid'
      WHERE id = ? AND payment_status = 'pending'
    `).bind(investigationId).run()

    // In a real implementation, this would trigger the OSINT pipeline
    // For now, we'll simulate it by scheduling background processing
    
    // Simulate OSINT processing with setTimeout equivalent
    // In production, use Cloudflare Workers Cron Triggers or Queues
    
    return c.json({ 
      success: true, 
      message: 'Investigation processing started',
      estimated_completion: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
    })

  } catch (error) {
    console.error('Error starting investigation:', error)
    return c.json({ error: 'Failed to start investigation' }, 500)
  }
})

// List user's investigations (requires authentication in real app)
app.get('/', async (c) => {
  const { env } = c
  
  try {
    // In production, get user ID from authentication
    // For now, return recent investigations
    const investigations = await env.DB.prepare(`
      SELECT id, investigation_type, status, target_name, confidence_score, 
             red_flags_count, amount_aud, created_at, completed_at
      FROM investigations 
      ORDER BY created_at DESC 
      LIMIT 20
    `).all()

    return c.json({
      success: true,
      investigations: investigations.results
    })

  } catch (error) {
    console.error('Error fetching investigations:', error)
    return c.json({ error: 'Failed to fetch investigations' }, 500)
  }
})

// Delete investigation (admin only or user's own)
app.delete('/:id', async (c) => {
  const { env } = c
  const investigationId = c.req.param('id')
  
  try {
    // In production, check user permissions
    
    // Delete all related records (cascade delete)
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM api_usage WHERE investigation_id = ?`).bind(investigationId),
      env.DB.prepare(`DELETE FROM reports WHERE investigation_id = ?`).bind(investigationId),
      env.DB.prepare(`DELETE FROM conviction_records WHERE investigation_id = ?`).bind(investigationId),
      env.DB.prepare(`DELETE FROM breach_records WHERE investigation_id = ?`).bind(investigationId),
      env.DB.prepare(`DELETE FROM social_profiles WHERE investigation_id = ?`).bind(investigationId),
      env.DB.prepare(`DELETE FROM image_analysis WHERE investigation_id = ?`).bind(investigationId),
      env.DB.prepare(`DELETE FROM osint_findings WHERE investigation_id = ?`).bind(investigationId),
      env.DB.prepare(`DELETE FROM investigations WHERE id = ?`).bind(investigationId)
    ])

    return c.json({ success: true, message: 'Investigation deleted' })

  } catch (error) {
    console.error('Error deleting investigation:', error)
    return c.json({ error: 'Failed to delete investigation' }, 500)
  }
})

export default app