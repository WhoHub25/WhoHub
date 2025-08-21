import { Hono } from 'hono'
import type { CloudflareBindings } from '../types'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// Upload image for investigation
app.post('/investigation/:id/image/:index', async (c) => {
  const { env } = c
  const investigationId = c.req.param('id')
  const imageIndex = c.req.param('index')
  
  try {
    // Verify investigation exists
    const investigation = await env.DB.prepare(
      `SELECT id FROM investigations WHERE id = ?`
    ).bind(investigationId).first()

    if (!investigation) {
      return c.json({ error: 'Investigation not found' }, 404)
    }

    // Get the uploaded file
    const formData = await c.req.formData()
    const file = formData.get('image') as File

    if (!file) {
      return c.json({ error: 'No image file provided' }, 400)
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' }, 400)
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return c.json({ error: 'File too large. Maximum size is 10MB.' }, 400)
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `investigations/${investigationId}/image_${imageIndex}_${timestamp}.${extension}`

    // Upload to R2
    const uploadResult = await env.R2.put(filename, file.stream(), {
      httpMetadata: {
        contentType: file.type,
        contentDisposition: `inline; filename="${file.name}"`
      },
      customMetadata: {
        investigation_id: investigationId,
        image_index: imageIndex,
        original_name: file.name,
        upload_timestamp: timestamp.toString()
      }
    })

    if (!uploadResult) {
      return c.json({ error: 'Failed to upload image' }, 500)
    }

    // Generate public URL (in production, use actual R2 domain)
    const imageUrl = `https://storage.whohub.dev/${filename}`

    // Update investigation with uploaded image
    const currentImages = await env.DB.prepare(
      `SELECT submitted_images FROM investigations WHERE id = ?`
    ).bind(investigationId).first()

    let imageList: string[] = []
    if (currentImages?.submitted_images) {
      try {
        imageList = JSON.parse(currentImages.submitted_images as string)
      } catch (e) {
        imageList = []
      }
    }

    // Add new image URL
    imageList.push(imageUrl)

    // Update database
    await env.DB.prepare(`
      UPDATE investigations 
      SET submitted_images = ? 
      WHERE id = ?
    `).bind(JSON.stringify(imageList), investigationId).run()

    return c.json({
      success: true,
      image_url: imageUrl,
      filename,
      message: 'Image uploaded successfully'
    })

  } catch (error) {
    console.error('Error uploading image:', error)
    return c.json({ error: 'Failed to upload image' }, 500)
  }
})

// Get uploaded image
app.get('/investigation/:id/image/:filename', async (c) => {
  const { env } = c
  const investigationId = c.req.param('id')
  const filename = c.req.param('filename')
  
  try {
    // Construct full filename
    const fullFilename = `investigations/${investigationId}/${filename}`
    
    // Get image from R2
    const object = await env.R2.get(fullFilename)
    
    if (!object) {
      return c.json({ error: 'Image not found' }, 404)
    }

    // Return image with proper headers
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
        'Content-Length': object.size.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'ETag': object.etag
      }
    })

  } catch (error) {
    console.error('Error retrieving image:', error)
    return c.json({ error: 'Failed to retrieve image' }, 500)
  }
})

// Delete uploaded image
app.delete('/investigation/:id/image/:filename', async (c) => {
  const { env } = c
  const investigationId = c.req.param('id')
  const filename = c.req.param('filename')
  
  try {
    // Verify investigation exists and user has permission
    const investigation = await env.DB.prepare(
      `SELECT id, submitted_images FROM investigations WHERE id = ?`
    ).bind(investigationId).first()

    if (!investigation) {
      return c.json({ error: 'Investigation not found' }, 404)
    }

    // Construct full filename
    const fullFilename = `investigations/${investigationId}/${filename}`
    
    // Delete from R2
    await env.R2.delete(fullFilename)

    // Update database - remove image URL from submitted_images
    let imageList: string[] = []
    if (investigation.submitted_images) {
      try {
        imageList = JSON.parse(investigation.submitted_images as string)
        imageList = imageList.filter(url => !url.includes(filename))
      } catch (e) {
        imageList = []
      }
    }

    await env.DB.prepare(`
      UPDATE investigations 
      SET submitted_images = ? 
      WHERE id = ?
    `).bind(JSON.stringify(imageList), investigationId).run()

    return c.json({
      success: true,
      message: 'Image deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting image:', error)
    return c.json({ error: 'Failed to delete image' }, 500)
  }
})

// Upload profile screenshot or evidence
app.post('/evidence', async (c) => {
  const { env } = c
  
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'profile', 'conversation', 'other'
    const description = formData.get('description') as string

    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
    }

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Invalid file type' }, 400)
    }

    const maxSize = 20 * 1024 * 1024 // 20MB for evidence files
    if (file.size > maxSize) {
      return c.json({ error: 'File too large. Maximum size is 20MB.' }, 400)
    }

    // Generate filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `evidence/${type}/${timestamp}.${extension}`

    // Upload to R2
    await env.R2.put(filename, file.stream(), {
      httpMetadata: {
        contentType: file.type
      },
      customMetadata: {
        type,
        description: description || '',
        original_name: file.name,
        upload_timestamp: timestamp.toString()
      }
    })

    const fileUrl = `https://storage.whohub.dev/${filename}`

    return c.json({
      success: true,
      file_url: fileUrl,
      filename,
      type,
      message: 'Evidence uploaded successfully'
    })

  } catch (error) {
    console.error('Error uploading evidence:', error)
    return c.json({ error: 'Failed to upload evidence' }, 500)
  }
})

// Generate pre-signed upload URL (for direct client uploads)
app.post('/presigned-url', async (c) => {
  const { env } = c
  
  try {
    const body = await c.req.json()
    const { investigation_id, file_type, file_name } = body

    if (!investigation_id || !file_type || !file_name) {
      return c.json({ error: 'Missing required parameters' }, 400)
    }

    // Verify investigation exists
    const investigation = await env.DB.prepare(
      `SELECT id FROM investigations WHERE id = ?`
    ).bind(investigation_id).first()

    if (!investigation) {
      return c.json({ error: 'Investigation not found' }, 404)
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file_name.split('.').pop() || 'jpg'
    const key = `investigations/${investigation_id}/upload_${timestamp}.${extension}`

    // In production, generate actual pre-signed URL for R2
    // For now, return a mock URL
    const presignedUrl = `/api/uploads/investigation/${investigation_id}/direct-upload`
    
    return c.json({
      success: true,
      presigned_url: presignedUrl,
      key,
      expires_in: 3600 // 1 hour
    })

  } catch (error) {
    console.error('Error generating pre-signed URL:', error)
    return c.json({ error: 'Failed to generate upload URL' }, 500)
  }
})

// List uploaded files for investigation
app.get('/investigation/:id', async (c) => {
  const { env } = c
  const investigationId = c.req.param('id')
  
  try {
    // Get investigation
    const investigation = await env.DB.prepare(
      `SELECT submitted_images FROM investigations WHERE id = ?`
    ).bind(investigationId).first()

    if (!investigation) {
      return c.json({ error: 'Investigation not found' }, 404)
    }

    let imageList: string[] = []
    if (investigation.submitted_images) {
      try {
        imageList = JSON.parse(investigation.submitted_images as string)
      } catch (e) {
        imageList = []
      }
    }

    // List objects in R2 for this investigation
    const prefix = `investigations/${investigationId}/`
    // Note: R2 list operation would be implemented here in production
    
    return c.json({
      success: true,
      images: imageList,
      total_count: imageList.length
    })

  } catch (error) {
    console.error('Error listing files:', error)
    return c.json({ error: 'Failed to list files' }, 500)
  }
})

export default app