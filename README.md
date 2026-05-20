# DrumNova - Redrum-Style Drum Machine

🌐 **[Try the live demo](https://drumnova.oscarperiche.com)**

A personal experiment building an interactive drum machine inspired by Redrum, fully functional in the browser. This is just a fun side project to explore the Web Audio API and create something useful for making beats.

## 🎵 Features

- **16 steps x 8 channels** sequencer grid with multi-block view (1/2/4 blocks visible at once)
- **Block system**: Choose 1, 2, 4, or 8 blocks for extended patterns (up to 128 steps total)
- **Swing/Shuffle control**: Adjustable groove (0-75%) to add that human feel
- **Velocity per pad**: Ghost notes, normal hits, and accents for dynamic expression
- **Block navigation**: Switch between blocks to program different sections
- **Seamless playback**: Play travels through all active blocks in sequence
- **Demo patterns** preconfigured (Rock Steady, Funk Soul, Boom Bap, Industrial Pulse, New Wave Icon, Four to the Floor, Tension Build, Poly Rhythm)
- **8 instrument channels**: Kick, Snare, HiHat, Clap, Tom, Perc, Cymbal, FX
- **Multiple sound variations**: 4-5 different sounds per instrument with enhanced variety
- **Mute buttons**: 🔊/🔇 per channel to silence individual instruments
- **Volume dials**: Individual volume control per channel with rotary knobs
- **BPM control** adjustable (60-200 BPM)
- **Keyboard shortcuts**: Space = play/pause, ESC = stop, 1-8 = mute channels, arrows = navigate blocks
- **Master bus compressor**: Professional sound cohesion and punch
- **Save/Load patterns**: Download and upload your patterns as JSON files with all settings preserved
- **Responsive design**: Works on desktop, tablet, and mobile with horizontal scroll
- **Visual interface** hardware-style with responsive colors
- **Web Audio API** for low-latency audio playback

## 🚀 Quick Start

1. Open `index.html` directly in your browser
2. Click on pads to create your pattern
3. Press **Play** to hear it
4. Adjust **BPM** with the slider
5. Load **demo patterns** to get started quickly

## 🎹 How It Works

### Structure
- Each **row** = an instrument (Kick, Snare, HiHat, Clap, Tom, Perc, Cymbal, FX)
- Each **column** = a beat step
- Each **block** = 16 steps of all instruments
- **Blue pads** = activated
- **Green/yellow pads** = currently playing

### Controls
- **Play/Pause**: Start or pause playback (shortcut: **Space**)
- **Stop**: Stop and return to beginning (shortcut: **ESC**)
- **Clear**: Erase current visible blocks' patterns (shortcut: **Ctrl+C**)
- **BPM Slider**: Adjust speed (60-200 BPM)
- **Swing Slider**: Add groove/shuffle (0-75%) - delays odd steps for human feel
- **Sound selectors**: Choose different sounds for each instrument (4-5 variations each)
- **Mute buttons**: 🔊/🔇 per channel to silence individual instruments during playback (shortcuts: **1-8**)
- **Volume dials**: Drag vertically to adjust individual channel volume (0-100%)
- **▶ Preview buttons**: Test individual instrument sounds (plays currently selected variant)
- **💾 Save / 📁 Load**: Save your pattern to a file or load a previously saved pattern (includes BPM, swing, volumes, mutes)
- **Demo Patterns**: Load pre-configured demo patterns to get started
- **Block buttons (1/2/4/8)**: Set how many blocks are active
- **View buttons (1/2/4)**: Set how many blocks are visible at once (default: 2)
- **◄ ► Navigation**: Switch between visible blocks (shortcuts: **Left/Right arrows**)

### Velocity System
Click pads with different modifier keys for dynamics:
- **Normal click**: 70% velocity (standard hit)
- **Shift + click**: 100% velocity (accent - loud, emphasized hit with gold glow)
- **Alt + click**: 30% velocity (ghost note - quiet, subtle hit with darker color)

This allows for realistic, musical patterns with dynamics instead of robotic, same-volume hits.

### Keyboard Shortcuts
- **Space**: Play / Pause
- **ESC**: Stop
- **Ctrl+C**: Clear pattern
- **1-8**: Toggle mute for channels 1-8
- **Left/Right arrows**: Navigate between blocks

### Multi-Block View
By default, **2 blocks** are visible simultaneously, allowing you to see and edit longer patterns at once:
- Click **View: 1/2/4** buttons to change how many blocks are shown
- Visual separators (gold lines) mark block boundaries
- Navigation arrows scroll through blocks
- All editing works seamlessly across visible blocks

### Block System
- **1 block** = 16 steps (basic patterns)
- **2 blocks** = 32 steps (intro + verse, build-ups)
- **4 blocks** = 64 steps (full song sections)
- **8 blocks** = 128 steps (complete compositions)

When loading demo patterns:
- Short patterns (16 steps) fill all active blocks with the same pattern
- Long patterns (32+ steps) automatically expand blocks to fit and distribute across them

## 🔧 Integrating Your Sound Library

Currently uses synthetic sample sounds. To use your own sounds:

### Option 1: Load sounds from JavaScript

```javascript
// In the browser console or in a custom script:
const mySounds = [
    { name: 'kick', url: 'path/to/kick.wav' },
    { name: 'snare', url: 'path/to/snare.wav' },
    { name: 'hihat', url: 'path/to/hihat.wav' },
    { name: 'perc', url: 'path/to/perc.wav' }
];

loadSoundLibrary(mySounds);
```

### Option 2: Load individual sound

```javascript
drumMachine.loadSoundFile('kick', 'sounds/my-kick.wav');
```

### Recommended File Structure

```
DrumNova/
├── index.html
├── style.css
├── app.js
└── sounds/
    ├── kick.wav
    ├── kick2.wav
    ├── snare.wav
    ├── snare2.wav
    ├── hihat.wav
    ├── hihat2.wav
    ├── perc.wav
    └── perc2.wav
```

## 💾 Saving and Loading Patterns

### Using the UI (Recommended)

- Click **💾 Save** to download your current pattern as a JSON file
- Click **📁 Load** to upload a previously saved pattern file

The saved file includes:
- Your pattern sequence (all blocks) with velocity data per pad
- BPM setting
- Swing/shuffle amount
- Sound selections for each channel
- Volume levels per channel
- Mute states

Pattern files are backward compatible - old patterns (boolean on/off) work with new features (velocity system).

### Using JavaScript (Advanced)

```javascript
const myPattern = drumMachine.exportPattern();
console.log(JSON.stringify(myPattern));
// Copy the output and save it in a JSON file
```

### Import a pattern

```javascript
const patternData = {
    name: 'My Pattern',
    bpm: 128,
    soundMap: ['kick', 'snare', 'hihat', 'perc'],
    pattern: [
        [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
        [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
        [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ]
};

drumMachine.importPattern(patternData);
```

## 🎨 Customization

### Modify visual style
Edit `style.css` to change colors, sizes, gradients, etc.

### Add more channels or steps
In `app.js`, modify:
```javascript
this.channels = 8;  // Number of rows (instruments)
this.steps = 16;    // Number of columns (beats per block)
```

### Add new demo patterns
In `app.js`, inside `this.demoPatterns`, add:
```javascript
myNewPattern: {
    name: 'My Pattern Name',
    bpm: 120,                     // Recommended BPM
    blocks: 1,                    // 1, 2, 4, or 8 blocks
    soundSelections: [0,0,0,0,0,0,0,0], // Sound variant index per channel (0-4)
    pattern: [
        [1,0,0,0,...], // Kick (8 channels total)
        [0,0,1,0,...], // Snare
        [1,1,1,1,...], // HiHat
        [0,0,0,0,...], // Clap
        [0,0,0,0,...], // Tom
        [0,0,0,0,...], // Perc
        [0,0,0,0,...], // Cymbal
        [0,0,0,0,...]  // FX
    ]
}
```

**Pattern metadata:**
- `bpm`: Sets the tempo automatically when loaded
- `blocks`: Number of blocks (1=16 steps, 2=32, 4=64, 8=128)
- `soundSelections`: Array of 8 indices (0-4) to select which sound variant for each channel
- `pattern`: 2D array - 8 rows (channels) × steps (16 per block)

## 🚧 Future Ideas (Maybe Someday)

### Possible Extensions
- ✅ Export/Import patterns with full settings
- ✅ 8 channels with multiple sound variations
- ✅ Block system (1/2/4/8 blocks = up to 128 steps)
- ✅ Mute/Solo per channel (mute implemented)
- ✅ Volume control per channel
- ✅ Swing/Shuffle (0-75%)
- ✅ Velocity per pad (ghost/normal/accent)
- ✅ Multi-block view (see 1/2/4 blocks at once)
- ✅ Keyboard shortcuts for workflow
- ✅ Master bus compression for professional sound
- ⬜ Save to browser localStorage
- ⬜ Copy/paste blocks
- ⬜ Reverb/delay effects
- ⬜ Step subdivision (32 steps)
- ⬜ MIDI sync/export

## 📝 License & Contributing

This is a personal project shared under the MIT License - feel free to use it, modify it, or learn from it however you want.

If you find bugs or have ideas to improve it, I'd love to hear about them! Open an issue or submit a pull request if you want to contribute. No formal process needed - this is just a casual project, so any feedback or improvements are welcome.

## 🎯 About

Made by Oscar Periche as a personal experiment to play with the Web Audio API and build something fun for making beats.

Visit [oscarperiche.com](https://oscarperiche.com) to get to know me.

---

**Enjoy creating your own beats! 🥁🎶**
