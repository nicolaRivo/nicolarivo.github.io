/**
 * Enhanced JavaScript for Nicola Rivosecchi Sound Designer Website
 * Streamlined code with unused functions removed
 */

document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('year').textContent = new Date().getFullYear();
    
    // Create and populate YouTube thumbnails
    setupYouTubeThumbnails();
    
    // Initialize animations
    setTimeout(checkAnimatedElements, 300);
    
    // Handle page loading
    handlePageLoading();
    
    // Setup navigation
    setupNavigation();
    
    // Setup contact form
    setupContactForm();
});

/**
 * Handle initial page loading and transitions
 */
function handlePageLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // Hide loading overlay after a slight delay
    setTimeout(() => {
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 500);
        }
    }, 800);
}

/**
 * Sets up navigation, scroll effects, and mobile menu
 */
function setupNavigation() {
    const header = document.getElementById('header');
    const hamburger = document.getElementById('menu-toggle');
    const nav = document.getElementById('main-nav');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Handle scroll events
    window.addEventListener('scroll', function() {
        // Header scroll effect
        if (window.scrollY > 50) {
            header?.classList.add('scrolled');
        } else {
            header?.classList.remove('scrolled');
        }
        
        // Check for elements to animate
        checkAnimatedElements();
        
        // Update active nav link based on scroll position
        updateActiveNavLink();
    });
    
    // Mobile menu toggle
    if (hamburger && nav) {
        hamburger.addEventListener('click', function() {
            nav.classList.toggle('open');
            hamburger.classList.toggle('active');
        });
        
        // Close mobile menu when clicking a link
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                nav.classList.remove('open');
                hamburger.classList.remove('active');
            });
        });
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = header?.offsetHeight || 0;
                
                window.scrollTo({
                    top: targetElement.offsetTop - headerHeight,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Updates the active navigation link based on scroll position
 */
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Get current scroll position with some offset
    const scrollPosition = window.scrollY + 150;
    
    // Find the current section
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
            });
            
            const activeLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        }
    });
}

/**
 * Creates high-quality YouTube thumbnails with play buttons
 */
function setupYouTubeThumbnails() {
    const iframeContainers = document.querySelectorAll('.iframe-container');
    
    iframeContainers.forEach(container => {
        // Get video ID from src attribute
        const src = container.getAttribute('data-src');
        if (!src) return;
        
        // Extract YouTube video ID
        const videoId = extractYouTubeId(src);
        if (!videoId) return;
        
        // Create thumbnail element
        const thumbnail = document.createElement('div');
        thumbnail.className = 'youtube-thumbnail';
        
        // Set high-quality thumbnail as background
        thumbnail.style.backgroundImage = `url(https://img.youtube.com/vi/${videoId}/hqdefault.jpg)`;
        
        // Add play button
        const playButton = document.createElement('div');
        playButton.className = 'play-button';
        thumbnail.appendChild(playButton);
        
        // Replace container content with thumbnail
        container.innerHTML = '';
        container.appendChild(thumbnail);
        
        // Add click event to load iframe
        thumbnail.addEventListener('click', function() {
            const iframe = document.createElement('iframe');
            iframe.src = src;
            iframe.setAttribute('allowfullscreen', '');
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
            
            const fullContainer = document.createElement('div');
            fullContainer.style.position = 'relative';
            fullContainer.style.width = '100%';
            fullContainer.style.paddingBottom = '56.25%';
            fullContainer.style.marginBottom = '2.5rem';
            fullContainer.style.borderRadius = '8px';
            fullContainer.style.overflow = 'hidden';
            
            iframe.style.position = 'absolute';
            iframe.style.top = '0';
            iframe.style.left = '0';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            
            fullContainer.appendChild(iframe);
            container.parentNode.replaceChild(fullContainer, container);
        });
    });
}

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeId(url) {
    const regExp = /^.*(?:youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
}

/**
 * Check which animated elements are visible and animate them
 */
function checkAnimatedElements() {
    const elements = document.querySelectorAll('.animated');
    
    elements.forEach(element => {
        if (isElementInViewport(element) && !element.classList.contains('in-view')) {
            element.classList.add('in-view');
            
            // Special handling for skill progress bars
            if (element.classList.contains('skill-category')) {
                const progressBars = element.querySelectorAll('.skill-progress');
                progressBars.forEach((bar, index) => {
                    const progress = bar.getAttribute('data-progress');
                    bar.style.setProperty('--progress-value', `${progress}%`);
                    
                    setTimeout(() => {
                        bar.classList.add('in-view');
                    }, 100 + (index * 100));
                });
            }
        }
    });
}

/**
 * Check if element is in viewport
 */
function isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    
    return (
        rect.top <= windowHeight * 0.85 && 
        rect.bottom >= 0
    );
}

/**
 * Contact form submission handling
 */
function setupContactForm() {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Simple form validation
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            
            if (!name || !email || !message) {
                alert('Please fill in all required fields.');
                return;
            }
            
            // Show success message
            const successMessage = document.createElement('div');
            successMessage.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <div style="font-size: 3rem; color: var(--color-primary); margin-bottom: 1rem;">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3 style="margin-bottom: 1rem;">Message Sent!</h3>
                    <p>Thank you for reaching out, ${name}. I'll get back to you soon.</p>
                </div>
            `;
            
            // Replace form with success message
            contactForm.parentNode.replaceChild(successMessage, contactForm);
        });
    }
}

// Trigger animations on scroll
window.addEventListener('scroll', checkAnimatedElements);