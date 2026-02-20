/**
 * WordPhaseScene.js
 *
 * The Boggle word-finding phase. Players swipe on a 4x4 letter grid
 * to form English words and earn currency before the build phase.
 *
 * Layout: three-column design
 *   Left:   Scoring reference table
 *   Center: 4x4 Boggle grid (vertically centered)
 *   Right:  Found words list
 */

window.Game = window.Game || {};

Game.WordPhaseScene = class WordPhaseScene extends Phaser.Scene {

    constructor() {
        super({ key: 'WordPhaseScene' });
    }

    init(data) {
        // data may contain info from a previous round; we pull state
        // from the registry which persists across scenes.
    }

    create() {
        var self = this;
        var CFG = Game.CONFIG;
        var FONT = CFG.FONT;

        // ---- State ----
        this.boggleGrid = new Game.BoggleGrid();
        this.selectionPath = [];
        this.isDragging = false;
        this.foundWords = new Set();
        this.foundWordsList = [];
        this.earnedCurrency = 0;
        this.timeRemaining = CFG.WORD_PHASE_TIME;
        this.phaseOver = false;

        // ---- Layout constants ----
        var TILE = CFG.TILE_SIZE;       // 64
        var GAP = 8;
        var CELL = TILE + GAP;          // 72
        var GRID_COLS = CFG.GRID_SIZE;  // 4
        var GRID_ROWS = CFG.GRID_SIZE;  // 4

        var gridWidth = GRID_COLS * CELL - GAP;   // 280
        var gridHeight = GRID_ROWS * CELL - GAP;  // 280

        // Grid: centered horizontally, vertically centered in playfield below header
        var headerH = 50;
        this.gridStartX = Math.floor(CFG.WIDTH / 2 - gridWidth / 2);
        this.gridStartY = Math.floor(headerH + (CFG.HEIGHT - headerH - gridHeight) / 2);
        this.cellPitch = CELL;
        this.tileSize = TILE;

        // ---- Background: tiled stone floor ----
        this.cameras.main.setBackgroundColor('#1a1a2e');
        for (var bgY = 0; bgY < CFG.HEIGHT; bgY += 64) {
            for (var bgX = 0; bgX < CFG.WIDTH; bgX += 64) {
                this.add.image(bgX + 32, bgY + 32, 'floor_tile').setDepth(0).setAlpha(0.6);
            }
        }

        // ---- Header bar background ----
        var headerBg = this.add.graphics().setDepth(9);
        headerBg.fillStyle(0x111122, 0.85);
        headerBg.fillRect(0, 0, CFG.WIDTH, headerH);
        headerBg.lineStyle(2, 0x4444aa, 0.4);
        headerBg.lineBetween(0, headerH, CFG.WIDTH, headerH);

        // ---- Round display (top left) ----
        var round = this.registry.get('round') || 1;
        this.add.text(16, headerH / 2, 'Round ' + round, {
            fontFamily: FONT,
            fontSize: '10px',
            color: '#aaaacc'
        }).setOrigin(0, 0.5).setDepth(10);

        // ---- Timer display (top center) ----
        this.timerText = this.add.text(CFG.WIDTH / 2, headerH / 2, this._formatTime(this.timeRemaining), {
            fontFamily: FONT,
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5, 0.5).setDepth(10);

        // ---- Currency display (top right) ----
        this.currencyText = this.add.text(CFG.WIDTH - 16, headerH / 2, 'Earned: 0', {
            fontFamily: FONT,
            fontSize: '10px',
            color: '#ffd700'
        }).setOrigin(1, 0.5).setDepth(10);

        // ---- Current word being built (above grid) ----
        this.currentWordText = this.add.text(
            this.gridStartX + gridWidth / 2,
            this.gridStartY - 28,
            '',
            {
                fontFamily: FONT,
                fontSize: '14px',
                color: '#ffffff'
            }
        ).setOrigin(0.5, 0.5).setDepth(10);

        // ---- Graphics layer for lines and tile highlights ----
        this.lineGraphics = this.add.graphics().setDepth(3);
        this.highlightGraphics = this.add.graphics().setDepth(2);

        // ---- Render the 4x4 grid tiles ----
        this.tileBackgrounds = [];
        this.tileLetters = [];

        for (var row = 0; row < GRID_ROWS; row++) {
            this.tileBackgrounds[row] = [];
            this.tileLetters[row] = [];
            for (var col = 0; col < GRID_COLS; col++) {
                var tx = this.gridStartX + col * CELL;
                var ty = this.gridStartY + row * CELL;

                var bg = this.add.image(tx + TILE / 2, ty + TILE / 2, 'letter_tile');
                bg.setDisplaySize(TILE, TILE);
                bg.setDepth(1);
                this.tileBackgrounds[row][col] = bg;

                var letter = this.boggleGrid.getLetterAt(row, col);
                var txt = this.add.text(tx + TILE / 2, ty + TILE / 2, letter, {
                    fontFamily: FONT,
                    fontSize: '18px',
                    color: '#2a1a0a'
                }).setOrigin(0.5, 0.5).setDepth(2);
                this.tileLetters[row][col] = txt;
            }
        }

        // ---- Scoring reference panel (left column) ----
        var panelW = 200;
        var panelX = this.gridStartX - panelW - 30;
        if (panelX < 10) panelX = 10;
        var panelY = this.gridStartY;
        var panelH = gridHeight;

        var scoreBg = this.add.graphics().setDepth(10);
        scoreBg.fillStyle(0x111133, 0.7);
        scoreBg.fillRoundedRect(panelX, panelY, panelW, panelH, 8);
        scoreBg.lineStyle(1, 0x4444aa, 0.6);
        scoreBg.strokeRoundedRect(panelX, panelY, panelW, panelH, 8);

        this.add.text(panelX + panelW / 2, panelY + 16, 'SCORING', {
            fontFamily: FONT,
            fontSize: '10px',
            color: '#aaaadd'
        }).setOrigin(0.5, 0).setDepth(11);

        this.add.text(panelX + 16, panelY + 42, 'LEN', {
            fontFamily: FONT,
            fontSize: '7px',
            color: '#888899'
        }).setDepth(11);

        this.add.text(panelX + panelW - 16, panelY + 42, 'GOLD', {
            fontFamily: FONT,
            fontSize: '7px',
            color: '#888899'
        }).setOrigin(1, 0).setDepth(11);

        var scoring = CFG.SCORING;
        var rowKeys = [3, 4, 5, 6, 7, 8];
        var tableStartY = panelY + 66;
        var rowSpacing = Math.floor((panelH - 80) / rowKeys.length);

        for (var si = 0; si < rowKeys.length; si++) {
            var len = rowKeys[si];
            var pts = scoring[len];
            var rowY = tableStartY + si * rowSpacing;
            var rowColor = len >= 7 ? '#ffd700' : (len >= 5 ? '#aaddff' : '#ccccdd');

            this.add.text(panelX + 16, rowY, len + ' letters', {
                fontFamily: FONT,
                fontSize: '8px',
                color: rowColor
            }).setDepth(11);

            this.add.text(panelX + panelW - 16, rowY, '+' + pts, {
                fontFamily: FONT,
                fontSize: '8px',
                color: '#ffd700'
            }).setOrigin(1, 0).setDepth(11);
        }

        // ---- Found words panel (right column) ----
        var rightPanelX = this.gridStartX + gridWidth + 30;
        var rightPanelW = CFG.WIDTH - rightPanelX - 10;
        if (rightPanelW < 160) rightPanelW = 160;
        var rightPanelY = this.gridStartY;
        var rightPanelH = gridHeight;

        var rightBg = this.add.graphics().setDepth(10);
        rightBg.fillStyle(0x111133, 0.7);
        rightBg.fillRoundedRect(rightPanelX, rightPanelY, rightPanelW, rightPanelH, 8);
        rightBg.lineStyle(1, 0x4444aa, 0.6);
        rightBg.strokeRoundedRect(rightPanelX, rightPanelY, rightPanelW, rightPanelH, 8);

        this.wordCountText = this.add.text(
            rightPanelX + rightPanelW / 2,
            rightPanelY + 16,
            '0 words found',
            {
                fontFamily: FONT,
                fontSize: '8px',
                color: '#aaaacc'
            }
        ).setOrigin(0.5, 0).setDepth(11);

        this.rightPanelX = rightPanelX;
        this.rightPanelY = rightPanelY;
        this.rightPanelW = rightPanelW;
        this.rightPanelH = rightPanelH;
        this.wordsAreaY = rightPanelY + 40;
        this.listMaxVisible = Math.floor((rightPanelH - 56) / 18);
        this.foundWordsTexts = [];

        // ---- Instruction text (below grid) ----
        this.add.text(
            this.gridStartX + gridWidth / 2,
            this.gridStartY + gridHeight + 14,
            'Drag to form words!',
            {
                fontFamily: FONT,
                fontSize: '7px',
                color: '#666688'
            }
        ).setOrigin(0.5, 0).setDepth(10);

        // ---- Timer event ----
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this._onTimerTick,
            callbackScope: this,
            loop: true
        });

        // ---- Input handlers ----
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

    _pointerToCell(pointer) {
        var col = Math.floor((pointer.x - this.gridStartX) / this.cellPitch);
        var row = Math.floor((pointer.y - this.gridStartY) / this.cellPitch);

        if (row < 0 || row >= Game.CONFIG.GRID_SIZE ||
            col < 0 || col >= Game.CONFIG.GRID_SIZE) {
            return null;
        }

        var localX = (pointer.x - this.gridStartX) - col * this.cellPitch;
        var localY = (pointer.y - this.gridStartY) - row * this.cellPitch;

        if (localX > this.tileSize || localY > this.tileSize) {
            return null;
        }

        return { row: row, col: col };
    }

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

        if (last.row === row && last.col === col) return;

        // Check backtrack (undo)
        if (this.selectionPath.length >= 2) {
            var prev = this.selectionPath[this.selectionPath.length - 2];
            if (prev.row === row && prev.col === col) {
                this.selectionPath.pop();
                this._updateVisuals();
                return;
            }
        }

        if (!this.boggleGrid.isAdjacent(last.row, last.col, row, col)) {
            return;
        }

        if (this.boggleGrid.isInPath(row, col, this.selectionPath)) {
            return;
        }

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

        if (this.foundWords.has(word)) {
            this._flashDuplicate();
            this._clearSelection();
            return;
        }

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

        if (scoring[len] !== undefined) {
            return scoring[len];
        }
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

    _drawTileHighlights() {
        this.highlightGraphics.clear();

        if (this.selectionPath.length === 0) return;

        var word = this.boggleGrid.getWordFromPath(this.selectionPath);
        var isComplete = word.length >= Game.CONFIG.MIN_WORD_LENGTH &&
                         !this.foundWords.has(word) &&
                         Game.Dictionary.isWord(word);
        var isPrefix = Game.Dictionary.isPrefix(word);

        var color, alpha;
        if (isComplete) {
            color = 0x00ff88; alpha = 0.35;
        } else if (isPrefix) {
            color = 0xffd700; alpha = 0.25;
        } else {
            color = 0xff4444; alpha = 0.3;
        }

        for (var i = 0; i < this.selectionPath.length; i++) {
            var cell = this.selectionPath[i];
            var tx = this.gridStartX + cell.col * this.cellPitch;
            var ty = this.gridStartY + cell.row * this.cellPitch;

            this.highlightGraphics.fillStyle(color, alpha);
            this.highlightGraphics.fillRoundedRect(tx, ty, this.tileSize, this.tileSize, 8);
            this.highlightGraphics.lineStyle(2, color, 0.8);
            this.highlightGraphics.strokeRoundedRect(tx, ty, this.tileSize, this.tileSize, 8);
        }
    }

    _drawPathLines() {
        this.lineGraphics.clear();

        if (this.selectionPath.length < 2) return;

        var word = this.boggleGrid.getWordFromPath(this.selectionPath);
        var isComplete = word.length >= Game.CONFIG.MIN_WORD_LENGTH &&
                         !this.foundWords.has(word) &&
                         Game.Dictionary.isWord(word);
        var isPrefix = Game.Dictionary.isPrefix(word);

        var lineColor;
        if (isComplete) { lineColor = 0x00ff88; }
        else if (isPrefix) { lineColor = 0xffd700; }
        else { lineColor = 0xff4444; }

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

    _flashInvalid() {
        var self = this;
        this.currentWordText.setColor('#ff2222');

        if (this.selectionPath.length > 0) {
            var word = this.boggleGrid.getWordFromPath(this.selectionPath);
            this.currentWordText.setText(word);
        }

        this.time.delayedCall(300, function () {
            self.currentWordText.setText('');
        });
    }

    _flashDuplicate() {
        var self = this;
        var word = this.boggleGrid.getWordFromPath(this.selectionPath);
        this.currentWordText.setText(word + ' (found)');
        this.currentWordText.setColor('#888888');

        this.time.delayedCall(400, function () {
            self.currentWordText.setText('');
        });
    }

    _animateSuccess(word, points) {
        var self = this;
        var FONT = Game.CONFIG.FONT;

        this.currentWordText.setText(word + '  +' + points);
        this.currentWordText.setColor('#00ff88');

        var floatText = this.add.text(
            this.currentWordText.x,
            this.currentWordText.y,
            '+' + points,
            {
                fontFamily: FONT,
                fontSize: '14px',
                color: '#00ff88'
            }
        ).setOrigin(0.5, 0.5);

        this.tweens.add({
            targets: floatText,
            y: floatText.y - 50,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: function () { floatText.destroy(); }
        });

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
        var FONT = Game.CONFIG.FONT;

        for (var i = 0; i < this.foundWordsTexts.length; i++) {
            this.foundWordsTexts[i].destroy();
        }
        this.foundWordsTexts = [];

        var wordCount = this.foundWordsList.length;
        this.wordCountText.setText(wordCount + ' word' + (wordCount !== 1 ? 's' : '') + ' found');

        var ROW_HEIGHT = 18;
        var count = Math.min(wordCount, this.listMaxVisible);
        var x = this.rightPanelX + 12;

        for (var i = 0; i < count; i++) {
            var entry = this.foundWordsList[i];
            var y = this.wordsAreaY + i * ROW_HEIGHT;

            var txt = this.add.text(x, y, entry.word + ' +' + entry.points, {
                fontFamily: FONT,
                fontSize: '7px',
                color: i === 0 ? '#00ff88' : '#ccccdd'
            }).setDepth(11);
            this.foundWordsTexts.push(txt);
        }

        if (wordCount > this.listMaxVisible) {
            var moreY = this.wordsAreaY + count * ROW_HEIGHT;
            var more = this.add.text(
                this.rightPanelX + this.rightPanelW / 2, moreY,
                '+ ' + (wordCount - count) + ' more',
                {
                    fontFamily: FONT,
                    fontSize: '7px',
                    color: '#666688'
                }
            ).setOrigin(0.5, 0).setDepth(11);
            this.foundWordsTexts.push(more);
        }
    }

    /* ================================================================== */
    /*  TIMER                                                             */
    /* ================================================================== */

    _onTimerTick() {
        if (this.phaseOver) return;

        this.timeRemaining--;
        this.timerText.setText(this._formatTime(this.timeRemaining));

        if (this.timeRemaining <= 5) {
            this.timerText.setColor('#ff4444');
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
        var FONT = Game.CONFIG.FONT;

        if (this.timerEvent) {
            this.timerEvent.remove(false);
        }

        // Try to submit if currently dragging
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

        // Update registry
        var currentCurrency = this.registry.get('currency') || 0;
        this.registry.set('currency', currentCurrency + this.earnedCurrency);

        // Overlay
        var self = this;
        this.add.rectangle(
            Game.CONFIG.WIDTH / 2, Game.CONFIG.HEIGHT / 2,
            Game.CONFIG.WIDTH, Game.CONFIG.HEIGHT,
            0x000000, 0.6
        ).setDepth(100);

        this.add.text(
            Game.CONFIG.WIDTH / 2, Game.CONFIG.HEIGHT / 2 - 30,
            "Time's Up!",
            {
                fontFamily: FONT,
                fontSize: '24px',
                color: '#ffffff'
            }
        ).setOrigin(0.5, 0.5).setDepth(101);

        this.add.text(
            Game.CONFIG.WIDTH / 2, Game.CONFIG.HEIGHT / 2 + 30,
            this.foundWords.size + ' words  |  +' + this.earnedCurrency + ' gold',
            {
                fontFamily: FONT,
                fontSize: '10px',
                color: '#ffd700'
            }
        ).setOrigin(0.5, 0.5).setDepth(101);

        this.time.delayedCall(2000, function () {
            self.scene.start('BuildPhaseScene');
        });
    }
};
