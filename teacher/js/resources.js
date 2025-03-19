/**
 * JavaScript for the Resources Page
 * Nicola Rivosecchi Music Teacher Website
 */

document.addEventListener('DOMContentLoaded', function() {
    // Resource navigation functionality
    setupResourceNavigation();
    
    // Filter buttons functionality
    setupFilterButtons();
    
    // Resource card animations
    setupResourceCardEffects();
    
    // Set current year in footer copyright
    document.getElementById('year').textContent = new Date().getFullYear();
});

/**
 * Setup smooth scrolling navigation between resource sections
 */
function setupResourceNavigation() {
    const navItems = document.querySelectorAll('.resource-nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // Add highlight effect to the target section
                targetElement.classList.add('highlight');
                setTimeout(() => {
                    targetElement.classList.remove('highlight');
                }, 1500);
                
                // Scroll to the target section with offset for header
                const headerHeight = document.getElementById('header').offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 20;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Setup filter buttons for resources
 */
function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get the parent filter container
            const filterContainer = this.closest('.resources-filter');
            
            // Get all buttons in this filter group and remove active class
            const buttons = filterContainer.querySelectorAll('.filter-btn');
            buttons.forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get the filter value
            const filterValue = this.getAttribute('data-filter');
            
            // Get the resource grid to filter
            const resourceGrid = this.closest('.resource-section').querySelector('.resources-grid');
            
            // Filter the resource cards
            filterResourceCards(resourceGrid, filterValue);
        });
    });
}

/**
 * Filter resource cards based on category
 */
function filterResourceCards(grid, filter) {
    const cards = grid.querySelectorAll('.resource-card');
    
    cards.forEach(card => {
        if (filter === 'all') {
            // Show all cards
            card.style.display = 'flex';
            
            // Add animation
            card.style.animation = 'fadeIn 0.5s forwards';
        } else {
            // Check if card has the selected category
            const categories = card.getAttribute('data-categories');
            
            if (categories && categories.includes(filter)) {
                card.style.display = 'flex';
                card.style.animation = 'fadeIn 0.5s forwards';
            } else {
                card.style.display = 'none';
            }
        }
    });
}

/**
 * Setup hover and interaction effects for resource cards
 */
function setupResourceCardEffects() {
    const resourceCards = document.querySelectorAll('.resource-card');
    
    resourceCards.forEach(card => {
        // Icon scale effect on hover
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.placeholder-thumbnail i');
            if (icon) {
                icon.style.transform = 'scale(1.2)';
                icon.style.transition = 'transform 0.3s ease';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.placeholder-thumbnail i');
            if (icon) {
                icon.style.transform = 'scale(1)';
            }
        });
        
        // Add click effect for future implementation of resource previews
        card.addEventListener('click', function() {
            // This is a placeholder for future functionality
            // When real resources are added, this could open a modal or download the resource
            
            // For now, just add a pulse effect
            this.classList.add('pulse');
            setTimeout(() => {
                this.classList.remove('pulse');
            }, 500);
            
            // Log the resource name (for development purposes)
            const resourceName = this.querySelector('h4').textContent;
            console.log(`Resource clicked: ${resourceName}`);
        });
    });
}

// Add these CSS animations to your stylesheet or inline here
document.head.insertAdjacentHTML('beforeend', `
    <style>
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.03); }
            100% { transform: scale(1); }
        }
        
        .pulse {
            animation: pulse 0.5s ease;
        }
        
        .highlight {
            animation: highlight 1.5s ease;
        }
        
        @keyframes highlight {
            0% { background-color: transparent; }
            20% { background-color: rgba(74, 134, 232, 0.1); }
            80% { background-color: rgba(74, 134, 232, 0.1); }
            100% { background-color: transparent; }
        }
    </style>
`);
