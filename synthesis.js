function makeSaturationCurve(amount) {
    const samples = 256;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        curve[i] = Math.tanh(amount * x) / Math.tanh(amount);
    }
    return curve;
}

function createReverbImpulse(audioContext, duration) {
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * duration;
    const impulse = audioContext.createBuffer(2, length, sampleRate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);

    const preDelaySamples = Math.floor(sampleRate * 0.02);
    const earlyReflections = [
        { time: 0.005, gain: 0.6 }, { time: 0.012, gain: 0.5 },
        { time: 0.019, gain: 0.45 }, { time: 0.026, gain: 0.4 },
        { time: 0.034, gain: 0.35 }, { time: 0.041, gain: 0.3 },
        { time: 0.053, gain: 0.25 }, { time: 0.068, gain: 0.2 }
    ];

    for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        let sL = 0, sR = 0;

        if (i < preDelaySamples) { impulseL[i] = 0; impulseR[i] = 0; continue; }

        if (t < 0.08) {
            for (const ref of earlyReflections) {
                const rs = Math.floor(ref.time * sampleRate);
                if (Math.abs(i - rs) < 3) {
                    const g = Math.exp(-Math.pow((i - rs) / 2, 2));
                    sL += (Math.random() * 2 - 1) * ref.gain * g;
                    sR += (Math.random() * 2 - 1) * ref.gain * g * 0.85;
                }
            }
        }

        if (t > 0.04) {
            const td = t - 0.04;
            const fast = Math.exp(-4 * td / duration);
            const mid  = Math.exp(-3 * td / duration);
            const slow = Math.exp(-2 * td / duration);
            const hf   = Math.exp(-5 * t / duration);
            if (Math.random() < 0.6) {
                const n = Math.random() * 2 - 1;
                const rv = n * (0.5 * fast * hf + 0.3 * mid + 0.2 * slow);
                sL += rv;
                sR += rv * (0.9 + Math.random() * 0.2);
            }
        }

        impulseL[i] = sL * 0.3;
        impulseR[i] = sR * 0.3;
    }

    return impulse;
}

function createSyntheticSound(audioContext, type) {
    const sr = audioContext.sampleRate;
    const dt = 1 / sr;

    // ── KICK ──────────────────────────────────────────────────────────────────
    if (type.startsWith('kick')) {
        const cfg = {
            kick:  { startHz: 150, endHz: 50,  pitchT: 0.08,  dur: 0.55, clickAmt: 0.5, sub: 0.4 },
            kick2: { startHz: 185, endHz: 60,  pitchT: 0.04,  dur: 0.35, clickAmt: 0.7, sub: 0.2 },
            kick3: { startHz: 80,  endHz: 28,  pitchT: 0.13,  dur: 0.72, clickAmt: 0.1, sub: 0.6 },
            kick4: { startHz: 220, endHz: 65,  pitchT: 0.03,  dur: 0.28, clickAmt: 0.9, sub: 0.1 },
            kick5: { startHz: 120, endHz: 45,  pitchT: 0.025, dur: 0.20, clickAmt: 0.7, sub: 0.3 },
        };
        const c = cfg[type] || cfg.kick;
        const len = Math.floor(sr * c.dur);
        const buf = audioContext.createBuffer(1, len, sr);
        const d = buf.getChannelData(0);
        const bodyDecay = c.dur * 0.70;
        let phase = 0;
        for (let i = 0; i < len; i++) {
            const t = i / sr;
            const freq = c.endHz + (c.startHz - c.endHz) * Math.exp(-t / c.pitchT);
            phase += (2 * Math.PI * freq) * dt;
            const env = Math.exp(-t / bodyDecay);
            const body  = Math.sin(phase) * env;
            const sub   = Math.sin(phase * 0.5) * c.sub * env;
            const click = (Math.random() * 2 - 1) * Math.exp(-t * 600) * c.clickAmt;
            d[i] = Math.tanh(body + sub + click) * 0.88;
        }
        return buf;
    }

    // ── SNARE ─────────────────────────────────────────────────────────────────
    if (type.startsWith('snare')) {
        const cfg = {
            snare:  { toneHz: 200, toneDecay: 0.08, noiseDecay: 0.15, noiseLvl: 0.62, snap: 0.5, dur: 0.22 },
            snare2: { toneHz: 165, toneDecay: 0.10, noiseDecay: 0.20, noiseLvl: 0.52, snap: 0.4, dur: 0.28 },
            snare3: { toneHz: 260, toneDecay: 0.06, noiseDecay: 0.12, noiseLvl: 0.72, snap: 0.7, dur: 0.18 },
            snare4: { toneHz: 145, toneDecay: 0.05, noiseDecay: 0.09, noiseLvl: 0.50, snap: 0.9, dur: 0.14 },
            snare5: { toneHz: 300, toneDecay: 0.04, noiseDecay: 0.08, noiseLvl: 0.60, snap: 0.8, dur: 0.12 },
        };
        const c = cfg[type] || cfg.snare;
        const len = Math.floor(sr * c.dur);
        const buf = audioContext.createBuffer(1, len, sr);
        const d = buf.getChannelData(0);
        const hpRC = 1 / (2 * Math.PI * 1800);
        const hpAlpha = hpRC / (hpRC + dt);
        let hpPrev = 0, hpPrevIn = 0, p1 = 0, p2 = 0;
        for (let i = 0; i < len; i++) {
            const t = i / sr;
            const pitchEnv = Math.exp(-t * 60);
            const f1 = c.toneHz * (1 + pitchEnv * 0.8);
            p1 += (2 * Math.PI * f1) * dt;
            p2 += (2 * Math.PI * f1 * 1.59) * dt;
            const tone = (Math.sin(p1) + Math.sin(p2) * 0.5) * Math.exp(-t / c.toneDecay) * 0.4;
            const rawNoise = (Math.random() * 2 - 1) * Math.exp(-t / c.noiseDecay) * c.noiseLvl;
            const filtered = hpAlpha * (hpPrev + rawNoise - hpPrevIn);
            hpPrev = filtered; hpPrevIn = rawNoise;
            const snap = (Math.random() * 2 - 1) * Math.exp(-t * 900) * c.snap * 0.15;
            d[i] = (tone + filtered * 0.45 + snap) * 0.9;
        }
        return buf;
    }

    // ── HI-HAT ────────────────────────────────────────────────────────────────
    if (type.startsWith('hihat')) {
        const cfg = {
            hihat:  { decay: 0.038, baseHz: 220, gain: 0.44 },
            hihat2: { decay: 0.38,  baseHz: 220, gain: 0.38 },
            hihat3: { decay: 0.022, baseHz: 200, gain: 0.36 },
            hihat4: { decay: 0.075, baseHz: 180, gain: 0.30 },
            hihat5: { decay: 0.060, baseHz: 245, gain: 0.46 },
        };
        const c = cfg[type] || cfg.hihat;
        const len = Math.floor(sr * Math.max(c.decay * 6, 0.05));
        const buf = audioContext.createBuffer(1, len, sr);
        const d = buf.getChannelData(0);
        const ratios = [1, 1.483, 2.027, 2.513, 3.134, 4.157];
        const phases = [0, 0, 0, 0, 0, 0];
        const hpRC = 1 / (2 * Math.PI * 7000);
        const hpAlpha = hpRC / (hpRC + dt);
        let hpPrev = 0, hpPrevIn = 0;
        for (let i = 0; i < len; i++) {
            const t = i / sr;
            let osc = 0;
            for (let r = 0; r < 6; r++) {
                phases[r] += (2 * Math.PI * c.baseHz * ratios[r]) * dt;
                osc += Math.sign(Math.sin(phases[r]));
            }
            osc /= 6;
            const filtered = hpAlpha * (hpPrev + osc - hpPrevIn);
            hpPrev = filtered; hpPrevIn = osc;
            d[i] = filtered * Math.exp(-t / c.decay) * c.gain;
        }
        return buf;
    }

    // ── CLAP ──────────────────────────────────────────────────────────────────
    if (type.startsWith('clap')) {
        const cfg = {
            clap:  { bursts: 4, spacing: 0.004, bDur: 0.003, decay: 0.06, loHz: 900,  hiHz: 2800, dur: 0.14 },
            clap2: { bursts: 3, spacing: 0.007, bDur: 0.005, decay: 0.10, loHz: 550,  hiHz: 1800, dur: 0.20 },
            clap3: { bursts: 5, spacing: 0.003, bDur: 0.002, decay: 0.055,loHz: 1200, hiHz: 3500, dur: 0.22 },
            clap4: { bursts: 4, spacing: 0.005, bDur: 0.004, decay: 0.09, loHz: 400,  hiHz: 1500, dur: 0.18 },
            clap5: { bursts: 3, spacing: 0.006, bDur: 0.006, decay: 0.12, loHz: 300,  hiHz: 1200, dur: 0.22 },
        };
        const c = cfg[type] || cfg.clap;
        const len = Math.floor(sr * c.dur);
        const buf = audioContext.createBuffer(1, len, sr);
        const d = buf.getChannelData(0);
        const lpRC = 1 / (2 * Math.PI * c.hiHz);
        const hpRC = 1 / (2 * Math.PI * c.loHz);
        const lpAlpha = dt / (dt + lpRC);
        const hpAlpha = hpRC / (hpRC + dt);
        let lpPrev = 0, hpPrev = 0, hpPrevIn = 0;
        for (let i = 0; i < len; i++) {
            const t = i / sr;
            let noise = 0;
            for (let b = 0; b < c.bursts; b++) {
                const bt = b * c.spacing;
                if (t >= bt) noise += (Math.random() * 2 - 1) * Math.exp(-(t - bt) / c.bDur);
            }
            noise /= c.bursts;
            lpPrev = lpPrev + lpAlpha * (noise - lpPrev);
            const filtered = hpAlpha * (hpPrev + lpPrev - hpPrevIn);
            hpPrev = filtered; hpPrevIn = lpPrev;
            d[i] = filtered * Math.exp(-t / c.decay) * 0.85;
        }
        return buf;
    }

    // ── TOM ───────────────────────────────────────────────────────────────────
    if (type.startsWith('tom')) {
        const cfg = {
            tom:  { startHz: 120, endHz: 52,  pitchT: 0.06, dur: 0.45, click: 0.35 },
            tom2: { startHz: 180, endHz: 82,  pitchT: 0.05, dur: 0.35, click: 0.28 },
            tom3: { startHz: 265, endHz: 125, pitchT: 0.04, dur: 0.28, click: 0.22 },
            tom4: { startHz: 90,  endHz: 38,  pitchT: 0.08, dur: 0.55, click: 0.38 },
        };
        const c = cfg[type] || cfg.tom;
        const len = Math.floor(sr * c.dur);
        const buf = audioContext.createBuffer(1, len, sr);
        const d = buf.getChannelData(0);
        let phase = 0;
        for (let i = 0; i < len; i++) {
            const t = i / sr;
            const freq = c.endHz + (c.startHz - c.endHz) * Math.exp(-t / c.pitchT);
            phase += (2 * Math.PI * freq) * dt;
            const body  = Math.sin(phase) * Math.exp(-t / (c.dur * 0.65)) * 0.85;
            const click = (Math.random() * 2 - 1) * Math.exp(-t * 400) * c.click;
            d[i] = (body + click) * 0.88;
        }
        return buf;
    }

    // ── PERC ──────────────────────────────────────────────────────────────────
    if (type === 'perc') {
        const len = Math.floor(sr * 0.12);
        const buf = audioContext.createBuffer(1, len, sr);
        const d = buf.getChannelData(0);
        const hpRC = 1 / (2 * Math.PI * 3000);
        const hpAlpha = hpRC / (hpRC + dt);
        let hpPrev = 0, hpPrevIn = 0;
        for (let i = 0; i < len; i++) {
            const t = i / sr;
            const pulse = Math.sin(Math.PI * (t % 0.004) / 0.004) > 0.5 ? 1 : 0;
            const noise = (Math.random() * 2 - 1) * pulse;
            const filtered = hpAlpha * (hpPrev + noise - hpPrevIn);
            hpPrev = filtered; hpPrevIn = noise;
            d[i] = filtered * Math.exp(-t / 0.04) * 0.55;
        }
        return buf;
    }
    if (type === 'perc2') {
        const len = Math.floor(sr * 0.5);
        const buf = audioContext.createBuffer(1, len, sr);
        const d = buf.getChannelData(0);
        let p1 = 0, p2 = 0;
        for (let i = 0; i < len; i++) {
            const t = i / sr;
            p1 += (2 * Math.PI * 562) * dt;
            p2 += (2 * Math.PI * 845) * dt;
            d[i] = (Math.sign(Math.sin(p1)) * 0.6 + Math.sign(Math.sin(p2)) * 0.4) * Math.exp(-t / 0.18) * 0.45;
        }
        return buf;
    }
    if (type === 'perc3') {
        const len = Math.floor(sr * 0.25);
        const buf = audioContext.createBuffer(1, len, sr);
        const d = buf.getChannelData(0);
        let phase = 0;
        for (let i = 0; i < len; i++) {
            const t = i / sr;
            const freq = 195 + (330 - 195) * Math.exp(-t * 15);
            phase += (2 * Math.PI * freq) * dt;
            const click = (Math.random() * 2 - 1) * Math.exp(-t * 350) * 0.3;
            d[i] = (Math.sin(phase) * 0.7 + click) * Math.exp(-t / 0.12) * 0.8;
        }
        return buf;
    }
    if (type === 'perc4') {
        const len = Math.floor(sr * 0.08);
        const buf = audioContext.createBuffer(1, len, sr);
        const d = buf.getChannelData(0);
        let p1 = 0, p2 = 0;
        for (let i = 0; i < len; i++) {
            const t = i / sr;
            p1 += (2 * Math.PI * 800) * dt;
            p2 += (2 * Math.PI * 1120) * dt;
            d[i] = (Math.sin(p1) * 0.7 + Math.sin(p2) * 0.3) * Math.exp(-t / 0.025) * 0.7;
        }
        return buf;
    }
    if (type === 'perc5') {
        const len = Math.floor(sr * 0.15);
        const buf = audioContext.createBuffer(1, len, sr);
        const d = buf.getChannelData(0);
        const ratios = [1, 1.28, 1.56, 2.10, 2.80];
        const phases = [0, 0, 0, 0, 0];
        for (let i = 0; i < len; i++) {
            const t = i / sr;
            let sample = 0;
            for (let r = 0; r < 5; r++) {
                phases[r] += (2 * Math.PI * 3200 * ratios[r]) * dt;
                sample += Math.sin(phases[r]) / (r + 1);
            }
            d[i] = (sample * 0.75 + (Math.random() * 2 - 1) * 0.25) * Math.exp(-t / 0.06) * 0.42;
        }
        return buf;
    }

    // ── CYMBAL ────────────────────────────────────────────────────────────────
    if (type.startsWith('cymbal')) {
        const cfg = {
            cymbal:  { decay: 0.80, dur: 1.6, baseHz: 205, gain: 0.36, atkMs: 5 },
            cymbal2: { decay: 1.50, dur: 2.5, baseHz: 180, gain: 0.32, atkMs: 3 },
            cymbal3: { decay: 0.50, dur: 1.0, baseHz: 250, gain: 0.40, atkMs: 2 },
            cymbal4: { decay: 0.28, dur: 0.7, baseHz: 220, gain: 0.36, atkMs: 1 },
        };
        const c = cfg[type] || cfg.cymbal;
        const len = Math.floor(sr * c.dur);
        const buf = audioContext.createBuffer(1, len, sr);
        const d = buf.getChannelData(0);
        const ratios = [1, 1.483, 2.027, 2.513, 3.134, 4.157];
        const phases = [0, 0, 0, 0, 0, 0];
        const hpRC = 1 / (2 * Math.PI * 4000);
        const hpAlpha = hpRC / (hpRC + dt);
        let hpPrev = 0, hpPrevIn = 0;
        const atkSamples = Math.max(1, Math.floor(sr * c.atkMs / 1000));
        for (let i = 0; i < len; i++) {
            const t = i / sr;
            let osc = 0;
            for (let r = 0; r < 6; r++) {
                phases[r] += (2 * Math.PI * c.baseHz * ratios[r]) * dt;
                osc += Math.sign(Math.sin(phases[r]));
            }
            osc /= 6;
            const sample = osc * 0.7 + (Math.random() * 2 - 1) * 0.3;
            const filtered = hpAlpha * (hpPrev + sample - hpPrevIn);
            hpPrev = filtered; hpPrevIn = sample;
            d[i] = filtered * Math.exp(-t / c.decay) * Math.min(1, i / atkSamples) * c.gain;
        }
        return buf;
    }

    // ── FX ────────────────────────────────────────────────────────────────────
    if (type === 'fx') {
        const len = Math.floor(sr * 0.07);
        const buf = audioContext.createBuffer(1, len, sr);
        const d = buf.getChannelData(0);
        let p1 = 0, p2 = 0;
        for (let i = 0; i < len; i++) {
            const t = i / sr;
            p1 += 2 * Math.PI * 2500 * dt;
            p2 += 2 * Math.PI * 3700 * dt;
            const env = Math.exp(-t / 0.013);
            d[i] = (Math.sin(p1) * 0.6 + Math.sin(p2) * 0.4) * env * 0.85;
        }
        return buf;
    }
    if (type === 'fx2') {
        const len = Math.floor(sr * 0.65);
        const buf = audioContext.createBuffer(1, len, sr);
        const d = buf.getChannelData(0);
        let phase = 0;
        for (let i = 0; i < len; i++) {
            const t = i / sr;
            phase += (2 * Math.PI * 2200 * Math.pow(50 / 2200, t / 0.65)) * dt;
            d[i] = Math.sin(phase) * Math.exp(-t / 0.45) * 0.65;
        }
        return buf;
    }
    if (type === 'fx3') {
        const len = Math.floor(sr * 0.14);
        const buf = audioContext.createBuffer(1, len, sr);
        const d = buf.getChannelData(0);
        let phase = 0;
        for (let i = 0; i < len; i++) {
            const t = i / sr;
            phase += (2 * Math.PI * 220) * dt;
            const saw = (phase % (2 * Math.PI)) / Math.PI - 1;
            d[i] = saw * Math.exp(-t / 0.04) * 0.5;
        }
        return buf;
    }
    if (type === 'fx4') {
        const len = Math.floor(sr * 0.09);
        const buf = audioContext.createBuffer(1, len, sr);
        const d = buf.getChannelData(0);
        let phase = 0;
        for (let i = 0; i < len; i++) {
            const t = i / sr;
            phase += (2 * Math.PI * (600 + (4000 - 600) * (t / 0.09))) * dt;
            d[i] = Math.sign(Math.sin(phase)) * Math.exp(-t / 0.04) * 0.40;
        }
        return buf;
    }
    if (type === 'fx5') {
        const len = Math.floor(sr * 1.0);
        const buf = audioContext.createBuffer(1, len, sr);
        const d = buf.getChannelData(0);
        const harmonics = [1, 2.756, 5.404, 8.933, 13.354];
        const phases = [0, 0, 0, 0, 0];
        for (let i = 0; i < len; i++) {
            const t = i / sr;
            let sample = 0;
            for (let h = 0; h < 5; h++) {
                phases[h] += (2 * Math.PI * 440 * harmonics[h]) * dt;
                sample += Math.sin(phases[h]) * Math.exp(-t * (h + 1) / 0.6) / (h + 1);
            }
            d[i] = sample * 0.22;
        }
        return buf;
    }

    return audioContext.createBuffer(1, Math.floor(sr * 0.1), sr);
}
