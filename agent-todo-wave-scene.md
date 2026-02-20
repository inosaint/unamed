# Agent G - Wave Phase Scene
## Tasks
- [x] Create `js/scenes/WavePhaseScene.js` - Combat scene with:
  - `create()`: Render TD map (path, placed towers from registry, castle with HP). Initialize enemy group. Create Tower instances from registry data. Start enemy spawning via WaveManager
  - `update(time, delta)`: Update all enemies (movement along path), all towers (targeting + firing), all bullets (movement + collision). Check for enemies reaching castle (deal 1 damage each). Check win condition (all enemies dead) and lose condition (castle HP <= 0)
  - Enemy spawning: Use WaveManager to spawn enemies at intervals. Number of enemies = 3 + (round * 2). Spawn interval ~1500ms
  - On enemy reaching castle: Enemy destroyed, castle takes 1 damage, flash/shake effect
  - On all enemies defeated: Brief victory message, increment round in registry, transition to WordPhaseScene for next round
  - On castle destroyed: Game Over overlay with final score (round reached), "Play Again" button that resets everything
  - Tower rendering: Create actual Tower game objects from registry tower data. Each tower gets update() called
  - HP bars: Enemies show small HP bars above them
  - Display: Round number, castle HP, enemies remaining count
- [x] Create `js/managers/WaveManager.js` - Game.WaveManager class:
  - Constructor(scene, path, round): Calculate enemy count (3 + round * 2), enemy HP (30 + round * 10), enemy speed (based on path length, ~60px/s base)
  - `start()`: Begin spawning enemies at regular intervals using scene.time.addEvent
  - `getEnemyCount()`: Total enemies for this wave
  - `isAllSpawned()`: Returns true when all enemies spawned
  - `isComplete()`: Returns true when all spawned AND all enemies dead
  - `getRemaining()`: Returns count of alive + unspawned enemies
  - `onEnemySpawn` callback: Creates new Enemy instance at path start
  - `destroy()`: Cleans up spawn timer
## Status: COMPLETE
## Notes
- Depends on: Tower.js, Enemy.js, Bullet.js, Path.js, Castle.js, CurrencyManager.js, mapdata.js
- Wall towers apply slow effect to enemies in range rather than shooting
- Bullets use Phaser arcade physics for simple movement, or manual position update
- Castle HP is persisted in registry between rounds
- RoundManager integration with fallback to manual registry updates
