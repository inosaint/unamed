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
            frameWidth: 704,
            frameHeight: 768
        });

        // Projectiles
        this.load.image('bullet', base + 'bullet.png');
        this.load.image('cannonball', base + 'cannonball.png');

        // Map elements
        this.load.image('placement_spot', base + 'placement_spot.png');
        this.load.image('path_straight_h', base + 'path_straight_h.png');
        this.load.image('path_straight_v', base + 'path_straight_v.png');
        this.load.image('path_corner_tr', base + 'path_corner_tr.png');
        this.load.image('path_corner_tl', base + 'path_corner_tl.png');
        this.load.image('path_corner_br', base + 'path_corner_br.png');
        this.load.image('path_corner_bl', base + 'path_corner_bl.png');
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
        this.load.image('gold', base + 'gold.png');
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

        console.log('[BootScene] Waiting for fonts...');
        var self = this;
        document.fonts.load('16px "Press Start 2P"').then(function () {
            console.log('[BootScene] Fonts loaded. Starting WordPhaseScene.');
            self.scene.start('WordPhaseScene');
        });
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
        // Goblin front-facing walk cycle (frames 0-3)
        this.anims.create({
            key: 'goblin-walk-down',
            frames: this.anims.generateFrameNumbers('goblin', {
                start: 0, end: 3
            }),
            frameRate: 8,
            repeat: -1
        });
        // Goblin left-facing walk cycle (frames 4, 6)
        this.anims.create({
            key: 'goblin-walk-left',
            frames: this.anims.generateFrameNumbers('goblin', {
                frames: [4, 6]
            }),
            frameRate: 6,
            repeat: -1
        });
        // Goblin right-facing walk cycle (frames 5, 7)
        this.anims.create({
            key: 'goblin-walk-right',
            frames: this.anims.generateFrameNumbers('goblin', {
                frames: [5, 7]
            }),
            frameRate: 6,
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
