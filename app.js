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
        this.currentBlock = 0; // Which block we're viewing/editing (start of visible range)
        this.visibleBlocks = 2; // How many blocks to show at once (1, 2, or 4)
        
        // Sequencer data: 3D array (blocks x channels x steps)
        this.sequence = this.createEmptySequence();
        
        // Sound mapping for each channel
        this.soundMap = ['kick', 'snare', 'hihat', 'clap', 'tom', 'perc', 'cymbal', 'fx'];
        
        // Mute state for each channel
        this.mutedChannels = [false, false, false, false, false, false, false, false];
        
        // Volume for each channel (0.0 to 1.0)
        this.channelVolumes = [0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7];
        
        // Swing amount (0-75%, affects offbeat timing)
        this.swing = 0;
        
        // Audio context and buffers
        this.audioContext = null;
        this.audioBuffers = {};
        this.masterCompressor = null; // Master bus compressor
        this.reverbNode = null; // Reverb convolver
        this.reverbGain = null; // Reverb send amount
        this.dryGain = null; // Dry signal
        this.reverbSend = 0; // 0-100%
        
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
        
        // Note: init() is called explicitly after construction with await
    }
    
    createEmptySequence() {
        // Create 8 blocks, each with 8 channels, each with 16 steps
        // Each step is now an object: {active: boolean, velocity: number (0.3-1.0)}
        return Array(8).fill(null).map(() => 
            Array(this.channels).fill(null).map(() => 
                Array(this.steps).fill(null).map(() => ({
                    active: false,
                    velocity: 0.7 // default (normal)
                }))
            )
        );
    }
    
    async init() {
        this.setupMobileModal();
        this.createGrid();
        this.populatePatternSelector();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
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
        
        const totalVisibleSteps = this.steps * this.visibleBlocks;
        
        // Update step indicators
        const stepNumbers = document.querySelector('.step-numbers');
        if (stepNumbers) {
            stepNumbers.innerHTML = '';
            stepNumbers.style.gridTemplateColumns = `repeat(${totalVisibleSteps}, 1fr)`;
            for (let i = 1; i <= totalVisibleSteps; i++) {
                const span = document.createElement('span');
                span.textContent = i;
                stepNumbers.appendChild(span);
            }
        }
        
        for (let channel = 0; channel < this.channels; channel++) {
            const row = document.createElement('div');
            row.className = 'channel-row';
            row.style.gridTemplateColumns = `repeat(${totalVisibleSteps}, 1fr)`;
            
            for (let step = 0; step < totalVisibleSteps; step++) {
                const pad = document.createElement('button');
                pad.className = 'pad';
                pad.dataset.channel = channel;
                pad.dataset.step = step;
                
                // Add block separator class every 16 steps
                if (step > 0 && step % 16 === 0) {
                    pad.classList.add('block-separator');
                }
                
                pad.addEventListener('click', (e) => this.togglePad(channel, step, e));
                
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
        
        // Swing slider
        const swingSlider = document.getElementById('swingSlider');
        swingSlider.addEventListener('input', (e) => {
            this.swing = parseInt(e.target.value);
            document.getElementById('swingValue').textContent = this.swing;
        });
        
        // Block buttons
        document.querySelectorAll('.block-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const blocks = parseInt(e.target.dataset.blocks);
                this.setTotalBlocks(blocks);
            });
        });
        
        // View buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = parseInt(e.target.dataset.view);
                this.setVisibleBlocks(view);
                
                // Update active state
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
        
        // Block navigation
        document.getElementById('prevBlock').addEventListener('click', () => {
            if (this.currentBlock > 0) {
                this.currentBlock = Math.max(0, this.currentBlock - this.visibleBlocks);
                this.updateBlockDisplay();
            }
        });
        
        document.getElementById('nextBlock').addEventListener('click', () => {
            if (this.currentBlock + this.visibleBlocks < this.totalBlocks) {
                this.currentBlock = Math.min(this.totalBlocks - this.visibleBlocks, this.currentBlock + this.visibleBlocks);
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
        
        // Save pattern to file
        document.getElementById('savePattern').addEventListener('click', () => {
            this.savePatternToFile();
        });
        
        // Load pattern from file
        document.getElementById('loadFile').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        
        document.getElementById('fileInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadPatternFromFile(file);
                e.target.value = ''; // Reset input
            }
        });
        
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                
                // Remove active from all tabs and content
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                // Add active to clicked tab and corresponding content
                e.target.classList.add('active');
                document.getElementById(`tab-${tabId}`).classList.add('active');
            });
        });
        
        // Reverb slider
        const reverbSlider = document.getElementById('reverbSend');
        reverbSlider.addEventListener('input', (e) => {
            this.reverbSend = parseInt(e.target.value);
            document.getElementById('reverbValue').textContent = this.reverbSend;
            
            // Update reverb/dry mix (equal power crossfade)
            const wetGain = this.reverbSend / 100;
            const dryGain = 1 - (wetGain * 0.5); // Reduce dry less aggressively
            
            this.reverbGain.gain.setValueAtTime(wetGain * 0.8, this.audioContext.currentTime);
            this.dryGain.gain.setValueAtTime(dryGain, this.audioContext.currentTime);
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
    
    // Keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in an input/select
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
            
            switch(e.key.toLowerCase()) {
                case ' ': // Space - Play/Pause
                    e.preventDefault();
                    if (this.isPlaying) {
                        this.pause();
                    } else {
                        this.play();
                    }
                    break;
                    
                case 'escape': // ESC - Stop
                    e.preventDefault();
                    this.stop();
                    break;
                    
                case 'c': // C - Clear (with Ctrl/Cmd)
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.clearPattern();
                    }
                    break;
                    
                case 'arrowleft': // Left arrow - Previous block
                    e.preventDefault();
                    if (this.currentBlock > 0) {
                        this.currentBlock = Math.max(0, this.currentBlock - this.visibleBlocks);
                        this.updateBlockDisplay();
                    }
                    break;
                    
                case 'arrowright': // Right arrow - Next block
                    e.preventDefault();
                    if (this.currentBlock + this.visibleBlocks < this.totalBlocks) {
                        this.currentBlock = Math.min(this.totalBlocks - this.visibleBlocks, this.currentBlock + this.visibleBlocks);
                        this.updateBlockDisplay();
                    }
                    break;
                    
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                    // Mute channels 1-8
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        const channel = parseInt(e.key) - 1;
                        this.toggleMute(channel);
                        const muteBtn = document.querySelector(`[data-channel="${channel}"].mute-btn`);
                        if (muteBtn) {
                            if (this.mutedChannels[channel]) {
                                muteBtn.classList.add('muted');
                                muteBtn.textContent = '🔇';
                            } else {
                                muteBtn.classList.remove('muted');
                                muteBtn.textContent = '🔊';
                            }
                        }
                    }
                    break;
            }
        });
    }
    
    setupMobileModal() {
        const modal = document.getElementById('channelModal');
        if (!modal) {
            console.warn('Channel modal not found');
            return;
        }
        
        const modalClose = modal.querySelector('.modal-close');
        const modalPreviewBtn = document.getElementById('modalPreviewBtn');
        const modalMuteBtn = document.getElementById('modalMuteBtn');
        const modalVolumeSlider = document.getElementById('modalVolumeSlider');
        const modalVolumeValue = document.getElementById('modalVolumeValue');
        const modalSoundSelector = document.getElementById('modalSoundSelector');
        const modalChannelName = document.getElementById('modalChannelName');
        
        let currentModalChannel = null;
        
        // Sound options for each channel (same as HTML)
        const soundOptions = {
            0: [ // Kick
                { value: 'kick', label: 'Kick 808' },
                { value: 'kick2', label: 'Kick Vintage' },
                { value: 'kick3', label: 'Kick Electro' },
                { value: 'kick4', label: 'Kick Deep' },
                { value: 'kick5', label: 'Kick Punchy' }
            ],
            1: [ // Snare
                { value: 'snare', label: 'Snare 808' },
                { value: 'snare2', label: 'Snare Vintage' },
                { value: 'snare3', label: 'Snare Clap' },
                { value: 'snare4', label: 'Snare Tight' },
                { value: 'snare5', label: 'Snare Rimshot' }
            ],
            2: [ // HiHat
                { value: 'hihat', label: 'HiHat Closed' },
                { value: 'hihat2', label: 'HiHat Open' },
                { value: 'hihat3', label: 'HiHat Pedal' },
                { value: 'hihat4', label: 'HiHat Brush' },
                { value: 'hihat5', label: 'HiHat 909' }
            ],
            3: [ // Clap
                { value: 'clap', label: 'Clap Sharp' },
                { value: 'clap2', label: 'Clap Room' },
                { value: 'clap3', label: 'Clap Echo' },
                { value: 'clap4', label: 'Clap Thick' },
                { value: 'clap5', label: 'Clap Vintage' }
            ],
            4: [ // Tom
                { value: 'tom', label: 'Tom Low' },
                { value: 'tom2', label: 'Tom Mid' },
                { value: 'tom3', label: 'Tom High' },
                { value: 'tom4', label: 'Tom Floor' }
            ],
            5: [ // Perc
                { value: 'perc', label: 'Perc Shaker' },
                { value: 'perc2', label: 'Perc Cowbell' },
                { value: 'perc3', label: 'Perc Conga' },
                { value: 'perc4', label: 'Perc Woodblock' },
                { value: 'perc5', label: 'Perc Tambourine' }
            ],
            6: [ // Cymbal
                { value: 'cymbal', label: 'Cymbal Crash' },
                { value: 'cymbal2', label: 'Cymbal Ride' },
                { value: 'cymbal3', label: 'Cymbal China' },
                { value: 'cymbal4', label: 'Cymbal Splash' }
            ],
            7: [ // FX
                { value: 'fx', label: 'FX Laser' },
                { value: 'fx2', label: 'FX Sweep' },
                { value: 'fx3', label: 'FX Stab' },
                { value: 'fx4', label: 'FX Noise' },
                { value: 'fx5', label: 'FX Bell' }
            ]
        };
        
        const channelNames = ['Kick', 'Snare', 'HiHat', 'Clap', 'Tom', 'Perc', 'Cymbal', 'FX'];
        
        // Function to open modal for a specific channel
        const openModalForChannel = (channel) => {
            currentModalChannel = channel;
            
            // Set modal title
            modalChannelName.textContent = channelNames[channel];
            
            // Populate sound selector
            modalSoundSelector.innerHTML = '';
            soundOptions[channel].forEach(option => {
                const opt = document.createElement('option');
                opt.value = option.value;
                opt.textContent = option.label;
                if (this.soundMap[channel] === option.value) {
                    opt.selected = true;
                }
                modalSoundSelector.appendChild(opt);
            });
            
            // Set mute button state
            if (this.mutedChannels[channel]) {
                modalMuteBtn.classList.add('muted');
                modalMuteBtn.textContent = '🔇';
            } else {
                modalMuteBtn.classList.remove('muted');
                modalMuteBtn.textContent = '🔊';
            }
            
            // Set volume slider
            const volumePercent = Math.round(this.channelVolumes[channel] * 100);
            modalVolumeSlider.value = volumePercent;
            modalVolumeValue.textContent = volumePercent + '%';
            
            // Show modal
            modal.classList.add('active');
        };
        
        // Open modal when mobile channel button is clicked
        const mobileButtons = document.querySelectorAll('.mobile-channel-btn');
        mobileButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const channel = parseInt(e.target.dataset.channel);
                openModalForChannel(channel);
            });
        });
        
        // Open modal when mobile settings button is clicked (legacy channel-labels buttons)
        document.querySelectorAll('.mobile-settings-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const channel = parseInt(e.target.dataset.channel);
                currentModalChannel = channel;
                
                // Set modal title
                modalChannelName.textContent = channelNames[channel];
                
                // Populate sound selector
                modalSoundSelector.innerHTML = '';
                soundOptions[channel].forEach(option => {
                    const opt = document.createElement('option');
                    opt.value = option.value;
                    opt.textContent = option.label;
                    if (this.soundMap[channel] === option.value) {
                        opt.selected = true;
                    }
                    modalSoundSelector.appendChild(opt);
                });
                
                // Set mute button state
                if (this.mutedChannels[channel]) {
                    modalMuteBtn.classList.add('muted');
                    modalMuteBtn.textContent = '🔇';
                } else {
                    modalMuteBtn.classList.remove('muted');
                    modalMuteBtn.textContent = '🔊';
                }
                
                // Set volume slider
                const volumePercent = Math.round(this.channelVolumes[channel] * 100);
                modalVolumeSlider.value = volumePercent;
                modalVolumeValue.textContent = volumePercent + '%';
                
                // Show modal
                modal.classList.add('active');
            });
        });
        
        // Close modal
        const closeModal = () => {
            modal.classList.remove('active');
            currentModalChannel = null;
        };
        
        modalClose.addEventListener('click', closeModal);
        
        // Close when clicking outside modal content
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Preview button
        modalPreviewBtn.addEventListener('click', () => {
            if (currentModalChannel !== null) {
                const soundName = this.soundMap[currentModalChannel];
                this.playSound(soundName, currentModalChannel);
            }
        });
        
        // Mute button
        modalMuteBtn.addEventListener('click', () => {
            if (currentModalChannel !== null) {
                this.toggleMute(currentModalChannel);
                
                // Update modal button
                if (this.mutedChannels[currentModalChannel]) {
                    modalMuteBtn.classList.add('muted');
                    modalMuteBtn.textContent = '🔇';
                } else {
                    modalMuteBtn.classList.remove('muted');
                    modalMuteBtn.textContent = '🔊';
                }
            }
        });
        
        // Volume slider
        modalVolumeSlider.addEventListener('input', (e) => {
            if (currentModalChannel !== null) {
                const volume = parseInt(e.target.value) / 100;
                this.channelVolumes[currentModalChannel] = volume;
                modalVolumeValue.textContent = e.target.value + '%';
                this.updateDialRotation(currentModalChannel);
            }
        });
        
        // Sound selector
        modalSoundSelector.addEventListener('change', (e) => {
            if (currentModalChannel !== null) {
                this.soundMap[currentModalChannel] = e.target.value;
                
                // Update desktop selector too
                const desktopSelector = document.querySelector(`.sound-selector[data-channel="${currentModalChannel}"]`);
                if (desktopSelector) {
                    desktopSelector.value = e.target.value;
                }
            }
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
        
        // Create master compressor for better sound cohesion and punch
        this.masterCompressor = this.audioContext.createDynamicsCompressor();
        this.masterCompressor.threshold.setValueAtTime(-24, this.audioContext.currentTime); // dB
        this.masterCompressor.knee.setValueAtTime(6, this.audioContext.currentTime);
        this.masterCompressor.ratio.setValueAtTime(4, this.audioContext.currentTime); // 4:1 compression
        this.masterCompressor.attack.setValueAtTime(0.003, this.audioContext.currentTime); // 3ms - fast attack for transients
        this.masterCompressor.release.setValueAtTime(0.05, this.audioContext.currentTime); // 50ms - quick release
        this.masterCompressor.connect(this.audioContext.destination);
        
        // Create reverb (convolution reverb with synthetic impulse response)
        this.reverbNode = this.audioContext.createConvolver();
        this.reverbNode.buffer = this.createReverbImpulse(2, this.audioContext.sampleRate, false); // 2 seconds duration
        
        // Create dry/wet gain nodes
        this.dryGain = this.audioContext.createGain();
        this.reverbGain = this.audioContext.createGain();
        this.reverbGain.gain.value = 0; // Start with 0% reverb
        this.dryGain.gain.value = 1; // Start with 100% dry
        
        // Connect reverb chain: reverb -> reverbGain -> compressor
        this.reverbNode.connect(this.reverbGain);
        this.reverbGain.connect(this.masterCompressor);
        
        // Dry signal goes straight to compressor
        this.dryGain.connect(this.masterCompressor);
        
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
    
    // Create reverb impulse response (synthetic room reverb)
    createReverbImpulse(duration, sampleRate, reverse) {
        const length = sampleRate * duration;
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);
        const impulseL = impulse.getChannelData(0);
        const impulseR = impulse.getChannelData(1);
        
        // Parameters for realistic room reverb
        const preDelay = 0.02; // 20ms pre-delay
        const preDelaySamples = Math.floor(sampleRate * preDelay);
        
        // Early reflections pattern (simulating wall bounces)
        const earlyReflections = [
            { time: 0.005, gain: 0.6 },
            { time: 0.012, gain: 0.5 },
            { time: 0.019, gain: 0.45 },
            { time: 0.026, gain: 0.4 },
            { time: 0.034, gain: 0.35 },
            { time: 0.041, gain: 0.3 },
            { time: 0.053, gain: 0.25 },
            { time: 0.068, gain: 0.2 }
        ];
        
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            let sampleL = 0;
            let sampleR = 0;
            
            // Skip pre-delay period
            if (i < preDelaySamples) {
                impulseL[i] = 0;
                impulseR[i] = 0;
                continue;
            }
            
            // Early reflections (first 80ms)
            if (t < 0.08) {
                for (let ref of earlyReflections) {
                    const refSample = Math.floor(ref.time * sampleRate);
                    if (Math.abs(i - refSample) < 3) {
                        const gaussian = Math.exp(-Math.pow((i - refSample) / 2, 2));
                        sampleL += (Math.random() * 2 - 1) * ref.gain * gaussian;
                        sampleR += (Math.random() * 2 - 1) * ref.gain * gaussian * 0.85;
                    }
                }
            }
            
            // Dense reverb tail
            if (t > 0.04) {
                // Multiple decay rates for more natural sound
                const fastDecay = Math.exp(-4 * (t - 0.04) / duration);
                const slowDecay = Math.exp(-2 * (t - 0.04) / duration);
                const midDecay = Math.exp(-3 * (t - 0.04) / duration);
                
                // High frequency damping (rooms absorb highs more)
                const hfDamping = Math.exp(-5 * t / duration);
                
                // Dense diffusion (many small reflections)
                const density = 0.6; // Probability of reflection
                if (Math.random() < density) {
                    const baseNoise = (Math.random() * 2 - 1);
                    
                    // Mix different decay curves for complexity
                    const reverbSample = baseNoise * (
                        0.5 * fastDecay * hfDamping +  // High frequencies decay fast
                        0.3 * midDecay +                // Mid frequencies
                        0.2 * slowDecay                 // Low frequencies linger
                    );
                    
                    sampleL += reverbSample;
                    sampleR += reverbSample * (0.9 + Math.random() * 0.2); // Slightly decorrelated
                }
            }
            
            impulseL[i] = sampleL * 0.3;
            impulseR[i] = sampleR * 0.3;
        }
        
        return impulse;
    }
    
    // Create synthetic sounds (placeholder - users can replace with their own samples)
    createSyntheticSound(type) {
        const sampleRate = this.audioContext.sampleRate;
        let duration, frequency, decay;
        
        // Diferents paràmetres segons el tipus de so
        if (type.startsWith('kick')) {
            duration = 0.5;
            const variants = { 
                kick: { freq: 60, decay: 0.5, pitchDecay: 18 },     // 808-style deep
                kick2: { freq: 80, decay: 0.35, pitchDecay: 25 },   // Punchy
                kick3: { freq: 50, decay: 0.6, pitchDecay: 15 },    // Sub bass
                kick4: { freq: 70, decay: 0.4, pitchDecay: 20 },    // Balanced
                kick5: { freq: 90, decay: 0.3, pitchDecay: 30 }     // Tight
            };
            const variant = variants[type] || variants.kick;
            frequency = variant.freq;
            decay = variant.decay;
        } else if (type.startsWith('snare')) {
            duration = 0.25;
            const variants = { 
                snare: { tone: 200, noise: 0.7, toneMix: 0.3, decay: 0.18, snap: 0.015 },      // 808 tight
                snare2: { tone: 180, noise: 0.65, toneMix: 0.35, decay: 0.22, snap: 0.02 },    // Fat
                snare3: { tone: 250, noise: 0.75, toneMix: 0.25, decay: 0.15, snap: 0.01 },    // Crisp
                snare4: { tone: 150, noise: 0.6, toneMix: 0.4, decay: 0.25, snap: 0.025 },     // Deep
                snare5: { tone: 220, noise: 0.8, toneMix: 0.2, decay: 0.12, snap: 0.008 }      // Sharp
            };
            const variant = variants[type] || variants.snare;
            frequency = variant.tone;
            decay = variant.decay;
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
                // Get variant-specific parameters
                const variants = { 
                    kick: { freq: 60, decay: 0.5, pitchDecay: 18 },
                    kick2: { freq: 80, decay: 0.35, pitchDecay: 25 },
                    kick3: { freq: 50, decay: 0.6, pitchDecay: 15 },
                    kick4: { freq: 70, decay: 0.4, pitchDecay: 20 },
                    kick5: { freq: 90, decay: 0.3, pitchDecay: 30 }
                };
                const variant = variants[type] || variants.kick;
                
                // Pitch envelope for punch (starts high, drops fast)
                const pitchEnv = Math.exp(-t * variant.pitchDecay);
                const freqSweep = variant.freq * (1 + pitchEnv * 2);
                
                // Click attack for punch
                const clickEnv = Math.exp(-t * 150);
                const click = (Math.random() * 2 - 1) * clickEnv * 0.3;
                
                // Main sine wave
                const sine = Math.sin(2 * Math.PI * freqSweep * t);
                
                // Sub harmonics for depth
                const sub = Math.sin(2 * Math.PI * freqSweep * 0.5 * t) * 0.5;
                
                data[i] = (sine + sub + click) * envelope * 0.8;
                
            } else if (type.startsWith('snare')) {
                // Get variant-specific parameters
                const variants = { 
                    snare: { tone: 200, noise: 0.7, toneMix: 0.3, decay: 0.18, snap: 0.015 },
                    snare2: { tone: 180, noise: 0.65, toneMix: 0.35, decay: 0.22, snap: 0.02 },
                    snare3: { tone: 250, noise: 0.75, toneMix: 0.25, decay: 0.15, snap: 0.01 },
                    snare4: { tone: 150, noise: 0.6, toneMix: 0.4, decay: 0.25, snap: 0.025 },
                    snare5: { tone: 220, noise: 0.8, toneMix: 0.2, decay: 0.12, snap: 0.008 }
                };
                const variant = variants[type] || variants.snare;
                
                // Noise component (white noise filtered)
                const noise = (Math.random() * 2 - 1);
                const noiseEnv = Math.exp(-t / variant.decay);
                
                // Tonal component with pitch envelope (808-style)
                const pitchEnv = Math.exp(-t * 40);
                const toneFreq = variant.tone * (1 + pitchEnv * 1.5);
                const tone1 = Math.sin(2 * Math.PI * toneFreq * t);
                const tone2 = Math.sin(2 * Math.PI * toneFreq * 1.6 * t) * 0.5; // Harmonic
                const toneEnv = Math.exp(-t / (variant.decay * 1.2));
                
                // Snap/click attack
                const snapEnv = Math.exp(-t / variant.snap);
                const snap = (Math.random() * 2 - 1) * snapEnv * 0.4;
                
                // Mix components
                const noisePart = noise * noiseEnv * variant.noise;
                const tonePart = (tone1 + tone2) * toneEnv * variant.toneMix;
                
                data[i] = (noisePart + tonePart + snap) * 0.8;
                
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
    playSound(soundName, channel = null, swingDelay = 0, velocity = 0.7) {
        if (!this.audioBuffers[soundName]) {
            console.warn(`Sound not found: ${soundName}`);
            return;
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffers[soundName];
        
        const gainNode = this.audioContext.createGain();
        
        // Apply channel volume and velocity
        let baseGain = 0.7;
        if (channel !== null && this.channelVolumes[channel] !== undefined) {
            baseGain = this.channelVolumes[channel];
        }
        
        // Multiply by velocity for dynamic range
        gainNode.gain.value = baseGain * velocity;
        
        // Connect to both dry and reverb paths
        source.connect(gainNode);
        gainNode.connect(this.dryGain); // Dry signal
        gainNode.connect(this.reverbNode); // Wet signal through reverb
        
        // Start with swing delay (in seconds)
        const startTime = this.audioContext.currentTime + swingDelay;
        source.start(startTime);
    }
    
    // Toggle mute state for a channel
    toggleMute(channel) {
        this.mutedChannels[channel] = !this.mutedChannels[channel];
        this.updateMuteUI(channel);
    }
    
    // Toggle pad state
    togglePad(channel, visualStep, event) {
        // Calculate which block and step within block
        const blockOffset = Math.floor(visualStep / this.steps);
        const blockIndex = this.currentBlock + blockOffset;
        const stepWithinBlock = visualStep % this.steps;
        
        const step = this.sequence[blockIndex][channel][stepWithinBlock];
        
        // Determine velocity based on modifier keys
        let velocity = 0.7; // Normal (default)
        if (event && event.shiftKey) {
            velocity = 1.0; // Accent (loud)
        } else if (event && event.altKey) {
            velocity = 0.3; // Ghost note (quiet)
        }
        
        // Toggle the step or change velocity if already active
        if (step.active && event && (event.shiftKey || event.altKey)) {
            // If already active, change velocity
            step.velocity = velocity;
        } else {
            // Toggle active state
            step.active = !step.active;
            if (step.active) {
                step.velocity = velocity;
            }
        }
        
        this.updatePadUI(channel, visualStep, blockIndex, stepWithinBlock);
    }
    
    // Update pad visual state
    updatePadUI(channel, visualStep, blockIndex, stepWithinBlock) {
        const pad = document.querySelector(`[data-channel="${channel}"][data-step="${visualStep}"]`);
        const step = this.sequence[blockIndex][channel][stepWithinBlock];
        
        if (step.active) {
            pad.classList.add('active');
            
            // Add velocity classes for visual feedback
            pad.classList.remove('velocity-normal', 'velocity-accent', 'velocity-ghost');
            if (step.velocity >= 0.9) {
                pad.classList.add('velocity-accent');
            } else if (step.velocity <= 0.4) {
                pad.classList.add('velocity-ghost');
            } else {
                pad.classList.add('velocity-normal');
            }
        } else {
            pad.classList.remove('active', 'velocity-normal', 'velocity-accent', 'velocity-ghost');
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
    
    // Set visible blocks
    setVisibleBlocks(view) {
        this.visibleBlocks = Math.min(view, this.totalBlocks);
        
        // Reset to valid position if current is out of range
        if (this.currentBlock + this.visibleBlocks > this.totalBlocks) {
            this.currentBlock = Math.max(0, this.totalBlocks - this.visibleBlocks);
        }
        
        // Recreate grid with new visible blocks
        this.createGrid();
        this.updateBlockDisplay();
    }
    
    // Update block display (reload grid with current block data)
    updateBlockDisplay() {
        // Reload all pad states from visible blocks
        for (let channel = 0; channel < this.channels; channel++) {
            for (let visualStep = 0; visualStep < this.steps * this.visibleBlocks; visualStep++) {
                const blockOffset = Math.floor(visualStep / this.steps);
                const blockIndex = this.currentBlock + blockOffset;
                const stepWithinBlock = visualStep % this.steps;
                
                if (blockIndex < this.totalBlocks) {
                    this.updatePadUI(channel, visualStep, blockIndex, stepWithinBlock);
                }
            }
        }
        this.updateBlockIndicator();
    }
    
    // Update block indicator text and navigation buttons
    updateBlockIndicator() {
        const endBlock = Math.min(this.currentBlock + this.visibleBlocks, this.totalBlocks);
        document.getElementById('blockIndicator').textContent = `Blocks ${this.currentBlock + 1}-${endBlock}/${this.totalBlocks}`;
        document.getElementById('prevBlock').disabled = this.currentBlock === 0;
        document.getElementById('nextBlock').disabled = this.currentBlock + this.visibleBlocks >= this.totalBlocks;
    }
    
    // Play sequence
    async play() {
        // Guard against multiple simultaneous calls
        if (this.isPlaying) {
            return;
        }
        
        // Set isPlaying FIRST to prevent double-triggering
        this.isPlaying = true;
        document.getElementById('playBtn').textContent = '⏸ Pause';
        document.getElementById('playBtn').classList.add('playing');
        
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        
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
        
        // Calculate swing delay for offbeat steps (odd steps: 1, 3, 5, 7...)
        let swingDelay = 0;
        if (stepInBlock % 2 === 1 && this.swing > 0) {
            // Convert swing percentage to delay in seconds
            // Base step duration is 1/4 of a beat (16th note)
            const sixteenthNoteDuration = (60 / this.bpm) / 4;
            // Swing percentage (0-75%) determines how much to delay
            swingDelay = (this.swing / 100) * sixteenthNoteDuration;
        }
        
        // Only show visual feedback if we're viewing the currently playing block
        const shouldShowVisual = blockIndex >= this.currentBlock && blockIndex < this.currentBlock + this.visibleBlocks;
        
        // Clear previous playing indicators (only in current view)
        if (shouldShowVisual) {
            this.clearPlayingIndicators();
        }
        
        // Play sounds and highlight active pads
        for (let channel = 0; channel < this.channels; channel++) {
            const step = this.sequence[blockIndex][channel][stepInBlock];
            
            // Check if this step is active in the current playing block
            if (step.active && !this.mutedChannels[channel]) {
                const soundName = this.soundMap[channel];
                this.playSound(soundName, channel, swingDelay, step.velocity);
                
                // Only show visual feedback if viewing the playing block
                if (shouldShowVisual) {
                    const visualStep = (blockIndex - this.currentBlock) * this.steps + stepInBlock;
                    const pad = document.querySelector(`[data-channel="${channel}"][data-step="${visualStep}"]`);
                    if (pad) {
                        pad.classList.add('playing');
                    }
                }
            } else if (shouldShowVisual) {
                // Show current step even if not active (visual feedback)
                const visualStep = (blockIndex - this.currentBlock) * this.steps + stepInBlock;
                const pad = document.querySelector(`[data-channel="${channel}"][data-step="${visualStep}"]`);
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
        // Clear visible blocks
        for (let i = 0; i < this.visibleBlocks; i++) {
            const blockIndex = this.currentBlock + i;
            if (blockIndex < this.totalBlocks) {
                this.sequence[blockIndex] = Array(this.channels).fill(null).map(() => 
                    Array(this.steps).fill(null).map(() => ({
                        active: false,
                        velocity: 0.7
                    }))
                );
            }
        }
        document.querySelectorAll('.pad').forEach(pad => {
            pad.classList.remove('active', 'velocity-normal', 'velocity-accent', 'velocity-ghost');
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
            this.sequence[blockIndex] = Array(this.channels).fill(null).map(() => 
                Array(this.steps).fill(null).map(() => ({
                    active: false,
                    velocity: 0.7
                }))
            );
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
                        this.sequence[blockIndex][channel][step].active = pattern.pattern[channel][patternStep] === 1;
                        this.sequence[blockIndex][channel][step].velocity = 0.7; // Default velocity for demos
                    } else {
                        this.sequence[blockIndex][channel][step].active = false;
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
            swing: this.swing,
            reverbSend: this.reverbSend,
            totalBlocks: this.totalBlocks,
            soundMap: [...this.soundMap],
            channelVolumes: [...this.channelVolumes],
            mutedChannels: [...this.mutedChannels],
            // Only export active blocks with velocity data
            pattern: this.sequence.slice(0, this.totalBlocks).map(block =>
                block.map(channel => channel.map(step => ({
                    active: step.active,
                    velocity: step.velocity
                })))
            )
        };
    }
    
    // Save pattern to file
    savePatternToFile() {
        const pattern = this.exportPattern();
        const timestamp = new Date().toISOString().slice(0,19).replace(/:/g,'-');
        const filename = `drumnova-pattern-${timestamp}.json`;
        
        const json = JSON.stringify(pattern, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
        console.log(`Pattern saved as ${filename}`);
    }
    
    // Load pattern from file
    loadPatternFromFile(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const patternData = JSON.parse(e.target.result);
                this.importPattern(patternData);
                console.log(`Pattern loaded from ${file.name}`);
            } catch (error) {
                console.error('Error loading pattern:', error);
                alert('Invalid pattern file. Please select a valid DrumNova pattern.');
            }
        };
        
        reader.readAsText(file);
    }
    
    // Import pattern (for future load functionality)
    importPattern(patternData) {
        if (patternData.bpm) {
            this.bpm = patternData.bpm;
            document.getElementById('bpmSlider').value = this.bpm;
            document.getElementById('bpmValue').textContent = this.bpm;
        }
        
        if (patternData.swing !== undefined) {
            this.swing = patternData.swing;
            document.getElementById('swingSlider').value = this.swing;
            document.getElementById('swingValue').textContent = this.swing;
        }
        
        if (patternData.reverbSend !== undefined) {
            this.reverbSend = patternData.reverbSend;
            document.getElementById('reverbSend').value = this.reverbSend;
            document.getElementById('reverbValue').textContent = this.reverbSend;
            
            // Update reverb/dry mix
            const wetGain = this.reverbSend / 100;
            const dryGain = 1 - (wetGain * 0.5);
            this.reverbGain.gain.setValueAtTime(wetGain * 0.8, this.audioContext.currentTime);
            this.dryGain.gain.setValueAtTime(dryGain, this.audioContext.currentTime);
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
        
        if (patternData.channelVolumes) {
            this.channelVolumes = [...patternData.channelVolumes];
            // Update volume dials
            for (let i = 0; i < this.channels; i++) {
                this.updateDialRotation(i);
            }
        }
        
        if (patternData.mutedChannels) {
            this.mutedChannels = [...patternData.mutedChannels];
            // Update mute buttons
            for (let i = 0; i < this.channels; i++) {
                this.updateMuteUI(i);
            }
        }
        
        if (patternData.pattern) {
            // Import all blocks from pattern
            for (let blockIndex = 0; blockIndex < patternData.pattern.length; blockIndex++) {
                for (let channel = 0; channel < this.channels; channel++) {
                    for (let step = 0; step < this.steps; step++) {
                        const stepData = patternData.pattern[blockIndex][channel][step];
                        
                        // Support both old format (boolean/number) and new format (object)
                        if (typeof stepData === 'object' && stepData !== null) {
                            this.sequence[blockIndex][channel][step] = {
                                active: stepData.active || false,
                                velocity: stepData.velocity || 0.7
                            };
                        } else {
                            // Legacy format: 1/0 or true/false
                            this.sequence[blockIndex][channel][step] = {
                                active: stepData === 1 || stepData === true,
                                velocity: 0.7
                            };
                        }
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

window.addEventListener('DOMContentLoaded', async () => {
    drumMachine = new DrumMachine();
    await drumMachine.init();
    
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
