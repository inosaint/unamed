/**
 * WavePhaseScene.js
 *
 * The combat phase. Enemies walk the path while towers auto-attack.
 * If enemies reach the castle it takes damage. When all enemies are
 * defeated the round increments and we return to the word phase.
 * If the castle is destroyed, a Game Over overlay is shown.
 *
 * Namespace: Game.WavePhaseScene
 */

window.Game = window.Game || {};

Game.WavePhaseScene = class WavePhaseScene extends Phaser.Scene {

    constructor() {
        super({ key: 'WavePhaseScene' });
    }

    create() {
        var self = this;

        // ---- Round info from registry ----
        this.round = this.registry.get('round') || 1;

        // ---- Build the path ----
        this.path = new Game.Path(Game.MAP.path);

        // ---- Background: tiled grass ----
        for (var bgY = 0; bgY < Game.CONFIG.HEIGHT; bgY += 64) {
            for (var bgX = 0; bgX < Game.CONFIG.WIDTH; bgX += 64) {
                this.add.image(bgX + 32, bgY + 32, 'grass').setDepth(0);
            }
        }

        // ---- Draw the path (above grass) ----
        this.mapGraphics = this.add.graphics();
        this.mapGraphics.setDepth(1);
        this.path.draw(this.mapGraphics);

        // ---- Castle ----
        this.castle = new Game.Castle(this, Game.MAP.castle.x, Game.MAP.castle.y);
        var castleHP = this.registry.get('castleHP');
        if (castleHP !== undefined && castleHP !== null) {
            this.castle.hp = castleHP;
            this.castle._updateDamageFrame();
            this.castle.updateHPBar();
        }

        // ---- Towers from registry ----
        this.towers = [];
        var towerData = this.registry.get('towers') || [];
        for (var i = 0; i < towerData.length; i++) {
            var td = towerData[i];
            var tower = new Game.Tower(this, td.x, td.y, td.type);
            this.towers.push(tower);
        }

        // ---- Enemies & bullets arrays ----
        this.enemies = [];
        this.bullets = [];

        // ---- Wave manager ----
        this.waveManager = new Game.WaveManager(this, this.path, this.round);
        this.waveManager.start(function (enemy) {
            self.enemies.push(enemy);
            self.updateEnemyCountText();
        });

        // ---- Track wave completion state ----
        this.waveComplete = false;
        this.gameOver = false;

        // ---- UI ----
        var FONT = Game.CONFIG.FONT;

        this.roundText = this.add.text(16, 16, 'Round: ' + this.round, {
            fontSize: '11px',
            fontFamily: FONT,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setDepth(20);

        this.castleHPText = this.add.text(16, 40, 'Castle HP: ' + this.castle.hp + '/' + this.castle.maxHp, {
            fontSize: '9px',
            fontFamily: FONT,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setDepth(20);

        this.enemyCountText = this.add.text(16, 60, 'Enemies: 0/' + this.waveManager.getEnemyCount(), {
            fontSize: '9px',
            fontFamily: FONT,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setDepth(20);
    }

    /**
     * update(time, delta)
     *
     * Main combat loop called every frame.
     */
    update(time, delta) {
        if (this.waveComplete || this.gameOver) {
            return;
        }

        // ---- 1. Update enemies (iterate backward for safe removal) ----
        var enemiesDefeated = 0;
        for (var i = this.enemies.length - 1; i >= 0; i--) {
            var enemy = this.enemies[i];

            if (!enemy.alive) {
                // Dead enemy: clean up and remove from array
                enemy.destroy();
                this.enemies.splice(i, 1);
                enemiesDefeated++;
                continue;
            }

            // Move enemy along path
            enemy.update(delta);

            // Check if enemy reached the end of the path
            if (enemy.reachedEnd()) {
                this.castle.takeDamage(1);
                this.registry.set('castleHP', this.castle.hp);
                this.updateCastleHPText();

                enemy.alive = false;
                enemy.destroy();
                this.enemies.splice(i, 1);
            }
        }

        // ---- 2. Update towers ----
        for (var t = 0; t < this.towers.length; t++) {
            this.towers[t].update(time, this.enemies);
        }

        // ---- 3. Update bullets (iterate backward for safe removal) ----
        for (var b = this.bullets.length - 1; b >= 0; b--) {
            var bullet = this.bullets[b];
            bullet.update(delta);

            if (!bullet.alive) {
                this.bullets.splice(b, 1);
            }
        }

        // ---- 4. Update UI ----
        this.updateCastleHPText();
        this.updateEnemyCountText();

        // ---- 5. Check lose condition ----
        if (this.castle.isDestroyed()) {
            this.gameOver = true;
            this.showGameOver();
            return;
        }

        // ---- 6. Check win condition ----
        if (this.waveManager.isAllSpawned() && this.enemies.length === 0) {
            this.waveComplete = true;
            this.showWaveComplete();
        }
    }

    // ---- UI helpers ----

    updateCastleHPText() {
        if (this.castleHPText) {
            this.castleHPText.setText('Castle HP: ' + this.castle.hp + '/' + this.castle.maxHp);
        }
    }

    updateEnemyCountText() {
        if (this.enemyCountText) {
            var remaining = this.waveManager.getRemaining();
            this.enemyCountText.setText('Enemies: ' + remaining + ' remaining');
        }
    }

    // ---- Wave complete ----

    showWaveComplete() {
        var self = this;

        // Brief "Wave Complete!" message
        var completeText = this.add.text(
            Game.CONFIG.WIDTH / 2,
            Game.CONFIG.HEIGHT / 2,
            'Wave Complete!',
            {
                fontSize: '24px',
                fontFamily: Game.CONFIG.FONT,
                color: '#ffdd00',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setDepth(30);

        // Increment round via RoundManager (falls back to manual if unavailable)
        if (Game.RoundManager && Game.RoundManager._registry) {
            Game.RoundManager.nextRound();
        } else {
            var nextRound = this.round + 1;
            this.registry.set('round', nextRound);
        }

        // Sync castle HP to registry
        this.registry.set('castleHP', this.castle.hp);

        // Clean up wave manager
        this.waveManager.destroy();

        // Transition to WordPhaseScene after a short delay
        this.time.delayedCall(2000, function () {
            completeText.destroy();
            self.scene.start('WordPhaseScene');
        });
    }

    // ---- Game Over ----

    showGameOver() {
        var self = this;

        // Clean up wave manager
        this.waveManager.destroy();

        // Dark overlay
        var overlay = this.add.rectangle(
            Game.CONFIG.WIDTH / 2,
            Game.CONFIG.HEIGHT / 2,
            Game.CONFIG.WIDTH,
            Game.CONFIG.HEIGHT,
            0x000000, 0.75
        ).setDepth(50);

        // "GAME OVER" text
        this.add.text(
            Game.CONFIG.WIDTH / 2,
            Game.CONFIG.HEIGHT / 2 - 80,
            'GAME OVER',
            {
                fontSize: '28px',
                fontFamily: Game.CONFIG.FONT,
                color: '#ff4444',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setDepth(51);

        // "You survived X rounds"
        var survivedRounds = this.round;
        this.add.text(
            Game.CONFIG.WIDTH / 2,
            Game.CONFIG.HEIGHT / 2 - 10,
            'You survived ' + survivedRounds + ' round' + (survivedRounds !== 1 ? 's' : ''),
            {
                fontSize: '11px',
                fontFamily: Game.CONFIG.FONT,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5).setDepth(51);

        // "Play Again" button
        var buttonBg = this.add.rectangle(
            Game.CONFIG.WIDTH / 2,
            Game.CONFIG.HEIGHT / 2 + 70,
            220, 50,
            0x4488ff, 1
        ).setDepth(51).setInteractive({ useHandCursor: true });

        var buttonText = this.add.text(
            Game.CONFIG.WIDTH / 2,
            Game.CONFIG.HEIGHT / 2 + 70,
            'Play Again',
            {
                fontSize: '13px',
                fontFamily: Game.CONFIG.FONT,
                color: '#ffffff'
            }
        ).setOrigin(0.5).setDepth(52);

        // Hover effects
        buttonBg.on('pointerover', function () {
            buttonBg.setFillStyle(0x66aaff, 1);
        });
        buttonBg.on('pointerout', function () {
            buttonBg.setFillStyle(0x4488ff, 1);
        });

        // Click handler: reset everything and restart
        buttonBg.on('pointerdown', function () {
            // Reset all game state via RoundManager (falls back to manual)
            if (Game.RoundManager && Game.RoundManager._registry) {
                Game.RoundManager.reset();
            } else {
                self.registry.set('round', 1);
                self.registry.set('currency', 0);
                self.registry.set('castleHP', Game.CONFIG.STARTING_CASTLE_HP);
                self.registry.set('towers', []);
            }

            // Transition to WordPhaseScene
            self.scene.start('WordPhaseScene');
        });
    }
};
