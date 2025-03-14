// Add this to sound/js/visualizer.js

/**
 * Audio Visualizer for Nicola Rivo - Sound Designer Website
 * Using Three.js for WebGL-based visualizations
 */

// Global visualizer variables
let scene, camera, renderer;
let particles, particleSystem;
let analyserConnected = false;

// Initialize the visualizer
function initVisualizer() {
    const container = document.getElementById('audio-visualizer');
    if (!container) return;
    
    // Setup scene
    scene = new THREE.Scene();
    
    // Setup camera
    camera = new THREE.PerspectiveCamera(
        75, // Field of view
        window.innerWidth / window.innerHeight, // Aspect ratio
        0.1, // Near clipping plane
        1000 // Far clipping plane
    );
    camera.position.z = 30;
    
    // Setup renderer
    renderer = new THREE.WebGLRenderer({ 
        alpha: true, // Transparent background
        antialias: true // Smoother edges
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // Create particles for visualization
    createParticles();
    
    // Start animation
    animate();
}

// Create particle system for visualization
function createParticles() {
    const particleCount = 1500;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    
    // Generate random positions for particles
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        particlePositions[i3] = (Math.random() - 0.5) * 60;
        particlePositions[i3 + 1] = (Math.random() - 0.5) * 60;
        particlePositions[i3 + 2] = (Math.random() - 0.5) * 60;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    // Create material for particles
    const particleMaterial = new THREE.PointsMaterial({
        color: 0x00ccff,
        size: 0.5,
        transparent: true,
        blending: THREE.AdditiveBlending
    });
    
    // Create the particle system
    particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);
    
    // Keep reference to particle positions for animation
    particles = particleSystem.geometry.attributes.position.array;
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Rotate particle system slightly for ambient motion
    if (particleSystem) {
        particleSystem.rotation.x += 0.0005;
        particleSystem.rotation.y += 0.0005;
    }
    
    renderer.render(scene, camera);
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the visualizer
    initVisualizer();
});