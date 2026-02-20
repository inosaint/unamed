# Agent E - TD Objects
## Tasks
- [x] Create `js/objects/Tower.js` - Game.Tower class extending Phaser.GameObjects.Image:
  - Constructor(scene, x, y, towerType): Create tower image using towerdata texture key. Store damage, range, fireRate, lastFired=0 from Game.TOWERS[towerType]
  - `update(time, enemies)`: Find nearest active enemy within range. If found and enough time since lastFired, call fire(). For wall type: no firing, instead apply slow to enemies in slowRange
  - `fire(target)`: Create a Bullet aimed at target enemy. Update lastFired timestamp
  - `drawRange(graphics)`: Draw semi-transparent range circle (for hover/selection feedback)
  - Tower should display its type visually (use the appropriate texture)
- [x] Create `js/objects/Enemy.js` - Game.Enemy class extending Phaser.GameObjects.Image:
  - Constructor(scene, path, speed, hp): Create enemy image using 'enemy' texture. Store path reference, speed, hp, maxHp. Start at path progress t=0
  - `update(delta)`: Advance along path based on speed and delta time. Update position using path.getPointAtProgress(t). If t >= 1, enemy reached the castle
  - `takeDamage(amount)`: Reduce HP. If HP <= 0, destroy and award nothing (currency is from words only). Flash white on hit
  - `updateHPBar(graphics)`: Draw small HP bar above enemy
  - `applySlow(factor, duration)`: Temporarily reduce speed
  - `reachedEnd()`: Returns true if t >= 1
- [x] Create `js/objects/Bullet.js` - Game.Bullet class extending Phaser.GameObjects.Image:
  - Constructor(scene, x, y, target, damage): Create bullet using 'bullet' texture. Store target enemy reference and damage
  - `update()`: Move toward target position at fixed speed (~400px/s). If close enough to target (within 10px), deal damage and destroy self. If target is dead/gone, destroy self
- [x] Create `js/managers/CurrencyManager.js` - Game.CurrencyManager object:
  - `init(registry)`: Store registry reference, set initial currency to 0
  - `get()`: Return current currency from registry
  - `add(amount)`: Add to currency in registry
  - `spend(amount)`: Deduct from currency. Returns true if successful, false if insufficient funds
  - `canAfford(amount)`: Returns true if currency >= amount
## Notes
- All classes use the global Game namespace
- Enemies use Game.Path's getPointAtProgress() for movement
- Towers reference Game.TOWERS data for stats
- CurrencyManager wraps Phaser registry for convenience
