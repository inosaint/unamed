/**
 * Tower.js
 *
 * Represents a single placed tower on the map. Handles targeting
 * the nearest enemy in range and firing bullets at it. Cannon-type
 * towers fire slow splash-damage projectiles.
 *
 * Extends Phaser.GameObjects.Image via ES5 prototype inheritance.
 *
 * Namespace: Game.Tower
 */

window.Game = window.Game || {};

/**
 * @constructor
 * @extends Phaser.GameObjects.Image
 * @param {Phaser.Scene} scene    - The scene this tower belongs to.
 * @param {number}       x        - World x position.
 * @param {number}       y        - World y position.
 * @param {string}       towerType - Tower type key (e.g. 'basic', 'archer', 'cannon').
 */
Game.Tower = function (scene, x, y, towerType) {
    // Look up stats from the tower data table
    var data = Game.TOWERS[towerType] || Game.TOWERS.basic;

    // Call parent constructor with the correct texture
    Phaser.GameObjects.Image.call(this, scene, x, y, data.textureKey);

    /**
     * Tower type key (e.g. 'basic', 'archer', 'wall').
     * @type {string}
     */
    this.towerType = towerType;

    /**
     * Damage dealt per bullet.
     * @type {number}
     */
    this.damage = data.damage;

    /**
     * Targeting range in pixels.
     * @type {number}
     */
    this.range = data.range;

    /**
     * Minimum interval between shots in milliseconds.
     * @type {number}
     */
    this.fireRate = data.fireRate;

    /**
     * Timestamp (game time in ms) of the last shot fired.
     * @type {number}
     */
    this.lastFired = 0;

    /**
     * For cannon towers: splash damage radius in pixels.
     * @type {number}
     */
    this.splashRadius = data.splashRadius || 0;

    // Ensure the tower renders above the path
    this.setDepth(10);

    // Add this game object to the scene's display list
    scene.add.existing(this);
};

// Set up prototype chain: Tower extends Phaser.GameObjects.Image
Game.Tower.prototype = Object.create(Phaser.GameObjects.Image.prototype);
Game.Tower.prototype.constructor = Game.Tower;

/**
 * update(time, enemies)
 *
 * Called each frame during the wave phase. Behaviour depends on tower type:
 *  - Shooting towers (basic, archer): find the nearest active enemy within
 *    range and fire a bullet if the cooldown has elapsed.
 *  - Wall towers: iterate through enemies and apply a slow effect to any
 *    that are within slowRange.
 *
 * @param {number}        time    - Current game time in ms.
 * @param {Game.Enemy[]}  enemies - Array of active enemies.
 */
Game.Tower.prototype.update = function (time, enemies) {
    if (!enemies || enemies.length === 0) {
        return;
    }

    // Find the nearest active enemy within range
    var nearest = null;
    var nearestDist = Infinity;

    for (var i = 0; i < enemies.length; i++) {
        var enemy = enemies[i];
        if (!enemy.alive) { continue; }

        var ex = enemy.x - this.x;
        var ey = enemy.y - this.y;
        var d = Math.sqrt(ex * ex + ey * ey);

        if (d <= this.range && d < nearestDist) {
            nearest = enemy;
            nearestDist = d;
        }
    }

    // Fire if a target is found and cooldown has elapsed
    if (nearest && (time - this.lastFired >= this.fireRate)) {
        this.fire(nearest, this.scene);
        this.lastFired = time;
    }
};

/**
 * fire(target, scene)
 *
 * Creates a new Game.Bullet from the tower's position aimed at the
 * given target enemy.
 *
 * @param {Game.Enemy}    target - The enemy to shoot at.
 * @param {Phaser.Scene}  scene  - The scene to create the bullet in.
 */
Game.Tower.prototype.fire = function (target, scene) {
    var bullet = new Game.Bullet(scene, this.x, this.y, target, this.damage, this.splashRadius);

    // If the scene maintains a bullets array, register the bullet
    if (scene.bullets) {
        scene.bullets.push(bullet);
    }
};

/**
 * drawRange(graphics)
 *
 * Draws a semi-transparent circle showing the tower's targeting range.
 * Used for UI feedback when hovering or selecting a tower.
 *
 * @param {Phaser.GameObjects.Graphics} graphics - Graphics object to draw on.
 */
Game.Tower.prototype.drawRange = function (graphics) {
    var radius = this.range;

    if (radius <= 0) { return; }

    graphics.lineStyle(2, 0xffffff, 0.5);
    graphics.fillStyle(0xffffff, 0.15);
    graphics.strokeCircle(this.x, this.y, radius);
    graphics.fillCircle(this.x, this.y, radius);
};
