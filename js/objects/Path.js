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
 * draw(graphics)
 *
 * Renders the path onto a Phaser Graphics object.
 * Draws a darker border line first for depth, then a lighter
 * tan/brown fill line on top.
 *
 * @param {Phaser.GameObjects.Graphics} graphics - The Phaser Graphics
 *   object to draw onto (should already be added to the scene).
 */
Game.Path.prototype.draw = function (graphics) {
    var wp = this.waypoints;

    // --- Border / shadow line (drawn first, slightly wider) ---
    graphics.lineStyle(46, 0x7a5c30, 1);
    graphics.beginPath();
    graphics.moveTo(wp[0].x, wp[0].y);
    for (var i = 1; i < wp.length; i++) {
        graphics.lineTo(wp[i].x, wp[i].y);
    }
    graphics.strokePath();

    // Fill corners with circles matching border line radius
    graphics.fillStyle(0x7a5c30, 1);
    for (var ci = 1; ci < wp.length - 1; ci++) {
        graphics.fillCircle(wp[ci].x, wp[ci].y, 23);
    }

    // --- Main path fill line ---
    graphics.lineStyle(40, 0xc2a060, 1);
    graphics.beginPath();
    graphics.moveTo(wp[0].x, wp[0].y);
    for (var j = 1; j < wp.length; j++) {
        graphics.lineTo(wp[j].x, wp[j].y);
    }
    graphics.strokePath();

    // Fill corners with circles matching fill line radius
    graphics.fillStyle(0xc2a060, 1);
    for (var cj = 1; cj < wp.length - 1; cj++) {
        graphics.fillCircle(wp[cj].x, wp[cj].y, 20);
    }
};
