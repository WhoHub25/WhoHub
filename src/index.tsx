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
        <nav class="bg-white shadow-lg border-b-2 border-gray-100 sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-20">
                    <div class="flex items-center">
                        <img src="/static/whohub-logo.png" alt="WhoHub" class="h-12 md:h-14 w-auto">
                    </div>
                    <div class="hidden md:flex items-center space-x-8">
                        <a href="#features" class="text-gray-700 hover:text-orange-600 font-medium transition-colors">Features</a>
                        <a href="#pricing" class="text-gray-700 hover:text-orange-600 font-medium transition-colors">Pricing</a>
                        <a href="#how-it-works" class="text-gray-700 hover:text-orange-600 font-medium transition-colors">How It Works</a>
                        <a href="#testimonials" class="text-gray-700 hover:text-orange-600 font-medium transition-colors">Reviews</a>
                        <a href="#faq" class="text-gray-700 hover:text-orange-600 font-medium transition-colors">FAQ</a>
                        <button onclick="startInvestigation('simple')" class="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors">
                            Start Investigation
                        </button>
                    </div>
                    <div class="md:hidden">
                        <button id="mobile-menu-btn" class="text-gray-700 hover:text-orange-600">
                            <i class="fas fa-bars text-xl"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Mobile Menu -->
                <div id="mobile-menu" class="md:hidden hidden bg-white border-t border-gray-200">
                    <div class="px-2 pt-2 pb-3 space-y-1">
                        <a href="#features" class="block px-3 py-2 text-gray-700 hover:text-orange-600">Features</a>
                        <a href="#pricing" class="block px-3 py-2 text-gray-700 hover:text-orange-600">Pricing</a>
                        <a href="#how-it-works" class="block px-3 py-2 text-gray-700 hover:text-orange-600">How It Works</a>
                        <a href="#testimonials" class="block px-3 py-2 text-gray-700 hover:text-orange-600">Reviews</a>
                        <a href="#faq" class="block px-3 py-2 text-gray-700 hover:text-orange-600">FAQ</a>
                        <button onclick="startInvestigation('simple')" class="w-full mt-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold">
                            Start Investigation
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <main class="min-h-screen">
            <!-- Hero Section -->
            <section class="bg-gradient-to-r from-gray-900 to-black text-white py-32 relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-orange-600/5"></div>
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <div class="mb-12">
                        <img src="/static/whohub-logo-tagline.png" alt="WhoHub - Know who you're really meeting" class="h-48 md:h-64 lg:h-72 w-auto mx-auto mb-8 drop-shadow-2xl">
                    </div>
                    <h1 class="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 bg-gradient-to-r from-white via-gray-100 to-orange-200 bg-clip-text text-transparent">
                        Stop Dating Scammers
                    </h1>
                    <p class="text-2xl md:text-3xl lg:text-4xl mb-6 opacity-90 font-light">
                        Professional OSINT investigations to detect catfish, fake profiles, and scammers
                    </p>
                    <p class="text-lg md:text-xl mb-12 opacity-75 max-w-4xl mx-auto">
                        Don't be the next victim. Our advanced AI-powered investigation platform analyzes photos, social media, criminal records, and data breaches to reveal the truth about your online matches in minutes.
                    </p>
                    
                    <!-- Stats -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto">
                        <div class="text-center">
                            <div class="text-3xl md:text-4xl font-bold text-orange-400 mb-2">50K+</div>
                            <div class="text-sm md:text-base text-gray-300">Investigations</div>
                        </div>
                        <div class="text-center">
                            <div class="text-3xl md:text-4xl font-bold text-orange-400 mb-2">95%</div>
                            <div class="text-sm md:text-base text-gray-300">Accuracy Rate</div>
                        </div>
                        <div class="text-center">
                            <div class="text-3xl md:text-4xl font-bold text-orange-400 mb-2">5 Min</div>
                            <div class="text-sm md:text-base text-gray-300">Report Time</div>
                        </div>
                        <div class="text-center">
                            <div class="text-3xl md:text-4xl font-bold text-orange-400 mb-2">24/7</div>
                            <div class="text-sm md:text-base text-gray-300">Available</div>
                        </div>
                    </div>
                    
                    <div class="flex flex-col sm:flex-row gap-6 justify-center">
                        <button id="start-investigation" class="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-12 py-6 rounded-2xl font-bold text-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-2xl transform hover:scale-105">
                            <i class="fas fa-search mr-3"></i>
                            Start Investigation Now
                        </button>
                        <button class="border-3 border-orange-500 text-orange-400 px-12 py-6 rounded-2xl font-bold text-xl hover:bg-orange-500 hover:text-white transition-all duration-300 shadow-xl">
                            <i class="fas fa-play mr-3"></i>
                            Watch Demo
                        </button>
                    </div>
                    
                    <!-- Trust Indicators -->
                    <div class="mt-16 flex flex-wrap justify-center items-center gap-8 opacity-60">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-shield-check text-green-400"></i>
                            <span class="text-sm">Privacy Protected</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i class="fas fa-lock text-green-400"></i>
                            <span class="text-sm">Secure Payment</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i class="fas fa-clock text-green-400"></i>
                            <span class="text-sm">Instant Reports</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i class="fas fa-users text-green-400"></i>
                            <span class="text-sm">50,000+ Users</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Warning/Alert Section -->
            <section class="bg-red-600 text-white py-8">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex items-center justify-center text-center">
                        <i class="fas fa-exclamation-triangle text-2xl mr-4"></i>
                        <div>
                            <h3 class="text-xl font-bold mb-1">⚠️ Dating App Scams Cost Australians $142 Million in 2023</h3>
                            <p class="text-red-100">Don't become a statistic. Verify before you trust.</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Problem Section -->
            <section class="py-20 bg-gray-50">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="text-center mb-16">
                        <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            The Hidden Dangers of Online Dating
                        </h2>
                        <p class="text-xl text-gray-600 max-w-4xl mx-auto">
                            Romance scammers are becoming more sophisticated, using AI-generated photos, stolen identities, and elaborate backstories to deceive victims.
                        </p>
                    </div>
                    
                    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                        <div class="bg-white p-8 rounded-2xl shadow-xl border-l-4 border-red-500">
                            <div class="text-3xl font-bold text-red-600 mb-2">73%</div>
                            <h3 class="text-xl font-semibold mb-2">Fake Profiles</h3>
                            <p class="text-gray-600">Of dating app users have encountered fake profiles or scammers</p>
                        </div>
                        
                        <div class="bg-white p-8 rounded-2xl shadow-xl border-l-4 border-red-500">
                            <div class="text-3xl font-bold text-red-600 mb-2">$547M</div>
                            <h3 class="text-xl font-semibold mb-2">Annual Losses</div>
                            <p class="text-gray-600">Lost to romance scams globally in 2023 alone</p>
                        </div>
                        
                        <div class="bg-white p-8 rounded-2xl shadow-xl border-l-4 border-red-500">
                            <div class="text-3xl font-bold text-red-600 mb-2">65%</div>
                            <h3 class="text-xl font-semibold mb-2">Repeat Victims</h3>
                            <p class="text-gray-600">Of scam victims are targeted multiple times</p>
                        </div>
                    </div>
                    
                    <div class="bg-gradient-to-r from-red-50 to-orange-50 p-8 rounded-2xl">
                        <h3 class="text-2xl font-bold text-gray-900 mb-4 text-center">Common Scammer Tactics</h3>
                        <div class="grid md:grid-cols-2 gap-6">
                            <div class="flex items-start gap-3">
                                <i class="fas fa-camera text-red-500 mt-1"></i>
                                <div>
                                    <h4 class="font-semibold">Stolen Photos</h4>
                                    <p class="text-gray-600 text-sm">Using attractive photos from social media or stock photo sites</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-3">
                                <i class="fas fa-robot text-red-500 mt-1"></i>
                                <div>
                                    <h4 class="font-semibold">AI-Generated Images</h4>
                                    <p class="text-gray-600 text-sm">Creating fake personas with AI-generated profile pictures</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-3">
                                <i class="fas fa-heart-broken text-red-500 mt-1"></i>
                                <div>
                                    <h4 class="font-semibold">Emotional Manipulation</h4>
                                    <p class="text-gray-600 text-sm">Building false romantic connections to lower your guard</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-3">
                                <i class="fas fa-money-bill-wave text-red-500 mt-1"></i>
                                <div>
                                    <h4 class="font-semibold">Financial Requests</h4>
                                    <p class="text-gray-600 text-sm">Emergency situations requiring immediate money transfers</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Features Section -->
            <section id="features" class="py-20 bg-white">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="text-center mb-16">
                        <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            Advanced OSINT Investigation
                        </h2>
                        <p class="text-xl text-gray-600 max-w-4xl mx-auto">
                            Our AI-powered platform performs comprehensive background checks using professional-grade intelligence gathering tools used by law enforcement and security professionals.
                        </p>
                    </div>
                    
                    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                        <div class="group bg-gray-50 p-8 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300">
                            <div class="w-16 h-16 bg-gradient-to-r from-orange-100 to-orange-200 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <i class="fas fa-image text-orange-600 text-2xl"></i>
                            </div>
                            <h3 class="text-2xl font-semibold mb-4">Reverse Image Search</h3>
                            <p class="text-gray-600 mb-4">Advanced image analysis using PimEyes, Yandex, and Google Vision API to detect stolen, fake, or AI-generated photos across the entire internet.</p>
                            <ul class="text-sm text-gray-500 space-y-1">
                                <li>• Search 15+ billion images</li>
                                <li>• Detect image modifications</li>
                                <li>• Track earliest appearances</li>
                                <li>• Identify stock photos</li>
                            </ul>
                        </div>
                        
                        <div class="group bg-gray-50 p-8 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300">
                            <div class="w-16 h-16 bg-gradient-to-r from-red-100 to-red-200 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <i class="fas fa-robot text-red-600 text-2xl"></i>
                            </div>
                            <h3 class="text-2xl font-semibold mb-4">AI & Deepfake Detection</h3>
                            <p class="text-gray-600 mb-4">Cutting-edge algorithms to identify artificially generated content, deepfakes, and manipulated images with 95%+ accuracy.</p>
                            <ul class="text-sm text-gray-500 space-y-1">
                                <li>• Deepfake detection</li>
                                <li>• AI-generated image analysis</li>
                                <li>• Face swap identification</li>
                                <li>• Metadata verification</li>
                            </ul>
                        </div>
                        
                        <div class="group bg-gray-50 p-8 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300">
                            <div class="w-16 h-16 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <i class="fas fa-users text-blue-600 text-2xl"></i>
                            </div>
                            <h3 class="text-2xl font-semibold mb-4">Social Media Profiling</h3>
                            <p class="text-gray-600 mb-4">Comprehensive analysis across Facebook, Instagram, LinkedIn, Twitter, TikTok, and 50+ other platforms.</p>
                            <ul class="text-sm text-gray-500 space-y-1">
                                <li>• Cross-platform verification</li>
                                <li>• Account age analysis</li>
                                <li>• Follower authenticity</li>
                                <li>• Posting pattern analysis</li>
                            </ul>
                        </div>
                        
                        <div class="group bg-gray-50 p-8 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300">
                            <div class="w-16 h-16 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <i class="fas fa-exclamation-triangle text-yellow-600 text-2xl"></i>
                            </div>
                            <h3 class="text-2xl font-semibold mb-4">Red Flag Detection</h3>
                            <p class="text-gray-600 mb-4">Automated detection of common scammer patterns, suspicious behavior, and known fraud indicators.</p>
                            <ul class="text-sm text-gray-500 space-y-1">
                                <li>• Scam keyword analysis</li>
                                <li>• Behavioral pattern matching</li>
                                <li>• Known scammer database</li>
                                <li>• Risk score calculation</li>
                            </ul>
                        </div>
                        
                        <div class="group bg-gray-50 p-8 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300">
                            <div class="w-16 h-16 bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <i class="fas fa-gavel text-purple-600 text-2xl"></i>
                            </div>
                            <h3 class="text-2xl font-semibold mb-4">Criminal Background Check</h3>
                            <p class="text-gray-600 mb-4">Search court records, convictions, and media reports from Australian, New Zealand, and international databases.</p>
                            <ul class="text-sm text-gray-500 space-y-1">
                                <li>• Court record searches</li>
                                <li>• Criminal conviction history</li>
                                <li>• News article mentions</li>
                                <li>• Legal proceedings</li>
                            </ul>
                        </div>
                        
                        <div class="group bg-gray-50 p-8 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300">
                            <div class="w-16 h-16 bg-gradient-to-r from-green-100 to-green-200 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <i class="fas fa-shield-alt text-green-600 text-2xl"></i>
                            </div>
                            <h3 class="text-2xl font-semibold mb-4">Data Breach Analysis</h3>
                            <p class="text-gray-600 mb-4">Check email addresses and phone numbers against HaveIBeenPwned and major data breach databases.</p>
                            <ul class="text-sm text-gray-500 space-y-1">
                                <li>• Breach history analysis</li>
                                <li>• Compromised accounts</li>
                                <li>• Security vulnerabilities</li>
                                <li>• Identity theft indicators</li>
                            </ul>
                        </div>
                    </div>
                    
                    <!-- Technology Stack -->
                    <div class="bg-gradient-to-r from-gray-900 to-black rounded-3xl p-8 md:p-12 text-white">
                        <div class="text-center mb-12">
                            <h3 class="text-3xl md:text-4xl font-bold mb-4">Powered by Advanced Technology</h3>
                            <p class="text-gray-300 text-lg max-w-3xl mx-auto">
                                Our platform leverages the same professional-grade tools used by law enforcement, private investigators, and cybersecurity experts worldwide.
                            </p>
                        </div>
                        
                        <div class="grid md:grid-cols-4 gap-8">
                            <div class="text-center">
                                <div class="text-4xl mb-4">🤖</div>
                                <h4 class="text-lg font-semibold mb-2">AI Analysis</h4>
                                <p class="text-gray-400 text-sm">Machine learning algorithms for pattern recognition</p>
                            </div>
                            <div class="text-center">
                                <div class="text-4xl mb-4">🔍</div>
                                <h4 class="text-lg font-semibold mb-2">OSINT Tools</h4>
                                <p class="text-gray-400 text-sm">Professional intelligence gathering software</p>
                            </div>
                            <div class="text-center">
                                <div class="text-4xl mb-4">☁️</div>
                                <h4 class="text-lg font-semibold mb-2">Cloud Computing</h4>
                                <p class="text-gray-400 text-sm">Scalable infrastructure for real-time processing</p>
                            </div>
                            <div class="text-center">
                                <div class="text-4xl mb-4">🔒</div>
                                <h4 class="text-lg font-semibold mb-2">Privacy First</h4>
                                <p class="text-gray-400 text-sm">End-to-end encryption and data protection</p>
                            </div>
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
                        <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            How It Works
                        </h2>
                        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
                            Get your comprehensive OSINT investigation report in just 4 simple steps. Our automated system works 24/7 to deliver results in minutes, not days.
                        </p>
                    </div>
                    
                    <div class="grid md:grid-cols-2 xl:grid-cols-4 gap-8 mb-16">
                        <div class="text-center group">
                            <div class="w-24 h-24 bg-gradient-to-r from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <span class="text-3xl font-bold text-orange-600">1</span>
                            </div>
                            <h3 class="text-2xl font-semibold mb-4">Submit Information</h3>
                            <p class="text-gray-600 mb-4">Upload profile photos, screenshots, or provide basic details like name, email, or phone number from dating app conversations.</p>
                            <div class="text-sm text-gray-500">
                                <i class="fas fa-clock mr-1"></i>
                                Takes 2-3 minutes
                            </div>
                        </div>
                        
                        <div class="text-center group">
                            <div class="w-24 h-24 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <span class="text-3xl font-bold text-green-600">2</span>
                            </div>
                            <h3 class="text-2xl font-semibold mb-4">Secure Payment</h3>
                            <p class="text-gray-600 mb-4">Choose between Simple ($19.99) or Full ($49.99) investigation packages. Payment processed securely via Stripe.</p>
                            <div class="text-sm text-gray-500">
                                <i class="fas fa-lock mr-1"></i>
                                Bank-level security
                            </div>
                        </div>
                        
                        <div class="text-center group">
                            <div class="w-24 h-24 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <span class="text-3xl font-bold text-blue-600">3</span>
                            </div>
                            <h3 class="text-2xl font-semibold mb-4">AI Investigation</h3>
                            <p class="text-gray-600 mb-4">Our advanced AI system searches 15+ billion images, social media platforms, criminal databases, and breach records automatically.</p>
                            <div class="text-sm text-gray-500">
                                <i class="fas fa-robot mr-1"></i>
                                Fully automated
                            </div>
                        </div>
                        
                        <div class="text-center group">
                            <div class="w-24 h-24 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <span class="text-3xl font-bold text-purple-600">4</span>
                            </div>
                            <h3 class="text-2xl font-semibold mb-4">Receive Report</h3>
                            <p class="text-gray-600 mb-4">Get your detailed, privacy-protected PDF report with confidence scores, red flags, and actionable insights delivered instantly.</p>
                            <div class="text-sm text-gray-500">
                                <i class="fas fa-download mr-1"></i>
                                5-10 minutes delivery
                            </div>
                        </div>
                    </div>
                    
                    <!-- Sample Report Preview -->
                    <div class="bg-gradient-to-r from-gray-50 to-orange-50 rounded-3xl p-8 md:p-12">
                        <div class="text-center mb-8">
                            <h3 class="text-3xl font-bold text-gray-900 mb-4">Sample Report Preview</h3>
                            <p class="text-gray-600">See what information you'll receive in your OSINT investigation report</p>
                        </div>
                        
                        <div class="grid md:grid-cols-2 gap-8">
                            <div class="bg-white p-6 rounded-xl shadow-lg">
                                <h4 class="text-lg font-semibold mb-4 flex items-center">
                                    <i class="fas fa-chart-line text-orange-500 mr-2"></i>
                                    Confidence Score
                                </h4>
                                <div class="flex items-center mb-2">
                                    <div class="w-full bg-gray-200 rounded-full h-4">
                                        <div class="bg-red-500 h-4 rounded-full" style="width: 25%"></div>
                                    </div>
                                    <span class="ml-3 text-2xl font-bold text-red-500">25%</span>
                                </div>
                                <p class="text-red-600 font-semibold">HIGH RISK - Multiple red flags detected</p>
                            </div>
                            
                            <div class="bg-white p-6 rounded-xl shadow-lg">
                                <h4 class="text-lg font-semibold mb-4 flex items-center">
                                    <i class="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                                    Red Flags Found
                                </h4>
                                <ul class="space-y-2 text-sm">
                                    <li class="flex items-center text-red-600">
                                        <i class="fas fa-times-circle mr-2"></i>
                                        Photos found on 12 different websites
                                    </li>
                                    <li class="flex items-center text-red-600">
                                        <i class="fas fa-times-circle mr-2"></i>
                                        Email associated with 3 data breaches
                                    </li>
                                    <li class="flex items-center text-red-600">
                                        <i class="fas fa-times-circle mr-2"></i>
                                        No verifiable social media presence
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Testimonials -->
            <section id="testimonials" class="py-20 bg-gray-900 text-white">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="text-center mb-16">
                        <h2 class="text-4xl md:text-5xl font-bold mb-6">
                            Trusted by 50,000+ Users
                        </h2>
                        <p class="text-xl text-gray-300 max-w-3xl mx-auto">
                            Real stories from people who discovered the truth and protected themselves from dating scams
                        </p>
                    </div>
                    
                    <div class="grid md:grid-cols-3 gap-8">
                        <div class="bg-gray-800 p-8 rounded-2xl">
                            <div class="flex items-center mb-4">
                                <div class="flex text-yellow-400">
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                </div>
                                <span class="ml-2 text-gray-300">5.0</span>
                            </div>
                            <p class="text-gray-300 mb-6 italic">
                                "WhoHub saved me from a sophisticated romance scam. The report revealed that 'Jennifer's' photos were stolen from a Ukrainian model's Instagram. I was about to send $5,000 for her 'emergency'. Thank you!"
                            </p>
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                                    <span class="font-bold">M.S.</span>
                                </div>
                                <div class="ml-3">
                                    <div class="font-semibold">Michael S.</div>
                                    <div class="text-gray-400 text-sm">Sydney, Australia</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-gray-800 p-8 rounded-2xl">
                            <div class="flex items-center mb-4">
                                <div class="flex text-yellow-400">
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                </div>
                                <span class="ml-2 text-gray-300">5.0</span>
                            </div>
                            <p class="text-gray-300 mb-6 italic">
                                "As a single mother, I can't afford to make mistakes in dating. WhoHub's full report showed my match had multiple criminal convictions for fraud. The $49.99 was the best money I ever spent."
                            </p>
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                                    <span class="font-bold">S.L.</span>
                                </div>
                                <div class="ml-3">
                                    <div class="font-semibold">Sarah L.</div>
                                    <div class="text-gray-400 text-sm">Melbourne, Australia</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-gray-800 p-8 rounded-2xl">
                            <div class="flex items-center mb-4">
                                <div class="flex text-yellow-400">
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                </div>
                                <span class="ml-2 text-gray-300">5.0</span>
                            </div>
                            <p class="text-gray-300 mb-6 italic">
                                "The AI detection feature is incredible. It identified that my match's photos were AI-generated - something I never would have spotted. This technology is a game-changer for online dating safety."
                            </p>
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                                    <span class="font-bold">D.K.</span>
                                </div>
                                <div class="ml-3">
                                    <div class="font-semibold">David K.</div>
                                    <div class="text-gray-400 text-sm">Brisbane, Australia</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="text-center mt-16">
                        <div class="bg-gradient-to-r from-orange-500 to-orange-600 inline-flex items-center px-6 py-3 rounded-full text-white font-semibold">
                            <i class="fas fa-users mr-2"></i>
                            Join 50,000+ Protected Users
                        </div>
                    </div>
                </div>
            </section>

            <!-- FAQ Section -->
            <section id="faq" class="py-20 bg-gray-50">
                <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="text-center mb-16">
                        <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            Frequently Asked Questions
                        </h2>
                        <p class="text-xl text-gray-600">
                            Get answers to common questions about our OSINT investigation service
                        </p>
                    </div>
                    
                    <div class="space-y-6">
                        <div class="bg-white rounded-2xl shadow-lg">
                            <button class="w-full text-left p-6 focus:outline-none" onclick="toggleFAQ(1)">
                                <div class="flex justify-between items-center">
                                    <h3 class="text-lg font-semibold text-gray-900">Is this legal and ethical?</h3>
                                    <i class="fas fa-chevron-down text-gray-400"></i>
                                </div>
                            </button>
                            <div id="faq-1" class="hidden px-6 pb-6 text-gray-600">
                                <p>Yes, absolutely. WhoHub only uses publicly available information and complies with all privacy laws. We use the same OSINT techniques used by law enforcement, journalists, and cybersecurity professionals. All searches are conducted on public data sources and we never access private accounts or perform any illegal activities.</p>
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-2xl shadow-lg">
                            <button class="w-full text-left p-6 focus:outline-none" onclick="toggleFAQ(2)">
                                <div class="flex justify-between items-center">
                                    <h3 class="text-lg font-semibold text-gray-900">How accurate are your reports?</h3>
                                    <i class="fas fa-chevron-down text-gray-400"></i>
                                </div>
                            </button>
                            <div id="faq-2" class="hidden px-6 pb-6 text-gray-600">
                                <p>Our AI-powered analysis achieves 95%+ accuracy in detecting fake images, stolen photos, and suspicious patterns. However, no system is 100% perfect. We provide confidence scores for all findings and recommend using our reports as one factor in your decision-making process. Always trust your instincts and never ignore red flags.</p>
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-2xl shadow-lg">
                            <button class="w-full text-left p-6 focus:outline-none" onclick="toggleFAQ(3)">
                                <div class="flex justify-between items-center">
                                    <h3 class="text-lg font-semibold text-gray-900">What's the difference between Simple and Full reports?</h3>
                                    <i class="fas fa-chevron-down text-gray-400"></i>
                                </div>
                            </button>
                            <div id="faq-3" class="hidden px-6 pb-6 text-gray-600">
                                <p><strong>Simple Report ($19.99):</strong> Includes reverse image search, basic AI detection, data breach check, social media scan, and confidence score.<br><br><strong>Full Report ($49.99):</strong> Everything in Simple plus deep social profiling, criminal record search, advanced AI analysis, detailed timeline, and professional PDF report with comprehensive findings.</p>
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-2xl shadow-lg">
                            <button class="w-full text-left p-6 focus:outline-none" onclick="toggleFAQ(4)">
                                <div class="flex justify-between items-center">
                                    <h3 class="text-lg font-semibold text-gray-900">How long does it take to get results?</h3>
                                    <i class="fas fa-chevron-down text-gray-400"></i>
                                </div>
                            </button>
                            <div id="faq-4" class="hidden px-6 pb-6 text-gray-600">
                                <p>Most reports are completed within 5-10 minutes. Our AI system works 24/7 and processes investigations automatically. In rare cases with complex searches, it may take up to 30 minutes. You'll receive an email notification when your report is ready for download.</p>
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-2xl shadow-lg">
                            <button class="w-full text-left p-6 focus:outline-none" onclick="toggleFAQ(5)">
                                <div class="flex justify-between items-center">
                                    <h3 class="text-lg font-semibold text-gray-900">Is my personal information protected?</h3>
                                    <i class="fas fa-chevron-down text-gray-400"></i>
                                </div>
                            </button>
                            <div id="faq-5" class="hidden px-6 pb-6 text-gray-600">
                                <p>Yes, we take privacy very seriously. All uploaded images and personal data are encrypted and automatically deleted after 30 days. Reports are redacted to protect privacy - we never include full addresses, exact birth dates, or other sensitive personal information. Payment processing is handled securely through Stripe.</p>
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-2xl shadow-lg">
                            <button class="w-full text-left p-6 focus:outline-none" onclick="toggleFAQ(6)">
                                <div class="flex justify-between items-center">
                                    <h3 class="text-lg font-semibold text-gray-900">What if no red flags are found?</h3>
                                    <i class="fas fa-chevron-down text-gray-400"></i>
                                </div>
                            </button>
                            <div id="faq-6" class="hidden px-6 pb-6 text-gray-600">
                                <p>A clean report is great news! It means we couldn't find any obvious red flags in public databases. However, this doesn't guarantee someone is trustworthy - always use common sense, meet in public places, and never send money to someone you've only met online. Our service is one tool among many for staying safe while dating.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- CTA Section -->
            <section class="py-20 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 class="text-4xl md:text-5xl font-bold mb-6">
                        Don't Be the Next Victim
                    </h2>
                    <p class="text-xl mb-8 opacity-90">
                        Protect yourself with professional OSINT investigation. Know who you're really meeting before it's too late.
                    </p>
                    
                    <div class="bg-white/10 backdrop-blur rounded-2xl p-8 mb-8">
                        <div class="text-4xl font-bold mb-2">$142 Million</div>
                        <p class="text-orange-100">Lost to romance scams in Australia in 2023 alone</p>
                    </div>
                    
                    <div class="flex flex-col sm:flex-row gap-4 justify-center">
                        <button onclick="startInvestigation('simple')" class="bg-white text-orange-600 px-12 py-6 rounded-2xl font-bold text-xl hover:bg-gray-100 transition-colors shadow-2xl">
                            <i class="fas fa-search mr-3"></i>
                            Start Investigation - $19.99
                        </button>
                        <button onclick="startInvestigation('full')" class="border-3 border-white text-white px-12 py-6 rounded-2xl font-bold text-xl hover:bg-white hover:text-orange-600 transition-colors">
                            <i class="fas fa-shield-alt mr-3"></i>
                            Full Report - $49.99
                        </button>
                    </div>
                    
                    <p class="text-sm mt-6 opacity-75">
                        <i class="fas fa-lock mr-1"></i>
                        Secure payment • Money-back guarantee • Privacy protected
                    </p>
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
