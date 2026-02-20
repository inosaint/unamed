/**
 * Enemy.js
 *
 * Represents a single enemy that follows the path toward the castle.
 * Uses the goblin spritesheet with 8 walk-cycle frames played as
 * a looping animation. Flips horizontally when moving left.
 *
 * Extends Phaser.GameObjects.Sprite via ES5 prototype inheritance.
 *
 * Namespace: Game.Enemy
 */

window.Game = window.Game || {};

/**
 * @constructor
 * @extends Phaser.GameObjects.Sprite
 * @param {Phaser.Scene} scene - The scene this enemy belongs to.
 * @param {Game.Path}    path  - The path the enemy will follow.
 * @param {number}       speed - Movement speed in pixels per second.
 * @param {number}       hp    - Starting hit points.
 */
Game.Enemy = function (scene, path, speed, hp) {
    var pos = path.getPointAtProgress(0);

    // Call Sprite constructor with the goblin spritesheet
    Phaser.GameObjects.Sprite.call(this, scene, pos.x, pos.y, 'goblin', 0);

    this.path = path;
    this.pathProgress = 0;
    this.speed = speed;
    this.baseSpeed = speed;
    this.hp = hp;
    this.maxHp = hp;
    this.alive = true;
    this._slowed = false;

    // Scale down: goblin frames are 692x745, display at ~48px tall
    this.setScale(48 / 745);

    this.setDepth(8);
    scene.add.existing(this);

    // Start the walk cycle animation (all 8 frames looping)
    this.anims.play('goblin-walk', true);

    // HP bar
    this.hpBar = scene.add.graphics();
    this.hpBar.setDepth(9);
    this.updateHPBar();
};

// Prototype chain: Enemy extends Phaser.GameObjects.Sprite
Game.Enemy.prototype = Object.create(Phaser.GameObjects.Sprite.prototype);
Game.Enemy.prototype.constructor = Game.Enemy;

/**
 * update(delta)
 */
Game.Enemy.prototype.update = function (delta) {
    if (!this.alive) { return false; }

    var prevX = this.x;

    var distanceToMove = this.speed * (delta / 1000);
    var totalLength = this.path.getTotalLength();
    if (totalLength > 0) {
        this.pathProgress += distanceToMove / totalLength;
    }

    if (this.pathProgress > 1) {
        this.pathProgress = 1;
    }

    var pos = this.path.getPointAtProgress(this.pathProgress);
    this.x = pos.x;
    this.y = pos.y;

    // Flip sprite when moving left
    var dx = this.x - prevX;
    if (dx < -0.5) {
        this.setFlipX(true);
    } else if (dx > 0.5) {
        this.setFlipX(false);
    }

    this.updateHPBar();

    if (this.pathProgress >= 1) {
        return true;
    }
    return false;
};

/**
 * takeDamage(amount)
 */
Game.Enemy.prototype.takeDamage = function (amount) {
    if (!this.alive) { return; }

    this.hp -= amount;

    this.setTint(0xffffff);
    var self = this;
    if (this.scene) {
        this.scene.time.delayedCall(100, function () {
            if (self.alive) {
                self.clearTint();
            }
        });
    }

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
 */
Game.Enemy.prototype.updateHPBar = function () {
    if (!this.hpBar) { return; }

    this.hpBar.clear();

    if (!this.alive) { return; }

    var barWidth = 30;
    var barHeight = 4;
    var barX = this.x - barWidth / 2;
    var barY = this.y - 30; // above the scaled sprite

    this.hpBar.fillStyle(0x333333, 0.8);
    this.hpBar.fillRect(barX, barY, barWidth, barHeight);

    var fillWidth = (this.hp / this.maxHp) * barWidth;
    if (fillWidth > 0) {
        this.hpBar.fillStyle(0x00ff00, 1);
        this.hpBar.fillRect(barX, barY, fillWidth, barHeight);
    }
};

/**
 * applySlow(factor, duration)
 */
Game.Enemy.prototype.applySlow = function (factor, duration) {
    if (this._slowed || !this.alive) { return; }

    this._slowed = true;
    this.speed = this.baseSpeed * factor;
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
 */
Game.Enemy.prototype.reachedEnd = function () {
    return this.pathProgress >= 1;
};

/**
 * destroy()
 */
Game.Enemy.prototype.destroy = function () {
    if (this.hpBar) {
        this.hpBar.destroy();
        this.hpBar = null;
    }
    Phaser.GameObjects.Sprite.prototype.destroy.call(this);
};
