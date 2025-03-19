/**
 * Main JavaScript file for Nicola Rivosecchi Music Teacher website
 */

document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer copyright
    document.getElementById('year').textContent = new Date().getFullYear();
    
    // Handle navigation menu toggle for mobile
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');
    
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', function() {
            menuToggle.classList.toggle('open');
            mainNav.classList.toggle('open');
        });
    }
    
    // Close mobile menu when clicking a nav link
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            menuToggle.classList.remove('open');
            mainNav.classList.remove('open');
            
            // Update active link
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            
            this.classList.add('active');
        });
    });
    
    // Smooth scrolling for navigation links
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
    
    // Header shrink on scroll
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Animate sections when they come into view
        animateSectionsOnScroll();
        
        // Update active nav link based on scroll position
        updateActiveNavOnScroll();
    });
    
    // Testimonial carousel functionality
    const testimonialSlides = document.querySelectorAll('.testimonial-slide');
    const testimonialDots = document.querySelectorAll('.dot');
    const prevButton = document.querySelector('.prev-testimonial');
    const nextButton = document.querySelector('.next-testimonial');
    let currentSlide = 0;
    
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
        
        // Auto-advance slides every 5 seconds
        setInterval(() => {
            showSlide(currentSlide + 1);
        }, 5000);
    }
    
    // Accordion functionality for FAQ
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
    
    // Contact form handling
    setupContactForm();
    
    // Function to check if an element is in viewport
    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        
        return (
            rect.top <= windowHeight * 0.8 && // Trigger when element is 80% into view
            rect.bottom >= 0
        );
    }
    
    // Function to animate sections when they come into view
    function animateSectionsOnScroll() {
        const sections = document.querySelectorAll('.section');
        
        sections.forEach(section => {
            if (isElementInViewport(section) && !section.classList.contains('visible')) {
                section.classList.add('visible');
            }
        });
    }
    
    // Function to update active nav link based on scroll position
    function updateActiveNavOnScroll() {
        const sections = document.querySelectorAll('section');
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
    
    // Run animations on page load
    setTimeout(() => {
        animateSectionsOnScroll();
        updateActiveNavOnScroll();
    }, 100);
});

/**
 * Setup contact form with direct email submission
 * This creates a direct mailto link based on form input
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
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            
            // Add invalid class for styling
            field.classList.add('invalid');
            
            // Focus the first invalid field
            if (isValid === false) {
                field.focus();
            }
        } else {
            field.classList.remove('invalid');
        }
    });
    
    return isValid;
}

/**
 * Creates a mailto link with form data, formatted for readability
 * This creates a professional-looking email that flows naturally
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
