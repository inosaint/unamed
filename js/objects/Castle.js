/**
 * Castle.js
 *
 * The player's castle that sits at the end of the enemy path.
 * Enemies that reach the castle deal damage to it; when HP reaches
 * zero the game is lost. Displays a colour-coded HP bar above itself.
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
    /** @type {Phaser.Scene} */
    this.scene = scene;

    // Create the castle sprite using the pre-loaded 'castle' texture
    /** @type {Phaser.GameObjects.Image} */
    this.sprite = scene.add.image(x, y, 'castle');
    this.sprite.setDepth(5);

    // HP values — pull from the registry if another system set it,
    // otherwise fall back to the global config constant.
    /** @type {number} */
    this.maxHp = scene.registry.get('castleMaxHp') ||
                 Game.CONFIG.STARTING_CASTLE_HP;
    /** @type {number} */
    this.hp = this.maxHp;

    // Graphics object used to draw the HP bar above the sprite
    /** @type {Phaser.GameObjects.Graphics} */
    this.hpBar = scene.add.graphics();
    this.hpBar.setDepth(6);

    // Draw the initial (full) HP bar
    this.updateHPBar();
};

/**
 * takeDamage(amount)
 *
 * Reduces the castle's HP by the given amount, updates the HP bar,
 * and plays a brief red flash on the castle sprite.
 *
 * @param {number} amount - Damage to inflict (positive integer).
 */
Game.Castle.prototype.takeDamage = function (amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.updateHPBar();

    // Brief red tint flash for visual feedback
    this.sprite.setTint(0xff0000);

    var self = this;
    this.scene.time.delayedCall(150, function () {
        self.sprite.clearTint();
    });
};

/**
 * isDestroyed()
 *
 * @return {boolean} True when the castle has no HP remaining.
 */
Game.Castle.prototype.isDestroyed = function () {
    return this.hp <= 0;
};

/**
 * updateHPBar()
 *
 * Redraws the HP bar directly above the castle sprite.
 * Shows a dark background, a green/red fill proportional to
 * remaining HP, and a thin border.
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

    // Coloured fill — green when healthy, red when low
    var ratio = this.hp / this.maxHp;
    var color = ratio > 0.5 ? 0x00cc00 : (ratio > 0.25 ? 0xcccc00 : 0xcc0000);
    this.hpBar.fillStyle(color, 1);
    this.hpBar.fillRect(x, y, barWidth * ratio, barHeight);

    // Thin border
    this.hpBar.lineStyle(1, 0x000000, 1);
    this.hpBar.strokeRect(x, y, barWidth, barHeight);
};
