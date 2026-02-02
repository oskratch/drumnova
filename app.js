// ===========================
// DRUM MACHINE - DrumNova
// ===========================

class DrumMachine {
    constructor() {
        this.channels = 4;
        this.steps = 16;
        this.currentStep = 0;
        this.isPlaying = false;
        this.bpm = 120;
        this.intervalId = null;
        
        // Sequencer data: array of arrays (channels x steps)
        this.sequence = Array(this.channels).fill(null).map(() => Array(this.steps).fill(false));
        
        // Sound mapping for each channel
        this.soundMap = ['kick', 'snare', 'hihat', 'perc'];
        
        // Audio context and buffers
        this.audioContext = null;
        this.audioBuffers = {};
        
        // Demo patterns
        this.demoPatterns = {
            basic: {
                name: 'Basic Rock',
                pattern: [
                    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], // Kick
                    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], // Snare
                    [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], // HiHat
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]  // Perc
                ]
            },
            funk: {
                name: 'Funk Groove',
                pattern: [
                    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0], // Kick
                    [0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0], // Snare
                    [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1], // HiHat
                    [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0]  // Perc
                ]
            },
            hiphop: {
                name: 'Hip Hop',
                pattern: [
                    [1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0], // Kick
                    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], // Snare
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // HiHat
                    [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0]  // Perc
                ]
            },
            techno: {
                name: 'Techno',
                pattern: [
                    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], // Kick
                    [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], // Snare
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // HiHat
                    [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0]  // Perc
                ]
            }
        };
        
        this.init();
    }
    
    async init() {
        this.createGrid();
        this.setupEventListeners();
        await this.initAudio();
    }
    
    // Create the sequencer grid
    createGrid() {
        const grid = document.getElementById('sequencerGrid');
        grid.innerHTML = '';
        
        for (let channel = 0; channel < this.channels; channel++) {
            const row = document.createElement('div');
            row.className = 'channel-row';
            
            for (let step = 0; step < this.steps; step++) {
                const pad = document.createElement('button');
                pad.className = 'pad';
                pad.dataset.channel = channel;
                pad.dataset.step = step;
                
                pad.addEventListener('click', () => this.togglePad(channel, step));
                
                row.appendChild(pad);
            }
            
            grid.appendChild(row);
        }
    }
    
    // Setup event listeners
    setupEventListeners() {
        // Play button
        document.getElementById('playBtn').addEventListener('click', () => {
            if (this.isPlaying) {
                this.pause();
            } else {
                this.play();
            }
        });
        
        // Stop button
        document.getElementById('stopBtn').addEventListener('click', () => this.stop());
        
        // Clear button
        document.getElementById('clearBtn').addEventListener('click', () => this.clearPattern());
        
        // BPM slider
        const bpmSlider = document.getElementById('bpmSlider');
        bpmSlider.addEventListener('input', (e) => {
            this.bpm = parseInt(e.target.value);
            document.getElementById('bpmValue').textContent = this.bpm;
            
            if (this.isPlaying) {
                this.stop();
                this.play();
            }
        });
        
        // Pattern selector
        document.getElementById('loadPattern').addEventListener('click', () => {
            const patternKey = document.getElementById('patternSelect').value;
            if (patternKey && this.demoPatterns[patternKey]) {
                this.loadDemoPattern(patternKey);
            }
        });
        
        // Sound selectors
        document.querySelectorAll('.sound-selector').forEach(selector => {
            selector.addEventListener('change', (e) => {
                const channel = parseInt(e.target.dataset.channel);
                this.soundMap[channel] = e.target.value;
            });
        });
    }
    
    // Initialize Web Audio API
    async initAudio() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Lista de sons a generar (per defecte generarem sons sintètics)
        // L'usuari podrà substituir-los pels seus propis fitxers
        const sounds = [
            'kick', 'kick2', 'kick3',
            'snare', 'snare2', 'snare3',
            'hihat', 'hihat2', 'hihat3',
            'perc', 'perc2', 'perc3'
        ];
        
        // Generar sons sintètics de mostra
        for (const sound of sounds) {
            this.audioBuffers[sound] = this.createSyntheticSound(sound);
        }
        
        console.log('Audio system initialized. Ready to load custom sounds.');
    }
    
    // Create synthetic sounds (placeholder - users can replace with their own samples)
    createSyntheticSound(type) {
        const sampleRate = this.audioContext.sampleRate;
        let duration, frequency, decay;
        
        // Diferents paràmetres segons el tipus de so
        if (type.startsWith('kick')) {
            duration = 0.5;
            frequency = type === 'kick' ? 150 : (type === 'kick2' ? 100 : 180);
            decay = 0.3;
        } else if (type.startsWith('snare')) {
            duration = 0.3;
            frequency = type === 'snare' ? 200 : (type === 'snare2' ? 180 : 220);
            decay = 0.2;
        } else if (type.startsWith('hihat')) {
            duration = type === 'hihat2' ? 0.3 : 0.1;
            frequency = 8000;
            decay = type === 'hihat2' ? 0.2 : 0.05;
        } else {
            duration = 0.2;
            frequency = 800;
            decay = 0.15;
        }
        
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t / decay);
            
            if (type.startsWith('kick')) {
                const freqSweep = frequency * Math.exp(-t * 15);
                data[i] = Math.sin(2 * Math.PI * freqSweep * t) * envelope;
            } else if (type.startsWith('snare')) {
                const noise = (Math.random() * 2 - 1) * 0.5;
                const tone = Math.sin(2 * Math.PI * frequency * t) * 0.5;
                data[i] = (noise + tone) * envelope;
            } else if (type.startsWith('hihat')) {
                data[i] = (Math.random() * 2 - 1) * envelope;
            } else {
                data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope;
            }
        }
        
        return buffer;
    }
    
    // Load custom sound file (for user's sound library)
    async loadSoundFile(soundName, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.audioBuffers[soundName] = audioBuffer;
            console.log(`Loaded sound: ${soundName}`);
            return true;
        } catch (error) {
            console.error(`Error loading sound ${soundName}:`, error);
            return false;
        }
    }
    
    // Play a sound
    playSound(soundName) {
        if (!this.audioBuffers[soundName]) {
            console.warn(`Sound not found: ${soundName}`);
            return;
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffers[soundName];
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 0.7;
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        source.start(0);
    }
    
    // Toggle pad state
    togglePad(channel, step) {
        this.sequence[channel][step] = !this.sequence[channel][step];
        this.updatePadUI(channel, step);
    }
    
    // Update pad visual state
    updatePadUI(channel, step) {
        const pad = document.querySelector(`[data-channel="${channel}"][data-step="${step}"]`);
        if (this.sequence[channel][step]) {
            pad.classList.add('active');
        } else {
            pad.classList.remove('active');
        }
    }
    
    // Play sequence
    play() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.isPlaying = true;
        document.getElementById('playBtn').textContent = '⏸ Pause';
        document.getElementById('playBtn').classList.add('playing');
        
        const stepDuration = (60 / this.bpm) * 1000 / 4; // 16th notes
        
        this.intervalId = setInterval(() => {
            this.processStep();
            this.currentStep = (this.currentStep + 1) % this.steps;
        }, stepDuration);
    }
    
    // Pause sequence
    pause() {
        this.isPlaying = false;
        document.getElementById('playBtn').textContent = '▶ Play';
        document.getElementById('playBtn').classList.remove('playing');
        clearInterval(this.intervalId);
        this.clearPlayingIndicators();
    }
    
    // Stop sequence
    stop() {
        this.pause();
        this.currentStep = 0;
    }
    
    // Process current step
    processStep() {
        // Clear previous playing indicators
        this.clearPlayingIndicators();
        
        // Play sounds and highlight active pads
        for (let channel = 0; channel < this.channels; channel++) {
            const pad = document.querySelector(`[data-channel="${channel}"][data-step="${this.currentStep}"]`);
            
            if (this.sequence[channel][this.currentStep]) {
                const soundName = this.soundMap[channel];
                this.playSound(soundName);
                pad.classList.add('playing');
            } else {
                // Show current step even if not active
                pad.style.opacity = '0.7';
                setTimeout(() => {
                    pad.style.opacity = '1';
                }, 50);
            }
        }
    }
    
    // Clear playing indicators
    clearPlayingIndicators() {
        document.querySelectorAll('.pad.playing').forEach(pad => {
            pad.classList.remove('playing');
        });
    }
    
    // Clear pattern
    clearPattern() {
        this.sequence = Array(this.channels).fill(null).map(() => Array(this.steps).fill(false));
        document.querySelectorAll('.pad').forEach(pad => {
            pad.classList.remove('active');
        });
    }
    
    // Load demo pattern
    loadDemoPattern(patternKey) {
        const pattern = this.demoPatterns[patternKey];
        if (!pattern) return;
        
        this.clearPattern();
        
        for (let channel = 0; channel < this.channels; channel++) {
            for (let step = 0; step < this.steps; step++) {
                this.sequence[channel][step] = pattern.pattern[channel][step] === 1;
                this.updatePadUI(channel, step);
            }
        }
        
        console.log(`Loaded pattern: ${pattern.name}`);
    }
    
    // Export pattern (for future save functionality)
    exportPattern() {
        return {
            name: 'Custom Pattern',
            bpm: this.bpm,
            soundMap: [...this.soundMap],
            pattern: this.sequence.map(channel => channel.map(step => step ? 1 : 0))
        };
    }
    
    // Import pattern (for future load functionality)
    importPattern(patternData) {
        if (patternData.bpm) {
            this.bpm = patternData.bpm;
            document.getElementById('bpmSlider').value = this.bpm;
            document.getElementById('bpmValue').textContent = this.bpm;
        }
        
        if (patternData.soundMap) {
            this.soundMap = [...patternData.soundMap];
            // Update selectors
            document.querySelectorAll('.sound-selector').forEach((selector, index) => {
                selector.value = this.soundMap[index];
            });
        }
        
        if (patternData.pattern) {
            this.clearPattern();
            for (let channel = 0; channel < this.channels; channel++) {
                for (let step = 0; step < this.steps; step++) {
                    this.sequence[channel][step] = patternData.pattern[channel][step] === 1;
                    this.updatePadUI(channel, step);
                }
            }
        }
    }
}

// Initialize drum machine when page loads
let drumMachine;

window.addEventListener('DOMContentLoaded', () => {
    drumMachine = new DrumMachine();
    
    // Export to window for debugging and future extensions
    window.drumMachine = drumMachine;
    
    console.log('DrumNova initialized!');
    console.log('Use drumMachine.loadSoundFile(name, url) to load custom sounds');
    console.log('Use drumMachine.exportPattern() to save your pattern');
    console.log('Use drumMachine.importPattern(data) to load a pattern');
});

// ===========================
// UTILITY FUNCTIONS FOR SOUND LIBRARY INTEGRATION
// ===========================

// Function to load multiple sounds from a library
async function loadSoundLibrary(sounds) {
    const promises = sounds.map(sound => 
        drumMachine.loadSoundFile(sound.name, sound.url)
    );
    
    const results = await Promise.all(promises);
    const loaded = results.filter(r => r).length;
    console.log(`Loaded ${loaded}/${sounds.length} sounds`);
    return results;
}

// Example usage:
// const mySounds = [
//     { name: 'kick', url: 'sounds/kick.wav' },
//     { name: 'snare', url: 'sounds/snare.wav' },
//     { name: 'hihat', url: 'sounds/hihat.wav' },
//     { name: 'perc', url: 'sounds/perc.wav' }
// ];
// loadSoundLibrary(mySounds);
