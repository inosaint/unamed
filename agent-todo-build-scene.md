# Agent F - Build Phase Scene
## Tasks
- [x] Create `js/scenes/BuildPhaseScene.js` - Tower placement scene with:
  - [x] `create()`: Render the TD map (draw path using Game.Path, draw placement spots, draw castle). Show UI panel with: currency display, round number, tower shop (3 tower types with cost labels), "Start Wave" button
  - [x] Render existing towers from registry (towers placed in previous rounds persist)
  - [x] Placement spots: Draw each spot from Game.MAP.spots as clickable circles using 'placement_spot' texture
  - [x] Tower shop: Display 3 options (Basic - 5g, Archer - 10g, Wall - 3g) in horizontal bar at top. Greyed out if can't afford. Click to select tower type, highlighted when selected
  - [x] On tower purchase: Deduct currency via CurrencyManager, add tower data {x, y, type} to registry towers array, render the new tower on the map
  - [x] "Start Wave" button: Prominent button that transitions to WavePhaseScene
  - [x] Show round number ("Round X - Build Phase")
  - [x] Auto-skip to wave if currency is 0 and no towers can be afforded (with a brief delay)
  - [x] On hover over placement spot, show range circle for selected tower type
  - [x] Uses ES6 class syntax matching BootScene pattern
## Notes
- Depends on: Path.js, Castle.js, CurrencyManager.js, towerdata.js, mapdata.js, config.js
- Reads/writes to Phaser registry for persistent tower state
- Placement spots that already have towers show the tower instead of the empty spot
- Flow: select tower type from shop bar -> click empty spot -> tower placed
