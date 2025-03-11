/**
 * Main JavaScript for Nicola Rivo - Sound Designer Website
 */

document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('year').textContent = new Date().getFullYear();
    
    // Navigation functionality
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('nav');
    
    hamburger.addEventListener('click', function() {
        nav.classList.toggle('active');
        hamburger.classList.toggle('active');
    });
    
    // Close mobile nav when clicking a link
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function() {
            nav.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });
    
    // Smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Header scroll effect
    const header = document.querySelector('header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    // Animate skill bars when in viewport
    const skillBars = document.querySelectorAll('.skill-progress');
    const animateSkillBars = () => {
        skillBars.forEach(bar => {
            const barPosition = bar.getBoundingClientRect().top;
            if (barPosition < window.innerHeight - 100) {
                const progress = bar.getAttribute('data-progress');
                bar.style.width = `${progress}%`;
            }
        });
    };
    
    // Scroll animations for fade-in elements
    const fadeInElements = document.querySelectorAll('.skills, .about, .contact, .project-card');
    const animateFadeIn = () => {
        fadeInElements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            if (elementPosition < window.innerHeight - 100) {
                element.classList.add('fade-in');
            }
        });
    };
    
    // Run animations on scroll
    window.addEventListener('scroll', function() {
        animateSkillBars();
        animateFadeIn();
    });
    
    // Run animations on load
    animateSkillBars();
    animateFadeIn();
    
    // Project modal functionality
    const modal = document.getElementById('project-modal');
    const modalTitle = document.querySelector('.modal-title');
    const modalBody = document.querySelector('.modal-body');
    const modalClose = document.querySelector('.modal-close');
    
    // Project details
    const projectDetails = {
        project1: {
            title: 'Echoes of the Void',
            description: 'A sci-fi short film set in deep space, where the protagonist encounters an anomaly that warps sound and reality. I created a rich soundscape that blends organic and synthetic elements to portray the alienness of space and the psychological journey of the main character.',
            role: 'Lead Sound Designer',
            client: 'Nova Films',
            year: '2024',
            techniques: 'Field Recording, Granular Synthesis, Max/MSP, Spatial Audio',
            imageUrl: 'assets/images/project1-detail.jpg'
        },
        project2: {
            title: 'Forgotten Realms',
            description: 'An open-world fantasy RPG that takes players through diverse environments from misty forests to abandoned ruins and volcanic mountains. I developed a dynamic audio system that seamlessly transitions between different environmental soundscapes based on player location and game events.',
            role: 'Audio Director',
            client: 'Arcane Studios',
            year: '2023',
            techniques: 'Procedural Audio, Middleware Implementation, Foley, Synthesis',
            imageUrl: 'assets/images/project2-detail.jpg'
        },
        project3: {
            title: 'Urban Rhythms',
            description: 'An interactive installation that transforms public spaces into immersive soundscapes. Using motion sensors and microphones, the system captures movement and ambient sounds from the environment, processes them in real-time, and generates a constantly evolving musical composition.',
            role: 'Creator & Developer',
            client: 'Urban Arts Foundation',
            year: '2024',
            techniques: 'Web Audio API, Sensor Integration, Algorithmic Composition',
            imageUrl: 'assets/images/project3-detail.jpg'
        },
        project4: {
            title: 'Whispers of Nature',
            description: 'A six-part documentary series exploring remote ecosystems around the world. I spent three months in the field capturing the sounds of these environments, from the Amazon rainforest to the Arctic tundra.',
            role: 'Field Recordist & Sound Designer',
            client: 'Natural World Media',
            year: '2022',
            techniques: 'Field Recording, Ambisonics, Restoration, Sound Editing',
            imageUrl: 'assets/images/project4-detail.jpg'
        },
        project5: {
            title: 'Synthetic Dreams',
            description: 'An experimental electronic music album created entirely using custom Max/MSP patches and modular synthesis. The project explores the boundary between structured composition and generative music.',
            role: 'Composer & Sound Designer',
            client: 'Self-released',
            year: '2023',
            techniques: 'Max/MSP, Modular Synthesis, Generative Composition',
            imageUrl: 'assets/images/project5-detail.jpg'
        },
        project6: {
            title: 'Emotional Resonance',
            description: 'An interactive web experience that generates personalized music based on the emotional state of users. Visitors answer a series of questions or allow the application to analyze their text input for emotional content, which then influences various musical parameters.',
            role: 'Developer & Sound Designer',
            client: 'Interactive Arts Collective',
            year: '2024',
            techniques: 'Tone.js, Sentiment Analysis, Algorithmic Composition',
            imageUrl: 'assets/images/project6-detail.jpg'
        }
    };
    
    // Open modal
    document.querySelectorAll('.project-details-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const projectId = this.getAttribute('data-project');
            const project = projectDetails[projectId];
            
            if (project) {
                modalTitle.textContent = project.title;
                modalBody.innerHTML = `
                    <div class="project-detail-image">
                        <img src="${project.imageUrl || 'assets/images/placeholder.jpg'}" alt="${project.title}">
                    </div>
                    <div class="project-detail-content">
                        <p>${project.description}</p>
                        <div class="project-meta">
                            <div class="meta-item">
                                <strong>Role:</strong> ${project.role}
                            </div>
                            <div class="meta-item">
                                <strong>Client:</strong> ${project.client}
                            </div>
                            <div class="meta-item">
                                <strong>Year:</strong> ${project.year}
                            </div>
                            <div class="meta-item">
                                <strong>Techniques:</strong> ${project.techniques}
                            </div>
                        </div>
                    </div>
                `;
                
                modal.classList.add('open');
                document.body.style.overflow = 'hidden'; // Prevent scrolling
            }
        });
    });
    
    // Close modal
    modalClose.addEventListener('click', function() {
        modal.classList.remove('open');
        document.body.style.overflow = ''; // Re-enable scrolling
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('open');
            document.body.style.overflow = ''; // Re-enable scrolling
        }
    });
    
    // Contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Simple form validation
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;
            
            if (!name || !email || !subject || !message) {
                alert('Please fill in all fields.');
                return;
            }
            
            // In a real-world scenario, you would send this data to a server
            // For GitHub Pages, you can use services like Formspree or Netlify Forms
            alert(`Thanks for your message, ${name}! I'll get back to you soon.`);
            contactForm.reset();
            
            /* Example with Formspree:
            
            const formData = new FormData(contactForm);
            
            fetch('https://formspree.io/f/your-form-id', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                if (response.ok) {
                    alert(`Thanks for your message, ${name}! I'll get back to you soon.`);
                    contactForm.reset();
                } else {
                    throw new Error('Form submission failed');
                }
            })
            .catch(error => {
                alert('There was a problem submitting your form. Please try again later.');
                console.error(error);
            });
            */
        });
    }
    
    // Occasional glitch effect for the whole page
    const triggerRandomGlitch = () => {
        const colorBars = document.querySelector('.color-bars');
        colorBars.style.opacity = '0.2';
        
        setTimeout(() => {
            colorBars.style.opacity = '0';
        }, 100);
    };
    
    // Random glitch timing
    setInterval(() => {
        if (Math.random() < 0.3) { // 30% chance
            triggerRandomGlitch();
        }
    }, 10000); // Every 10 seconds check
    
    // Create a small glitch on page load
    setTimeout(triggerRandomGlitch, 3000);
});