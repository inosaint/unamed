window.Game = window.Game || {};

Game.RoundManager = {
    _registry: null,

    init: function(registry) {
        this._registry = registry;
    },

    getRound: function() {
        if (this._registry) return this._registry.get('round') || 1;
        return 1;
    },

    nextRound: function() {
        if (this._registry) {
            var current = this.getRound();
            this._registry.set('round', current + 1);
            return current + 1;
        }
        return 1;
    },

    getEnemyCount: function() {
        return 3 + this.getRound() * 2;
    },

    getEnemyHP: function() {
        return 30 + this.getRound() * 10;
    },

    getEnemySpeed: function() {
        return 60; // constant base speed for prototype
    },

    reset: function() {
        if (this._registry) {
            this._registry.set('round', 1);
            this._registry.set('currency', 0);
            this._registry.set('castleHP', Game.CONFIG.STARTING_CASTLE_HP);
            this._registry.set('towers', []);
        }
    }
};
