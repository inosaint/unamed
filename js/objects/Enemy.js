/**
 * Enemy.js
 *
 * Represents a single enemy that follows the path toward the castle.
 * Tracks its progress along the path, takes damage from towers, and
 * damages the castle if it reaches the end. Displays an HP bar above
 * the sprite.
 *
 * Extends Phaser.GameObjects.Image via ES5 prototype inheritance.
 *
 * Namespace: Game.Enemy
 */

window.Game = window.Game || {};

/**
 * @constructor
 * @extends Phaser.GameObjects.Image
 * @param {Phaser.Scene} scene - The scene this enemy belongs to.
 * @param {Game.Path}    path  - The path the enemy will follow.
 * @param {number}       speed - Movement speed in pixels per second.
 * @param {number}       hp    - Starting hit points.
 */
Game.Enemy = function (scene, path, speed, hp) {
    // Get the starting position from the path
    var pos = path.getPointAtProgress(0);

    // Call parent constructor
    Phaser.GameObjects.Image.call(this, scene, pos.x, pos.y, 'enemy');

    /**
     * Reference to the path this enemy follows.
     * @type {Game.Path}
     */
    this.path = path;

    /**
     * Progress along the path, from 0 (start) to 1 (castle).
     * @type {number}
     */
    this.pathProgress = 0;

    /**
     * Current movement speed in pixels per second.
     * May be temporarily reduced by slow effects.
     * @type {number}
     */
    this.speed = speed;

    /**
     * Original movement speed, used to restore after slow effects.
     * @type {number}
     */
    this.baseSpeed = speed;

    /**
     * Current hit points.
     * @type {number}
     */
    this.hp = hp;

    /**
     * Maximum hit points (used for HP bar proportional fill).
     * @type {number}
     */
    this.maxHp = hp;

    /**
     * Whether this enemy is still alive and active.
     * @type {boolean}
     */
    this.alive = true;

    /**
     * Whether a slow effect is currently active (prevents stacking).
     * @type {boolean}
     */
    this._slowed = false;

    // Render above the path
    this.setDepth(8);

    // Add to the scene display list
    scene.add.existing(this);

    // Create a Graphics object for the HP bar (rendered above the enemy)
    this.hpBar = scene.add.graphics();
    this.hpBar.setDepth(9);

    // Draw the initial HP bar
    this.updateHPBar();
};

// Set up prototype chain: Enemy extends Phaser.GameObjects.Image
Game.Enemy.prototype = Object.create(Phaser.GameObjects.Image.prototype);
Game.Enemy.prototype.constructor = Game.Enemy;

/**
 * update(delta)
 *
 * Advances the enemy along the path based on its speed and the elapsed
 * time. Updates the sprite position and HP bar each frame.
 *
 * @param  {number} delta - Time elapsed since last frame in ms.
 * @return {boolean} True if the enemy has reached the end of the path.
 */
Game.Enemy.prototype.update = function (delta) {
    if (!this.alive) { return false; }

    // Calculate distance to move this frame
    var distanceToMove = this.speed * (delta / 1000);

    // Convert pixel distance to path progress (0-1)
    var totalLength = this.path.getTotalLength();
    if (totalLength > 0) {
        this.pathProgress += distanceToMove / totalLength;
    }

    // Clamp progress
    if (this.pathProgress > 1) {
        this.pathProgress = 1;
    }

    // Update position from the path
    var pos = this.path.getPointAtProgress(this.pathProgress);
    this.x = pos.x;
    this.y = pos.y;

    // Update HP bar position
    this.updateHPBar();

    // Check if enemy has reached the end
    if (this.pathProgress >= 1) {
        return true;
    }

    return false;
};

/**
 * takeDamage(amount)
 *
 * Reduces the enemy's HP by the given amount. Flashes the sprite
 * white briefly on hit. If HP drops to zero or below, marks the
 * enemy as dead and hides it.
 *
 * @param {number} amount - Damage to inflict.
 */
Game.Enemy.prototype.takeDamage = function (amount) {
    if (!this.alive) { return; }

    this.hp -= amount;

    // Flash white on hit
    this.setTint(0xffffff);
    var self = this;
    if (this.scene) {
        this.scene.time.delayedCall(100, function () {
            if (self.alive) {
                self.clearTint();
            }
        });
    }

    // Update the HP bar to reflect new HP
    this.updateHPBar();

    if (this.hp <= 0) {
        this.hp = 0;
        this.alive = false;
        this.setVisible(false);
        this.setActive(false);
        if (this.hpBar) {
            this.hpBar.setVisible(false);
        }
    }
};

/**
 * updateHPBar()
 *
 * Draws a small HP bar (30x4 pixels) centered above the enemy sprite.
 * Background is dark grey; fill is green, proportional to current HP.
 */
Game.Enemy.prototype.updateHPBar = function () {
    if (!this.hpBar) { return; }

    this.hpBar.clear();

    if (!this.alive) { return; }

    var barWidth = 30;
    var barHeight = 4;
    var barX = this.x - barWidth / 2;
    var barY = this.y - 20; // above the sprite

    // Background (dark grey)
    this.hpBar.fillStyle(0x333333, 0.8);
    this.hpBar.fillRect(barX, barY, barWidth, barHeight);

    // Green fill proportional to remaining HP
    var fillWidth = (this.hp / this.maxHp) * barWidth;
    if (fillWidth > 0) {
        this.hpBar.fillStyle(0x00ff00, 1);
        this.hpBar.fillRect(barX, barY, fillWidth, barHeight);
    }
};

/**
 * applySlow(factor, duration)
 *
 * Temporarily reduces the enemy's speed by the given factor.
 * After the duration (in ms) elapses, speed is restored to baseSpeed.
 * Does not stack: if already slowed, the call is ignored.
 *
 * @param {number} factor   - Speed multiplier (e.g. 0.5 = half speed).
 * @param {number} duration - Duration of the slow effect in ms.
 */
Game.Enemy.prototype.applySlow = function (factor, duration) {
    if (this._slowed || !this.alive) { return; }

    this._slowed = true;
    this.speed = this.baseSpeed * factor;

    // Tint slightly blue to indicate slow
    this.setTint(0x8888ff);

    var self = this;
    if (this.scene) {
        this.scene.time.delayedCall(duration, function () {
            if (self.alive) {
                self.speed = self.baseSpeed;
                self.clearTint();
            }
            self._slowed = false;
        });
    }
};

/**
 * reachedEnd()
 *
 * @return {boolean} True if the enemy has reached the end of the path.
 */
Game.Enemy.prototype.reachedEnd = function () {
    return this.pathProgress >= 1;
};

/**
 * destroy()
 *
 * Cleans up the HP bar graphics and then calls the parent destroy.
 */
Game.Enemy.prototype.destroy = function () {
    if (this.hpBar) {
        this.hpBar.destroy();
        this.hpBar = null;
    }

    // Call parent destroy
    Phaser.GameObjects.Image.prototype.destroy.call(this);
};
