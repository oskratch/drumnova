# DrumNova - Redrum-Style Drum Machine

An interactive rhythm machine inspired by Redrum, fully functional in the browser.

## 🎵 Features

- **16 steps x 8 channels** sequencer grid
- **Block system**: Choose 1, 2, 4, or 8 blocks for extended patterns (up to 128 steps total)
- **Block navigation**: Switch between blocks to program different sections
- **Seamless playback**: Play travels through all active blocks in sequence
- **Demo patterns** preconfigured (Rock Steady, Funk Soul, Boom Bap, Industrial Pulse, New Wave Icon, Four to the Floor, Tension Build, Poly Rhythm)
- **8 instrument channels**: Kick, Snare, HiHat, Clap, Tom, Perc, Cymbal, FX
- **Multiple sound variations**: 4-5 different sounds per instrument with enhanced variety
- **Mute buttons**: 🔊/🔇 per channel to silence individual instruments
- **BPM control** adjustable (60-200 BPM)
- **Visual interface** hardware-style with responsive colors
- **Web Audio API** for low-latency audio playback
- **Export/Import patterns** (ready for future features)

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
- **Play/Pause**: Start or pause playback
- **Stop**: Stop and return to beginning
- **Clear**: Erase current block's pattern
- **BPM Slider**: Adjust speed (60-200 BPM)
- **Sound selectors**: Choose different sounds for each instrument (4-5 variations each)
- **Mute buttons**: 🔊/🔇 per channel to silence individual instruments during playback
- **▶ Preview buttons**: Test individual instrument sounds (plays currently selected variant)
- **Demo Patterns**: Load pre-recorded bases into current block
- **Block buttons (1/2/4/8)**: Set how many blocks are active
- **◄ ► Navigation**: Switch between blocks to edit different sections

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

### Export your current pattern

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
    pattern: [
        [1,0,0,0,...], // Kick (8 channels total now)
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

## 🚧 Future Enhancements (Ready to Implement)

### Backend with PHP/Laravel (Optional)
If you want to add server functionality:
- Dynamic sound library management
- Save patterns to database
- Share patterns between users
- Authentication and user profiles

### Possible Extensions
- ✅ Export/Import patterns (already implemented at JS level)
- ✅ 8 channels with multiple sound variations
- ✅ Block system (1/2/4/8 blocks = up to 128 steps)
- ✅ Mute/Solo per channel (mute implemented)
- ⬜ Save to browser localStorage
- ⬜ Copy/paste blocks
- ⬜ Effects (reverb, delay, filter)
- ⬜ Volume control per channel
- ⬜ Swing/Shuffle
- ⬜ Step subdivision (32 steps)
- ⬜ MIDI sync/export

## 📝 License & Contributing

This project is open source and free to use, modify, and distribute. If you create improvements, fixes, or new features, please consider sharing them back with the community through GitHub issues or pull requests.

### How to Contribute
- **Report bugs**: Use GitHub Issues to report any problems you encounter
- **Suggest features**: Open issues with feature requests or ideas
- **Share your creations**: Post your patterns, modifications, or derivative works
- **Contribute code**: Fork the repository and submit pull requests for improvements

### GitHub Repository Setup
To make this project fully open source on GitHub:

1. **Enable Issues**: In repository settings, ensure "Issues" is enabled for bug reports and feature requests
2. **Enable Discussions** (optional): For community conversations and sharing patterns
3. **Add Topics**: Add relevant topics like `drum-machine`, `web-audio`, `javascript`, `music-production`
4. **Create Labels**: Set up labels for issues (bug, enhancement, question, etc.)
5. **Add License File**: Create a `LICENSE` file with MIT or similar permissive license
6. **Add Contributing Guidelines**: Create `CONTRIBUTING.md` with development guidelines

### Repository Visibility & Restrictions
- **Make it Public**: Set repository visibility to public so anyone can see and contribute
- **No Code of Conduct Required**: For a small personal project, a simple contribution guideline is sufficient
- **No Security Policy Needed**: Unless you plan to accept security reports
- **Branch Protection**: Consider protecting the main branch to require pull request reviews for changes

The goal is to create a welcoming space for music producers and developers to collaborate and share their drum machine creations!

## 🎯 Credits

Developed with passion for electronic music and clean code by Oscar Periche.
Visit [oscarperiche.com](https://oscarperiche.com) to get to know me.

---

**Enjoy creating your own beats! 🥁🎶**
