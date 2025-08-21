import { Hono } from 'hono'
import type { CloudflareBindings, StripeWebhookPayload } from '../types'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// Stripe webhook endpoint
app.post('/stripe', async (c) => {
  const { env } = c
  
  try {
    const signature = c.req.header('stripe-signature')
    const body = await c.req.text()
    
    if (!signature) {
      return c.json({ error: 'Missing Stripe signature' }, 400)
    }

    // In production, verify the webhook signature using Stripe's webhook secret
    // const webhookSecret = await env.KV.get('stripe_webhook_secret')
    // if (!verifyStripeSignature(body, signature, webhookSecret)) {
    //   return c.json({ error: 'Invalid signature' }, 401)
    // }

    const event: StripeWebhookPayload = JSON.parse(body)
    
    console.log(`Received Stripe webhook: ${event.type}`)

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event, env)
        break
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event, env)
        break
        
      case 'payment_intent.canceled':
        await handlePaymentCancellation(event, env)
        break
        
      default:
        console.log(`Unhandled webhook event type: ${event.type}`)
    }

    return c.json({ received: true })

  } catch (error) {
    console.error('Stripe webhook error:', error)
    return c.json({ error: 'Webhook processing failed' }, 500)
  }
})

// Handle successful payment
async function handlePaymentSuccess(event: StripeWebhookPayload, env: CloudflareBindings) {
  const paymentIntent = event.data.object
  const paymentIntentId = paymentIntent.id
  
  try {
    // Find investigation by payment intent ID
    const investigation = await env.DB.prepare(`
      SELECT * FROM investigations 
      WHERE payment_intent_id = ? AND payment_status = 'pending'
    `).bind(paymentIntentId).first()

    if (!investigation) {
      console.log(`No pending investigation found for payment intent: ${paymentIntentId}`)
      return
    }

    // Update investigation status
    await env.DB.prepare(`
      UPDATE investigations 
      SET payment_status = 'paid', status = 'processing'
      WHERE id = ?
    `).bind(investigation.id).run()

    console.log(`Payment confirmed for investigation ${investigation.id}`)

    // Trigger OSINT processing
    await triggerOSINTProcessing(investigation.id, env)

  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

// Handle payment failure
async function handlePaymentFailure(event: StripeWebhookPayload, env: CloudflareBindings) {
  const paymentIntent = event.data.object
  const paymentIntentId = paymentIntent.id
  
  try {
    // Update investigation status
    await env.DB.prepare(`
      UPDATE investigations 
      SET payment_status = 'failed', status = 'failed'
      WHERE payment_intent_id = ?
    `).bind(paymentIntentId).run()

    console.log(`Payment failed for payment intent: ${paymentIntentId}`)

  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}

// Handle payment cancellation
async function handlePaymentCancellation(event: StripeWebhookPayload, env: CloudflareBindings) {
  const paymentIntent = event.data.object
  const paymentIntentId = paymentIntent.id
  
  try {
    // Update investigation status
    await env.DB.prepare(`
      UPDATE investigations 
      SET payment_status = 'failed', status = 'failed'
      WHERE payment_intent_id = ?
    `).bind(paymentIntentId).run()

    console.log(`Payment canceled for payment intent: ${paymentIntentId}`)

  } catch (error) {
    console.error('Error handling payment cancellation:', error)
  }
}

// Trigger OSINT processing pipeline
async function triggerOSINTProcessing(investigationId: number, env: CloudflareBindings) {
  try {
    // In production, this would trigger:
    // 1. Cloudflare Workers Cron Job
    // 2. Queue processing
    // 3. External service calls
    
    // For now, simulate immediate processing
    console.log(`Starting OSINT processing for investigation ${investigationId}`)
    
    // You could use Cloudflare's Queue API here:
    // await env.QUEUE.send({ investigationId, action: 'start_osint' })
    
    // Or trigger a separate Worker:
    // await fetch('https://osint-processor.whohub.workers.dev/process', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ investigationId })
    // })

  } catch (error) {
    console.error('Error triggering OSINT processing:', error)
  }
}

// GitHub webhook for monitoring repository changes (optional)
app.post('/github', async (c) => {
  const { env } = c
  
  try {
    const signature = c.req.header('x-hub-signature-256')
    const body = await c.req.text()
    
    if (!signature) {
      return c.json({ error: 'Missing GitHub signature' }, 400)
    }

    const event = JSON.parse(body)
    console.log(`GitHub webhook: ${c.req.header('x-github-event')}`)

    // Handle GitHub events (push, pull_request, etc.)
    // This could trigger deployments or updates

    return c.json({ received: true })

  } catch (error) {
    console.error('GitHub webhook error:', error)
    return c.json({ error: 'Webhook processing failed' }, 500)
  }
})

// Generic webhook endpoint for external services
app.post('/external/:service', async (c) => {
  const { env } = c
  const service = c.req.param('service')
  
  try {
    const body = await c.req.json()
    
    console.log(`External webhook from ${service}:`, body)

    switch (service) {
      case 'pimeyes':
        await handlePimEyesWebhook(body, env)
        break
        
      case 'haveibeenpwned':
        await handleHIBPWebhook(body, env)
        break
        
      default:
        console.log(`Unknown external service: ${service}`)
    }

    return c.json({ received: true })

  } catch (error) {
    console.error(`External webhook error for ${service}:`, error)
    return c.json({ error: 'Webhook processing failed' }, 500)
  }
})

// Handle PimEyes webhook (when reverse image search completes)
async function handlePimEyesWebhook(data: any, env: CloudflareBindings) {
  try {
    const { investigation_id, search_id, results } = data
    
    if (!investigation_id || !results) {
      console.log('Invalid PimEyes webhook data')
      return
    }

    // Store PimEyes results
    for (const result of results) {
      await env.DB.prepare(`
        INSERT INTO osint_findings (
          investigation_id, finding_type, source, raw_data, processed_data,
          confidence, is_red_flag, image_url, matched_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        investigation_id,
        'image_search',
        'pimeyes',
        JSON.stringify(result),
        JSON.stringify({
          similarity: result.similarity,
          source_domain: result.source_domain,
          context: result.context
        }),
        result.similarity / 100,
        result.similarity > 80, // Mark as red flag if >80% similarity
        result.query_image_url,
        result.matched_url
      ).run()
    }

    console.log(`Stored ${results.length} PimEyes results for investigation ${investigation_id}`)

  } catch (error) {
    console.error('Error handling PimEyes webhook:', error)
  }
}

// Handle HaveIBeenPwned webhook
async function handleHIBPWebhook(data: any, env: CloudflareBindings) {
  try {
    const { investigation_id, email, breaches } = data
    
    if (!investigation_id || !email || !breaches) {
      console.log('Invalid HIBP webhook data')
      return
    }

    // Store breach data
    for (const breach of breaches) {
      await env.DB.prepare(`
        INSERT INTO breach_records (
          investigation_id, email, breach_name, breach_date,
          breach_description, data_types, verified, severity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        investigation_id,
        email,
        breach.name,
        breach.breach_date,
        breach.description,
        JSON.stringify(breach.data_classes),
        breach.verified,
        breach.is_verified ? 'high' : 'medium'
      ).run()
    }

    console.log(`Stored ${breaches.length} breach records for investigation ${investigation_id}`)

  } catch (error) {
    console.error('Error handling HIBP webhook:', error)
  }
}

// Health check for webhook endpoints
app.get('/health', async (c) => {
  return c.json({
    status: 'healthy',
    endpoints: [
      '/webhooks/stripe',
      '/webhooks/github',
      '/webhooks/external/:service'
    ],
    timestamp: new Date().toISOString()
  })
})

// Webhook test endpoint (development only)
app.post('/test', async (c) => {
  const body = await c.req.json()
  
  console.log('Test webhook received:', body)
  
  return c.json({
    success: true,
    received_data: body,
    timestamp: new Date().toISOString()
  })
})

// List recent webhook events (admin only)
app.get('/events', async (c) => {
  const { env } = c
  
  try {
    // In production, you might store webhook events in a separate table
    // For now, return recent API usage as a proxy
    const recentEvents = await env.DB.prepare(`
      SELECT api_provider as service, created_at, success, error_message
      FROM api_usage 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all()

    return c.json({
      success: true,
      events: recentEvents.results
    })

  } catch (error) {
    console.error('Error fetching webhook events:', error)
    return c.json({ error: 'Failed to fetch events' }, 500)
  }
})

export default app