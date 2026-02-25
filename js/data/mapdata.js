/**
 * mapdata.js
 *
 * Static map layout data for Word Defense.
 * Defines the enemy path (S-curve from top to bottom),
 * tower placement spots near the path, and the castle position.
 * Designed for a 576x1024 portrait canvas.
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
        { x: 288, y: -20 },    // spawn point (off-screen top)
        { x: 288, y: 90 },     // enter visible area
        { x: 496, y: 90 },     // turn right
        { x: 496, y: 250 },    // down right side
        { x: 80, y: 250 },     // cross left
        { x: 80, y: 410 },     // down left side
        { x: 496, y: 410 },    // cross right
        { x: 496, y: 570 },    // down right side
        { x: 80, y: 570 },     // cross left
        { x: 80, y: 700 },     // down left side
        { x: 288, y: 700 },    // center approach
        { x: 288, y: 820 }     // castle area
    ],

    /**
     * spots - Tower placement positions.
     * 3x3 equidistant grid between the path rows.
     */
    spots: [
        { x: 176, y: 170 },
        { x: 288, y: 170 },
        { x: 400, y: 170 },
        { x: 176, y: 330 },
        { x: 288, y: 330 },
        { x: 400, y: 330 },
        { x: 176, y: 490 },
        { x: 288, y: 490 },
        { x: 400, y: 490 }
    ],

    /**
     * castle - Position of the castle (end of the path).
     */
    castle: { x: 288, y: 820 }
};
