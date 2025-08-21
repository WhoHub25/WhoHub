// WhoHub - Professional OSINT Dating Safety Platform
// JavaScript for Interactive Functionality and Form Handling

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initializeNavigation();
    initializeScrollEffects();
    initializeFormHandling();
    initializeAnimations();
    initializeSmoothScrolling();
    initializeContactForm();
    
    // Show loading complete
    console.log('WhoHub initialized successfully');
});

// Navigation functionality
function initializeNavigation() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const header = document.querySelector('header');
    
    // Mobile menu toggle
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            
            // Animate hamburger menu
            const spans = mobileToggle.querySelectorAll('span');
            spans.forEach((span, index) => {
                span.style.transform = navMenu.classList.contains('active') 
                    ? `rotate(${index === 0 ? '45deg' : index === 1 ? '0deg' : '-45deg'}) translate(${index === 1 ? '0' : index === 0 ? '6px, 6px' : '6px, -6px'})` 
                    : 'none';
                span.style.opacity = index === 1 && navMenu.classList.contains('active') ? '0' : '1';
            });
        });
        
        // Close menu when clicking nav links
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                // Reset hamburger
                const spans = mobileToggle.querySelectorAll('span');
                spans.forEach(span => {
                    span.style.transform = 'none';
                    span.style.opacity = '1';
                });
            });
        });
    }
    
    // Header scroll effect
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled');
        }
        
        // Hide/show header on scroll
        if (currentScrollY > lastScrollY && currentScrollY > 200) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollY = currentScrollY;
    });
}

// Scroll effects and animations
function initializeScrollEffects() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -100px 0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                // Add staggered animation for grid items
                if (entry.target.classList.contains('feature-card') || entry.target.classList.contains('pricing-card')) {
                    const delay = Array.from(entry.target.parentElement.children).indexOf(entry.target) * 0.1;
                    entry.target.style.animationDelay = `${delay}s`;
                }
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.feature-card, .pricing-card, .section-header');
    animatedElements.forEach(el => observer.observe(el));
    
    // Parallax effect for hero
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        const heroContent = document.querySelector('.hero-content');
        
        if (hero && heroContent) {
            heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
        }
    });
}

// Smooth scrolling for anchor links
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Form handling functionality
function initializeFormHandling() {
    // Generic form submission handler
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
    });
    
    // Input validation and styling
    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

// Contact form specific handling
function initializeContactForm() {
    const contactForm = document.getElementById('early-access-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleEarlyAccessSubmission(this);
        });
    }
}

// Handle early access form submission
async function handleEarlyAccessSubmission(form) {
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    // Clear previous alerts
    clearAlerts(form);
    
    try {
        // Validate form
        const validation = validateForm(form);
        if (!validation.isValid) {
            throw new Error(validation.message);
        }
        
        // For GoDaddy hosting, we'll store in localStorage and show success message
        // In production, this would send to your backend/email service
        const submissionData = {
            name: formData.get('name'),
            email: formData.get('email'),
            interest: formData.get('interest'),
            message: formData.get('message'),
            timestamp: new Date().toISOString()
        };
        
        // Store locally for now (replace with actual API call)
        let submissions = JSON.parse(localStorage.getItem('whohub_submissions') || '[]');
        submissions.push(submissionData);
        localStorage.setItem('whohub_submissions', JSON.stringify(submissions));
        
        // Show success message
        showAlert(form, 'Thank you for your interest! We\'ll contact you soon with early access details.', 'success');
        form.reset();
        
        // Track submission (replace with actual analytics)
        if (typeof gtag !== 'undefined') {
            gtag('event', 'early_access_signup', {
                'custom_parameters': {
                    'interest': submissionData.interest
                }
            });
        }
        
    } catch (error) {
        showAlert(form, error.message || 'An error occurred. Please try again.', 'error');
    } finally {
        // Reset button
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Generic form submission handler
async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    
    // Skip if it's the early access form (handled separately)
    if (form.id === 'early-access-form') {
        return;
    }
    
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    
    if (submitBtn) {
        const originalText = submitBtn.textContent;
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        try {
            // Generic form handling - customize based on your needs
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
            showAlert(form, 'Message sent successfully!', 'success');
            form.reset();
        } catch (error) {
            showAlert(form, 'An error occurred. Please try again.', 'error');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}

// Form validation
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    const errors = [];
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            errors.push(`${field.getAttribute('data-label') || field.name} is required`);
            showFieldError(field, 'This field is required');
        }
    });
    
    // Email validation
    const emailFields = form.querySelectorAll('input[type="email"]');
    emailFields.forEach(field => {
        if (field.value && !isValidEmail(field.value)) {
            errors.push('Please enter a valid email address');
            showFieldError(field, 'Please enter a valid email address');
        }
    });
    
    return {
        isValid: errors.length === 0,
        message: errors.join(', ')
    };
}

// Field validation
function validateField(e) {
    const field = e.target;
    clearFieldError(field);
    
    if (field.hasAttribute('required') && !field.value.trim()) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    if (field.type === 'email' && field.value && !isValidEmail(field.value)) {
        showFieldError(field, 'Please enter a valid email address');
        return false;
    }
    
    return true;
}

// Clear field error
function clearFieldError(field) {
    if (typeof field === 'object' && field.target) {
        field = field.target;
    }
    
    field.classList.remove('error');
    const errorMsg = field.parentElement.querySelector('.field-error');
    if (errorMsg) {
        errorMsg.remove();
    }
}

// Show field error
function showFieldError(field, message) {
    field.classList.add('error');
    
    // Remove existing error
    const existingError = field.parentElement.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add new error
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.color = '#ef4444';
    errorDiv.style.fontSize = '0.875rem';
    errorDiv.style.marginTop = '4px';
    
    field.parentElement.appendChild(errorDiv);
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Alert system
function showAlert(container, message, type = 'info') {
    clearAlerts(container);
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    // Insert at the beginning of the form/container
    container.insertBefore(alert, container.firstChild);
    
    // Auto-hide after 5 seconds for success messages
    if (type === 'success') {
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    }
}

function clearAlerts(container) {
    const alerts = container.querySelectorAll('.alert');
    alerts.forEach(alert => alert.remove());
}

// Animation utilities
function initializeAnimations() {
    // Counter animation for statistics
    const counters = document.querySelectorAll('[data-counter]');
    
    const counterObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    });
    
    counters.forEach(counter => counterObserver.observe(counter));
    
    // Typing animation for hero text
    const typewriterElements = document.querySelectorAll('[data-typewriter]');
    typewriterElements.forEach(element => {
        const text = element.textContent;
        element.textContent = '';
        typewriterAnimation(element, text);
    });
}

// Counter animation
function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-counter'));
    const duration = 2000; // 2 seconds
    const start = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentValue = Math.floor(progress * target);
        element.textContent = currentValue.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
}

// Typewriter animation
function typewriterAnimation(element, text, speed = 50) {
    let i = 0;
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Performance optimization
const debouncedScrollHandler = debounce(() => {
    // Handle scroll events here if needed
}, 100);

window.addEventListener('scroll', debouncedScrollHandler);

// Error handling
window.addEventListener('error', function(e) {
    console.error('WhoHub Error:', e.error);
    // You could send this to your error tracking service
});

// Browser compatibility checks
function checkCompatibility() {
    // Check for required features
    const requiredFeatures = [
        'localStorage',
        'FormData',
        'fetch',
        'IntersectionObserver'
    ];
    
    const unsupported = requiredFeatures.filter(feature => {
        switch(feature) {
            case 'localStorage':
                return !window.localStorage;
            case 'FormData':
                return !window.FormData;
            case 'fetch':
                return !window.fetch;
            case 'IntersectionObserver':
                return !window.IntersectionObserver;
            default:
                return false;
        }
    });
    
    if (unsupported.length > 0) {
        console.warn('Unsupported features detected:', unsupported);
        // You could show a browser upgrade notice here
    }
}

// Initialize compatibility check
checkCompatibility();

// Export functions for testing or external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateForm,
        isValidEmail,
        showAlert,
        clearAlerts
    };
}

// Google Analytics integration (if available)
function trackEvent(action, category = 'engagement', label = '') {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            event_category: category,
            event_label: label
        });
    }
}

// Track user interactions
document.addEventListener('click', function(e) {
    // Track button clicks
    if (e.target.classList.contains('btn')) {
        const buttonText = e.target.textContent.trim();
        trackEvent('button_click', 'interaction', buttonText);
    }
    
    // Track navigation clicks
    if (e.target.classList.contains('nav-link')) {
        const linkText = e.target.textContent.trim();
        trackEvent('navigation_click', 'navigation', linkText);
    }
});

// Print support
window.addEventListener('beforeprint', function() {
    // Prepare page for printing
    document.body.classList.add('printing');
});

window.addEventListener('afterprint', function() {
    // Clean up after printing
    document.body.classList.remove('printing');
});