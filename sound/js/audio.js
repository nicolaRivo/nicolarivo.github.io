/**
 * Audio Processing for Nicola Rivo - Sound Designer Website
 * Using Tone.js for audio synthesis and processing
 */

// Global audio variables
let audioContext;
let analyser;
let dataArray;
let isAudioInitialized = false;
let isSoundPlaying = false;
let synth;
let soundEffects = {};

// Ambient background music settings
const ambientSettings = {
    scale: ['C3', 'D3', 'E3', 'G3', 'A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5'],
    bpm: 60,
    delayTime: '8n',
    feedback: 0.4,
    reverbDecay: 4
};

// Project-specific sound patterns
const projectSoundPatterns = {
    project1: { // Sci-fi theme
        notes: ['C4', 'G4', 'Bb4', 'F4', 'Eb4', 'C5'],
        synth: {
            oscillator: {
                type: 'sine4'
            },
            envelope: {
                attack: 0.1,
                decay: 0.2,
                sustain: 0.5,
                release: 2
            }
        },
        effects: ['reverb', 'delay', 'phaser']
    },
    project2: { // Fantasy theme
        notes: ['E3', 'G3', 'A3', 'B3', 'D4', 'E4'],
        synth: {
            oscillator: {
                type: 'triangle8'
            },
            envelope: {
                attack: 0.05,
                decay: 0.1,
                sustain: 0.7,
                release: 1.5
            }
        },
        effects: ['reverb', 'chorus']
    },
    project3: { // Urban theme
        notes: ['D3', 'A3', 'D4', 'F4', 'A4', 'C5'],
        synth: {
            oscillator: {
                type: 'square8'
            },
            envelope: {
                attack: 0.01,
                decay: 0.1,
                sustain: 0.4,
                release: 0.8
            }
        },
        effects: ['distortion', 'delay']
    },
    project4: { // Nature theme
        notes: ['G3', 'B3', 'D4', 'G4', 'A4', 'B4'],
        synth: {
            oscillator: {
                type: 'sine8'
            },
            envelope: {
                attack: 0.2,
                decay: 0.4,
                sustain: 0.8,
                release: 3
            }
        },
        effects: ['reverb', 'tremolo']
    },
    project5: { // Experimental theme
        notes: ['F#3', 'A3', 'C#4', 'F#4', 'A4', 'E5'],
        synth: {
            oscillator: {
                type: 'fmsine4'
            },
            envelope: {
                attack: 0.05,
                decay: 0.2,
                sustain: 0.6,
                release: 2
            }
        },
        effects: ['reverb', 'bitcrusher', 'phaser']
    },
    project6: { // Emotional theme
        notes: ['E3', 'B3', 'E4', 'G#4', 'B4', 'E5'],
        synth: {
            oscillator: {
                type: 'am8'
            },
            envelope: {
                attack: 0.1,
                decay: 0.3,
                sustain: 0.7,
                release: 2.5
            }
        },
        effects: ['reverb', 'chorus', 'delay']
    }
};

// Initialize audio system
function initializeAudio() {
    if (isAudioInitialized) {
        toggleSound();
        return;
    }

    // Start audio context
    Tone.start().then(() => {
        console.log('Audio context started');
        isAudioInitialized = true;
        
        // Create the main synth
        synth = new Tone.PolySynth(Tone.Synth).toDestination();
        
        // Setup effects
        soundEffects.reverb = new Tone.Reverb({
            decay: ambientSettings.reverbDecay,
            wet: 0.5
        }).toDestination();
        
        soundEffects.delay = new Tone.FeedbackDelay({
            delayTime: ambientSettings.delayTime,
            feedback: ambientSettings.feedback,
            wet: 0.3
        }).toDestination();
        
        soundEffects.chorus = new Tone.Chorus({
            frequency: 1.5,
            delayTime: 3.5,
            depth: 0.7,
            wet: 0.3
        }).toDestination();
        
        soundEffects.phaser = new Tone.Phaser({
            frequency: 0.5,
            octaves: 5,
            wet: 0.3
        }).toDestination();
        
        soundEffects.tremolo = new Tone.Tremolo({
            frequency: 3,
            depth: 0.8,
            wet: 0.3
        }).toDestination();
        
        soundEffects.distortion = new Tone.Distortion({
            distortion: 0.4,
            wet: 0.3
        }).toDestination();
        
        soundEffects.bitcrusher = new Tone.BitCrusher({
            bits: 4,
            wet: 0.3
        }).toDestination();
        
        // Connect to analyzer
        analyser = Tone.getContext().createAnalyser();
        analyser.fftSize = 256;
        Tone.Destination.connect(analyser);
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        // Start with ambient sound
        playAmbientSound();
        
        // Update the UI
        updateSoundTriggerUI();
        
        // Setup project sound triggers
        setupProjectSoundTriggers();
    }).catch(error => {
        console.error('Error starting audio context:', error);
    });
}

// Toggle ambient sound on/off
function toggleSound() {
    if (!isAudioInitialized) return;
    
    if (isSoundPlaying) {
        Tone.Transport.stop();
        isSoundPlaying = false;
    } else {
        playAmbientSound();
    }
    
    updateSoundTriggerUI();
}

// Play ambient background sound
function playAmbientSound() {
    // Stop any previous transport
    Tone.Transport.stop();
    
    // Set BPM
    Tone.Transport.bpm.value = ambientSettings.bpm;
    
    // Reset the synth
    synth.disconnect();
    synth.connect(soundEffects.reverb);
    synth.connect(soundEffects.delay);
    
    // Create a pattern of notes
    const sequence = new Tone.Pattern((time, note) => {
        synth.triggerAttackRelease(note, '8n', time);
    }, ambientSettings.scale, 'random');
    
    // Start the transport and pattern
    Tone.Transport.start();
    sequence.start(0);
    
    isSoundPlaying = true;
}

// Play project-specific sound
function playProjectSound(projectId) {
    if (!isAudioInitialized) {
        initializeAudio();
        setTimeout(() => playProjectSound(projectId), 500);
        return;
    }
    
    // Stop previous sounds
    Tone.Transport.stop();
    
    const projectSound = projectSoundPatterns[projectId];
    if (!projectSound) {
        console.error('No sound pattern found for project:', projectId);
        return;
    }
    
    // Configure synth
    synth.disconnect();
    synth.dispose();
    synth = new Tone.PolySynth(Tone.Synth, projectSound.synth).toDestination();
    
    // Connect effects
    projectSound.effects.forEach(effect => {
        if (soundEffects[effect]) {
            synth.connect(soundEffects[effect]);
        }
    });
    
    // Create a sequence with the project notes
    const sequence = new Tone.Sequence((time, note) => {
        synth.triggerAttackRelease(note, '4n', time);
    }, projectSound.notes, '4n');
    
    // Start the transport and sequence
    Tone.Transport.start();
    sequence.start(0);
    
    isSoundPlaying = true;
    updateSoundTriggerUI();
}

// Update the sound trigger UI based on current state
function updateSoundTriggerUI() {
    const soundTrigger = document.getElementById('sound-trigger');
    const audioWaves = soundTrigger.querySelectorAll('.audio-wave');
    
    if (isSoundPlaying) {
        audioWaves.forEach(wave => {
            wave.style.animationPlayState = 'running';
        });
    } else {
        audioWaves.forEach(wave => {
            wave.style.animationPlayState = 'paused';
            wave.style.height = '5px';
        });
    }
}

// Setup event listeners for sound triggers
function setupProjectSoundTriggers() {
    // Main sound toggle
    document.getElementById('sound-trigger').addEventListener('click', () => {
        initializeAudio();
    });
    
    // Project sound buttons
    document.querySelectorAll('.audio-play-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const projectId = this.getAttribute('data-project');
            playProjectSound(projectId);
            
            // Visual feedback
            const playIcon = this.querySelector('.play-icon');
            playIcon.style.borderColor = 'transparent transparent transparent var(--color-primary)';
            setTimeout(() => {
                playIcon.style.borderColor = 'transparent transparent transparent var(--color-text)';
            }, 300);
        });
    });
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up the sound trigger
    const soundTrigger = document.getElementById('sound-trigger');
    if (soundTrigger) {
        soundTrigger.addEventListener('click', initializeAudio);
    }
});