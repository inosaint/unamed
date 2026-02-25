/**
 * WordPhaseScene.js
 *
 * The Boggle word-finding phase. Players swipe on a 4x4 letter grid
 * to form English words and earn currency before the build phase.
 *
 * Layout: portrait single-column design
 *   Header:  Round, timer, currency
 *   Center:  4x4 Boggle grid + current word display
 *   Below:   Found words as mini letter tile rows
 *   Corner:  "?" button for scoring rules overlay
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
        var GAP = 14;
        var CELL = TILE + GAP;          // 72
        var GRID_COLS = CFG.GRID_SIZE;  // 4
        var GRID_ROWS = CFG.GRID_SIZE;  // 4

        var gridWidth = GRID_COLS * CELL - GAP;   // 280
        var gridHeight = GRID_ROWS * CELL - GAP;  // 280

        // Grid: centered horizontally, positioned in upper portion
        var headerH = 64;
        this.gridStartX = Math.floor(CFG.WIDTH / 2 - gridWidth / 2);
        this.gridStartY = 200;
        this.cellPitch = CELL;
        this.tileSize = TILE;

        // ---- Dungeon room background (Moonlighter-style) ----
        this.cameras.main.setBackgroundColor('#0e0e1a');
        this._drawDungeonRoom(CFG);

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

        // ---- Currency display (top right, gold icon + text) ----
        var goldIcon = this.add.image(CFG.WIDTH - 80, headerH / 2, 'gold');
        goldIcon.setDisplaySize(20, 20).setDepth(10);
        this.currencyText = this.add.text(CFG.WIDTH - 66, headerH / 2, '0', {
            fontFamily: FONT,
            fontSize: '10px',
            color: '#ffd700'
        }).setOrigin(0, 0.5).setDepth(10);

        // ---- "?" info button (scoring rules) ----
        var infoBtnX = CFG.WIDTH - 30;
        var infoBtnY = 75;
        var infoBtn = this.add.text(infoBtnX, infoBtnY, '?', {
            fontFamily: FONT,
            fontSize: '16px',
            color: '#222222',
            backgroundColor: '#ffd700',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5, 0.5).setDepth(10).setInteractive({ useHandCursor: true });
        infoBtn.on('pointerdown', function () {
            self._showScoringOverlay();
        });

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

        // ---- Found words area (below grid) ----
        var wordsStartY = this.gridStartY + gridHeight + 30;
        this.wordCountText = this.add.text(
            CFG.WIDTH / 2, wordsStartY,
            '0 words found',
            {
                fontFamily: FONT,
                fontSize: '8px',
                color: '#ffffff'
            }
        ).setOrigin(0.5, 0).setDepth(10);

        this.wordsAreaY = wordsStartY + 24;
        this.wordsAreaWidth = CFG.WIDTH - 40;
        this.listMaxVisible = 14;
        this.foundWordsObjects = []; // arrays of image/text objects per word row

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
        this.currencyText.setText('' + this.earnedCurrency);
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
    /*  FOUND WORDS LIST (mini letter tile blocks)                        */
    /* ================================================================== */

    _updateFoundWordsList() {
        var FONT = Game.CONFIG.FONT;
        var CFG = Game.CONFIG;

        // Destroy previous word objects
        for (var d = 0; d < this.foundWordsObjects.length; d++) {
            var objs = this.foundWordsObjects[d];
            for (var dd = 0; dd < objs.length; dd++) {
                objs[dd].destroy();
            }
        }
        this.foundWordsObjects = [];

        var wordCount = this.foundWordsList.length;
        this.wordCountText.setText(wordCount + ' word' + (wordCount !== 1 ? 's' : '') + ' found');

        var MINI_TILE = 24;
        var TILE_GAP = 2;
        var ROW_HEIGHT = 28;
        var count = Math.min(wordCount, this.listMaxVisible);

        for (var i = 0; i < count; i++) {
            var entry = this.foundWordsList[i];
            var word = entry.word;
            var rowY = this.wordsAreaY + i * ROW_HEIGHT;
            var rowObjs = [];

            // Calculate total width of this word row
            var wordW = word.length * (MINI_TILE + TILE_GAP) - TILE_GAP;
            var pointsStr = '+' + entry.points;
            var totalW = wordW + 8 + 40; // word tiles + gap + points text
            var startX = Math.floor(CFG.WIDTH / 2 - totalW / 2);

            // Mini letter tiles
            for (var c = 0; c < word.length; c++) {
                var tileX = startX + c * (MINI_TILE + TILE_GAP) + MINI_TILE / 2;
                var tileY = rowY + MINI_TILE / 2;

                var tileBg = this.add.image(tileX, tileY, 'letter_tile');
                tileBg.setDisplaySize(MINI_TILE, MINI_TILE);
                tileBg.setDepth(10);
                rowObjs.push(tileBg);

                var letterTxt = this.add.text(tileX, tileY, word[c], {
                    fontFamily: FONT,
                    fontSize: '9px',
                    color: '#2a1a0a'
                }).setOrigin(0.5, 0.5).setDepth(11);
                rowObjs.push(letterTxt);
            }

            // Points label
            var ptsX = startX + wordW + 8;
            var ptsTxt = this.add.text(ptsX, rowY + MINI_TILE / 2, pointsStr, {
                fontFamily: FONT,
                fontSize: '8px',
                color: i === 0 ? '#00ff88' : '#ffd700'
            }).setOrigin(0, 0.5).setDepth(11);
            rowObjs.push(ptsTxt);

            this.foundWordsObjects.push(rowObjs);
        }

        if (wordCount > this.listMaxVisible) {
            var moreY = this.wordsAreaY + count * ROW_HEIGHT;
            var moreObjs = [];
            var more = this.add.text(
                CFG.WIDTH / 2, moreY,
                '+ ' + (wordCount - count) + ' more',
                {
                    fontFamily: FONT,
                    fontSize: '7px',
                    color: '#666688'
                }
            ).setOrigin(0.5, 0).setDepth(11);
            moreObjs.push(more);
            this.foundWordsObjects.push(moreObjs);
        }
    }

    /* ================================================================== */
    /*  SCORING OVERLAY                                                   */
    /* ================================================================== */

    _showScoringOverlay() {
        if (this._scoringOverlay) return;
        var self = this;
        var CFG = Game.CONFIG;
        var FONT = CFG.FONT;

        var container = this.add.container(0, 0).setDepth(200);

        // Dim background
        var dim = this.add.rectangle(CFG.WIDTH / 2, CFG.HEIGHT / 2,
            CFG.WIDTH, CFG.HEIGHT, 0x000000, 0.7);
        dim.setInteractive(); // block clicks through
        container.add(dim);

        // Panel
        var panelW = 300;
        var panelH = 280;
        var panelX = CFG.WIDTH / 2 - panelW / 2;
        var panelY = CFG.HEIGHT / 2 - panelH / 2;

        var bg = this.add.graphics();
        bg.fillStyle(0x1a1a3e, 0.95);
        bg.fillRoundedRect(panelX, panelY, panelW, panelH, 12);
        bg.lineStyle(2, 0xffd700, 0.8);
        bg.strokeRoundedRect(panelX, panelY, panelW, panelH, 12);
        container.add(bg);

        // Title
        var title = this.add.text(CFG.WIDTH / 2, panelY + 24, 'SCORING', {
            fontFamily: FONT, fontSize: '12px', color: '#ffd700'
        }).setOrigin(0.5, 0);
        container.add(title);

        // Headers
        container.add(this.add.text(panelX + 30, panelY + 56, 'LEN', {
            fontFamily: FONT, fontSize: '7px', color: '#888899'
        }));
        container.add(this.add.text(panelX + panelW - 30, panelY + 56, 'GOLD', {
            fontFamily: FONT, fontSize: '7px', color: '#888899'
        }).setOrigin(1, 0));

        // Rows
        var scoring = CFG.SCORING;
        var rowKeys = [3, 4, 5, 6, 7, 8];
        var tableY = panelY + 80;
        var rowSpacing = 28;

        for (var si = 0; si < rowKeys.length; si++) {
            var len = rowKeys[si];
            var pts = scoring[len];
            var rowY = tableY + si * rowSpacing;
            var rowColor = len >= 7 ? '#ffd700' : (len >= 5 ? '#aaddff' : '#ccccdd');

            container.add(this.add.text(panelX + 30, rowY, len + ' letters', {
                fontFamily: FONT, fontSize: '9px', color: rowColor
            }));
            container.add(this.add.text(panelX + panelW - 30, rowY, '+' + pts, {
                fontFamily: FONT, fontSize: '9px', color: '#ffd700'
            }).setOrigin(1, 0));
        }

        // Close button
        var closeBtn = this.add.text(CFG.WIDTH / 2, panelY + panelH - 24, 'CLOSE', {
            fontFamily: FONT, fontSize: '10px', color: '#ff6666',
            backgroundColor: '#331122', padding: { x: 16, y: 6 }
        }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', function () {
            container.destroy(true);
            self._scoringOverlay = null;
        });
        container.add(closeBtn);

        this._scoringOverlay = container;
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

    /* ================================================================== */
    /*  DUNGEON ROOM BACKGROUND                                           */
    /* ================================================================== */

    _drawDungeonRoom(CFG) {
        var W = CFG.WIDTH;
        var H = CFG.HEIGHT;
        var WALL = 72;          // wall thickness
        var PILLAR = 20;        // corner pillar extra size

        // --- Floor: tile the center area ---
        for (var fy = WALL; fy < H - WALL; fy += 64) {
            for (var fx = WALL; fx < W - WALL; fx += 64) {
                this.add.image(fx + 32, fy + 32, 'floor_tile')
                    .setDepth(0).setAlpha(0.7).setTint(0x88aaaa);
            }
        }

        var g = this.add.graphics().setDepth(0.5);

        // --- Outer wall (darkest layer) ---
        g.fillStyle(0x1a1a2e, 1);
        g.fillRect(0, 0, W, WALL);           // top
        g.fillRect(0, H - WALL, W, WALL);    // bottom
        g.fillRect(0, 0, WALL, H);           // left
        g.fillRect(W - WALL, 0, WALL, H);    // right

        // --- Wall stone texture (medium layer) ---
        var stoneW = 48;
        var stoneH = 24;
        var colors = [0x2a2a44, 0x252540, 0x30304a, 0x222238];

        // Top wall stones
        for (var sy = 4; sy < WALL - 4; sy += stoneH + 2) {
            var offset = (Math.floor(sy / (stoneH + 2)) % 2) * (stoneW / 2);
            for (var sx = 4 + offset; sx < W - 4; sx += stoneW + 3) {
                var c = colors[(sx * 7 + sy * 13) % colors.length];
                g.fillStyle(c, 1);
                g.fillRect(sx, sy, Math.min(stoneW, W - 4 - sx), stoneH);
            }
        }
        // Bottom wall stones
        for (var sy2 = H - WALL + 4; sy2 < H - 4; sy2 += stoneH + 2) {
            var offset2 = (Math.floor((sy2 - H + WALL) / (stoneH + 2)) % 2) * (stoneW / 2);
            for (var sx2 = 4 + offset2; sx2 < W - 4; sx2 += stoneW + 3) {
                var c2 = colors[(sx2 * 7 + sy2 * 13) % colors.length];
                g.fillStyle(c2, 1);
                g.fillRect(sx2, sy2, Math.min(stoneW, W - 4 - sx2), stoneH);
            }
        }
        // Left wall stones
        for (var ly = WALL; ly < H - WALL; ly += stoneH + 2) {
            var lOffset = (Math.floor(ly / (stoneH + 2)) % 2) * (stoneW / 2);
            for (var lx = 4 + lOffset; lx < WALL - 4; lx += stoneW + 3) {
                var c3 = colors[(lx * 7 + ly * 13) % colors.length];
                g.fillStyle(c3, 1);
                g.fillRect(lx, ly, Math.min(stoneW, WALL - 4 - lx), stoneH);
            }
        }
        // Right wall stones
        for (var ry = WALL; ry < H - WALL; ry += stoneH + 2) {
            var rOffset = (Math.floor(ry / (stoneH + 2)) % 2) * (stoneW / 2);
            for (var rx = W - WALL + 4 + rOffset; rx < W - 4; rx += stoneW + 3) {
                var c4 = colors[(rx * 7 + ry * 13) % colors.length];
                g.fillStyle(c4, 1);
                g.fillRect(rx, ry, Math.min(stoneW, W - 4 - rx), stoneH);
            }
        }

        // --- Inner wall edge (shadow/depth line) ---
        g.fillStyle(0x111122, 1);
        g.fillRect(WALL - 4, WALL - 4, W - 2 * WALL + 8, 4);  // top inner
        g.fillRect(WALL - 4, H - WALL, W - 2 * WALL + 8, 4);  // bottom inner
        g.fillRect(WALL - 4, WALL, 4, H - 2 * WALL);           // left inner
        g.fillRect(W - WALL, WALL, 4, H - 2 * WALL);           // right inner

        // --- Corner pillars (darker, thicker) ---
        g.fillStyle(0x181830, 1);
        g.fillRect(0, 0, WALL + PILLAR, WALL + PILLAR);                          // top-left
        g.fillRect(W - WALL - PILLAR, 0, WALL + PILLAR, WALL + PILLAR);          // top-right
        g.fillRect(0, H - WALL - PILLAR, WALL + PILLAR, WALL + PILLAR);          // bottom-left
        g.fillRect(W - WALL - PILLAR, H - WALL - PILLAR, WALL + PILLAR, WALL + PILLAR); // bottom-right

        // Pillar inner highlight
        g.fillStyle(0x2a2a48, 1);
        g.fillRect(6, 6, WALL + PILLAR - 12, WALL + PILLAR - 12);
        g.fillRect(W - WALL - PILLAR + 6, 6, WALL + PILLAR - 12, WALL + PILLAR - 12);
        g.fillRect(6, H - WALL - PILLAR + 6, WALL + PILLAR - 12, WALL + PILLAR - 12);
        g.fillRect(W - WALL - PILLAR + 6, H - WALL - PILLAR + 6, WALL + PILLAR - 12, WALL + PILLAR - 12);

        // --- Subtle floor shadow along walls ---
        var shadow = this.add.graphics().setDepth(0.6);
        shadow.fillStyle(0x000000, 0.25);
        shadow.fillRect(WALL, WALL, W - 2 * WALL, 16);            // top shadow
        shadow.fillRect(WALL, H - WALL - 16, W - 2 * WALL, 16);   // bottom shadow
        shadow.fillRect(WALL, WALL, 16, H - 2 * WALL);            // left shadow
        shadow.fillRect(W - WALL - 16, WALL, 16, H - 2 * WALL);   // right shadow
    }
};
