/**
 * WordPhaseScene.js
 *
 * The Boggle word-finding phase. Players swipe on a 4x4 letter grid
 * to form English words and earn currency before the build phase.
 *
 * This is the core novel mechanic of Word Defense.
 */

window.Game = window.Game || {};

Game.WordPhaseScene = class WordPhaseScene extends Phaser.Scene {

    constructor() {
        super({ key: 'WordPhaseScene' });
    }

    /* ------------------------------------------------------------------ */
    /*  init – receive data from previous scene                            */
    /* ------------------------------------------------------------------ */
    init(data) {
        // data may contain info from a previous round; we pull state
        // from the registry which persists across scenes.
    }

    /* ------------------------------------------------------------------ */
    /*  create – build the entire word-finding UI                          */
    /* ------------------------------------------------------------------ */
    create() {
        var self = this;
        var CFG = Game.CONFIG;

        // ---- State ----
        this.boggleGrid = new Game.BoggleGrid();
        this.selectionPath = [];       // array of {row, col}
        this.isDragging = false;
        this.foundWords = new Set();
        this.foundWordsList = [];      // ordered array for display: {word, points}
        this.earnedCurrency = 0;
        this.timeRemaining = CFG.WORD_PHASE_TIME;
        this.phaseOver = false;

        // ---- Layout constants ----
        var TILE = CFG.TILE_SIZE;       // 64
        var GAP = 8;                    // gap between tiles
        var CELL = TILE + GAP;          // 72 total cell pitch
        var GRID_COLS = CFG.GRID_SIZE;  // 4
        var GRID_ROWS = CFG.GRID_SIZE;  // 4

        // Grid origin: centered horizontally, shifted up to leave room for words below
        var gridWidth = GRID_COLS * CELL - GAP;
        var gridHeight = GRID_ROWS * CELL - GAP;
        this.gridStartX = CFG.WIDTH / 2 - gridWidth / 2;
        this.gridStartY = 120;
        this.cellPitch = CELL;
        this.tileSize = TILE;

        // ---- Background ----
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // ---- Round display (top left) ----
        var round = this.registry.get('round') || 1;
        this.add.text(20, 16, 'Round ' + round, {
            fontFamily: 'monospace',
            fontSize: '22px',
            color: '#aaaacc'
        });

        // ---- Timer display (top center) ----
        this.timerText = this.add.text(CFG.WIDTH / 2, 16, this._formatTime(this.timeRemaining), {
            fontFamily: 'monospace',
            fontSize: '36px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        // ---- Currency display (top right area) ----
        this.currencyText = this.add.text(CFG.WIDTH - 20, 16, 'Earned: 0', {
            fontFamily: 'monospace',
            fontSize: '22px',
            color: '#ffd700'
        }).setOrigin(1, 0);

        // ---- Current word being built (above grid) ----
        this.currentWordText = this.add.text(
            this.gridStartX + gridWidth / 2,
            this.gridStartY - 48,
            '',
            {
                fontFamily: 'monospace',
                fontSize: '32px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5, 0.5);

        // ---- Graphics layer for lines and tile highlights ----
        this.lineGraphics = this.add.graphics();
        this.highlightGraphics = this.add.graphics();

        // ---- Render the 4x4 grid tiles ----
        this.tileBackgrounds = [];  // 2D array of Graphics objects
        this.tileLetters = [];      // 2D array of Text objects

        for (var row = 0; row < GRID_ROWS; row++) {
            this.tileBackgrounds[row] = [];
            this.tileLetters[row] = [];
            for (var col = 0; col < GRID_COLS; col++) {
                var tx = this.gridStartX + col * CELL;
                var ty = this.gridStartY + row * CELL;

                // Tile background: rounded rectangle
                var bg = this.add.graphics();
                bg.fillStyle(0x2d2d5e, 1);
                bg.fillRoundedRect(tx, ty, TILE, TILE, 8);
                bg.lineStyle(2, 0x4a4a8a, 1);
                bg.strokeRoundedRect(tx, ty, TILE, TILE, 8);
                this.tileBackgrounds[row][col] = bg;

                // Letter text centered in tile
                var letter = this.boggleGrid.getLetterAt(row, col);
                var txt = this.add.text(tx + TILE / 2, ty + TILE / 2, letter, {
                    fontFamily: 'monospace',
                    fontSize: '28px',
                    color: '#e0e0ff',
                    fontStyle: 'bold'
                }).setOrigin(0.5, 0.5);
                this.tileLetters[row][col] = txt;
            }
        }

        // ---- Found words section (below grid) ----
        var wordsAreaY = this.gridStartY + gridHeight + 60;
        this.foundWordsTexts = [];
        this.wordsAreaY = wordsAreaY;
        this.wordsAreaCenterX = CFG.WIDTH / 2;
        this.listMaxVisible = 24;

        // Word count label
        this.wordCountText = this.add.text(CFG.WIDTH / 2, wordsAreaY - 28, '0 words found', {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#aaaacc'
        }).setOrigin(0.5, 0);

        // ---- Instruction text (between grid and words) ----
        this.add.text(
            this.gridStartX + gridWidth / 2,
            this.gridStartY + gridHeight + 16,
            'Drag across letters to form words!',
            {
                fontFamily: 'monospace',
                fontSize: '16px',
                color: '#666688'
            }
        ).setOrigin(0.5, 0);

        // ---- Timer event (ticks every second) ----
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this._onTimerTick,
            callbackScope: this,
            loop: true
        });

        // ---- Input handlers ----
        // We use a full-scene interactive zone for the grid area
        this.input.on('pointerdown', function (pointer) {
            if (self.phaseOver) return;
            var cell = self._pointerToCell(pointer);
            if (cell) {
                self._startSelection(cell.row, cell.col);
            }
        });

        this.input.on('pointermove', function (pointer) {
            if (self.phaseOver) return;
            if (!self.isDragging) return;
            var cell = self._pointerToCell(pointer);
            if (cell) {
                self._continueSelection(cell.row, cell.col);
            }
        });

        this.input.on('pointerup', function (pointer) {
            if (self.phaseOver) return;
            if (self.isDragging) {
                self._submitWord();
            }
        });

        console.log('[WordPhaseScene] Word phase started. Find words in 30 seconds!');
    }

    /* ================================================================== */
    /*  GRID / POINTER HELPERS                                            */
    /* ================================================================== */

    /**
     * Convert a pointer position to a grid cell {row, col},
     * or null if the pointer is outside the grid.
     */
    _pointerToCell(pointer) {
        var col = Math.floor((pointer.x - this.gridStartX) / this.cellPitch);
        var row = Math.floor((pointer.y - this.gridStartY) / this.cellPitch);

        if (row < 0 || row >= Game.CONFIG.GRID_SIZE ||
            col < 0 || col >= Game.CONFIG.GRID_SIZE) {
            return null;
        }

        // Check pointer is actually inside the tile (not in the gap)
        var localX = (pointer.x - this.gridStartX) - col * this.cellPitch;
        var localY = (pointer.y - this.gridStartY) - row * this.cellPitch;

        if (localX > this.tileSize || localY > this.tileSize) {
            return null; // pointer is in the gap between tiles
        }

        return { row: row, col: col };
    }

    /**
     * Get the center pixel position of a tile at (row, col).
     */
    _tileCenterX(col) {
        return this.gridStartX + col * this.cellPitch + this.tileSize / 2;
    }

    _tileCenterY(row) {
        return this.gridStartY + row * this.cellPitch + this.tileSize / 2;
    }

    /* ================================================================== */
    /*  SELECTION / DRAG LOGIC                                            */
    /* ================================================================== */

    _startSelection(row, col) {
        this.selectionPath = [{ row: row, col: col }];
        this.isDragging = true;
        this._updateVisuals();
    }

    _continueSelection(row, col) {
        if (this.selectionPath.length === 0) return;

        var last = this.selectionPath[this.selectionPath.length - 1];

        // Same tile as last — ignore
        if (last.row === row && last.col === col) return;

        // Check if this tile is the second-to-last (undo / backtrack)
        if (this.selectionPath.length >= 2) {
            var prev = this.selectionPath[this.selectionPath.length - 2];
            if (prev.row === row && prev.col === col) {
                // Pop the last tile (user dragged backward)
                this.selectionPath.pop();
                this._updateVisuals();
                return;
            }
        }

        // Check adjacency to last tile
        if (!this.boggleGrid.isAdjacent(last.row, last.col, row, col)) {
            return;
        }

        // Check not already in path
        if (this.boggleGrid.isInPath(row, col, this.selectionPath)) {
            return;
        }

        // Add tile to path
        this.selectionPath.push({ row: row, col: col });
        this._updateVisuals();
    }

    _submitWord() {
        this.isDragging = false;

        if (this.selectionPath.length < Game.CONFIG.MIN_WORD_LENGTH) {
            this._flashInvalid();
            this._clearSelection();
            return;
        }

        var word = this.boggleGrid.getWordFromPath(this.selectionPath);

        // Already found?
        if (this.foundWords.has(word)) {
            this._flashDuplicate();
            this._clearSelection();
            return;
        }

        // Valid word?
        if (!Game.Dictionary.isWord(word)) {
            this._flashInvalid();
            this._clearSelection();
            return;
        }

        // Success!
        var points = this._getWordPoints(word);
        this.foundWords.add(word);
        this.foundWordsList.unshift({ word: word, points: points });
        this.earnedCurrency += points;

        this._animateSuccess(word, points);
        this._updateFoundWordsList();
        this.currencyText.setText('Earned: ' + this.earnedCurrency);
        this._clearSelection();
    }

    _clearSelection() {
        this.selectionPath = [];
        this._updateVisuals();
    }

    /* ================================================================== */
    /*  SCORING                                                           */
    /* ================================================================== */

    _getWordPoints(word) {
        var len = word.length;
        var scoring = Game.CONFIG.SCORING;

        // Use the scoring table; for lengths beyond the table, use the max
        if (scoring[len] !== undefined) {
            return scoring[len];
        }
        // For words longer than 8, use the highest score (32)
        var maxPoints = 0;
        for (var key in scoring) {
            if (scoring[key] > maxPoints) {
                maxPoints = scoring[key];
            }
        }
        return maxPoints;
    }

    /* ================================================================== */
    /*  VISUAL UPDATES                                                    */
    /* ================================================================== */

    _updateVisuals() {
        this._drawTileHighlights();
        this._drawPathLines();
        this._updateCurrentWordText();
    }

    /**
     * Redraw tile backgrounds. Selected tiles get a coloured overlay
     * based on whether the current path is a valid prefix, word, or dead end.
     */
    _drawTileHighlights() {
        this.highlightGraphics.clear();

        if (this.selectionPath.length === 0) return;

        var word = this.boggleGrid.getWordFromPath(this.selectionPath);
        var isComplete = word.length >= Game.CONFIG.MIN_WORD_LENGTH &&
                         !this.foundWords.has(word) &&
                         Game.Dictionary.isWord(word);
        var isPrefix = Game.Dictionary.isPrefix(word);

        // Determine highlight colour
        var color, alpha;
        if (isComplete) {
            // Bright green — valid submittable word
            color = 0x00ff88;
            alpha = 0.35;
        } else if (isPrefix) {
            // Gold/yellow — valid prefix, keep going
            color = 0xffd700;
            alpha = 0.25;
        } else {
            // Red/orange — dead end, no words down this path
            color = 0xff4444;
            alpha = 0.3;
        }

        for (var i = 0; i < this.selectionPath.length; i++) {
            var cell = this.selectionPath[i];
            var tx = this.gridStartX + cell.col * this.cellPitch;
            var ty = this.gridStartY + cell.row * this.cellPitch;

            this.highlightGraphics.fillStyle(color, alpha);
            this.highlightGraphics.fillRoundedRect(tx, ty, this.tileSize, this.tileSize, 8);

            // Brighter border for selected tiles
            this.highlightGraphics.lineStyle(2, color, 0.8);
            this.highlightGraphics.strokeRoundedRect(tx, ty, this.tileSize, this.tileSize, 8);
        }
    }

    /**
     * Draw connecting lines between selected tiles.
     */
    _drawPathLines() {
        this.lineGraphics.clear();

        if (this.selectionPath.length < 2) return;

        var word = this.boggleGrid.getWordFromPath(this.selectionPath);
        var isComplete = word.length >= Game.CONFIG.MIN_WORD_LENGTH &&
                         !this.foundWords.has(word) &&
                         Game.Dictionary.isWord(word);
        var isPrefix = Game.Dictionary.isPrefix(word);

        var lineColor;
        if (isComplete) {
            lineColor = 0x00ff88;
        } else if (isPrefix) {
            lineColor = 0xffd700;
        } else {
            lineColor = 0xff4444;
        }

        this.lineGraphics.lineStyle(4, lineColor, 0.8);

        this.lineGraphics.beginPath();
        var first = this.selectionPath[0];
        this.lineGraphics.moveTo(
            this._tileCenterX(first.col),
            this._tileCenterY(first.row)
        );

        for (var i = 1; i < this.selectionPath.length; i++) {
            var cell = this.selectionPath[i];
            this.lineGraphics.lineTo(
                this._tileCenterX(cell.col),
                this._tileCenterY(cell.row)
            );
        }

        this.lineGraphics.strokePath();
    }

    /**
     * Show the current word being built above the grid.
     */
    _updateCurrentWordText() {
        if (this.selectionPath.length === 0) {
            this.currentWordText.setText('');
            return;
        }

        var word = this.boggleGrid.getWordFromPath(this.selectionPath);
        var isComplete = word.length >= Game.CONFIG.MIN_WORD_LENGTH &&
                         !this.foundWords.has(word) &&
                         Game.Dictionary.isWord(word);
        var isPrefix = Game.Dictionary.isPrefix(word);

        this.currentWordText.setText(word);

        if (isComplete) {
            this.currentWordText.setColor('#00ff88');
        } else if (isPrefix) {
            this.currentWordText.setColor('#ffd700');
        } else {
            this.currentWordText.setColor('#ff6655');
        }
    }

    /* ================================================================== */
    /*  FEEDBACK ANIMATIONS                                               */
    /* ================================================================== */

    /**
     * Brief red flash on invalid submission.
     */
    _flashInvalid() {
        var self = this;
        this.currentWordText.setColor('#ff2222');

        // Quick shake on the current word text
        if (this.selectionPath.length > 0) {
            var word = this.boggleGrid.getWordFromPath(this.selectionPath);
            this.currentWordText.setText(word);
        }

        this.time.delayedCall(300, function () {
            self.currentWordText.setText('');
        });
    }

    /**
     * Flash for duplicate word.
     */
    _flashDuplicate() {
        var self = this;
        var word = this.boggleGrid.getWordFromPath(this.selectionPath);
        this.currentWordText.setText(word + ' (found)');
        this.currentWordText.setColor('#888888');

        this.time.delayedCall(400, function () {
            self.currentWordText.setText('');
        });
    }

    /**
     * Success animation: flash green, float the points up.
     */
    _animateSuccess(word, points) {
        var self = this;

        // Flash the current word text green
        this.currentWordText.setText(word + '  +' + points);
        this.currentWordText.setColor('#00ff88');

        // Floating points text rising up from grid center
        var floatText = this.add.text(
            this.currentWordText.x,
            this.currentWordText.y,
            '+' + points,
            {
                fontFamily: 'monospace',
                fontSize: '28px',
                color: '#00ff88',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5, 0.5);

        this.tweens.add({
            targets: floatText,
            y: floatText.y - 60,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: function () {
                floatText.destroy();
            }
        });

        // Clear word text after a beat
        this.time.delayedCall(400, function () {
            if (!self.isDragging) {
                self.currentWordText.setText('');
            }
        });
    }

    /* ================================================================== */
    /*  FOUND WORDS LIST                                                  */
    /* ================================================================== */

    _updateFoundWordsList() {
        // Destroy old text objects
        for (var i = 0; i < this.foundWordsTexts.length; i++) {
            this.foundWordsTexts[i].destroy();
        }
        this.foundWordsTexts = [];

        // Update word count
        this.wordCountText.setText(this.foundWordsList.length + ' word' + (this.foundWordsList.length !== 1 ? 's' : '') + ' found');

        // Render words in a multi-column grid, centered below the Boggle grid
        var COL_WIDTH = 130;
        var ROW_HEIGHT = 24;
        var MAX_COLS = 4;
        var MAX_ROWS = 6;
        var count = Math.min(this.foundWordsList.length, this.listMaxVisible);

        // Calculate grid dimensions
        var numCols = Math.min(MAX_COLS, Math.max(1, Math.ceil(count / MAX_ROWS)));
        var numRows = Math.min(MAX_ROWS, Math.ceil(count / numCols));
        var totalWidth = numCols * COL_WIDTH;
        var startX = this.wordsAreaCenterX - totalWidth / 2;

        for (var i = 0; i < count; i++) {
            var entry = this.foundWordsList[i];
            var col = Math.floor(i / numRows);
            var row = i % numRows;
            var x = startX + col * COL_WIDTH;
            var y = this.wordsAreaY + row * ROW_HEIGHT;

            var txt = this.add.text(x, y,
                entry.word + ' +' + entry.points, {
                    fontFamily: 'monospace',
                    fontSize: '16px',
                    color: i === 0 ? '#00ff88' : '#ccccdd'
                });
            this.foundWordsTexts.push(txt);
        }

        // Show overflow count
        if (this.foundWordsList.length > this.listMaxVisible) {
            var moreText = this.add.text(this.wordsAreaCenterX, this.wordsAreaY + numRows * ROW_HEIGHT + 4,
                '+ ' + (this.foundWordsList.length - count) + ' more', {
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    color: '#666688'
                }).setOrigin(0.5, 0);
            this.foundWordsTexts.push(moreText);
        }
    }

    /* ================================================================== */
    /*  TIMER                                                             */
    /* ================================================================== */

    _onTimerTick() {
        if (this.phaseOver) return;

        this.timeRemaining--;
        this.timerText.setText(this._formatTime(this.timeRemaining));

        // Flash timer red in last 5 seconds
        if (this.timeRemaining <= 5) {
            this.timerText.setColor('#ff4444');
            // Pulse effect
            this.tweens.add({
                targets: this.timerText,
                scaleX: 1.15,
                scaleY: 1.15,
                duration: 150,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        }

        if (this.timeRemaining <= 0) {
            this._endPhase();
        }
    }

    _formatTime(seconds) {
        var s = Math.max(0, seconds);
        return '0:' + (s < 10 ? '0' : '') + s;
    }

    /* ================================================================== */
    /*  PHASE END                                                         */
    /* ================================================================== */

    _endPhase() {
        if (this.phaseOver) return;
        this.phaseOver = true;

        // Stop the timer
        if (this.timerEvent) {
            this.timerEvent.remove(false);
        }

        // If currently dragging, try to submit the word
        if (this.isDragging && this.selectionPath.length >= Game.CONFIG.MIN_WORD_LENGTH) {
            var word = this.boggleGrid.getWordFromPath(this.selectionPath);
            if (!this.foundWords.has(word) && Game.Dictionary.isWord(word)) {
                var points = this._getWordPoints(word);
                this.foundWords.add(word);
                this.foundWordsList.unshift({ word: word, points: points });
                this.earnedCurrency += points;
            }
        }

        this.isDragging = false;
        this._clearSelection();

        // Update registry with earned currency
        var currentCurrency = this.registry.get('currency') || 0;
        this.registry.set('currency', currentCurrency + this.earnedCurrency);

        // Show "Time's Up!" overlay
        var self = this;
        var overlay = this.add.rectangle(
            Game.CONFIG.WIDTH / 2, Game.CONFIG.HEIGHT / 2,
            Game.CONFIG.WIDTH, Game.CONFIG.HEIGHT,
            0x000000, 0.6
        ).setDepth(100);

        var timesUpText = this.add.text(
            Game.CONFIG.WIDTH / 2, Game.CONFIG.HEIGHT / 2 - 30,
            "Time's Up!",
            {
                fontFamily: 'monospace',
                fontSize: '48px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5, 0.5).setDepth(101);

        var summaryText = this.add.text(
            Game.CONFIG.WIDTH / 2, Game.CONFIG.HEIGHT / 2 + 30,
            this.foundWords.size + ' words found  |  +' + this.earnedCurrency + ' currency',
            {
                fontFamily: 'monospace',
                fontSize: '22px',
                color: '#ffd700'
            }
        ).setOrigin(0.5, 0.5).setDepth(101);

        // Transition to BuildPhaseScene after a short delay
        this.time.delayedCall(2000, function () {
            self.scene.start('BuildPhaseScene');
        });
    }
};
