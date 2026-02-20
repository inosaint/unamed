/**
 * Bullet.js
 *
 * A projectile fired by a tower at an enemy. Travels toward its
 * target and deals damage on contact. Self-destructs if the target
 * dies before impact.
 *
 * Extends Phaser.GameObjects.Image via ES5 prototype inheritance.
 *
 * Namespace: Game.Bullet
 */

window.Game = window.Game || {};

/**
 * @constructor
 * @extends Phaser.GameObjects.Image
 * @param {Phaser.Scene}  scene  - The scene this bullet belongs to.
 * @param {number}        x      - Starting x position (tower location).
 * @param {number}        y      - Starting y position (tower location).
 * @param {Game.Enemy}    target - The enemy to fly toward.
 * @param {number}        damage      - Damage dealt on hit.
 * @param {number}        splashRadius - AoE radius (0 = single target).
 */
Game.Bullet = function (scene, x, y, target, damage, splashRadius) {
    // Call parent constructor
    Phaser.GameObjects.Image.call(this, scene, x, y, 'bullet');

    /**
     * The enemy this bullet is homing toward.
     * @type {Game.Enemy}
     */
    this.target = target;

    /**
     * Damage dealt to the target on impact.
     * @type {number}
     */
    this.damage = damage;

    /**
     * Travel speed in pixels per second.
     * @type {number}
     */
    this.speed = 400;

    /**
     * Splash damage radius. 0 means single-target only.
     * @type {number}
     */
    this.splashRadius = splashRadius || 0;

    /**
     * Whether the bullet is still in flight.
     * @type {boolean}
     */
    this.alive = true;

    // Render above towers and enemies
    this.setDepth(12);

    // Add to the scene display list
    scene.add.existing(this);
};

// Set up prototype chain: Bullet extends Phaser.GameObjects.Image
Game.Bullet.prototype = Object.create(Phaser.GameObjects.Image.prototype);
Game.Bullet.prototype.constructor = Game.Bullet;

/**
 * update(delta)
 *
 * Moves the bullet toward its target each frame. If the target is
 * no longer alive, the bullet self-destructs. If the bullet gets
 * close enough to the target (within 10px), it deals damage and
 * self-destructs.
 *
 * @param {number} delta - Time elapsed since last frame in ms.
 */
Game.Bullet.prototype.update = function (delta) {
    if (!this.alive) { return; }

    // If the target is dead or gone, destroy the bullet
    if (!this.target || !this.target.alive) {
        this.destroy();
        return;
    }

    // Calculate angle and distance to target
    var angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
    var dx = this.target.x - this.x;
    var dy = this.target.y - this.y;
    var distance = Math.sqrt(dx * dx + dy * dy);

    // Check if close enough to hit
    if (distance < 10) {
        if (this.splashRadius > 0 && this.scene && this.scene.enemies) {
            // Splash damage: hit all enemies within radius of impact point
            var enemies = this.scene.enemies;
            for (var s = 0; s < enemies.length; s++) {
                var e = enemies[s];
                if (!e.alive) continue;
                var sdx = e.x - this.target.x;
                var sdy = e.y - this.target.y;
                if (Math.sqrt(sdx * sdx + sdy * sdy) <= this.splashRadius) {
                    e.takeDamage(this.damage);
                }
            }
        } else {
            this.target.takeDamage(this.damage);
        }
        this.destroy();
        return;
    }

    // Move toward target
    var moveDistance = this.speed * (delta / 1000);
    this.x += Math.cos(angle) * moveDistance;
    this.y += Math.sin(angle) * moveDistance;
};

/**
 * destroy()
 *
 * Marks the bullet as dead and removes it from the scene.
 */
Game.Bullet.prototype.destroy = function () {
    this.alive = false;
    this.setVisible(false);
    this.setActive(false);

    // Call parent destroy
    Phaser.GameObjects.Image.prototype.destroy.call(this);
};
