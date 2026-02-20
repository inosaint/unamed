/**
 * BuildPhaseScene.js
 *
 * Tower placement phase. Players tap on a placement spot, then pick
 * a tower type from a popup modal. Shows the TD map with path,
 * placement spots, castle, and a "Start Wave" button.
 *
 * Namespace: Game.BuildPhaseScene
 */

window.Game = window.Game || {};

Game.BuildPhaseScene = class BuildPhaseScene extends Phaser.Scene {

    constructor() {
        super({ key: 'BuildPhaseScene' });
    }

    create() {
        // Ensure CurrencyManager has registry reference
        Game.CurrencyManager._registry = this.registry;

        // Read state from registry
        this.currentRound = this.registry.get('round') || 1;
        this.towers = this.registry.get('towers') || [];
        this.castleHP = this.registry.get('castleHP') || Game.CONFIG.STARTING_CASTLE_HP;

        // Active popup (only one at a time)
        this.activePopup = null;

        // Tracking
        this.spotSprites = [];
        this.towerSprites = [];

        // Background: tiled grass
        this.cameras.main.setBackgroundColor(0x2d5a27);
        for (var bgY = 0; bgY < Game.CONFIG.HEIGHT; bgY += 64) {
            for (var bgX = 0; bgX < Game.CONFIG.WIDTH; bgX += 64) {
                this.add.image(bgX + 32, bgY + 32, 'grass').setDepth(0);
            }
        }

        // Draw path
        this.path = new Game.Path(Game.MAP.path);
        this.mapGraphics = this.add.graphics();
        this.mapGraphics.setDepth(1);
        this.path.draw(this.mapGraphics);

        // Draw castle
        this.castle = new Game.Castle(this, Game.MAP.castle.x, Game.MAP.castle.y);
        this.castle.hp = this.castleHP;
        this.castle.maxHp = Game.CONFIG.STARTING_CASTLE_HP;
        this.castle._updateDamageFrame();
        this.castle.updateHPBar();

        // Placement spots and existing towers
        this._renderSpots();
        this._renderExistingTowers();

        // Top UI panel
        this._createTopPanel();

        // Start Wave button
        this._createStartWaveButton();

        // Track when a popup was just opened so background click doesn't close it instantly
        this._popupJustOpened = false;

        // Close popup when clicking on empty space
        this.input.on('pointerdown', this._onBackgroundClick, this);

        // Auto-skip check
        this._checkAutoSkip();

        console.log('[BuildPhaseScene] Round ' + this.currentRound + ', Gold: ' + Game.CurrencyManager.get());
    }

    /* ================================================================ */
    /*  Top UI Panel                                                     */
    /* ================================================================ */

    _createTopPanel() {
        var W = Game.CONFIG.WIDTH;

        // Dark panel background
        var panelBg = this.add.graphics();
        panelBg.setDepth(10);
        panelBg.fillStyle(0x111122, 0.85);
        panelBg.fillRect(0, 0, W, 50);
        panelBg.lineStyle(2, 0xffd700, 0.6);
        panelBg.lineBetween(0, 50, W, 50);

        var FONT = Game.CONFIG.FONT;

        // Round label (center)
        this.add.text(W / 2, 25, 'Round ' + this.currentRound + ' - Build Phase', {
            fontSize: '10px', fontFamily: FONT,
            color: '#ffd700', align: 'center'
        }).setOrigin(0.5, 0.5).setDepth(11);

        // Currency (left)
        this.currencyText = this.add.text(16, 25, 'Gold: ' + Game.CurrencyManager.get() + 'g', {
            fontSize: '9px', fontFamily: FONT, color: '#ffdd00'
        }).setOrigin(0, 0.5).setDepth(11);

        // Castle HP (right)
        this.add.text(W - 16, 25, 'Castle HP: ' + this.castleHP, {
            fontSize: '8px', fontFamily: FONT, color: '#ff6666'
        }).setOrigin(1, 0.5).setDepth(11);

        // Instructions text with tower limit info
        var maxPerType = this._getMaxPerType();
        this.instructionText = this.add.text(W / 2, 68,
            'Tap a spot to place a tower (max ' + maxPerType + ' each)', {
            fontSize: '7px', fontFamily: FONT, color: '#aaffaa'
        }).setOrigin(0.5, 0.5).setDepth(11);
    }

    /* ================================================================ */
    /*  Placement Spots                                                  */
    /* ================================================================ */

    _renderSpots() {
        var self = this;
        var spots = Game.MAP.spots;

        for (var i = 0; i < spots.length; i++) {
            (function (index) {
                var spot = spots[index];

                // Skip spots that already have a tower
                if (self._getTowerAtSpot(index)) return;

                var spotImg = self.add.image(spot.x, spot.y, 'placement_spot');
                spotImg.setDepth(3);
                spotImg.setScale(1.0);
                spotImg.setInteractive({ useHandCursor: true });
                spotImg.setData('spotIndex', index);

                // Hover effect
                spotImg.on('pointerover', function () {
                    spotImg.setScale(1.3);
                    spotImg.setAlpha(0.8);
                });
                spotImg.on('pointerout', function () {
                    spotImg.setScale(1.0);
                    spotImg.setAlpha(1.0);
                });

                // Click: open tower selection popup
                spotImg.on('pointerdown', function () {
                    self._popupJustOpened = true;
                    self._openTowerPopup(index, spot.x, spot.y, spotImg);
                });

                self.spotSprites.push({ index: index, sprite: spotImg });
            })(i);
        }
    }

    /* ================================================================ */
    /*  Tower Selection Popup (modal near the clicked spot)              */
    /* ================================================================ */

    _openTowerPopup(spotIndex, x, y, spotSprite) {
        var self = this;

        // Close any existing popup first
        this._closePopup();

        var currency = Game.CurrencyManager.get();
        var towerTypes = ['basic', 'archer', 'cannon'];
        var popupW = 180;
        var rowH = 44;
        var popupH = towerTypes.length * rowH + 16;

        // Position popup near the spot but keep on screen
        var popupX = x + 30;
        var popupY = y - popupH / 2;
        if (popupX + popupW > Game.CONFIG.WIDTH - 10) popupX = x - popupW - 30;
        if (popupY < 60) popupY = 60;
        if (popupY + popupH > Game.CONFIG.HEIGHT - 60) popupY = Game.CONFIG.HEIGHT - 60 - popupH;

        // Container for the popup
        var container = this.add.container(0, 0);
        container.setDepth(20);

        // Background
        var bg = this.add.graphics();
        bg.fillStyle(0x1a1a3e, 0.95);
        bg.fillRoundedRect(popupX, popupY, popupW, popupH, 10);
        bg.lineStyle(2, 0xffd700, 0.8);
        bg.strokeRoundedRect(popupX, popupY, popupW, popupH, 10);
        container.add(bg);

        // Tower options
        for (var i = 0; i < towerTypes.length; i++) {
            (function (idx) {
                var type = towerTypes[idx];
                var data = Game.TOWERS[type];
                var placed = self._countTowersOfType(type);
                var maxAllowed = self._getMaxPerType();
                var atLimit = placed >= maxAllowed;
                var canAfford = currency >= data.cost && !atLimit;
                var rowY = popupY + 8 + idx * rowH + rowH / 2;

                // Row background (hover zone)
                var rowBg = self.add.graphics();
                container.add(rowBg);

                // Icon
                var icon = self.add.image(popupX + 24, rowY, data.textureKey);
                icon.setScale(0.9);
                container.add(icon);

                // Name
                var nameText = self.add.text(popupX + 48, rowY - 8, data.name, {
                    fontSize: '7px', fontFamily: Game.CONFIG.FONT,
                    color: canAfford ? '#ffffff' : '#666666'
                }).setOrigin(0, 0.5);
                container.add(nameText);

                // Cost
                var costText = self.add.text(popupX + 48, rowY + 10, data.cost + 'g', {
                    fontSize: '6px', fontFamily: Game.CONFIG.FONT,
                    color: canAfford ? '#ffd700' : '#994444'
                }).setOrigin(0, 0.5);
                container.add(costText);

                // Stats + limit info
                var limitStr = placed + '/' + maxAllowed;
                var infoStr = 'DMG:' + data.damage + ' ' + limitStr;
                var infoColor = atLimit ? '#ff6666' : (canAfford ? '#aaaacc' : '#555566');
                var infoText = self.add.text(popupX + popupW - 10, rowY, infoStr, {
                    fontSize: '6px', fontFamily: Game.CONFIG.FONT,
                    color: infoColor
                }).setOrigin(1, 0.5);
                container.add(infoText);

                // Clickable zone for this row
                var zone = self.add.zone(popupX + popupW / 2, rowY, popupW - 8, rowH - 4);
                zone.setInteractive({ useHandCursor: canAfford });
                container.add(zone);

                if (canAfford) {
                    zone.on('pointerover', function () {
                        rowBg.clear();
                        rowBg.fillStyle(0x4444aa, 0.4);
                        rowBg.fillRoundedRect(popupX + 4, rowY - rowH / 2 + 2, popupW - 8, rowH - 4, 6);
                    });
                    zone.on('pointerout', function () {
                        rowBg.clear();
                    });
                    zone.on('pointerdown', function () {
                        self._popupJustOpened = true;
                        self._purchaseTower(spotIndex, type, spotSprite);
                        self._closePopup();
                    });
                }
            })(i);
        }

        // Close button (X) in top-right corner
        var closeText = this.add.text(popupX + popupW - 12, popupY + 8, 'X', {
            fontSize: '8px', fontFamily: Game.CONFIG.FONT, color: '#ff6666'
        }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });
        closeText.on('pointerdown', function () {
            self._popupJustOpened = true;
            self._closePopup();
        });
        container.add(closeText);

        this.activePopup = container;
    }

    _closePopup() {
        if (this.activePopup) {
            this.activePopup.destroy(true);
            this.activePopup = null;
        }
    }

    _onBackgroundClick() {
        // Don't close if a popup was just opened on this same click
        if (this._popupJustOpened) {
            this._popupJustOpened = false;
            return;
        }
        // Close popup if clicking outside
        if (this.activePopup) {
            this._closePopup();
        }
    }

    /* ================================================================ */
    /*  Existing towers                                                  */
    /* ================================================================ */

    _renderExistingTowers() {
        for (var i = 0; i < this.towers.length; i++) {
            var t = this.towers[i];
            this._renderTower(t.x, t.y, t.type);
        }
    }

    _renderTower(x, y, type) {
        var towerData = Game.TOWERS[type];
        if (!towerData) return;

        var img = this.add.image(x, y, towerData.textureKey);
        img.setDepth(4);
        img.setScale(1.2);
        this.towerSprites.push(img);

        var label = this.add.text(x, y + 22, towerData.name, {
            fontSize: '6px', fontFamily: Game.CONFIG.FONT, color: '#ffffff',
            stroke: '#000000', strokeThickness: 2, align: 'center'
        }).setOrigin(0.5, 0).setDepth(4);
    }

    /**
     * Get the max number of each tower type allowed this round.
     */
    _getMaxPerType() {
        return Math.ceil(this.currentRound / 2);
    }

    /**
     * Count how many towers of a given type are placed.
     */
    _countTowersOfType(type) {
        var count = 0;
        for (var i = 0; i < this.towers.length; i++) {
            if (this.towers[i].type === type) count++;
        }
        return count;
    }

    _getTowerAtSpot(spotIndex) {
        var spot = Game.MAP.spots[spotIndex];
        for (var i = 0; i < this.towers.length; i++) {
            if (this.towers[i].x === spot.x && this.towers[i].y === spot.y) {
                return this.towers[i];
            }
        }
        return null;
    }

    /* ================================================================ */
    /*  Purchase tower                                                   */
    /* ================================================================ */

    _purchaseTower(spotIndex, towerType, spotSprite) {
        var spot = Game.MAP.spots[spotIndex];
        var towerData = Game.TOWERS[towerType];

        if (!Game.CurrencyManager.spend(towerData.cost)) {
            console.log('[BuildPhaseScene] Cannot afford ' + towerData.name);
            return;
        }

        // Add tower to registry
        var newTower = { x: spot.x, y: spot.y, type: towerType };
        this.towers.push(newTower);
        this.registry.set('towers', this.towers);

        // Render tower
        this._renderTower(spot.x, spot.y, towerType);

        // Remove the spot sprite
        if (spotSprite) {
            spotSprite.disableInteractive();
            spotSprite.destroy();
            for (var i = 0; i < this.spotSprites.length; i++) {
                if (this.spotSprites[i].index === spotIndex) {
                    this.spotSprites.splice(i, 1);
                    break;
                }
            }
        }

        // Update UI
        this._updateCurrencyDisplay();

        // Feedback
        var text = this.add.text(spot.x, spot.y - 30, towerData.name + ' built!', {
            fontSize: '7px', fontFamily: Game.CONFIG.FONT,
            color: '#00ff00', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5, 0.5).setDepth(25);

        this.tweens.add({
            targets: text, y: spot.y - 70, alpha: 0, duration: 1000,
            ease: 'Power2', onComplete: function () { text.destroy(); }
        });

        console.log('[BuildPhaseScene] Placed ' + towerData.name + ' at (' + spot.x + ', ' + spot.y + ')');

        // Check auto-skip
        this._checkAutoSkip();
    }

    _updateCurrencyDisplay() {
        if (this.currencyText) {
            this.currencyText.setText('Gold: ' + Game.CurrencyManager.get() + 'g');
        }
    }

    /* ================================================================ */
    /*  Start Wave Button                                                */
    /* ================================================================ */

    _createStartWaveButton() {
        var self = this;
        var btnX = Game.CONFIG.WIDTH / 2;
        var btnY = Game.CONFIG.HEIGHT - 40;
        var btnW = 200;
        var btnH = 48;

        var btnBg = this.add.graphics();
        btnBg.setDepth(10);
        btnBg.fillStyle(0xcc3333, 1);
        btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 12);
        btnBg.lineStyle(2, 0xff6666, 1);
        btnBg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 12);

        this.add.text(btnX, btnY, 'Start Wave!', {
            fontSize: '11px', fontFamily: Game.CONFIG.FONT,
            color: '#ffffff', align: 'center'
        }).setOrigin(0.5, 0.5).setDepth(11);

        var btnZone = this.add.zone(btnX, btnY, btnW, btnH);
        btnZone.setInteractive({ useHandCursor: true });
        btnZone.setDepth(12);

        btnZone.on('pointerover', function () {
            btnBg.clear();
            btnBg.fillStyle(0xff4444, 1);
            btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 12);
            btnBg.lineStyle(2, 0xff8888, 1);
            btnBg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 12);
        });
        btnZone.on('pointerout', function () {
            btnBg.clear();
            btnBg.fillStyle(0xcc3333, 1);
            btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 12);
            btnBg.lineStyle(2, 0xff6666, 1);
            btnBg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 12);
        });
        btnZone.on('pointerdown', function () {
            self._popupJustOpened = true;
            self._startWave();
        });
    }

    _startWave() {
        this.registry.set('towers', this.towers);
        console.log('[BuildPhaseScene] Starting wave ' + this.currentRound + ' with ' + this.towers.length + ' towers.');
        this.scene.start('WavePhaseScene');
    }

    /* ================================================================ */
    /*  Auto-skip                                                        */
    /* ================================================================ */

    _checkAutoSkip() {
        var self = this;
        var currency = Game.CurrencyManager.get();
        var maxPerType = this._getMaxPerType();

        // Find cheapest tower type that hasn't hit its limit
        var cheapest = Infinity;
        var types = Object.keys(Game.TOWERS);
        for (var i = 0; i < types.length; i++) {
            if (this._countTowersOfType(types[i]) < maxPerType) {
                if (Game.TOWERS[types[i]].cost < cheapest) cheapest = Game.TOWERS[types[i]].cost;
            }
        }

        var hasEmptySpot = false;
        for (var j = 0; j < Game.MAP.spots.length; j++) {
            if (!this._getTowerAtSpot(j)) { hasEmptySpot = true; break; }
        }

        // All tower types at limit, or can't afford anything, or no spots
        var allAtLimit = cheapest === Infinity;
        if (allAtLimit || (currency < cheapest && currency === 0) || !hasEmptySpot) {
            this.add.text(Game.CONFIG.WIDTH / 2, Game.CONFIG.HEIGHT / 2 - 60,
                'No builds available\nstarting wave...', {
                    fontSize: '9px', fontFamily: Game.CONFIG.FONT,
                    color: '#ffcc00', stroke: '#000000', strokeThickness: 3,
                    align: 'center'
                }).setOrigin(0.5, 0.5).setDepth(30);

            this.time.delayedCall(1500, function () { self._startWave(); });
        }
    }
};
