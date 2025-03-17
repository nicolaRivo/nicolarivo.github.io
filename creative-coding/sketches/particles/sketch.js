/**
 * [SKETCH_NAME] by Nicola Rivosecchi
 * [DATE]
 * 
 * This p5.js sketch [BRIEF_DESCRIPTION]
 */

// Global variables
let speed = 0.5;
let colorIntensity = 75;

function setup() {
  // Create canvas inside the container
  const container = document.getElementById('sketch-canvas-container');
  const canvas = createCanvas(
    container.offsetWidth, 
    min(container.offsetWidth * 0.75, 600)
  );
  canvas.parent('sketch-canvas-container');
  
  // Initialize sketch
  background(0);
  
  // Set up event listeners for controls
  document.getElementById('speed-slider').addEventListener('input', function() {
    speed = this.value / 100;
  });
  
  document.getElementById('color-slider').addEventListener('input', function() {
    colorIntensity = this.value;
  });
  
  document.getElementById('reset-btn').addEventListener('click', resetSketch);
  document.getElementById('save-btn').addEventListener('click', function() {
    saveCanvas('nicola-rivosecchi-[SKETCH_NAME]', 'png');
  });
}

function draw() {
  // Main drawing code
  background(0, 10);
  
  // Example drawing code - replace with your own
  translate(width/2, height/2);
  
  for (let i = 0; i < 10; i++) {
    fill(
      colorIntensity * 2.55, 
      100, 
      200, 
      150
    );
    noStroke();
    
    let x = sin(frameCount * speed * 0.01 + i) * 100;
    let y = cos(frameCount * speed * 0.01 + i) * 100;
    
    ellipse(x, y, 20, 20);
  }
}

function resetSketch() {
  // Reset all variables and controls
  document.getElementById('speed-slider').value = 50;
  document.getElementById('color-slider').value = 75;
  speed = 0.5;
  colorIntensity = 75;
}

function windowResized() {
  // Resize canvas when window is resized
  const container = document.getElementById('sketch-canvas-container');
  resizeCanvas(
    container.offsetWidth, 
    min(container.offsetWidth * 0.75, 600)
  );
}

// Optional: Mouse interaction
function mouseDragged() {
  // Example interaction - modify based on your sketch's needs
  let mx = mouseX - width/2;
  let my = mouseY - height/2;
  
  fill(255, 100, 0, 150);
  ellipse(mx, my, 10, 10);
  
  return false; // Prevent default behavior
}