/**
 * BootScene.js
 *
 * The very first scene that runs. Responsibilities:
 *  1. Generate all placeholder textures (no external assets needed).
 *  2. Build the dictionary trie from the word list.
 *  3. Initialise Phaser registry values used across scenes.
 *  4. Transition to WordPhaseScene.
 */

window.Game = window.Game || {};

Game.BootScene = class BootScene extends Phaser.Scene {

    constructor() {
        super({ key: 'BootScene' });
    }

    /* ------------------------------------------------------------------ */
    /*  preload – nothing to load from disk; textures are generated below  */
    /* ------------------------------------------------------------------ */
    preload() {
        // intentionally empty
    }

    /* ------------------------------------------------------------------ */
    /*  create – generate textures, build dictionary, init registry        */
    /* ------------------------------------------------------------------ */
    create() {
        console.log('[BootScene] Generating placeholder textures...');
        this._generateTextures();

        console.log('[BootScene] Building dictionary trie...');
        this._buildDictionary();

        console.log('[BootScene] Initialising registry...');
        this._initRegistry();

        console.log('[BootScene] Boot complete. Starting WordPhaseScene.');
        this.scene.start('WordPhaseScene');
    }

    /* ------------------------------------------------------------------ */
    /*  Texture generation helpers                                         */
    /* ------------------------------------------------------------------ */
    _generateTextures() {
        const g = this.add.graphics();

        // --- enemy: red filled circle, 32x32 ---
        g.clear();
        g.fillStyle(0xff3333, 1);
        g.fillCircle(16, 16, 16);
        g.generateTexture('enemy', 32, 32);

        // --- tower_basic: blue filled square, 32x32 ---
        g.clear();
        g.fillStyle(0x3366ff, 1);
        g.fillRect(0, 0, 32, 32);
        g.generateTexture('tower_basic', 32, 32);

        // --- tower_archer: green filled square, 32x32 ---
        g.clear();
        g.fillStyle(0x33cc66, 1);
        g.fillRect(0, 0, 32, 32);
        g.generateTexture('tower_archer', 32, 32);

        // --- tower_cannon: brown filled diamond, 32x32 ---
        g.clear();
        g.fillStyle(0x8b6914, 1);
        g.fillTriangle(16, 2, 2, 30, 30, 30);
        g.generateTexture('tower_cannon', 32, 32);

        // --- bullet: yellow filled circle, 8x8 ---
        g.clear();
        g.fillStyle(0xffff00, 1);
        g.fillCircle(4, 4, 4);
        g.generateTexture('bullet', 8, 8);

        // --- castle: gray filled rectangle, 64x48 ---
        g.clear();
        g.fillStyle(0x999999, 1);
        g.fillRect(0, 0, 64, 48);
        g.generateTexture('castle', 64, 48);

        // --- path_tile: tan square, 64x64 (one map tile) ---
        g.clear();
        g.fillStyle(0xd2b48c, 1);
        g.fillRect(0, 0, 64, 64);
        g.generateTexture('path_tile', 64, 64);

        // --- placement_spot: semi-transparent green circle, 40x40 ---
        g.clear();
        g.fillStyle(0x00ff00, 0.35);
        g.fillCircle(20, 20, 20);
        g.generateTexture('placement_spot', 40, 40);

        // Clean up the temporary graphics object
        g.destroy();
    }

    /* ------------------------------------------------------------------ */
    /*  Dictionary                                                         */
    /* ------------------------------------------------------------------ */
    _buildDictionary() {
        // Game.WORDS is expected to be set by js/data/wordlist.js
        // Game.Dictionary is expected to be set by js/objects/Dictionary.js
        if (Game.Dictionary && Game.WORDS) {
            Game.Dictionary.build(Game.WORDS);
        } else {
            console.warn('[BootScene] Dictionary or word list not found – skipping trie build.');
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Registry initialisation                                            */
    /* ------------------------------------------------------------------ */
    _initRegistry() {
        this.registry.set('currency', 0);
        this.registry.set('castleHP', Game.CONFIG.STARTING_CASTLE_HP);
        this.registry.set('round', 1);
        this.registry.set('towers', []);

        // Initialise managers with a reference to the shared registry
        if (Game.RoundManager) {
            Game.RoundManager.init(this.registry);
        }
        if (Game.CurrencyManager) {
            Game.CurrencyManager._registry = this.registry;
        }
    }
};
