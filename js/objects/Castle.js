/**
 * Castle.js
 *
 * The player's castle at the end of the enemy path.
 * Uses a 3-frame spritesheet showing damage states:
 *   Frame 0: intact (HP >= 20)
 *   Frame 1: damaged (HP < 20)
 *   Frame 2: destroyed (HP < 5)
 *
 * Namespace: Game.Castle
 */

window.Game = window.Game || {};

/**
 * @constructor
 * @param {Phaser.Scene} scene - The Phaser scene this castle belongs to.
 * @param {number} x - World x position.
 * @param {number} y - World y position.
 */
Game.Castle = function (scene, x, y) {
    this.scene = scene;

    // Create the castle sprite using the spritesheet (frame 0 = intact)
    this.sprite = scene.add.sprite(x, y, 'castle_sheet', 0);
    this.sprite.setDepth(5);

    // Scale down: frames are 917x1239, display at ~80px tall
    var displayH = 80;
    this.sprite.setScale(displayH / 1239);

    this.maxHp = scene.registry.get('castleMaxHp') ||
                 Game.CONFIG.STARTING_CASTLE_HP;
    this.hp = this.maxHp;

    // HP bar graphics
    this.hpBar = scene.add.graphics();
    this.hpBar.setDepth(6);
    this.updateHPBar();
};

/**
 * takeDamage(amount)
 */
Game.Castle.prototype.takeDamage = function (amount) {
    this.hp = Math.max(0, this.hp - amount);
    this._updateDamageFrame();
    this.updateHPBar();

    // Brief red tint flash
    this.sprite.setTint(0xff0000);
    var self = this;
    this.scene.time.delayedCall(150, function () {
        self.sprite.clearTint();
    });
};

/**
 * _updateDamageFrame()
 * Switches the spritesheet frame based on current HP.
 */
Game.Castle.prototype._updateDamageFrame = function () {
    if (this.hp < 5) {
        this.sprite.setFrame(2); // destroyed
    } else if (this.hp < 20) {
        this.sprite.setFrame(1); // damaged
    } else {
        this.sprite.setFrame(0); // intact
    }
};

/**
 * isDestroyed()
 */
Game.Castle.prototype.isDestroyed = function () {
    return this.hp <= 0;
};

/**
 * updateHPBar()
 */
Game.Castle.prototype.updateHPBar = function () {
    this.hpBar.clear();

    var barWidth = 60;
    var barHeight = 8;
    var x = this.sprite.x - barWidth / 2;
    var y = this.sprite.y - this.sprite.displayHeight / 2 - 14;

    // Dark background
    this.hpBar.fillStyle(0x333333, 1);
    this.hpBar.fillRect(x, y, barWidth, barHeight);

    // Coloured fill
    var ratio = this.hp / this.maxHp;
    var color = ratio > 0.5 ? 0x00cc00 : (ratio > 0.25 ? 0xcccc00 : 0xcc0000);
    this.hpBar.fillStyle(color, 1);
    this.hpBar.fillRect(x, y, barWidth * ratio, barHeight);

    // Border
    this.hpBar.lineStyle(1, 0x000000, 1);
    this.hpBar.strokeRect(x, y, barWidth, barHeight);
};
