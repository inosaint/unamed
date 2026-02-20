/**
 * main.js
 *
 * Entry point for Word Defense.
 * Creates the Phaser.Game instance with the full scene list and arcade physics.
 * This file must be loaded LAST so that all scenes and helpers are available.
 */

window.Game = window.Game || {};

(function () {
    'use strict';

    var config = {
        type: Phaser.AUTO,
        width: Game.CONFIG.WIDTH,
        height: Game.CONFIG.HEIGHT,
        parent: 'game-container',
        backgroundColor: 0x1a1a2e,

        physics: {
            default: 'arcade',
            arcade: {
                // No gravity for a top-down tower defense game
                gravity: { x: 0, y: 0 },
                debug: false
            }
        },

        scene: [
            Game.BootScene,
            Game.WordPhaseScene,
            Game.BuildPhaseScene,
            Game.WavePhaseScene
        ]
    };

    // Instantiate the game and store a reference on the namespace
    Game.instance = new Phaser.Game(config);

    console.log('[main.js] Phaser game created.');
})();
