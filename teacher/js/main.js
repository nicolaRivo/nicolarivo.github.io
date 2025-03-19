/**
 * Main JavaScript file for Nicola Rivosecchi Music Teacher website
 */

document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer copyright
    document.getElementById('year').textContent = new Date().getFullYear();
    
    // Setup video background with improved mobile handling
    setupVideoBackground();
    
    // Handle navigation menu toggle for mobile
    setupMobileNavigation();
    
    // Smooth scrolling for navigation links
    setupSmoothScrolling();
    
    // Header appearance on scroll
    setupHeaderScroll();
    
    // Testimonial carousel functionality
    setupTestimonialCarousel();
    
    // Accordion functionality for FAQ
    setupAccordion();
    
    // Contact form handling
    setupContactForm();
    
    // Run animations on page load
    setTimeout(() => {
        animateSectionsOnScroll();
        updateActiveNavOnScroll();
    }, 100);
});

/**
 * Setup mobile navigation with improved handling
 */
function setupMobileNavigation() {
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');
    const body = document.body;
    
    if (menuToggle && mainNav) {
        // Improved toggle behavior
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event bubbling
            menuToggle.classList.toggle('open');
            mainNav.classList.toggle('open');
            body.classList.toggle('menu-open'); // Add overlay class to body
            
            // Prevent scrolling when menu is open
            if (body.classList.contains('menu-open')) {
                body.style.overflow = 'hidden';
            } else {
                body.style.overflow = '';
            }
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (mainNav.classList.contains('open') && 
                !mainNav.contains(e.target) && 
                e.target !== menuToggle && 
                !menuToggle.contains(e.target)) {
                menuToggle.classList.remove('open');
                mainNav.classList.remove('open');
                body.classList.remove('menu-open');
                body.style.overflow = '';
            }
        });
        
        // Close mobile menu when clicking a nav link
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                menuToggle.classList.remove('open');
                mainNav.classList.remove('open');
                body.classList.remove('menu-open');
                body.style.overflow = '';
                
                // Update active link
                navLinks.forEach(navLink => {
                    navLink.classList.remove('active');
                });
                
                this.classList.add('active');
            });
        });
    }
}

/**
 * Setup smooth scrolling for all anchor links
 */
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            // Get the target element
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (!targetElement) return;
            
            // Get the height of the header for offset
            const headerHeight = document.getElementById('header').offsetHeight;
            
            // Calculate the position to scroll to
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
            
            // Scroll smoothly
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        });
    });
}

/**
 * Setup header appearance on scroll with enhanced effects
 */
function setupHeaderScroll() {
    const header = document.getElementById('header');
    const navLinks = document.querySelectorAll('.nav-link');
    
    window.addEventListener('scroll', function() {
        const scrollPosition = window.scrollY;
        
        // Start showing nav elements at 50px, fully visible by 250px
        if (scrollPosition > 50) {
            const opacity = Math.min((scrollPosition - 50) / 200, 1);
            const headerOpacity = Math.min((scrollPosition - 50) / 100, 1);
            
            // Apply gradual background
            header.style.background = `linear-gradient(135deg, 
                rgba(74, 134, 232, ${headerOpacity * 0.95}) 0%, 
                rgba(124, 77, 255, ${headerOpacity * 0.95}) 100%)`;
            
            // Add scrolled class when fully visible
            if (scrollPosition > 200) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            
            // Add subtle shadow as we scroll
            header.style.boxShadow = `0 ${headerOpacity * 4}px ${headerOpacity * 6}px rgba(0, 0, 0, ${headerOpacity * 0.1})`;
        } else {
            // Reset at top of page
            header.style.background = 'transparent';
            header.style.boxShadow = 'none';
            header.classList.remove('scrolled');
        }
        
        // Animate sections when they come into view
        animateSectionsOnScroll();
        
        // Update active nav link based on scroll position
        updateActiveNavOnScroll();
    });
}

/**
 * Setup testimonial carousel
 */
function setupTestimonialCarousel() {
    const testimonialSlides = document.querySelectorAll('.testimonial-slide');
    const testimonialDots = document.querySelectorAll('.dot');
    const prevButton = document.querySelector('.prev-testimonial');
    const nextButton = document.querySelector('.next-testimonial');
    let currentSlide = 0;
    let autoSlideInterval;
    
    if (testimonialSlides.length > 0) {
        function showSlide(n) {
            // Hide all slides
            testimonialSlides.forEach(slide => {
                slide.classList.remove('active');
            });
            
            // Remove active class from all dots
            testimonialDots.forEach(dot => {
                dot.classList.remove('active');
            });
            
            // Calculate the slide index
            currentSlide = (n + testimonialSlides.length) % testimonialSlides.length;
            
            // Show the current slide
            testimonialSlides[currentSlide].classList.add('active');
            
            // Highlight the current dot
            testimonialDots[currentSlide].classList.add('active');
            
            // Reset auto-advance timer
            clearInterval(autoSlideInterval);
            startAutoSlide();
        }
        
        // Start auto-advance
        function startAutoSlide() {
            autoSlideInterval = setInterval(() => {
                showSlide(currentSlide + 1);
            }, 5000);
        }
        
        // Next/previous controls
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                showSlide(currentSlide - 1);
            });
        }
        
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                showSlide(currentSlide + 1);
            });
        }
        
        // Dot controls
        testimonialDots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                showSlide(index);
            });
        });
        
        // Pause auto-advance on hover
        const testimonialCarousel = document.querySelector('.testimonial-carousel');
        if (testimonialCarousel) {
            testimonialCarousel.addEventListener('mouseenter', () => {
                clearInterval(autoSlideInterval);
            });
            
            testimonialCarousel.addEventListener('mouseleave', () => {
                startAutoSlide();
            });
        }
        
        // Start auto-advance on page load
        startAutoSlide();
    }
}

/**
 * Setup accordion functionality for FAQ
 */
function setupAccordion() {
    const accordionItems = document.querySelectorAll('.accordion-item');
    
    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        
        header.addEventListener('click', () => {
            // Toggle current item
            item.classList.toggle('active');
            
            // Close other items
            accordionItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
        });
    });
}

/**
 * Handle video background loading and fallback with improved mobile handling
 */
function setupVideoBackground() {
    const heroVideo = document.querySelector('.video-background video');
    const videoBg = document.querySelector('.video-background');
    
    if (heroVideo) {
        // Check if on mobile device
        const isMobile = window.innerWidth <= 768;
        
        // Check if the browser supports video
        const isVideoSupported = !!document.createElement('video').canPlayType;
        
        if (!isVideoSupported) {
            // If video is not supported, make sure the poster image is displayed properly
            if (videoBg) {
                videoBg.classList.add('video-fallback');
            }
            return;
        }
        
        // Set poster attribute if not already set
        if (!heroVideo.hasAttribute('poster')) {
            heroVideo.setAttribute('poster', 'assets/images/hero.jpeg');
        }
        
        // Handle video loading error
        heroVideo.addEventListener('error', function() {
            console.log('Video failed to load, falling back to image');
            if (videoBg) {
                videoBg.classList.add('video-fallback');
                heroVideo.style.display = 'none'; // Hide the video element
            }
        });
        
        // For mobile specifically
        if (isMobile) {
            // Make sure these attributes are set for mobile
            heroVideo.setAttribute('playsinline', '');
            heroVideo.setAttribute('muted', '');
            heroVideo.muted = true; // Explicitly set muted property
        }
        
        // Check if video is playing after a short delay
        setTimeout(() => {
            if (heroVideo.paused || heroVideo.currentTime === 0) {
                console.log('Video not playing, attempting to play manually');
                
                // Try to play the video manually
                heroVideo.play().catch(error => {
                    console.log('Manual play failed:', error);
                    // If manual play fails, fall back to image
                    if (videoBg) {
                        videoBg.classList.add('video-fallback');
                    }
                });
            }
        }, isMobile ? 500 : 1000); // Shorter delay for mobile
        
        // Listen for window resize to handle orientation changes
        window.addEventListener('resize', function() {
            // Re-check if mobile
            const isMobileNow = window.innerWidth <= 768;
            
            if (isMobileNow) {
                // Ensure playsinline and muted are set
                heroVideo.setAttribute('playsinline', '');
                heroVideo.muted = true;
                
                // Try to play again if paused
                if (heroVideo.paused) {
                    heroVideo.play().catch(() => {
                        // If still can't play, ensure fallback
                        videoBg.classList.add('video-fallback');
                    });
                }
            }
        });
    }
}

/**
 * Setup contact form with direct email submission
 */
function setupContactForm() {
    const contactForm = document.getElementById('contact-form');
    const formSuccess = document.getElementById('form-success');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            // Prevent the default form submission
            e.preventDefault();
            
            // Simple validation
            if (!validateForm(contactForm)) {
                return;
            }
            
            // Create and open a mailto link with the form data
            const mailtoLink = createMailtoLink(contactForm);
            window.open(mailtoLink, '_blank');
            
            // Show success message
            contactForm.style.display = 'none';
            formSuccess.classList.remove('hidden');
            
            // Reset form for if they come back
            setTimeout(() => {
                contactForm.reset();
            }, 1000);
            
            // Log successful submission
            console.log('Form submitted via mailto link');
        });
    }
}

/**
 * Validate form fields
 * @param {HTMLFormElement} form - The form to validate
 * @returns {boolean} - Whether the form is valid
 */
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    let firstInvalidField = null;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            
            // Add invalid class for styling
            field.classList.add('invalid');
            
            // Store first invalid field for focusing
            if (!firstInvalidField) {
                firstInvalidField = field;
            }
        } else {
            field.classList.remove('invalid');
        }
    });
    
    // Focus the first invalid field if any found
    if (firstInvalidField) {
        firstInvalidField.focus();
    }
    
    return isValid;
}

/**
 * Creates a mailto link with form data, formatted for readability
 * 
 * @param {HTMLFormElement} form - The form containing user input
 * @returns {string} - A formatted mailto URL
 */
function createMailtoLink(form) {
    // Get form values
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim() || 'Not provided';
    const instrument = form.instrument.value;
    const experience = form.experience.value;
    const message = form.message.value.trim();
    
    // Create a well-formatted email body
    const bodyText = 
`New Lesson Inquiry from your website

Dear Nicola,

You've received a new lesson inquiry from ${name}. Here are their details:

STUDENT INFORMATION:
--------------------
Name: ${name}
Email: ${email}
Phone: ${phone}

LESSON DETAILS:
--------------
Instrument: ${instrument}
Experience: ${experience}

MESSAGE:
--------
${message}

--------------------
This inquiry was submitted through your website contact form.
To respond, simply reply to this email.`;

    // Create the subject line
    const subject = `Lesson Inquiry from ${name} - ${instrument}`;
    
    // Encode for mailto - this should preserve the line breaks in most email clients
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(bodyText);
    
    // Return the mailto link
    return `mailto:nicola.rivosecchi@gmail.com?subject=${encodedSubject}&body=${encodedBody}`;
}

/**
 * Function to check if an element is in viewport
 * @param {HTMLElement} el - The element to check
 * @returns {boolean} - Whether the element is in viewport
 */
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    
    return (
        rect.top <= windowHeight * 0.8 && // Trigger when element is 80% into view
        rect.bottom >= 0
    );
}

/**
 * Function to animate sections when they come into view
 */
function animateSectionsOnScroll() {
    const sections = document.querySelectorAll('.section');
    
    sections.forEach(section => {
        if (isElementInViewport(section) && !section.classList.contains('visible')) {
            section.classList.add('visible');
        }
    });
}

/**
 * Function to update active nav link based on scroll position
 */
function updateActiveNavOnScroll() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    let scrollPosition = window.scrollY + window.innerHeight / 3;
    
    sections.forEach(section => {
        // Get section top and bottom positions
        const sectionTop = section.offsetTop - 100; // Offset for header
        const sectionBottom = sectionTop + section.offsetHeight;
        
        // Check if scroll position is within section bounds
        if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
            const id = section.getAttribute('id');
            
            // Remove active class from all links
            navLinks.forEach(link => {
                link.classList.remove('active');
            });
            
            // Add active class to corresponding link
            const activeLink = document.querySelector(`a[href="#${id}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        }
    });
}
