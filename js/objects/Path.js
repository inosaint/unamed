/**
 * Path.js
 *
 * Represents the enemy travel path as a polyline defined by waypoints.
 * Provides distance-based interpolation so enemies can be placed at
 * any fractional progress (0-1) along the route, and a draw method
 * for rendering the path onto a Phaser Graphics object.
 *
 * Namespace: Game.Path
 */

window.Game = window.Game || {};

Game.Path = function (waypoints) {
    /**
     * The raw array of {x, y} waypoints that define the path.
     * @type {{x: number, y: number}[]}
     */
    this.waypoints = waypoints;

    /**
     * Length of each segment between consecutive waypoints (in pixels).
     * segments[i] = distance from waypoints[i] to waypoints[i+1].
     * @type {number[]}
     */
    this.segments = [];

    /**
     * Sum of all segment lengths.
     * @type {number}
     */
    this.totalLength = 0;

    // Pre-calculate segment lengths and total length
    for (var i = 0; i < waypoints.length - 1; i++) {
        var dx = waypoints[i + 1].x - waypoints[i].x;
        var dy = waypoints[i + 1].y - waypoints[i].y;
        var len = Math.sqrt(dx * dx + dy * dy);
        this.segments.push(len);
        this.totalLength += len;
    }
};

/**
 * getPointAtProgress(t)
 *
 * Returns the {x, y} world position at fractional progress t along
 * the full path. t=0 is the first waypoint, t=1 is the last.
 * Linearly interpolates between waypoints based on cumulative distance.
 *
 * @param  {number} t - Progress along the path, clamped to [0, 1].
 * @return {{x: number, y: number}} The interpolated position.
 */
Game.Path.prototype.getPointAtProgress = function (t) {
    // Clamp t to valid range
    if (t <= 0) {
        return { x: this.waypoints[0].x, y: this.waypoints[0].y };
    }
    if (t >= 1) {
        var last = this.waypoints[this.waypoints.length - 1];
        return { x: last.x, y: last.y };
    }

    // Convert fractional progress to a pixel distance along the path
    var targetDist = t * this.totalLength;
    var accumulated = 0;

    for (var i = 0; i < this.segments.length; i++) {
        var segLen = this.segments[i];

        if (accumulated + segLen >= targetDist) {
            // The target point lies within this segment
            var segProgress = (targetDist - accumulated) / segLen;
            var ax = this.waypoints[i].x;
            var ay = this.waypoints[i].y;
            var bx = this.waypoints[i + 1].x;
            var by = this.waypoints[i + 1].y;

            return {
                x: ax + (bx - ax) * segProgress,
                y: ay + (by - ay) * segProgress
            };
        }

        accumulated += segLen;
    }

    // Fallback (should not be reached)
    var end = this.waypoints[this.waypoints.length - 1];
    return { x: end.x, y: end.y };
};

/**
 * getTotalLength()
 *
 * @return {number} The total path length in pixels.
 */
Game.Path.prototype.getTotalLength = function () {
    return this.totalLength;
};

/**
 * draw(scene, depth)
 *
 * Renders the path using sliced sprite tiles (corners + straights).
 * Places corner pieces at interior waypoints and tiles straight
 * segments between them.
 *
 * @param {Phaser.Scene} scene - The scene to add images to.
 * @param {number} [depth=1] - Depth for the path sprites.
 */
Game.Path.prototype.draw = function (scene, depth) {
    if (depth === undefined) depth = 1;
    var wp = this.waypoints;
    var TILE = 64;
    var STEP = TILE - 2; // overlap tiles by 2px to prevent seams

    // Helper: determine direction from wp[i] to wp[i+1]
    function segDir(i) {
        var dx = wp[i + 1].x - wp[i].x;
        var dy = wp[i + 1].y - wp[i].y;
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'right' : 'left';
        }
        return dy > 0 ? 'down' : 'up';
    }

    // 1. Tile straight segments between consecutive waypoints.
    //    Inset by TILE at interior waypoints (corners) so tiles don't poke past.
    var HALF = TILE / 2;
    var INSET = TILE; // full tile inset at corners
    for (var s = 0; s < wp.length - 1; s++) {
        var ax = wp[s].x, ay = wp[s].y;
        var bx = wp[s + 1].x, by = wp[s + 1].y;
        var horizontal = Math.abs(bx - ax) > Math.abs(by - ay);

        // Is the start/end waypoint an interior point (corner)?
        var sCorner = (s > 0);
        var eCorner = (s + 1 < wp.length - 1);

        if (horizontal) {
            var rawMin = Math.min(ax, bx);
            var rawMax = Math.max(ax, bx);
            var minX = rawMin + ((ax < bx ? sCorner : eCorner) ? INSET : 0);
            var maxX = rawMax - ((ax < bx ? eCorner : sCorner) ? INSET : 0);
            for (var tx = minX; tx <= maxX; tx += STEP) {
                scene.add.image(tx, ay, 'path_straight_h')
                    .setDisplaySize(TILE, TILE).setDepth(depth);
            }
            scene.add.image(maxX, ay, 'path_straight_h')
                .setDisplaySize(TILE, TILE).setDepth(depth);
        } else {
            var rawMinY = Math.min(ay, by);
            var rawMaxY = Math.max(ay, by);
            var minY = rawMinY + ((ay < by ? sCorner : eCorner) ? INSET : 0);
            var maxY = rawMaxY - ((ay < by ? eCorner : sCorner) ? INSET : 0);
            for (var ty = minY; ty <= maxY; ty += STEP) {
                scene.add.image(ax, ty, 'path_straight_v')
                    .setDisplaySize(TILE, TILE).setDepth(depth);
            }
            scene.add.image(ax, maxY, 'path_straight_v')
                .setDisplaySize(TILE, TILE).setDepth(depth);
        }
    }

    // 2. Place corner sprites at interior waypoints (on top of straights)
    for (var c = 1; c < wp.length - 1; c++) {
        var fromDir = segDir(c - 1);
        var toDir = segDir(c);
        var cornerKey = null;

        if ((fromDir === 'down' && toDir === 'right') || (fromDir === 'left' && toDir === 'up')) {
            cornerKey = 'path_corner_bl';
        } else if ((fromDir === 'down' && toDir === 'left') || (fromDir === 'right' && toDir === 'up')) {
            cornerKey = 'path_corner_br';
        } else if ((fromDir === 'up' && toDir === 'right') || (fromDir === 'left' && toDir === 'down')) {
            cornerKey = 'path_corner_tl';
        } else if ((fromDir === 'up' && toDir === 'left') || (fromDir === 'right' && toDir === 'down')) {
            cornerKey = 'path_corner_tr';
        }

        if (cornerKey) {
            scene.add.image(wp[c].x, wp[c].y, cornerKey)
                .setDisplaySize(TILE, TILE).setDepth(depth + 0.1);
        }
    }
};
