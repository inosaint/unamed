# Agent C - Map & Data
## Tasks
- [x] Create `js/data/mapdata.js` - `Game.MAP` object with: `path` (array of {x,y} waypoints forming an S-curve, entry at top, castle at bottom, designed for 1024x768 canvas), `spots` (array of ~10-12 {x,y} tower placement positions near the path but not on it), `castle` ({x,y} position at path end)
- [x] Create `js/data/towerdata.js` - `Game.TOWERS` object with tower type definitions: `basic` (cost: 5, damage: 10, range: 100, fireRate: 1000ms, color: 0x4444ff), `archer` (cost: 10, damage: 25, range: 150, fireRate: 1500ms, color: 0x44ff44), `wall` (cost: 3, damage: 0, range: 0, slowFactor: 0.5, color: 0x8B4513)
- [x] Create `js/objects/Path.js` - `Game.Path` class. Constructor takes waypoints array. Method `getPointAtProgress(t)` returns {x,y} position along the full path at progress 0-1 (interpolates between waypoints). Method `getTotalLength()` returns path length in pixels. Method `draw(graphics)` renders the path as thick tan/brown lines on a Phaser Graphics object
- [x] Create `js/objects/Castle.js` - `Game.Castle` class. Constructor takes scene, x, y. Creates a Phaser image using the 'castle' texture. Has `hp` and `maxHp` properties. Method `takeDamage(amount)` reduces HP and updates HP bar. Method `isDestroyed()` returns hp <= 0. Draws an HP bar above the castle sprite
## Notes
