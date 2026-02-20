/**
 * towerdata.js
 *
 * Tower type definitions for Word Defense.
 * Each tower type specifies its cost, combat stats, visual color,
 * and the texture key used for rendering.
 *
 * Namespace: Game.TOWERS
 */

window.Game = window.Game || {};

Game.TOWERS = {
    /**
     * basic - Cheap, fast-firing tower with short range.
     * Good early-game option for covering tight path bends.
     */
    basic: {
        name: 'Basic',
        cost: 5,
        damage: 5,
        range: 100,
        fireRate: 800,          // ms between shots (fastest)
        color: 0x4444ff,
        textureKey: 'tower_basic'
    },

    /**
     * archer - Higher damage and longer range, but slower fire rate.
     * Best placed where it can cover long straight path segments.
     */
    archer: {
        name: 'Archer',
        cost: 10,
        damage: 12,
        range: 150,
        fireRate: 1800,         // ms between shots (medium)
        color: 0x44ff44,
        textureKey: 'tower_archer'
    },

    /**
     * cannon - Highest damage, slowest fire rate, splash damage in a radius.
     * Great for clusters of enemies on tight path bends.
     */
    cannon: {
        name: 'Cannon',
        cost: 8,
        damage: 15,
        range: 110,
        fireRate: 3000,         // ms between shots (slowest)
        splashRadius: 50,       // pixels — AoE radius on impact
        color: 0x8B4513,
        textureKey: 'tower_cannon'
    }
};
