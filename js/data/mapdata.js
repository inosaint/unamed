/**
 * mapdata.js
 *
 * Static map layout data for Word Defense.
 * Defines the enemy path (S-curve from top to bottom),
 * tower placement spots near the path, and the castle position.
 * Designed for a 1024x768 canvas.
 *
 * Namespace: Game.MAP
 */

window.Game = window.Game || {};

Game.MAP = {
    /**
     * path - Ordered array of {x, y} waypoints that enemies follow.
     * Forms an S-curve starting off-screen at the top-center and
     * winding down to the castle at the bottom.
     */
    path: [
        { x: 512, y: -20 },    // spawn point (off-screen top)
        { x: 512, y: 80 },     // enter visible area
        { x: 800, y: 80 },     // first turn right
        { x: 800, y: 230 },    // down right side
        { x: 200, y: 230 },    // cross left
        { x: 200, y: 380 },    // down left side
        { x: 800, y: 380 },    // cross right
        { x: 800, y: 530 },    // down right side
        { x: 512, y: 530 },    // center approach
        { x: 512, y: 680 }     // castle area
    ],

    /**
     * spots - Tower placement positions.
     * Each {x, y} is offset ~50-60px from the path so towers
     * sit beside it, not on it. Spread along the full route
     * to give players strategic choices at every bend.
     */
    spots: [
        // Along the first horizontal segment (top)
        { x: 600, y: 140 },
        { x: 700, y: 140 },

        // Near the first right-side descent
        { x: 860, y: 155 },

        // Along the second horizontal segment (upper-mid)
        { x: 650, y: 170 },
        { x: 400, y: 290 },
        { x: 300, y: 170 },

        // Near the left-side descent
        { x: 140, y: 305 },

        // Along the third horizontal segment (lower-mid)
        { x: 400, y: 440 },
        { x: 600, y: 320 },
        { x: 700, y: 440 },

        // Near the second right-side descent
        { x: 860, y: 455 },

        // Near the castle approach
        { x: 450, y: 590 },
        { x: 580, y: 590 }
    ],

    /**
     * castle - Position of the castle (end of the path).
     */
    castle: { x: 512, y: 700 }
};
