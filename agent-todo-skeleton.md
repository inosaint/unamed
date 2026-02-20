# Agent A - Skeleton
## Tasks
- [x] Create `css/style.css` - Dark background, centered canvas container, no scrollbars
- [x] Create `js/config.js` - Game namespace (`window.Game`), CONFIG constants (WIDTH: 1024, HEIGHT: 768, GRID_SIZE: 4, WORD_PHASE_TIME: 30, TILE_SIZE: 64, MIN_WORD_LENGTH: 3, scoring table, STARTING_CASTLE_HP: 20)
- [x] Create `js/scenes/BootScene.js` - Generate all placeholder textures (enemy: red circle 32px, basic tower: blue square 32px, archer tower: green square 32px, wall: brown square 32px, bullet: yellow circle 8px, castle: gray rect 64x48, path tile: tan, placement spot: semi-transparent green circle). Build dictionary trie from Game.WORDS. Transition to WordPhaseScene. Initialize registry values (currency: 0, castleHP: 20, round: 1, towers: [])
- [x] Create `js/main.js` - Phaser.Game instantiation with config (type: AUTO, width/height from CONFIG, parent: 'game-container', scene list: [BootScene, WordPhaseScene, BuildPhaseScene, WavePhaseScene], physics: arcade)
- [x] Create `index.html` - HTML shell loading Phaser 3.90.0 from CDN, all JS files in dependency order (config -> data files -> objects -> managers -> scenes -> main), link to style.css
## Notes
