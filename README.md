# DrumNova - Drum Machine

🌐 **[Try the live demo](https://drumnova.oscarperiche.com)**

A browser-based drum machine inspired by classic hardware sequencers like the TR-808 and Redrum. Built entirely with vanilla JS, CSS, and HTML. No frameworks, no dependencies, no build step.

## Features

- **Hardware-style UI**, dark matte panel aesthetic with per-channel LED color coding
- **8 instrument channels**, Kick, Snare, HiHat, Clap, Tom, Perc, Cymbal, FX, each with its own accent color
- **5 sound variants per channel**, 40 procedurally synthesised sounds via Web Audio API (no audio files)
- **16 steps × 8 blocks**, up to 128-step patterns; choose 1/2/4/8 active blocks
- **Multi-block view**, see and edit 1, 2, or 4 blocks at once
- **Velocity per pad**, ghost notes (Alt+click), normal hits (click), accents (Shift+click)
- **Swing/Shuffle**, adjustable groove from 0 to 75%
- **Reverb effect**, synthetic convolution reverb with send control
- **Master bus**, WaveShaper saturation + dynamics compressor for punch and warmth
- **Mute per channel**, keyboard shortcuts 1–8
- **Volume dial per channel**, drag vertically to adjust
- **Save/Load patterns**, JSON export with full settings (BPM, swing, reverb, sound selections, velocities)
- **Autosave**, current pattern is saved to LocalStorage every 5 seconds and restored automatically on reload
- **8 demo patterns**, Rock Steady, Funk Soul, Boom Bap, Industrial Pulse, New Wave Icon, Four to the Floor, Tension Build, Poly Rhythm
- **Mobile-optimised**, fixed transport bar at bottom, collapsible controls, 40px touch targets, per-channel settings modal

## Quick Start

1. Open `index.html` in a browser (no server needed)
2. Click pads to build your pattern
3. Press **Play** or hit **Space**
4. Load a demo pattern to get started quickly

> To avoid `file://` CORS issues with some browsers, serve locally:
> ```bash
> python -m http.server 8000
> ```

## Controls

**Transport**, Play/Pause (`Space`), Stop (`Esc`), Clear (`Ctrl+C`)

**Pads**
- Click → normal hit (70% velocity)
- Shift+Click → accent (100%, gold glow)
- Alt+Click → ghost note (30%, faded)

**Blocks**, set 1/2/4/8 total blocks; navigate with `←` `→` arrows

**View**, show 1, 2, or 4 blocks simultaneously for easier editing

**Channel shortcuts**, keys `1`–`8` toggle mute per channel

## Architecture

Three plain JS files, no bundler:

| File | Purpose |
|---|---|
| `patterns.js` | 8 demo patterns as plain data |
| `synthesis.js` | All drum synthesis, kicks, snares, hi-hats, cymbals, FX |
| `app.js` | `DrumMachine` class, sequencer, UI, audio routing |

Sequence state: `sequence[blockIndex][channel][step] = { active, velocity }`

Signal chain: `BufferSource → GainNode → DryGain/ReverbSend → WaveShaper → Compressor → output`

## Adding Demo Patterns

Add entries to `demoPatterns` in `patterns.js`:

```js
myPattern: {
    name: 'My Pattern',
    bpm: 128,
    blocks: 2,                          // 1, 2, 4, or 8
    soundSelections: [0,0,0,0,0,0,0,0], // sound variant index (0–4) per channel
    pattern: [
        [1,0,0,0,...],  // Kick, 8 rows × (blocks×16) columns
        [0,0,1,0,...],  // Snare
        [1,1,1,1,...],  // HiHat
        [0,0,0,0,...],  // Clap
        [0,0,0,0,...],  // Tom
        [0,0,0,0,...],  // Perc
        [0,0,0,0,...],  // Cymbal
        [0,0,0,0,...],  // FX
    ]
}
```

## Save & Load

**UI**, SAVE downloads a `.json` file; OPEN loads it back. The file includes pattern data, BPM, swing, reverb, sound selections, volumes, and mute states.

**Console API**
```js
drumMachine.exportPattern()        // returns pattern object
drumMachine.importPattern(data)    // loads pattern object
drumMachine.loadSoundFile('kick', 'sounds/my-kick.wav')  // replace a synth sound
```

## What's Done

- ✅ 8 channels, multiple sound variants, block system (up to 128 steps)
- ✅ Velocity system (ghost / normal / accent)
- ✅ Swing, reverb, master compression, WaveShaper saturation
- ✅ TR-909-style metallic oscillator synthesis
- ✅ Hardware-aesthetic UI with per-channel LED colours
- ✅ Mobile layout with fixed transport bar and collapsible controls
- ✅ Save/Load patterns as JSON
- ✅ Keyboard shortcuts
- ✅ LocalStorage pattern persistence

Planned features and future ideas are tracked in [TODO.md](TODO.md).

## License

MIT. Use it, fork it, learn from it.

Made by [Oscar Periche](https://oscarperiche.com).
