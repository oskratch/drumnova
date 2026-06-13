class DrumMachine {
    constructor() {
        this.channels = 8;
        this.steps = 16;
        this.currentStep = 0;
        this.isPlaying = false;
        this.bpm = 120;
        this.intervalId = null;

        this.totalBlocks = 1;
        this.currentBlock = 0;
        this.visibleBlocks = 2;

        this.sequence = this.createEmptySequence();

        this.soundMap = ['kick', 'snare', 'hihat', 'clap', 'tom', 'perc', 'cymbal', 'fx'];
        this.mutedChannels = [false, false, false, false, false, false, false, false];
        this.channelVolumes = [0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7];
        this.swing = 0;

        this.audioContext = null;
        this.audioBuffers = {};
        this.masterCompressor = null;
        this.saturation = null;
        this.reverbNode = null;
        this.reverbGain = null;
        this.dryGain = null;
        this.reverbSend = 0;

        this.demoPatterns = demoPatterns;
    }

    createEmptySequence() {
        return Array(8).fill(null).map(() =>
            Array(this.channels).fill(null).map(() =>
                Array(this.steps).fill(null).map(() => ({ active: false, velocity: 0.7 }))
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

    createGrid() {
        const grid = document.getElementById('sequencerGrid');
        grid.innerHTML = '';

        const totalVisibleSteps = this.steps * this.visibleBlocks;

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
                if (step > 0 && step % 16 === 0) pad.classList.add('block-separator');
                pad.addEventListener('click', (e) => this.togglePad(channel, step, e));
                row.appendChild(pad);
            }
            grid.appendChild(row);
        }
    }

    setupEventListeners() {
        document.getElementById('playBtn').addEventListener('click', () => {
            if (this.isPlaying) this.pause(); else this.play();
        });

        document.getElementById('stopBtn').addEventListener('click', () => this.stop());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearPattern());

        const bpmSlider = document.getElementById('bpmSlider');
        bpmSlider.addEventListener('input', (e) => {
            this.bpm = parseInt(e.target.value);
            document.getElementById('bpmValue').textContent = this.bpm;
            if (this.isPlaying) { this.stop(); this.play(); }
        });

        const swingSlider = document.getElementById('swingSlider');
        swingSlider.addEventListener('input', (e) => {
            this.swing = parseInt(e.target.value);
            document.getElementById('swingValue').textContent = this.swing;
        });

        document.querySelectorAll('.block-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setTotalBlocks(parseInt(e.target.dataset.blocks)));
        });

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = parseInt(e.target.dataset.view);
                this.setVisibleBlocks(view);
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

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

        document.getElementById('loadPattern').addEventListener('click', () => {
            const key = document.getElementById('patternSelect').value;
            if (key && this.demoPatterns[key]) this.loadDemoPattern(key);
        });

        document.getElementById('savePattern').addEventListener('click', () => this.savePatternToFile());

        document.getElementById('loadFile').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('fileInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) { this.loadPatternFromFile(file); e.target.value = ''; }
        });

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById(`tab-${tabId}`).classList.add('active');
            });
        });

        const reverbSlider = document.getElementById('reverbSend');
        reverbSlider.addEventListener('input', (e) => {
            this.reverbSend = parseInt(e.target.value);
            document.getElementById('reverbValue').textContent = this.reverbSend;
            const wetGain = this.reverbSend / 100;
            const dryGain = 1 - (wetGain * 0.5);
            this.reverbGain.gain.setValueAtTime(wetGain * 0.8, this.audioContext.currentTime);
            this.dryGain.gain.setValueAtTime(dryGain, this.audioContext.currentTime);
        });

        document.querySelectorAll('.sound-selector').forEach(selector => {
            selector.addEventListener('change', (e) => {
                const channel = parseInt(e.target.dataset.channel);
                this.soundMap[channel] = e.target.value;
            });
        });

        document.querySelectorAll('.preview-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const channel = parseInt(e.target.dataset.channel);
                const selector = document.querySelector(`.sound-selector[data-channel="${channel}"]`);
                this.playSound(selector.value, channel);
                e.target.style.transform = 'scale(0.9)';
                setTimeout(() => { e.target.style.transform = 'scale(1)'; }, 100);
            });
        });

        document.querySelectorAll('.mute-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const channel = parseInt(e.target.dataset.channel);
                this.toggleMute(channel);
                if (this.mutedChannels[channel]) {
                    e.target.classList.add('muted');
                    e.target.textContent = '\u{1F507}';
                } else {
                    e.target.classList.remove('muted');
                    e.target.textContent = '\u{1F50A}';
                }
            });
        });

        for (let i = 0; i < this.channels; i++) this.updateMuteUI(i);

        this.initVolumeDials();
    }

    initVolumeDials() {
        document.querySelectorAll('.volume-dial').forEach(dial => {
            const channel = parseInt(dial.dataset.channel);
            let isDragging = false, startY = 0, startVolume = 0;
            this.updateDialRotation(channel);

            const onStart = (e) => {
                isDragging = true;
                startY = e.clientY || e.touches[0].clientY;
                startVolume = this.channelVolumes[channel];
                e.preventDefault();
            };
            const onMove = (e) => {
                if (!isDragging) return;
                const clientY = e.clientY || e.touches[0].clientY;
                const volumeChange = (startY - clientY) / 100;
                this.channelVolumes[channel] = Math.max(0, Math.min(1, startVolume + volumeChange));
                this.updateDialRotation(channel);
                e.preventDefault();
            };
            const onEnd = () => { isDragging = false; };

            dial.addEventListener('mousedown', onStart);
            dial.addEventListener('touchstart', onStart);
            document.addEventListener('mousemove', onMove);
            document.addEventListener('touchmove', onMove);
            document.addEventListener('mouseup', onEnd);
            document.addEventListener('touchend', onEnd);
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

            switch (e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault();
                    if (this.isPlaying) this.pause(); else this.play();
                    break;
                case 'escape':
                    e.preventDefault();
                    this.stop();
                    break;
                case 'c':
                    if (e.ctrlKey || e.metaKey) { e.preventDefault(); this.clearPattern(); }
                    break;
                case 'arrowleft':
                    e.preventDefault();
                    if (this.currentBlock > 0) {
                        this.currentBlock = Math.max(0, this.currentBlock - this.visibleBlocks);
                        this.updateBlockDisplay();
                    }
                    break;
                case 'arrowright':
                    e.preventDefault();
                    if (this.currentBlock + this.visibleBlocks < this.totalBlocks) {
                        this.currentBlock = Math.min(this.totalBlocks - this.visibleBlocks, this.currentBlock + this.visibleBlocks);
                        this.updateBlockDisplay();
                    }
                    break;
                case '1': case '2': case '3': case '4':
                case '5': case '6': case '7': case '8':
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        const channel = parseInt(e.key) - 1;
                        this.toggleMute(channel);
                        const muteBtn = document.querySelector(`[data-channel="${channel}"].mute-btn`);
                        if (muteBtn) {
                            if (this.mutedChannels[channel]) {
                                muteBtn.classList.add('muted');
                                muteBtn.textContent = '\u{1F507}';
                            } else {
                                muteBtn.classList.remove('muted');
                                muteBtn.textContent = '\u{1F50A}';
                            }
                        }
                    }
                    break;
            }
        });
    }

    setupMobileModal() {
        const modal = document.getElementById('channelModal');
        if (!modal) { console.warn('Channel modal not found'); return; }

        const modalClose = modal.querySelector('.modal-close');
        const modalPreviewBtn = document.getElementById('modalPreviewBtn');
        const modalMuteBtn = document.getElementById('modalMuteBtn');
        const modalVolumeSlider = document.getElementById('modalVolumeSlider');
        const modalVolumeValue = document.getElementById('modalVolumeValue');
        const modalSoundSelector = document.getElementById('modalSoundSelector');
        const modalChannelName = document.getElementById('modalChannelName');

        let currentModalChannel = null;

        const soundOptions = {
            0: [
                { value: 'kick',  label: 'Kick 808' },  { value: 'kick2', label: 'Kick Vintage' },
                { value: 'kick3', label: 'Kick Electro'},{ value: 'kick4', label: 'Kick Deep' },
                { value: 'kick5', label: 'Kick Punchy' }
            ],
            1: [
                { value: 'snare',  label: 'Snare 808' }, { value: 'snare2', label: 'Snare Vintage' },
                { value: 'snare3', label: 'Snare Clap' },{ value: 'snare4', label: 'Snare Tight' },
                { value: 'snare5', label: 'Snare Rimshot' }
            ],
            2: [
                { value: 'hihat',  label: 'HiHat Closed'},{ value: 'hihat2', label: 'HiHat Open' },
                { value: 'hihat3', label: 'HiHat Pedal' },{ value: 'hihat4', label: 'HiHat Brush' },
                { value: 'hihat5', label: 'HiHat 909' }
            ],
            3: [
                { value: 'clap',  label: 'Clap Sharp' }, { value: 'clap2', label: 'Clap Room' },
                { value: 'clap3', label: 'Clap Echo' },  { value: 'clap4', label: 'Clap Thick' },
                { value: 'clap5', label: 'Clap Vintage' }
            ],
            4: [
                { value: 'tom',  label: 'Tom Low' },  { value: 'tom2', label: 'Tom Mid' },
                { value: 'tom3', label: 'Tom High' }, { value: 'tom4', label: 'Tom Floor' }
            ],
            5: [
                { value: 'perc',  label: 'Perc Shaker' },  { value: 'perc2', label: 'Perc Cowbell' },
                { value: 'perc3', label: 'Perc Conga' },   { value: 'perc4', label: 'Perc Woodblock' },
                { value: 'perc5', label: 'Perc Tambourine'}
            ],
            6: [
                { value: 'cymbal',  label: 'Cymbal Crash' },{ value: 'cymbal2', label: 'Cymbal Ride' },
                { value: 'cymbal3', label: 'Cymbal China' },{ value: 'cymbal4', label: 'Cymbal Splash'}
            ],
            7: [
                { value: 'fx',  label: 'FX Laser' }, { value: 'fx2', label: 'FX Sweep' },
                { value: 'fx3', label: 'FX Stab' },  { value: 'fx4', label: 'FX Zap' },
                { value: 'fx5', label: 'FX Bell' }
            ]
        };

        const channelNames = ['Kick', 'Snare', 'HiHat', 'Clap', 'Tom', 'Perc', 'Cymbal', 'FX'];

        const openModal = (channel) => {
            currentModalChannel = channel;
            modalChannelName.textContent = channelNames[channel];

            modalSoundSelector.innerHTML = '';
            soundOptions[channel].forEach(opt => {
                const el = document.createElement('option');
                el.value = opt.value;
                el.textContent = opt.label;
                if (this.soundMap[channel] === opt.value) el.selected = true;
                modalSoundSelector.appendChild(el);
            });

            if (this.mutedChannels[channel]) {
                modalMuteBtn.classList.add('muted');
                modalMuteBtn.textContent = '\u{1F507}';
            } else {
                modalMuteBtn.classList.remove('muted');
                modalMuteBtn.textContent = '\u{1F50A}';
            }

            const vol = Math.round(this.channelVolumes[channel] * 100);
            modalVolumeSlider.value = vol;
            modalVolumeValue.textContent = vol + '%';
            modal.classList.add('active');
        };

        const closeModal = () => { modal.classList.remove('active'); currentModalChannel = null; };

        document.querySelectorAll('.mobile-channel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => openModal(parseInt(e.target.dataset.channel)));
        });
        document.querySelectorAll('.mobile-settings-btn').forEach(btn => {
            btn.addEventListener('click', (e) => openModal(parseInt(e.target.dataset.channel)));
        });

        modalClose.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        modalPreviewBtn.addEventListener('click', () => {
            if (currentModalChannel !== null) this.playSound(this.soundMap[currentModalChannel], currentModalChannel);
        });

        modalMuteBtn.addEventListener('click', () => {
            if (currentModalChannel === null) return;
            this.toggleMute(currentModalChannel);
            if (this.mutedChannels[currentModalChannel]) {
                modalMuteBtn.classList.add('muted');
                modalMuteBtn.textContent = '\u{1F507}';
            } else {
                modalMuteBtn.classList.remove('muted');
                modalMuteBtn.textContent = '\u{1F50A}';
            }
        });

        modalVolumeSlider.addEventListener('input', (e) => {
            if (currentModalChannel === null) return;
            const volume = parseInt(e.target.value) / 100;
            this.channelVolumes[currentModalChannel] = volume;
            modalVolumeValue.textContent = e.target.value + '%';
            this.updateDialRotation(currentModalChannel);
        });

        modalSoundSelector.addEventListener('change', (e) => {
            if (currentModalChannel === null) return;
            this.soundMap[currentModalChannel] = e.target.value;
            const desktopSelector = document.querySelector(`.sound-selector[data-channel="${currentModalChannel}"]`);
            if (desktopSelector) desktopSelector.value = e.target.value;
        });
    }

    updateDialRotation(channel) {
        const dial = document.querySelector(`.volume-dial[data-channel="${channel}"]`);
        if (!dial) return;
        const indicator = dial.querySelector('.dial-indicator');
        const rotation = (this.channelVolumes[channel] * 270) - 135;
        indicator.style.transform = `rotate(${rotation}deg)`;
        dial.title = `Volume: ${Math.round(this.channelVolumes[channel] * 100)}%`;
    }

    async initAudio() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        this.masterCompressor = this.audioContext.createDynamicsCompressor();
        this.masterCompressor.threshold.setValueAtTime(-18, this.audioContext.currentTime);
        this.masterCompressor.knee.setValueAtTime(4, this.audioContext.currentTime);
        this.masterCompressor.ratio.setValueAtTime(6, this.audioContext.currentTime);
        this.masterCompressor.attack.setValueAtTime(0.001, this.audioContext.currentTime);
        this.masterCompressor.release.setValueAtTime(0.1, this.audioContext.currentTime);
        this.masterCompressor.connect(this.audioContext.destination);

        this.saturation = this.audioContext.createWaveShaper();
        this.saturation.curve = makeSaturationCurve(2.5);
        this.saturation.oversample = '4x';
        this.saturation.connect(this.masterCompressor);

        this.reverbNode = this.audioContext.createConvolver();
        this.reverbNode.buffer = createReverbImpulse(this.audioContext, 2.5);

        this.dryGain = this.audioContext.createGain();
        this.reverbGain = this.audioContext.createGain();
        this.reverbGain.gain.value = 0;
        this.dryGain.gain.value = 1;

        this.reverbNode.connect(this.reverbGain);
        this.reverbGain.connect(this.saturation);
        this.dryGain.connect(this.saturation);

        const sounds = [
            'kick', 'kick2', 'kick3', 'kick4', 'kick5',
            'snare', 'snare2', 'snare3', 'snare4', 'snare5',
            'hihat', 'hihat2', 'hihat3', 'hihat4', 'hihat5',
            'clap', 'clap2', 'clap3', 'clap4', 'clap5',
            'tom', 'tom2', 'tom3', 'tom4',
            'perc', 'perc2', 'perc3', 'perc4', 'perc5',
            'cymbal', 'cymbal2', 'cymbal3', 'cymbal4',
            'fx', 'fx2', 'fx3', 'fx4', 'fx5'
        ];

        for (const sound of sounds) {
            this.audioBuffers[sound] = createSyntheticSound(this.audioContext, sound);
        }

        console.log('DrumNova audio ready.');
    }

    async loadSoundFile(soundName, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            this.audioBuffers[soundName] = await this.audioContext.decodeAudioData(arrayBuffer);
            console.log(`Loaded sound: ${soundName}`);
            return true;
        } catch (error) {
            console.error(`Error loading sound ${soundName}:`, error);
            return false;
        }
    }

    playSound(soundName, channel = null, swingDelay = 0, velocity = 0.7) {
        if (!this.audioBuffers[soundName]) {
            console.warn(`Sound not found: ${soundName}`);
            return;
        }
        const source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffers[soundName];

        const gainNode = this.audioContext.createGain();
        const baseGain = (channel !== null && this.channelVolumes[channel] !== undefined)
            ? this.channelVolumes[channel] : 0.7;
        gainNode.gain.value = baseGain * velocity;

        source.connect(gainNode);
        gainNode.connect(this.dryGain);
        gainNode.connect(this.reverbNode);
        source.start(this.audioContext.currentTime + swingDelay);
    }

    toggleMute(channel) {
        this.mutedChannels[channel] = !this.mutedChannels[channel];
        this.updateMuteUI(channel);
    }

    togglePad(channel, visualStep, event) {
        const blockOffset = Math.floor(visualStep / this.steps);
        const blockIndex = this.currentBlock + blockOffset;
        const stepWithinBlock = visualStep % this.steps;
        const step = this.sequence[blockIndex][channel][stepWithinBlock];

        let velocity = 0.7;
        if (event && event.shiftKey) velocity = 1.0;
        else if (event && event.altKey) velocity = 0.3;

        if (step.active && event && (event.shiftKey || event.altKey)) {
            step.velocity = velocity;
        } else {
            step.active = !step.active;
            if (step.active) step.velocity = velocity;
        }

        this.updatePadUI(channel, visualStep, blockIndex, stepWithinBlock);
    }

    updatePadUI(channel, visualStep, blockIndex, stepWithinBlock) {
        const pad = document.querySelector(`[data-channel="${channel}"][data-step="${visualStep}"]`);
        const step = this.sequence[blockIndex][channel][stepWithinBlock];

        if (step.active) {
            pad.classList.add('active');
            pad.classList.remove('velocity-normal', 'velocity-accent', 'velocity-ghost');
            if (step.velocity >= 0.9)      pad.classList.add('velocity-accent');
            else if (step.velocity <= 0.4) pad.classList.add('velocity-ghost');
            else                           pad.classList.add('velocity-normal');
        } else {
            pad.classList.remove('active', 'velocity-normal', 'velocity-accent', 'velocity-ghost');
        }
    }

    updateMuteUI(channel) {
        const muteBtn = document.querySelector(`[data-channel="${channel}"].mute-btn`);
        if (!muteBtn) return;
        if (this.mutedChannels[channel]) {
            muteBtn.classList.add('muted');
            muteBtn.textContent = '\u{1F507}';
        } else {
            muteBtn.classList.remove('muted');
            muteBtn.textContent = '\u{1F50A}';
        }
    }

    setTotalBlocks(blocks) {
        this.totalBlocks = blocks;
        document.querySelectorAll('.block-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.blocks) === blocks);
        });
        if (this.currentBlock >= this.totalBlocks) {
            this.currentBlock = 0;
            this.updateBlockDisplay();
        } else {
            this.updateBlockIndicator();
        }
    }

    setVisibleBlocks(view) {
        this.visibleBlocks = Math.min(view, this.totalBlocks);
        if (this.currentBlock + this.visibleBlocks > this.totalBlocks) {
            this.currentBlock = Math.max(0, this.totalBlocks - this.visibleBlocks);
        }
        this.createGrid();
        this.updateBlockDisplay();
    }

    updateBlockDisplay() {
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

    updateBlockIndicator() {
        const endBlock = Math.min(this.currentBlock + this.visibleBlocks, this.totalBlocks);
        document.getElementById('blockIndicator').textContent =
            `Blocks ${this.currentBlock + 1}-${endBlock}/${this.totalBlocks}`;
        document.getElementById('prevBlock').disabled = this.currentBlock === 0;
        document.getElementById('nextBlock').disabled =
            this.currentBlock + this.visibleBlocks >= this.totalBlocks;
    }

    async play() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        document.getElementById('playBtn').textContent = '⏸ Pause';
        document.getElementById('playBtn').classList.add('playing');

        if (this.audioContext.state === 'suspended') await this.audioContext.resume();

        const stepDuration = (60 / this.bpm) * 1000 / 4;
        this.intervalId = setInterval(() => {
            this.processStep();
            this.currentStep++;
            if (this.currentStep >= this.totalBlocks * this.steps) this.currentStep = 0;
        }, stepDuration);
    }

    pause() {
        this.isPlaying = false;
        document.getElementById('playBtn').textContent = '▶ Play';
        document.getElementById('playBtn').classList.remove('playing');
        clearInterval(this.intervalId);
        this.clearPlayingIndicators();
    }

    stop() {
        this.pause();
        this.currentStep = 0;
    }

    processStep() {
        const blockIndex = Math.floor(this.currentStep / this.steps);
        const stepInBlock = this.currentStep % this.steps;

        let swingDelay = 0;
        if (stepInBlock % 2 === 1 && this.swing > 0) {
            swingDelay = (this.swing / 100) * ((60 / this.bpm) / 4);
        }

        const shouldShowVisual = blockIndex >= this.currentBlock &&
            blockIndex < this.currentBlock + this.visibleBlocks;

        if (shouldShowVisual) this.clearPlayingIndicators();

        for (let channel = 0; channel < this.channels; channel++) {
            const step = this.sequence[blockIndex][channel][stepInBlock];

            if (step.active && !this.mutedChannels[channel]) {
                this.playSound(this.soundMap[channel], channel, swingDelay, step.velocity);
                if (shouldShowVisual) {
                    const visualStep = (blockIndex - this.currentBlock) * this.steps + stepInBlock;
                    const pad = document.querySelector(`[data-channel="${channel}"][data-step="${visualStep}"]`);
                    if (pad) pad.classList.add('playing');
                }
            } else if (shouldShowVisual) {
                const visualStep = (blockIndex - this.currentBlock) * this.steps + stepInBlock;
                const pad = document.querySelector(`[data-channel="${channel}"][data-step="${visualStep}"]`);
                if (pad) {
                    pad.style.opacity = '0.7';
                    setTimeout(() => { pad.style.opacity = '1'; }, 50);
                }
            }
        }
    }

    clearPlayingIndicators() {
        document.querySelectorAll('.pad.playing').forEach(pad => pad.classList.remove('playing'));
    }

    clearPattern() {
        for (let i = 0; i < this.visibleBlocks; i++) {
            const blockIndex = this.currentBlock + i;
            if (blockIndex < this.totalBlocks) {
                this.sequence[blockIndex] = Array(this.channels).fill(null).map(() =>
                    Array(this.steps).fill(null).map(() => ({ active: false, velocity: 0.7 }))
                );
            }
        }
        document.querySelectorAll('.pad').forEach(pad => {
            pad.classList.remove('active', 'velocity-normal', 'velocity-accent', 'velocity-ghost');
        });
    }

    loadDemoPattern(patternKey) {
        const pattern = this.demoPatterns[patternKey];
        if (!pattern) return;

        if (pattern.bpm) {
            this.bpm = pattern.bpm;
            document.getElementById('bpmValue').textContent = this.bpm;
            document.getElementById('bpmSlider').value = this.bpm;
        }

        if (pattern.soundSelections) {
            pattern.soundSelections.forEach((soundIndex, channel) => {
                const selector = document.querySelectorAll('.sound-selector')[channel];
                if (selector) selector.selectedIndex = soundIndex;
            });
        }

        if (pattern.blocks && pattern.blocks !== this.totalBlocks) this.setTotalBlocks(pattern.blocks);

        for (let blockIndex = 0; blockIndex < this.totalBlocks; blockIndex++) {
            this.sequence[blockIndex] = Array(this.channels).fill(null).map(() =>
                Array(this.steps).fill(null).map(() => ({ active: false, velocity: 0.7 }))
            );
        }

        const patternSteps = pattern.pattern[0].length;

        for (let blockIndex = 0; blockIndex < this.totalBlocks; blockIndex++) {
            const startStep = blockIndex * this.steps;
            for (let channel = 0; channel < this.channels; channel++) {
                for (let step = 0; step < this.steps; step++) {
                    const patternStep = startStep + step;
                    if (patternStep < patternSteps) {
                        this.sequence[blockIndex][channel][step].active =
                            pattern.pattern[channel][patternStep] === 1;
                    }
                }
            }
        }

        this.updateBlockDisplay();
        console.log(`Loaded "${pattern.name}" at ${pattern.bpm} BPM`);
    }

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
            pattern: this.sequence.slice(0, this.totalBlocks).map(block =>
                block.map(channel => channel.map(step => ({ active: step.active, velocity: step.velocity })))
            )
        };
    }

    savePatternToFile() {
        const pattern = this.exportPattern();
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const blob = new Blob([JSON.stringify(pattern, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `drumnova-pattern-${timestamp}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    loadPatternFromFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.importPattern(JSON.parse(e.target.result));
            } catch {
                alert('Invalid pattern file. Please select a valid DrumNova pattern.');
            }
        };
        reader.readAsText(file);
    }

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
            const wetGain = this.reverbSend / 100;
            this.reverbGain.gain.setValueAtTime(wetGain * 0.8, this.audioContext.currentTime);
            this.dryGain.gain.setValueAtTime(1 - wetGain * 0.5, this.audioContext.currentTime);
        }
        if (patternData.totalBlocks) this.setTotalBlocks(patternData.totalBlocks);
        if (patternData.soundMap) {
            this.soundMap = [...patternData.soundMap];
            document.querySelectorAll('.sound-selector').forEach((sel, i) => { sel.value = this.soundMap[i]; });
        }
        if (patternData.channelVolumes) {
            this.channelVolumes = [...patternData.channelVolumes];
            for (let i = 0; i < this.channels; i++) this.updateDialRotation(i);
        }
        if (patternData.mutedChannels) {
            this.mutedChannels = [...patternData.mutedChannels];
            for (let i = 0; i < this.channels; i++) this.updateMuteUI(i);
        }
        if (patternData.pattern) {
            for (let blockIndex = 0; blockIndex < patternData.pattern.length; blockIndex++) {
                for (let channel = 0; channel < this.channels; channel++) {
                    for (let step = 0; step < this.steps; step++) {
                        const s = patternData.pattern[blockIndex][channel][step];
                        this.sequence[blockIndex][channel][step] = (typeof s === 'object' && s !== null)
                            ? { active: s.active || false, velocity: s.velocity || 0.7 }
                            : { active: s === 1 || s === true, velocity: 0.7 };
                    }
                }
            }
            this.updateBlockDisplay();
        }
    }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

let drumMachine;

window.addEventListener('DOMContentLoaded', async () => {
    drumMachine = new DrumMachine();
    await drumMachine.init();
    window.drumMachine = drumMachine;
    window.loadSoundLibrary = loadSoundLibrary;
    console.log('DrumNova ready. Use drumMachine.exportPattern() / importPattern(data) / loadSoundFile(name, url)');
});

async function loadSoundLibrary(sounds) {
    const results = await Promise.all(sounds.map(s => drumMachine.loadSoundFile(s.name, s.url)));
    console.log(`Loaded ${results.filter(Boolean).length}/${sounds.length} sounds`);
    return results;
}
