# TODO / Future Ideas

Planned and speculative work not yet scheduled, moved out of README.md to keep that file focused on current features.

## Near-term

- **Per-channel EQ / filter**, a filter node per channel for shaping each sound.
- **Delay effect**, a delay send alongside the existing reverb send.
- **Copy/paste blocks**, duplicate a single block's content into another block.
- **MIDI sync/export**, Web MIDI clock sync and/or MIDI file export.

## Redrum-authentic features

- **Choke groups**, e.g. an open hi-hat cuts off when the closed hi-hat fires on the same channel group. A defining trait of Redrum and classic 808/909-style machines.
- **Pitch/Decay per channel**, expose pitch and decay controls for each synthesized sound, similar to Redrum's per-channel sound tweaks. Builds directly on `createSyntheticSound()`.
- **Flam per step**, a double-hit with a short micro-delay, toggleable per step/channel, matching Redrum's Flam button.
- **Copy/Paste full pattern**, duplicate an entire pattern (not just a block) to another slot for quick variations, mirroring Redrum's Copy Pattern command.

## General usability

- **Solo per channel**, isolate a channel quickly, alongside the existing mute.
- **Export to WAV**, render the current pattern offline (`OfflineAudioContext`) and download it as an audio file.
- **Undo/Redo**, `Ctrl+Z` / `Ctrl+Shift+Z` history for pattern edits.
