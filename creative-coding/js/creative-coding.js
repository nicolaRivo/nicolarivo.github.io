/**
 * Creative Coding JavaScript for Nicola Rivosecchi's p5.js experiments
 */

document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('year').textContent = new Date().getFullYear();
    
    // Handle page loading
    handlePageLoading();
    
    // Setup navigation
    setupNavigation();
    
    // Initialize animations
    setTimeout(checkAnimatedElements, 300);
    
    // Setup code toggles if on a sketch page
    setupCodeToggles();
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
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
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
    const sections = document.querySelectorAll('section[id]');
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
 * Check which animated elements are visible and animate them
 */
function checkAnimatedElements() {
    const elements = document.querySelectorAll('.animated');
    
    elements.forEach(element => {
        if (isElementInViewport(element) && !element.classList.contains('in-view')) {
            element.classList.add('in-view');
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
 * Setup code toggle functionality for sketch pages
 */
function setupCodeToggles() {
    const codeToggles = document.querySelectorAll('.code-toggle');
    
    codeToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const codeBlock = this.closest('.sketch-code').querySelector('.code-block');
            const isOpen = codeBlock.classList.contains('open');
            
            // Toggle the code block
            if (isOpen) {
                codeBlock.classList.remove('open');
                this.textContent = 'Show Code';
            } else {
                codeBlock.classList.add('open');
                this.textContent = 'Hide Code';
            }
        });
    });
}

// Trigger animations on scroll
window.addEventListener('scroll', checkAnimatedElements);