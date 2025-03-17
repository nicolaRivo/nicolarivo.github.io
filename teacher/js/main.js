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
    
    // Form submission
    const contactForm = document.getElementById('lesson-inquiry-form');
    const formSuccess = document.getElementById('form-success');
    
    if (contactForm && formSuccess) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // In a real implementation, you would send form data to a server here
            // For now, we'll just simulate a successful submission
            
            // Hide form and show success message after a short delay
            setTimeout(() => {
                contactForm.style.display = 'none';
                formSuccess.classList.remove('hidden');
            }, 500);
        });
    }
    
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