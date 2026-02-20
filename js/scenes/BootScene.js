/**
 * BootScene.js
 *
 * The very first scene that runs. Responsibilities:
 *  1. Load sprite assets and generate any remaining placeholder textures.
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
    /*  preload – load sprite assets from disk                             */
    /* ------------------------------------------------------------------ */
    preload() {
        var self = this;
        var base = 'assets/processed/';

        // Log loading progress
        this.load.on('filecomplete', function (key) {
            console.log('[BootScene] Loaded: ' + key);
        });
        this.load.on('loaderror', function (file) {
            console.error('[BootScene] FAILED to load: ' + file.key + ' (' + file.url + ')');
        });

        // Towers
        this.load.image('tower_basic', base + 'tower_basic.png');
        this.load.image('tower_archer', base + 'tower_archer.png');
        this.load.image('tower_cannon', base + 'tower_cannon.png');

        // Enemy (directional spritesheet: 4 cols x 2 rows = 8 frames)
        this.load.spritesheet('goblin', base + 'goblin_sheet.png', {
            frameWidth: 692,
            frameHeight: 745
        });

        // Projectiles
        this.load.image('bullet', base + 'bullet.png');
        this.load.image('cannonball', base + 'cannonball.png');

        // Map elements
        this.load.image('placement_spot', base + 'placement_spot.png');
        this.load.image('path_tile', base + 'path_tile.png');
        this.load.image('grass', base + 'grass.png');

        // Word phase
        this.load.image('floor_tile', base + 'floor_tile.png');
        this.load.image('letter_tile', base + 'letter_tile.png');

        // Castle (3-frame spritesheet: intact, damaged, destroyed)
        this.load.spritesheet('castle_sheet', base + 'castle_sheet.png', {
            frameWidth: 917,
            frameHeight: 1239
        });

        // UI
        this.load.image('heart', base + 'heart.png');
    }

    /* ------------------------------------------------------------------ */
    /*  create – generate textures, build dictionary, init registry        */
    /* ------------------------------------------------------------------ */
    create() {
        console.log('[BootScene] Generating remaining placeholder textures...');
        this._generateTextures();

        console.log('[BootScene] Creating animations...');
        this._createAnimations();

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
        // Most textures are now loaded from assets/processed/ in preload().
        // Castle now uses castle_sheet spritesheet, no placeholder needed.
    }

    /* ------------------------------------------------------------------ */
    /*  Animation definitions                                              */
    /* ------------------------------------------------------------------ */
    _createAnimations() {
        // Goblin walk cycle: all 8 frames in sequence
        // Frames 0-3: front-facing walk, 4: front stance,
        // 5: left profile, 6: back view, 7: right profile
        this.anims.create({
            key: 'goblin-walk',
            frames: this.anims.generateFrameNumbers('goblin', {
                start: 0, end: 7
            }),
            frameRate: 8,
            repeat: -1
        });
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
