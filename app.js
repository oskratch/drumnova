// ===========================
// DRUM MACHINE - DrumNova
// ===========================

class DrumMachine {
    constructor() {
        this.channels = 8;
        this.steps = 16;
        this.currentStep = 0;
        this.isPlaying = false;
        this.bpm = 120;
        this.intervalId = null;
        
        // Block system
        this.totalBlocks = 1; // Can be 1, 2, 4, or 8
        this.currentBlock = 0; // Which block we're viewing/editing
        
        // Sequencer data: 3D array (blocks x channels x steps)
        this.sequence = this.createEmptySequence();
        
        // Sound mapping for each channel
        this.soundMap = ['kick', 'snare', 'hihat', 'clap', 'tom', 'perc', 'cymbal', 'fx'];
        
        // Mute state for each channel
        this.mutedChannels = [false, false, false, false, false, false, false, false];
        
        // Volume for each channel (0.0 to 1.0)
        this.channelVolumes = [0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7];
        
        // Audio context and buffers
        this.audioContext = null;
        this.audioBuffers = {};
        
        // Demo patterns (updated for 8 channels with BPM and sound selections)
        this.demoPatterns = {
            basic: {
                name: 'Rock Steady',
                bpm: 120,
                blocks: 1,
                soundSelections: [0, 0, 0, 0, 0, 0, 0, 0], // Index of sound for each channel (0 = first option)
                pattern: [
                    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], // Kick - steady 4/4
                    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], // Snare - backbeat
                    [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], // HiHat - 16th notes
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Clap
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Tom
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Perc
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Cymbal
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]  // FX
                ]
            },
            funk: {
                name: 'Funk Soul',
                bpm: 105,
                blocks: 1,
                soundSelections: [0, 1, 0, 0, 0, 1, 0, 0], // Using some vintage sounds
                pattern: [
                    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0], // Kick - syncopated
                    [0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0], // Snare - ghost notes
                    [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1], // HiHat - funky pattern
                    [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], // Clap - accent
                    [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0], // Tom - low fill
                    [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0], // Perc - cowbell
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Cymbal
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]  // FX
                ]
            },
            hiphop: {
                name: 'Boom Bap',
                bpm: 90,
                blocks: 1,
                soundSelections: [0, 3, 0, 0, 0, 0, 0, 0], // Tight snare
                pattern: [
                    [1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0], // Kick - boom bap
                    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], // Snare - tight
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // HiHat - fast
                    [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0], // Clap - layered
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Tom
                    [0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1], // Perc - shaker
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Cymbal
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]  // FX - scratch
                ]
            },
            techno: {
                name: 'Industrial Pulse',
                bpm: 135,
                blocks: 2,
                soundSelections: [2, 0, 0, 0, 0, 0, 0, 0], // Electro kick
                pattern: [
                    // Block 1 + 2 (32 steps)
                    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0, 1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
                    [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0, 0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0, 0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
                ]
            },
            bluemonday: {
                name: 'New Wave Icon',
                bpm: 128,
                blocks: 1,
                soundSelections: [3, 0, 0, 0, 0, 0, 0, 0], // Deep kick
                pattern: [
                    [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], // Kick - iconic pattern
                    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], // Snare - steady
                    [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], // HiHat - alternating
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Clap
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Tom
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Perc
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Cymbal
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]  // FX
                ]
            },
            house: {
                name: 'Four to the Floor',
                bpm: 124,
                blocks: 1,
                soundSelections: [0, 0, 1, 0, 0, 0, 0, 0], // Open hihat
                pattern: [
                    [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], // Kick - four to floor
                    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], // Snare - backbeat
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // HiHat - fast
                    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], // Clap - layered
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Tom
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Perc
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Cymbal
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]  // FX
                ]
            },
            build: {
                name: 'Tension Build',
                bpm: 130,
                blocks: 1,
                soundSelections: [0, 0, 1, 0, 0, 0, 0, 0],
                pattern: [
                    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], // Kick - steady
                    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], // Snare - basic
                    [0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1], // HiHat - build up
                    [0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0], // Clap - late entry
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Tom
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Perc
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Cymbal
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]  // FX
                ]
            },
            complex: {
                name: 'Poly Rhythm',
                bpm: 115,
                blocks: 1,
                soundSelections: [0, 0, 0, 2, 0, 0, 0, 0], // Echo clap
                pattern: [
                    [1,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0], // Kick - syncopated
                    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1], // Snare - ghost + accent
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // HiHat - full
                    [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0], // Clap - off-beats
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Tom
                    [0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1], // Perc - fast
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Cymbal
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]  // FX - intro
                ]
            }
        };
        
        this.init();
    }
    
    createEmptySequence() {
        // Create 8 blocks, each with 8 channels, each with 16 steps
        return Array(8).fill(null).map(() => 
            Array(this.channels).fill(null).map(() => 
                Array(this.steps).fill(false)
            )
        );
    }
    
    async init() {
        this.createGrid();
        this.populatePatternSelector();
        this.setupEventListeners();
        await this.initAudio();
    }
    
    // Populate pattern selector dropdown from demoPatterns
    populatePatternSelector() {
        const select = document.getElementById('patternSelect');
        select.innerHTML = '<option value="">-- Select Pattern --</option>';
        
        Object.keys(this.demoPatterns).forEach(key => {
            const pattern = this.demoPatterns[key];
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `${pattern.name} (${pattern.bpm} BPM)`;
            select.appendChild(option);
        });
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
        
        // Block buttons
        document.querySelectorAll('.block-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const blocks = parseInt(e.target.dataset.blocks);
                this.setTotalBlocks(blocks);
            });
        });
        
        // Block navigation
        document.getElementById('prevBlock').addEventListener('click', () => {
            if (this.currentBlock > 0) {
                this.currentBlock--;
                this.updateBlockDisplay();
            }
        });
        
        document.getElementById('nextBlock').addEventListener('click', () => {
            if (this.currentBlock < this.totalBlocks - 1) {
                this.currentBlock++;
                this.updateBlockDisplay();
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
        
        // Preview buttons
        document.querySelectorAll('.preview-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const channel = parseInt(e.target.dataset.channel);
                const selector = document.querySelector(`.sound-selector[data-channel="${channel}"]`);
                const soundName = selector.value;
                this.playSound(soundName, channel);
                
                // Visual feedback
                e.target.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    e.target.style.transform = 'scale(1)';
                }, 100);
            });
        });
        
        // Mute buttons
        document.querySelectorAll('.mute-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const channel = parseInt(e.target.dataset.channel);
                this.toggleMute(channel);
                
                // Update button appearance
                if (this.mutedChannels[channel]) {
                    e.target.classList.add('muted');
                    e.target.textContent = '🔇';
                } else {
                    e.target.classList.remove('muted');
                    e.target.textContent = '🔊';
                }
            });
        });
        
        // Initialize mute button states
        for (let i = 0; i < this.channels; i++) {
            this.updateMuteUI(i);
        }
        
        // Volume dials
        this.initVolumeDials();
    }
    
    initVolumeDials() {
        const dials = document.querySelectorAll('.volume-dial');
        
        dials.forEach(dial => {
            const channel = parseInt(dial.dataset.channel);
            const indicator = dial.querySelector('.dial-indicator');
            let isDragging = false;
            let startY = 0;
            let startVolume = 0;
            
            // Initialize dial rotation based on current volume
            this.updateDialRotation(channel);
            
            const onMouseDown = (e) => {
                isDragging = true;
                startY = e.clientY || e.touches[0].clientY;
                startVolume = this.channelVolumes[channel];
                e.preventDefault();
            };
            
            const onMouseMove = (e) => {
                if (!isDragging) return;
                
                const clientY = e.clientY || e.touches[0].clientY;
                const deltaY = startY - clientY; // Inverted: up = increase
                const volumeChange = deltaY / 100; // Sensitivity
                
                // Update volume (clamped between 0 and 1)
                this.channelVolumes[channel] = Math.max(0, Math.min(1, startVolume + volumeChange));
                this.updateDialRotation(channel);
                
                e.preventDefault();
            };
            
            const onMouseUp = () => {
                isDragging = false;
            };
            
            // Mouse events
            dial.addEventListener('mousedown', onMouseDown);
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            
            // Touch events
            dial.addEventListener('touchstart', onMouseDown);
            document.addEventListener('touchmove', onMouseMove);
            document.addEventListener('touchend', onMouseUp);
        });
    }
    
    updateDialRotation(channel) {
        const dial = document.querySelector(`.volume-dial[data-channel="${channel}"]`);
        if (!dial) return;
        
        const indicator = dial.querySelector('.dial-indicator');
        const volume = this.channelVolumes[channel];
        
        // Rotate from -135° (min) to +135° (max)
        const rotation = (volume * 270) - 135;
        indicator.style.transform = `rotate(${rotation}deg)`;
        
        // Update title to show percentage
        dial.title = `Volume: ${Math.round(volume * 100)}%`;
    }
    
    // Initialize Web Audio API
    async initAudio() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // List of sounds to generate (by default we will generate synthetic sounds)
        // The user will be able to replace them with their own files
        const sounds = [
            'kick', 'kick2', 'kick3', 'kick4', 'kick5',
            'snare', 'snare2', 'snare3', 'snare4', 'snare5',
            'hihat', 'hihat2', 'hihat3', 'hihat4', 'hihat5',
            'clap', 'clap2', 'clap3', 'clap4',
            'tom', 'tom2', 'tom3', 'tom4',
            'perc', 'perc2', 'perc3', 'perc4', 'perc5',
            'cymbal', 'cymbal2', 'cymbal3', 'cymbal4',
            'fx', 'fx2', 'fx3', 'fx4', 'fx5'
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
            const variants = { kick: 150, kick2: 100, kick3: 180, kick4: 120, kick5: 160 };
            frequency = variants[type] || 150;
            decay = 0.3;
        } else if (type.startsWith('snare')) {
            duration = 0.3;
            const variants = { snare: 200, snare2: 180, snare3: 220, snare4: 240, snare5: 190 };
            frequency = variants[type] || 200;
            decay = 0.2;
        } else if (type.startsWith('hihat')) {
            const variants = { hihat: 0.1, hihat2: 0.3, hihat3: 0.15, hihat4: 0.08, hihat5: 0.12 };
            duration = variants[type] || 0.1;
            frequency = 8000;
            decay = duration * 0.5;
        } else if (type.startsWith('clap')) {
            duration = 0.2;
            const variants = { clap: 1000, clap2: 800, clap3: 1200, clap4: 600, clap5: 1500 };
            frequency = variants[type] || 1000;
            decay = 0.15;
        } else if (type.startsWith('perc')) {
            const variants = {
                perc: { freq: 800, dur: 0.15, dec: 0.1 },     // Shaker
                perc2: { freq: 600, dur: 0.2, dec: 0.15 },    // Cowbell
                perc3: { freq: 300, dur: 0.3, dec: 0.2 },     // Conga
                perc4: { freq: 1200, dur: 0.1, dec: 0.08 },   // Woodblock
                perc5: { freq: 400, dur: 0.25, dec: 0.18 }    // Tambourine
            };
            const variant = variants[type] || variants.perc;
            duration = variant.dur;
            frequency = variant.freq;
            decay = variant.dec;
        } else if (type.startsWith('tom')) {
            duration = 0.4;
            const variants = { tom: 120, tom2: 180, tom3: 250, tom4: 150 };
            frequency = variants[type] || 150;
            decay = 0.25;
        } else if (type.startsWith('cymbal')) {
            duration = type === 'cymbal2' ? 1.5 : 0.8;
            frequency = 10000;
            decay = duration * 0.4;
        } else if (type.startsWith('fx')) {
            const variants = {
                fx: { freq: 800, dur: 0.4, dec: 0.3 },      // Laser sweep
                fx2: { freq: 150, dur: 0.8, dec: 0.6 },     // Deep sweep
                fx3: { freq: 1200, dur: 0.2, dec: 0.1 },    // Sharp stab
                fx4: { freq: 4000, dur: 0.1, dec: 0.05 },   // High noise
                fx5: { freq: 600, dur: 0.6, dec: 0.4 }      // Bell-like
            };
            const variant = variants[type] || variants.fx;
            duration = variant.dur;
            frequency = variant.freq;
            decay = variant.dec;
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
            } else if (type.startsWith('hihat') || type.startsWith('cymbal')) {
                data[i] = (Math.random() * 2 - 1) * envelope;
            } else if (type.startsWith('clap')) {
                // Multiple short bursts for clap effect with variations
                if (type === 'clap') {
                    // Sharp clap
                    const burst = Math.floor(t * 40) % 3 === 0 ? 1 : 0.3;
                    data[i] = (Math.random() * 2 - 1) * envelope * burst;
                } else if (type === 'clap2') {
                    // Room clap - more reverb-like
                    const burst = Math.floor(t * 30) % 4 === 0 ? 1 : 0.2;
                    data[i] = (Math.random() * 2 - 1) * envelope * burst;
                } else if (type === 'clap3') {
                    // Echo clap - delayed bursts
                    const burst1 = Math.floor(t * 50) % 5 === 0 ? 1 : 0;
                    const burst2 = Math.floor((t - 0.05) * 50) % 5 === 0 ? 0.5 : 0;
                    data[i] = (Math.random() * 2 - 1) * envelope * (burst1 + burst2);
                } else if (type === 'clap4') {
                    // Thick clap - layered
                    const burst = Math.floor(t * 35) % 4 === 0 ? 1 : 0.4;
                    const tone = Math.sin(2 * Math.PI * frequency * t) * 0.3;
                    data[i] = ((Math.random() * 2 - 1) * burst + tone) * envelope;
                } else if (type === 'clap5') {
                    // Vintage clap - filtered
                    const burst = Math.floor(t * 45) % 3 === 0 ? 1 : 0.5;
                    const filter = Math.exp(-t * 30);
                    data[i] = (Math.random() * 2 - 1) * envelope * burst * filter;
                } else {
                    const burst = Math.floor(t * 40) % 3 === 0 ? 1 : 0.3;
                    data[i] = (Math.random() * 2 - 1) * envelope * burst;
                }
            } else if (type.startsWith('perc')) {
                if (type === 'perc') {
                    // Shaker - fast repeating clicks
                    const click = Math.floor(t * 60) % 2 === 0 ? 1 : 0;
                    data[i] = (Math.random() * 2 - 1) * envelope * click;
                } else if (type === 'perc2') {
                    // Cowbell - metallic tone
                    const tone1 = Math.sin(2 * Math.PI * frequency * t);
                    const tone2 = Math.sin(2 * Math.PI * frequency * 1.8 * t) * 0.5;
                    data[i] = (tone1 + tone2) * envelope;
                } else if (type === 'perc3') {
                    // Conga - low drum-like
                    const freqSweep = frequency * Math.exp(-t * 5);
                    data[i] = Math.sin(2 * Math.PI * freqSweep * t) * envelope;
                } else if (type === 'perc4') {
                    // Woodblock - sharp attack
                    const attack = Math.exp(-t * 50);
                    data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * attack;
                } else if (type === 'perc5') {
                    // Tambourine - jingling
                    const jingle1 = Math.sin(2 * Math.PI * frequency * t);
                    const jingle2 = Math.sin(2 * Math.PI * frequency * 1.3 * t) * 0.7;
                    const jingle3 = Math.sin(2 * Math.PI * frequency * 1.6 * t) * 0.5;
                    data[i] = (jingle1 + jingle2 + jingle3) * envelope * 0.3;
                } else {
                    data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope;
                }
            } else if (type.startsWith('tom')) {
                const freqSweep = frequency * Math.exp(-t * 8);
                data[i] = Math.sin(2 * Math.PI * freqSweep * t) * envelope;
            } else if (type.startsWith('fx')) {
                if (type === 'fx') {
                    // Laser sweep - frequency sweep up
                    const freqSweep = frequency * (1 + t * 8);
                    data[i] = Math.sin(2 * Math.PI * freqSweep * t) * envelope;
                } else if (type === 'fx2') {
                    // Deep sweep - frequency sweep down
                    const freqSweep = frequency * Math.exp(-t * 2);
                    data[i] = Math.sin(2 * Math.PI * freqSweep * t) * envelope;
                } else if (type === 'fx3') {
                    // Sharp stab - short noise burst
                    data[i] = (Math.random() * 2 - 1) * envelope * Math.exp(-t * 20);
                } else if (type === 'fx4') {
                    // High noise - filtered noise
                    const noise = (Math.random() * 2 - 1) * envelope;
                    const filter = Math.exp(-t * 50); // High frequency filter
                    data[i] = noise * filter;
                } else if (type === 'fx5') {
                    // Bell-like - harmonic series
                    let sample = 0;
                    for (let h = 1; h <= 5; h++) {
                        sample += Math.sin(2 * Math.PI * frequency * h * t) / h;
                    }
                    data[i] = sample * envelope * 0.2;
                } else {
                    const modulation = Math.sin(2 * Math.PI * 10 * t);
                    data[i] = Math.sin(2 * Math.PI * frequency * t * (1 + modulation * 0.5)) * envelope;
                }
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
    playSound(soundName, channel = null) {
        if (!this.audioBuffers[soundName]) {
            console.warn(`Sound not found: ${soundName}`);
            return;
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffers[soundName];
        
        const gainNode = this.audioContext.createGain();
        
        // Apply channel volume if specified, otherwise use default
        if (channel !== null && this.channelVolumes[channel] !== undefined) {
            gainNode.gain.value = this.channelVolumes[channel];
        } else {
            gainNode.gain.value = 0.7;
        }
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        source.start(0);
    }
    
    // Toggle mute state for a channel
    toggleMute(channel) {
        this.mutedChannels[channel] = !this.mutedChannels[channel];
        this.updateMuteUI(channel);
    }
    
    // Toggle pad state
    togglePad(channel, step) {
        this.sequence[this.currentBlock][channel][step] = !this.sequence[this.currentBlock][channel][step];
        this.updatePadUI(channel, step);
    }
    
    // Update pad visual state
    updatePadUI(channel, step) {
        const pad = document.querySelector(`[data-channel="${channel}"][data-step="${step}"]`);
        if (this.sequence[this.currentBlock][channel][step]) {
            pad.classList.add('active');
        } else {
            pad.classList.remove('active');
        }
    }
    
    // Update mute button visual state
    updateMuteUI(channel) {
        const muteBtn = document.querySelector(`[data-channel="${channel}"].mute-btn`);
        if (this.mutedChannels[channel]) {
            muteBtn.classList.add('muted');
            muteBtn.textContent = '🔇';
        } else {
            muteBtn.classList.remove('muted');
            muteBtn.textContent = '🔊';
        }
    }
    
    // Set total blocks
    setTotalBlocks(blocks) {
        this.totalBlocks = blocks;
        
        // Update UI
        document.querySelectorAll('.block-btn').forEach(btn => {
            if (parseInt(btn.dataset.blocks) === blocks) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Reset to first block if current is out of range
        if (this.currentBlock >= this.totalBlocks) {
            this.currentBlock = 0;
            this.updateBlockDisplay();
        } else {
            this.updateBlockIndicator();
        }
    }
    
    // Update block display (reload grid with current block data)
    updateBlockDisplay() {
        // Reload all pad states from current block
        for (let channel = 0; channel < this.channels; channel++) {
            for (let step = 0; step < this.steps; step++) {
                this.updatePadUI(channel, step);
            }
        }
        this.updateBlockIndicator();
    }
    
    // Update block indicator text and navigation buttons
    updateBlockIndicator() {
        document.getElementById('blockIndicator').textContent = `Block ${this.currentBlock + 1}/${this.totalBlocks}`;
        document.getElementById('prevBlock').disabled = this.currentBlock === 0;
        document.getElementById('nextBlock').disabled = this.currentBlock === this.totalBlocks - 1;
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
            this.currentStep++;
            
            // Calculate total steps (blocks * steps per block)
            const totalSteps = this.totalBlocks * this.steps;
            if (this.currentStep >= totalSteps) {
                this.currentStep = 0;
            }
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
        // Calculate which block and which step within that block
        const blockIndex = Math.floor(this.currentStep / this.steps);
        const stepInBlock = this.currentStep % this.steps;
        
        // Only show visual feedback if we're viewing the currently playing block
        const shouldShowVisual = blockIndex === this.currentBlock;
        
        // Clear previous playing indicators (only in current view)
        if (shouldShowVisual) {
            this.clearPlayingIndicators();
        }
        
        // Play sounds and highlight active pads
        for (let channel = 0; channel < this.channels; channel++) {
            // Check if this step is active in the current playing block
            if (this.sequence[blockIndex][channel][stepInBlock] && !this.mutedChannels[channel]) {
                const soundName = this.soundMap[channel];
                this.playSound(soundName, channel);
                
                // Only show visual feedback if viewing the playing block
                if (shouldShowVisual) {
                    const pad = document.querySelector(`[data-channel="${channel}"][data-step="${stepInBlock}"]`);
                    if (pad) {
                        pad.classList.add('playing');
                    }
                }
            } else if (shouldShowVisual) {
                // Show current step even if not active (visual feedback)
                const pad = document.querySelector(`[data-channel="${channel}"][data-step="${stepInBlock}"]`);
                if (pad) {
                    pad.style.opacity = '0.7';
                    setTimeout(() => {
                        pad.style.opacity = '1';
                    }, 50);
                }
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
        // Clear only the current block or all blocks?
        // Let's clear only current block for now
        this.sequence[this.currentBlock] = Array(this.channels).fill(null).map(() => Array(this.steps).fill(false));
        document.querySelectorAll('.pad').forEach(pad => {
            pad.classList.remove('active');
        });
    }
    
    // Load demo pattern
    loadDemoPattern(patternKey) {
        const pattern = this.demoPatterns[patternKey];
        if (!pattern) return;

        // Apply BPM from pattern
        if (pattern.bpm) {
            this.bpm = pattern.bpm;
            document.getElementById('bpmValue').textContent = this.bpm;
            document.getElementById('bpmSlider').value = this.bpm;
        }

        // Apply sound selections for each channel
        if (pattern.soundSelections) {
            pattern.soundSelections.forEach((soundIndex, channel) => {
                const selector = document.querySelectorAll('.sound-selector')[channel];
                if (selector) {
                    selector.selectedIndex = soundIndex;
                }
            });
        }

        // Set block count to pattern's requirement
        if (pattern.blocks && pattern.blocks !== this.totalBlocks) {
            this.setTotalBlocks(pattern.blocks);
        }

        // Clear all active blocks
        for (let blockIndex = 0; blockIndex < this.totalBlocks; blockIndex++) {
            this.sequence[blockIndex] = Array(this.channels).fill(null).map(() => Array(this.steps).fill(false));
        }

        // Calculate how many blocks this pattern spans
        const patternSteps = pattern.pattern[0].length; // Assume all channels have same length
        const blocksNeeded = Math.ceil(patternSteps / this.steps);

        // Load pattern across blocks
        for (let blockIndex = 0; blockIndex < this.totalBlocks; blockIndex++) {
            const startStep = blockIndex * this.steps;
            const endStep = Math.min(startStep + this.steps, patternSteps);

            for (let channel = 0; channel < this.channels; channel++) {
                for (let step = 0; step < this.steps; step++) {
                    const patternStep = startStep + step;
                    if (patternStep < patternSteps) {
                        this.sequence[blockIndex][channel][step] = pattern.pattern[channel][patternStep] === 1;
                    } else {
                        this.sequence[blockIndex][channel][step] = false; // Fill remaining with false
                    }
                }
            }
        }

        // Update UI for current block
        this.updateBlockDisplay();

        console.log(`Loaded pattern "${pattern.name}" at ${pattern.bpm} BPM (${patternSteps} steps, ${pattern.blocks} blocks)`);
    }
    
    // Export pattern (for future save functionality)
    exportPattern() {
        return {
            name: 'Custom Pattern',
            bpm: this.bpm,
            totalBlocks: this.totalBlocks,
            soundMap: [...this.soundMap],
            // Only export active blocks
            pattern: this.sequence.slice(0, this.totalBlocks).map(block =>
                block.map(channel => channel.map(step => step ? 1 : 0))
            )
        };
    }
    
    // Import pattern (for future load functionality)
    importPattern(patternData) {
        if (patternData.bpm) {
            this.bpm = patternData.bpm;
            document.getElementById('bpmSlider').value = this.bpm;
            document.getElementById('bpmValue').textContent = this.bpm;
        }
        
        if (patternData.totalBlocks) {
            this.setTotalBlocks(patternData.totalBlocks);
        }
        
        if (patternData.soundMap) {
            this.soundMap = [...patternData.soundMap];
            // Update selectors
            document.querySelectorAll('.sound-selector').forEach((selector, index) => {
                selector.value = this.soundMap[index];
            });
        }
        
        if (patternData.pattern) {
            // Import all blocks from pattern
            for (let blockIndex = 0; blockIndex < patternData.pattern.length; blockIndex++) {
                for (let channel = 0; channel < this.channels; channel++) {
                    for (let step = 0; step < this.steps; step++) {
                        this.sequence[blockIndex][channel][step] = patternData.pattern[blockIndex][channel][step] === 1;
                    }
                }
            }
            // Update display
            this.updateBlockDisplay();
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
