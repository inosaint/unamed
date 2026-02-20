# Agent D - Word Phase Scene
## Tasks
- [x] Create `js/scenes/WordPhaseScene.js` - Full Boggle word-finding scene with:
  - [x] `init(data)`: Receive any data from previous scene
  - [x] `create()`: Generate new BoggleGrid, render 4x4 letter tiles (centered on screen), set up timer (30s), init found words list, current selection path, score display
  - [x] Tile rendering: 4x4 grid of rounded rectangles with letters centered in each. Use TILE_SIZE from config (64px). Tiles should look clean with a slight border
  - [x] Drag input system:
    - [x] `pointerdown` on a tile: start new selection path, highlight tile
    - [x] `pointermove`: detect which tile pointer is over. If adjacent to last tile in path and not already in path, add it. If it's the second-to-last tile (dragging backward), pop last tile (undo). Draw lines between selected tiles
    - [x] `pointerup`: submit the word. Validate via Dictionary.isWord(). If valid and not already found, add to found list, award currency per scoring table. If invalid, flash red briefly
  - [x] Real-time feedback: Use Dictionary.isPrefix() during drag. If current path is not a valid prefix, tint the selection differently (e.g., reddish) to signal dead end
  - [x] Timer: countdown from 30s displayed prominently at top. When reaches 0, auto-transition to BuildPhaseScene
  - [x] Found words list: displayed on right side, scrollable if many words. Show word and its point value
  - [x] Currency earned display: running total at top
  - [x] Visual polish: highlight valid path in yellow/gold, invalid prefix in red, smooth line drawing between tiles
  - [x] On phase end: store earned currency in registry, transition to BuildPhaseScene
## Notes
- Depends on: BoggleGrid.js, Dictionary.js, config.js (Game.CONFIG.SCORING, WORD_PHASE_TIME, etc.)
- Uses Phaser registry for persistent state (this.registry)
