/**
 * config.js
 *
 * Global namespace and configuration constants for Word Defense.
 * This file must be loaded before all other game scripts.
 */

// Establish the global Game namespace
window.Game = window.Game || {};

/**
 * CONFIG - All game-wide constants live here.
 * Other modules reference Game.CONFIG.* for dimensions, timings, etc.
 */
Game.CONFIG = {
    // Canvas / display
    WIDTH: 1024,
    HEIGHT: 768,

    // Boggle grid
    GRID_SIZE: 4,            // 4x4 letter grid
    MIN_WORD_LENGTH: 3,      // minimum letters for a valid word
    WORD_PHASE_TIME: 30,     // seconds for the word-finding phase

    // Map / tile
    TILE_SIZE: 64,           // pixels per map tile

    // Castle
    STARTING_CASTLE_HP: 20,

    // Scoring table: word length -> currency reward
    SCORING: {
        3: 1,
        4: 2,
        5: 4,
        6: 8,
        7: 16,
        8: 32
    }
};
