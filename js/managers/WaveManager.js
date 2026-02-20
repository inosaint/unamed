/**
 * WaveManager.js
 *
 * Handles spawning waves of enemies during the wave phase.
 * Determines enemy count, stats, and spawn timing based on
 * the current round number.
 *
 * Namespace: Game.WaveManager
 */

window.Game = window.Game || {};

/**
 * @constructor
 * @param {Phaser.Scene} scene - The scene this manager belongs to.
 * @param {Game.Path}    path  - The path enemies will follow.
 * @param {number}       round - Current round number (1-based).
 */
Game.WaveManager = function (scene, path, round) {
    /** @type {Phaser.Scene} */
    this.scene = scene;

    /** @type {Game.Path} */
    this.path = path;

    /** @type {number} */
    this.round = round;

    /** @type {number} Total enemies to spawn this wave. */
    this.enemyCount = 3 + (round * 2);

    /** @type {number} HP for each enemy this wave. */
    this.enemyHP = 30 + (round * 10);

    /** @type {number} Base movement speed in pixels per second. */
    this.enemySpeed = 60;

    /** @type {number} Milliseconds between each spawn. */
    this.spawnInterval = 1500;

    /** @type {number} How many enemies have been spawned so far. */
    this.enemiesSpawned = 0;

    /** @type {Phaser.Time.TimerEvent|null} */
    this.spawnTimer = null;
};

/**
 * start(onSpawn)
 *
 * Begins spawning enemies at regular intervals. Each tick creates
 * a new Game.Enemy and passes it to the onSpawn callback.
 *
 * @param {function} onSpawn - Callback receiving the newly created Game.Enemy.
 */
Game.WaveManager.prototype.start = function (onSpawn) {
    var self = this;

    this.spawnTimer = this.scene.time.addEvent({
        delay: this.spawnInterval,
        repeat: this.enemyCount - 1,
        callback: function () {
            var enemy = new Game.Enemy(
                self.scene,
                self.path,
                self.enemySpeed,
                self.enemyHP
            );
            self.enemiesSpawned++;

            if (onSpawn) {
                onSpawn(enemy);
            }
        }
    });
};

/**
 * getEnemyCount()
 *
 * @return {number} Total number of enemies for this wave.
 */
Game.WaveManager.prototype.getEnemyCount = function () {
    return this.enemyCount;
};

/**
 * isAllSpawned()
 *
 * @return {boolean} True if all enemies for this wave have been spawned.
 */
Game.WaveManager.prototype.isAllSpawned = function () {
    return this.enemiesSpawned >= this.enemyCount;
};

/**
 * isComplete()
 *
 * @return {boolean} True if all enemies have been spawned AND all are dead.
 */
Game.WaveManager.prototype.isComplete = function () {
    if (!this.isAllSpawned()) { return false; }

    var enemies = this.scene.enemies;
    if (!enemies) { return true; }

    for (var i = 0; i < enemies.length; i++) {
        if (enemies[i].alive) {
            return false;
        }
    }
    return true;
};

/**
 * getRemaining()
 *
 * @return {number} Count of alive enemies plus unspawned enemies.
 */
Game.WaveManager.prototype.getRemaining = function () {
    var unspawned = this.enemyCount - this.enemiesSpawned;
    var aliveCount = 0;

    var enemies = this.scene.enemies;
    if (enemies) {
        for (var i = 0; i < enemies.length; i++) {
            if (enemies[i].alive) {
                aliveCount++;
            }
        }
    }

    return aliveCount + Math.max(0, unspawned);
};

/**
 * destroy()
 *
 * Cleans up the spawn timer.
 */
Game.WaveManager.prototype.destroy = function () {
    if (this.spawnTimer) {
        this.spawnTimer.remove(false);
        this.spawnTimer = null;
    }
};
