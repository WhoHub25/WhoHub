import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serveStatic } from 'hono/cloudflare-workers'
import type { CloudflareBindings } from './types'

// Import API routes
import investigationRoutes from './api/investigations'
import uploadRoutes from './api/uploads'
import reportsRoutes from './api/reports'
import webhookRoutes from './api/webhooks'

// Create main app with Cloudflare bindings
const app = new Hono<{ Bindings: CloudflareBindings }>()

// Middleware
app.use('*', logger())
app.use('/api/*', cors({
  origin: ['http://localhost:3000', 'https://*.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Serve static files from public directory
app.use('/static/*', serveStatic({ root: './public' }))

// API Routes
app.route('/api/investigations', investigationRoutes)
app.route('/api/uploads', uploadRoutes)
app.route('/api/reports', reportsRoutes)
app.route('/api/webhooks', webhookRoutes)

// Health check endpoint
app.get('/api/health', async (c) => {
  const { env } = c
  
  try {
    // Test database connection
    const result = await env.DB.prepare('SELECT 1 as test').first()
    
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: result ? 'connected' : 'disconnected',
        r2: 'available',
        kv: 'available',
        ai: 'available'
      }
    })
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Root route - Main WhoHub application
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WhoHub - OSINT Dating Safety Platform</title>
        <meta name="description" content="Detect catfish, scammers, and fake profiles on dating platforms using advanced OSINT investigation tools.">
        
        <!-- Favicon -->
        <link rel="icon" type="image/svg+xml" href="/static/favicon.svg">
        
        <!-- CSS Libraries -->
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        
        <!-- Custom CSS -->
        <link href="/static/styles.css" rel="stylesheet">
        
        <!-- Tailwind Config -->
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: {
                    50: '#fff7ed',
                    500: '#f97316',
                    600: '#ea580c',
                    700: '#c2410c',
                    900: '#9a3412'
                  },
                  danger: {
                    50: '#fef2f2',
                    500: '#ef4444',
                    600: '#dc2626',
                    700: '#b91c1c'
                  },
                  whohub: {
                    orange: '#f97316',
                    dark: '#1a1a1a'
                  }
                }
              }
            }
          }
        </script>
    </head>
    <body class="bg-gray-50 font-sans">
        <!-- Navigation -->
        <nav class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <div class="flex items-center">
                        <img src="/static/whohub-logo.png" alt="WhoHub" class="h-8 w-auto">
                    </div>
                    <div class="flex items-center space-x-4">
                        <a href="#features" class="text-gray-600 hover:text-gray-900">Features</a>
                        <a href="#pricing" class="text-gray-600 hover:text-gray-900">Pricing</a>
                        <a href="#how-it-works" class="text-gray-600 hover:text-gray-900">How It Works</a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <main class="min-h-screen">
            <!-- Hero Section -->
            <section class="bg-gradient-to-r from-gray-900 to-black text-white py-20">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div class="mb-8">
                        <img src="/static/whohub-logo-tagline.png" alt="WhoHub - Know who you're really meeting" class="h-32 w-auto mx-auto mb-6">
                    </div>
                    <h1 class="text-4xl md:text-6xl font-bold mb-6">
                        Stop Dating Scammers
                    </h1>
                    <p class="text-xl md:text-2xl mb-8 opacity-90">
                        Professional OSINT investigations to detect catfish, fake profiles, and scammers on dating platforms
                    </p>
                    <div class="flex flex-col sm:flex-row gap-4 justify-center">
                        <button id="start-investigation" class="bg-orange-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-orange-600 transition-colors shadow-lg">
                            <i class="fas fa-search mr-2"></i>
                            Start Investigation
                        </button>
                        <button class="border-2 border-orange-500 text-orange-500 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-orange-500 hover:text-white transition-colors">
                            <i class="fas fa-play mr-2"></i>
                            Watch Demo
                        </button>
                    </div>
                </div>
            </section>

            <!-- Features Section -->
            <section id="features" class="py-20 bg-white">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="text-center mb-16">
                        <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Advanced OSINT Investigation
                        </h2>
                        <p class="text-xl text-gray-600">
                            Automated background checks using cutting-edge intelligence gathering tools
                        </p>
                    </div>
                    
                    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div class="bg-gray-50 p-6 rounded-xl">
                            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                                <i class="fas fa-image text-primary-600 text-xl"></i>
                            </div>
                            <h3 class="text-xl font-semibold mb-2">Reverse Image Search</h3>
                            <p class="text-gray-600">PimEyes, Yandex, and Google Vision API to detect stolen, fake, or AI-generated photos</p>
                        </div>
                        
                        <div class="bg-gray-50 p-6 rounded-xl">
                            <div class="w-12 h-12 bg-danger-100 rounded-lg flex items-center justify-center mb-4">
                                <i class="fas fa-robot text-danger-600 text-xl"></i>
                            </div>
                            <h3 class="text-xl font-semibold mb-2">AI Detection</h3>
                            <p class="text-gray-600">Advanced deepfake and AI-generated image detection with confidence scoring</p>
                        </div>
                        
                        <div class="bg-gray-50 p-6 rounded-xl">
                            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                                <i class="fas fa-users text-orange-600 text-xl"></i>
                            </div>
                            <h3 class="text-xl font-semibold mb-2">Social Profiling</h3>
                            <p class="text-gray-600">Comprehensive social media analysis across all major platforms</p>
                        </div>
                        
                        <div class="bg-gray-50 p-6 rounded-xl">
                            <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                                <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                            </div>
                            <h3 class="text-xl font-semibold mb-2">Red Flag Detection</h3>
                            <p class="text-gray-600">Automated scam keyword detection and suspicious pattern analysis</p>
                        </div>
                        
                        <div class="bg-gray-50 p-6 rounded-xl">
                            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                                <i class="fas fa-gavel text-purple-600 text-xl"></i>
                            </div>
                            <h3 class="text-xl font-semibold mb-2">Criminal Records</h3>
                            <p class="text-gray-600">Court records, convictions, and media reports from public databases</p>
                        </div>
                        
                        <div class="bg-gray-50 p-6 rounded-xl">
                            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                                <i class="fas fa-shield-alt text-green-600 text-xl"></i>
                            </div>
                            <h3 class="text-xl font-semibold mb-2">Data Breach Check</h3>
                            <p class="text-gray-600">HaveIBeenPwned and breach database checks for compromised accounts</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Pricing Section -->
            <section id="pricing" class="py-20 bg-gray-50">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="text-center mb-16">
                        <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Investigation Packages
                        </h2>
                        <p class="text-xl text-gray-600">
                            Choose the level of investigation that's right for you
                        </p>
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <div class="bg-white p-8 rounded-xl shadow-lg">
                            <div class="text-center mb-6">
                                <h3 class="text-2xl font-bold text-gray-900">Simple Report</h3>
                                <div class="text-4xl font-bold text-primary-600 mt-2">$19.99 <span class="text-lg text-gray-500">AUD</span></div>
                                <p class="text-gray-600 mt-2">Perfect for basic verification</p>
                            </div>
                            <ul class="space-y-3 mb-8">
                                <li class="flex items-center">
                                    <i class="fas fa-check text-green-500 mr-3"></i>
                                    Reverse image search
                                </li>
                                <li class="flex items-center">
                                    <i class="fas fa-check text-green-500 mr-3"></i>
                                    Basic AI detection
                                </li>
                                <li class="flex items-center">
                                    <i class="fas fa-check text-green-500 mr-3"></i>
                                    Data breach check
                                </li>
                                <li class="flex items-center">
                                    <i class="fas fa-check text-green-500 mr-3"></i>
                                    Social media scan
                                </li>
                                <li class="flex items-center">
                                    <i class="fas fa-check text-green-500 mr-3"></i>
                                    Confidence score
                                </li>
                            </ul>
                            <button class="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors" onclick="startInvestigation('simple')">
                                Choose Simple
                            </button>
                        </div>
                        
                        <div class="bg-white p-8 rounded-xl shadow-lg border-2 border-primary-500 relative">
                            <div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                <span class="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-semibold">RECOMMENDED</span>
                            </div>
                            <div class="text-center mb-6">
                                <h3 class="text-2xl font-bold text-gray-900">Full Report</h3>
                                <div class="text-4xl font-bold text-primary-600 mt-2">$49.99 <span class="text-lg text-gray-500">AUD</span></div>
                                <p class="text-gray-600 mt-2">Comprehensive investigation</p>
                            </div>
                            <ul class="space-y-3 mb-8">
                                <li class="flex items-center">
                                    <i class="fas fa-check text-green-500 mr-3"></i>
                                    Everything in Simple
                                </li>
                                <li class="flex items-center">
                                    <i class="fas fa-check text-green-500 mr-3"></i>
                                    Deep social profiling
                                </li>
                                <li class="flex items-center">
                                    <i class="fas fa-check text-green-500 mr-3"></i>
                                    Criminal record search
                                </li>
                                <li class="flex items-center">
                                    <i class="fas fa-check text-green-500 mr-3"></i>
                                    Advanced AI analysis
                                </li>
                                <li class="flex items-center">
                                    <i class="fas fa-check text-green-500 mr-3"></i>
                                    Detailed timeline
                                </li>
                                <li class="flex items-center">
                                    <i class="fas fa-check text-green-500 mr-3"></i>
                                    Professional PDF report
                                </li>
                            </ul>
                            <button class="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors" onclick="startInvestigation('full')">
                                Choose Full
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <!-- How It Works -->
            <section id="how-it-works" class="py-20 bg-white">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="text-center mb-16">
                        <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            How It Works
                        </h2>
                        <p class="text-xl text-gray-600">
                            Get your OSINT report in just a few simple steps
                        </p>
                    </div>
                    
                    <div class="grid md:grid-cols-4 gap-8">
                        <div class="text-center">
                            <div class="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span class="text-2xl font-bold text-primary-600">1</span>
                            </div>
                            <h3 class="text-xl font-semibold mb-2">Submit Information</h3>
                            <p class="text-gray-600">Upload screenshots, photos, or provide name/details from dating profiles</p>
                        </div>
                        
                        <div class="text-center">
                            <div class="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span class="text-2xl font-bold text-primary-600">2</span>
                            </div>
                            <h3 class="text-xl font-semibold mb-2">Make Payment</h3>
                            <p class="text-gray-600">Secure payment processing with instant confirmation</p>
                        </div>
                        
                        <div class="text-center">
                            <div class="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span class="text-2xl font-bold text-primary-600">3</span>
                            </div>
                            <h3 class="text-xl font-semibold mb-2">Automated Investigation</h3>
                            <p class="text-gray-600">Our AI-powered OSINT pipeline analyzes across multiple databases</p>
                        </div>
                        
                        <div class="text-center">
                            <div class="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span class="text-2xl font-bold text-primary-600">4</span>
                            </div>
                            <h3 class="text-xl font-semibold mb-2">Receive Report</h3>
                            <p class="text-gray-600">Get your detailed PDF report within minutes</p>
                        </div>
                    </div>
                </div>
            </section>
        </main>

        <!-- Footer -->
        <footer class="bg-gray-900 text-white py-8">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <p>&copy; 2025 WhoHub. All rights reserved. | Privacy Policy | Terms of Service</p>
            </div>
        </footer>

        <!-- Modal for Investigation Form -->
        <div id="investigation-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
            <div class="flex items-center justify-center min-h-screen p-4">
                <div class="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-6">
                            <h2 class="text-2xl font-bold text-gray-900">Start Investigation</h2>
                            <button id="close-modal" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        
                        <div id="investigation-form-container">
                            <!-- Investigation form will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- JavaScript Libraries -->
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://js.stripe.com/v3/"></script>
        
        <!-- Custom JavaScript -->
        <script src="/static/app.js"></script>
        
        <!-- Initialize App -->
        <script>
            // Initialize WhoHub application
            document.addEventListener('DOMContentLoaded', function() {
                console.log('WhoHub application loaded successfully');
                initializeApp();
            });
        </script>
    </body>
    </html>
  `)
})

export default app
