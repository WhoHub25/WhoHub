// WhoHub Frontend Application
class WhoHubApp {
  constructor() {
    this.currentInvestigation = null
    this.stripePublicKey = 'pk_test_...' // Replace with actual Stripe key
    this.stripe = null
    this.initializeStripe()
  }

  async initializeStripe() {
    try {
      this.stripe = Stripe(this.stripePublicKey)
    } catch (error) {
      console.error('Stripe initialization failed:', error)
    }
  }

  // Show investigation modal
  showInvestigationModal(type = 'simple') {
    const modal = document.getElementById('investigation-modal')
    const container = document.getElementById('investigation-form-container')
    
    container.innerHTML = this.generateInvestigationForm(type)
    modal.classList.remove('hidden')
    
    // Bind form events
    this.bindFormEvents()
  }

  // Hide investigation modal
  hideInvestigationModal() {
    const modal = document.getElementById('investigation-modal')
    modal.classList.add('hidden')
  }

  // Generate investigation form HTML
  generateInvestigationForm(type) {
    const price = type === 'full' ? '$49.99' : '$19.99'
    const features = type === 'full' 
      ? ['Everything in Simple', 'Deep social profiling', 'Criminal record search', 'Advanced AI analysis', 'Detailed timeline', 'Professional PDF report']
      : ['Reverse image search', 'Basic AI detection', 'Data breach check', 'Social media scan', 'Confidence score']

    return `
      <form id="investigation-form" class="space-y-6">
        <input type="hidden" name="investigation_type" value="${type}">
        
        <!-- Package Info -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            ${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${price} AUD
          </h3>
          <ul class="text-sm text-gray-600 space-y-1">
            ${features.map(feature => `<li class="flex items-center"><i class="fas fa-check text-green-500 mr-2"></i>${feature}</li>`).join('')}
          </ul>
        </div>

        <!-- Target Information -->
        <div class="space-y-4">
          <h4 class="text-lg font-semibold text-gray-900">Target Information</h4>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Full Name (Optional)
            </label>
            <input 
              type="text" 
              name="target_name" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g. John Doe"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Email Address (Optional)
            </label>
            <input 
              type="email" 
              name="target_email" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g. john@example.com"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Phone Number (Optional)
            </label>
            <input 
              type="tel" 
              name="target_phone" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g. +61 400 123 456"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Dating Platform
            </label>
            <select 
              name="dating_platform" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select platform</option>
              <option value="tinder">Tinder</option>
              <option value="bumble">Bumble</option>
              <option value="hinge">Hinge</option>
              <option value="match">Match.com</option>
              <option value="eharmony">eHarmony</option>
              <option value="okcupid">OkCupid</option>
              <option value="pof">Plenty of Fish</option>
              <option value="badoo">Badoo</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Additional Information
            </label>
            <textarea 
              name="additional_info" 
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              placeholder="Any additional details about the person or suspicious behavior..."
            ></textarea>
          </div>
        </div>

        <!-- Image Upload -->
        <div class="space-y-4">
          <h4 class="text-lg font-semibold text-gray-900">Upload Images</h4>
          <p class="text-sm text-gray-600">
            Upload screenshots of their profile, photos, or conversations (Max 5 images, 10MB each)
          </p>
          
          <div id="image-upload-area" class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <i class="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-4"></i>
            <p class="text-gray-600">
              <span class="font-medium">Click to upload</span> or drag and drop
            </p>
            <p class="text-sm text-gray-500">PNG, JPG, WebP up to 10MB</p>
            <input type="file" id="image-input" multiple accept=".jpg,.jpeg,.png,.webp" class="hidden">
          </div>
          
          <div id="uploaded-images" class="grid grid-cols-2 md:grid-cols-3 gap-4 hidden">
            <!-- Uploaded images will appear here -->
          </div>
        </div>

        <!-- Terms and Privacy -->
        <div class="space-y-4">
          <label class="flex items-start">
            <input type="checkbox" name="terms_accepted" required class="mt-1 mr-3">
            <span class="text-sm text-gray-600">
              I agree to the <a href="#" class="text-primary-600 hover:underline">Terms of Service</a> 
              and <a href="#" class="text-primary-600 hover:underline">Privacy Policy</a>. 
              I understand that this service is for legitimate safety purposes only.
            </span>
          </label>
          
          <label class="flex items-start">
            <input type="checkbox" name="consent_given" required class="mt-1 mr-3">
            <span class="text-sm text-gray-600">
              I confirm that I have a legitimate reason to investigate this person and consent to 
              the processing of the provided information.
            </span>
          </label>
        </div>

        <!-- Submit Button -->
        <div class="flex justify-end space-x-4">
          <button 
            type="button" 
            onclick="whoHubApp.hideInvestigationModal()" 
            class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
          >
            <i class="fas fa-credit-card mr-2"></i>
            Proceed to Payment (${price})
          </button>
        </div>
      </form>
    `
  }

  // Bind form events
  bindFormEvents() {
    const form = document.getElementById('investigation-form')
    const imageInput = document.getElementById('image-input')
    const uploadArea = document.getElementById('image-upload-area')

    // Form submission
    form.addEventListener('submit', (e) => this.handleFormSubmit(e))

    // Image upload events
    uploadArea.addEventListener('click', () => imageInput.click())
    uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e))
    uploadArea.addEventListener('drop', (e) => this.handleDrop(e))
    imageInput.addEventListener('change', (e) => this.handleImageSelect(e))
  }

  // Handle form submission
  async handleFormSubmit(e) {
    e.preventDefault()
    
    const form = e.target
    const formData = new FormData(form)
    const data = Object.fromEntries(formData.entries())

    // Validate form
    if (!data.terms_accepted || !data.consent_given) {
      this.showAlert('Please accept the terms and conditions', 'error')
      return
    }

    try {
      // Show loading
      this.showLoading('Creating investigation...')

      // Create investigation
      const response = await axios.post('/api/investigations', data)
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create investigation')
      }

      this.currentInvestigation = response.data
      
      // Upload images if any
      await this.uploadImages()

      // Process payment
      await this.processPayment()

    } catch (error) {
      console.error('Form submission error:', error)
      this.showAlert(error.message || 'Failed to create investigation', 'error')
      this.hideLoading()
    }
  }

  // Handle image selection
  handleImageSelect(e) {
    const files = Array.from(e.target.files)
    this.displaySelectedImages(files)
  }

  // Handle drag and drop
  handleDragOver(e) {
    e.preventDefault()
    e.currentTarget.classList.add('border-primary-500')
  }

  handleDrop(e) {
    e.preventDefault()
    e.currentTarget.classList.remove('border-primary-500')
    
    const files = Array.from(e.dataTransfer.files)
    this.displaySelectedImages(files)
  }

  // Display selected images
  displaySelectedImages(files) {
    const container = document.getElementById('uploaded-images')
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      const maxSize = 10 * 1024 * 1024 // 10MB
      
      if (!validTypes.includes(file.type)) {
        this.showAlert(`Invalid file type: ${file.name}`, 'error')
        return false
      }
      
      if (file.size > maxSize) {
        this.showAlert(`File too large: ${file.name}`, 'error')
        return false
      }
      
      return true
    })

    if (validFiles.length === 0) return

    // Limit to 5 images
    const limitedFiles = validFiles.slice(0, 5)
    
    container.innerHTML = ''
    container.classList.remove('hidden')

    limitedFiles.forEach((file, index) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageDiv = document.createElement('div')
        imageDiv.className = 'relative group'
        imageDiv.innerHTML = `
          <img src="${e.target.result}" alt="Upload ${index + 1}" class="w-full h-24 object-cover rounded-lg">
          <button 
            type="button" 
            onclick="this.parentElement.remove()" 
            class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ×
          </button>
          <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
            ${file.name}
          </div>
        `
        container.appendChild(imageDiv)
      }
      reader.readAsDataURL(file)
    })

    // Store files for upload
    this.selectedFiles = limitedFiles
  }

  // Upload images to server
  async uploadImages() {
    if (!this.selectedFiles || this.selectedFiles.length === 0) return

    const investigationId = this.currentInvestigation.investigation_id
    
    for (let i = 0; i < this.selectedFiles.length; i++) {
      const file = this.selectedFiles[i]
      const formData = new FormData()
      formData.append('image', file)

      try {
        await axios.post(`/api/uploads/investigation/${investigationId}/image/${i + 1}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } catch (error) {
        console.error(`Failed to upload image ${i + 1}:`, error)
      }
    }
  }

  // Process payment with Stripe
  async processPayment() {
    if (!this.stripe) {
      this.showAlert('Payment system not available', 'error')
      return
    }

    try {
      this.showLoading('Processing payment...')

      // In production, create payment intent on server
      const { error } = await this.stripe.confirmCardPayment(this.currentInvestigation.payment_intent_client_secret)

      if (error) {
        throw new Error(error.message)
      }

      // Payment successful
      this.showSuccess()

    } catch (error) {
      console.error('Payment error:', error)
      this.showAlert(error.message || 'Payment failed', 'error')
      this.hideLoading()
    }
  }

  // Show success message and redirect to results
  showSuccess() {
    this.hideLoading()
    this.hideInvestigationModal()
    
    this.showAlert('Payment successful! Your investigation is starting...', 'success')
    
    // Redirect to results page
    setTimeout(() => {
      window.location.href = `/investigation/${this.currentInvestigation.investigation_id}`
    }, 2000)
  }

  // Utility functions
  showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div')
    const bgColor = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500'
    
    alertDiv.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300`
    alertDiv.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check' : 'info-circle'} mr-2"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `
    
    document.body.appendChild(alertDiv)
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (alertDiv.parentElement) {
        alertDiv.remove()
      }
    }, 5000)
  }

  showLoading(message) {
    const loadingDiv = document.createElement('div')
    loadingDiv.id = 'loading-overlay'
    loadingDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    loadingDiv.innerHTML = `
      <div class="bg-white rounded-lg p-6 text-center">
        <i class="fas fa-spinner fa-spin text-3xl text-primary-600 mb-4"></i>
        <p class="text-gray-800">${message}</p>
      </div>
    `
    
    document.body.appendChild(loadingDiv)
  }

  hideLoading() {
    const loadingDiv = document.getElementById('loading-overlay')
    if (loadingDiv) {
      loadingDiv.remove()
    }
  }
}

// Initialize app
let whoHubApp

function initializeApp() {
  whoHubApp = new WhoHubApp()
  
  // Bind global event listeners
  const startBtn = document.getElementById('start-investigation')
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      whoHubApp.showInvestigationModal('simple')
    })
  }
  
  const closeBtn = document.getElementById('close-modal')
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      whoHubApp.hideInvestigationModal()
    })
  }
  
  // Modal background click to close
  const modal = document.getElementById('investigation-modal')
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.id === 'investigation-modal') {
        whoHubApp.hideInvestigationModal()
      }
    })
  }
  
  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn')
  const mobileMenu = document.getElementById('mobile-menu')
  
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden')
    })
  }
  
  // Smooth scrolling for navigation links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault()
      const target = document.querySelector(this.getAttribute('href'))
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
        // Close mobile menu if open
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
          mobileMenu.classList.add('hidden')
        }
      }
    })
  })
}

// Global functions for button clicks
function startInvestigation(type) {
  whoHubApp.showInvestigationModal(type)
}

// Investigation status checking
async function checkInvestigationStatus(investigationId) {
  try {
    const response = await axios.get(`/api/investigations/${investigationId}`)
    return response.data
  } catch (error) {
    console.error('Error checking investigation status:', error)
    return null
  }
}

// FAQ toggle function
function toggleFAQ(faqNumber) {
  const faqContent = document.getElementById(`faq-${faqNumber}`)
  const allFAQs = document.querySelectorAll('[id^="faq-"]')
  
  // Close all other FAQs
  allFAQs.forEach(faq => {
    if (faq.id !== `faq-${faqNumber}`) {
      faq.classList.add('hidden')
      // Reset chevron icon
      const button = faq.previousElementSibling
      const icon = button.querySelector('i')
      if (icon) {
        icon.classList.remove('fa-chevron-up')
        icon.classList.add('fa-chevron-down')
      }
    }
  })
  
  // Toggle current FAQ
  faqContent.classList.toggle('hidden')
  
  // Toggle chevron icon
  const button = faqContent.previousElementSibling
  const icon = button.querySelector('i')
  if (icon) {
    if (faqContent.classList.contains('hidden')) {
      icon.classList.remove('fa-chevron-up')
      icon.classList.add('fa-chevron-down')
    } else {
      icon.classList.remove('fa-chevron-down')
      icon.classList.add('fa-chevron-up')
    }
  }
}

// Scroll animations
function initializeScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  }
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade-in')
      }
    })
  }, observerOptions)
  
  // Observe all feature cards and sections
  document.querySelectorAll('.group, .feature-card, section').forEach(el => {
    observer.observe(el)
  })
}

// Add scroll animations after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initializeScrollAnimations, 1000)
})