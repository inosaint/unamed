/**
 * CurrencyManager.js
 *
 * Manages the player's currency: earning from words, spending on
 * towers, and keeping the Phaser registry in sync.
 *
 * Namespace: Game.CurrencyManager
 */

window.Game = window.Game || {};

Game.CurrencyManager = {

    /**
     * Internal reference to the Phaser data registry.
     * Set during init().
     * @type {Phaser.Data.DataManager|null}
     * @private
     */
    _registry: null,

    /**
     * init(registry)
     *
     * Stores a reference to the Phaser registry and sets the initial
     * currency balance to 0.
     *
     * @param {Phaser.Data.DataManager} registry - The Phaser game registry
     *   (typically scene.registry or game.registry).
     */
    init: function (registry) {
        this._registry = registry;
        this._registry.set('currency', 0);
    },

    /**
     * get()
     *
     * Returns the player's current currency balance.
     *
     * @return {number} Current currency.
     */
    get: function () {
        return this._registry.get('currency') || 0;
    },

    /**
     * add(amount)
     *
     * Adds currency to the player's balance.
     *
     * @param {number} amount - Currency to add.
     */
    add: function (amount) {
        this._registry.set('currency', this.get() + amount);
    },

    /**
     * spend(amount)
     *
     * Deducts currency if the player can afford it.
     *
     * @param  {number} amount - Currency to deduct.
     * @return {boolean} True if the transaction succeeded, false if
     *   insufficient funds.
     */
    spend: function (amount) {
        if (this.canAfford(amount)) {
            this._registry.set('currency', this.get() - amount);
            return true;
        }
        return false;
    },

    /**
     * canAfford(amount)
     *
     * Checks whether the player has enough currency.
     *
     * @param  {number} amount - Amount to check.
     * @return {boolean} True if current balance >= amount.
     */
    canAfford: function (amount) {
        return this.get() >= amount;
    },

    /**
     * scoreWord(scene, wordLength)
     *
     * Awards currency based on the word length using the scoring table
     * defined in Game.CONFIG.SCORING. For words longer than the longest
     * key in the table, the highest defined reward is used.
     *
     * @param  {Phaser.Scene} scene      - Any active scene (unused but
     *   kept for backward compatibility).
     * @param  {number}       wordLength - Number of letters in the word.
     * @return {number} The reward amount awarded.
     */
    scoreWord: function (scene, wordLength) {
        var scoring = Game.CONFIG.SCORING;
        var keys = Object.keys(scoring).map(Number).sort(function (a, b) { return b - a; });
        var reward = 0;

        for (var i = 0; i < keys.length; i++) {
            if (wordLength >= keys[i]) {
                reward = scoring[keys[i]];
                break;
            }
        }

        if (reward > 0) {
            this.add(reward);
        }

        return reward;
    }
};
