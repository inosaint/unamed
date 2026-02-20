# Word Defense

A browser-based game that combines **Boggle-style word finding** with **tower defense**. Swipe letters to form words, earn currency, and spend it placing towers to defend your castle from waves of enemies.

## How to Play

### 1. Word Phase (30 seconds)

A 4x4 grid of random letters appears. Drag across adjacent letters to form English words (minimum 3 letters). Each valid word earns currency based on length:

| Word Length | Currency |
|-------------|----------|
| 3 letters   | 1        |
| 4 letters   | 2        |
| 5 letters   | 4        |
| 6 letters   | 8        |
| 7 letters   | 16       |
| 8 letters   | 32       |

**Drag feedback:** The path turns green when you've formed a valid word, gold when the path is a valid prefix (keep going!), and red when no words start with that combination.

You can drag backward to undo letters. Each word can only be submitted once per round.

### 2. Build Phase

Spend your earned currency placing towers on the map. Tap a green placement circle, then choose a tower from the popup.

**Towers:**

| Tower  | Cost | Damage | Fire Rate | Range | Special            |
|--------|------|--------|-----------|-------|--------------------|
| Basic  | 5g   | 5      | Fast      | Short | Cheap, rapid fire  |
| Cannon | 8g   | 15     | Slow      | Mid   | Splash damage (AoE)|
| Archer | 10g  | 12     | Medium    | Long  | Best single-target |

**Tower Limits:** You can only place a limited number of each tower type per round. The limit increases as you progress:

- Rounds 1-2: 1 of each type
- Rounds 3-4: 2 of each type
- Rounds 5-6: 3 of each type
- And so on...

Towers persist between rounds, so plan your placements carefully.

### 3. Wave Phase

Enemies march along the path toward your castle. Towers auto-target and fire at enemies in range. If an enemy reaches the castle, it takes 1 HP of damage. Your castle starts with 20 HP.

Survive the wave to advance to the next round with a fresh Boggle board and tougher enemies.

**Enemy scaling per round:**
- Count: 3 + (round x 2)
- HP: 30 + (round x 10)

### Game Over

If your castle HP reaches 0, it's game over. You'll see how many rounds you survived and can restart.

## Running the Game

No build tools required. Just serve the files with any static HTTP server:

```bash
# Python
python3 -m http.server 8000

# Node
npx serve .
```

Then open `http://localhost:8000` in your browser.

## Tech Stack

- **Phaser 3** (v3.90.0) via CDN - game framework
- **Vanilla JavaScript** - no build step, no modules, all scripts loaded via `<script>` tags
- **Embedded word list** - ~8,500 English words with a Trie for fast prefix/word lookup
- **Placeholder graphics** - all visuals are generated in code (colored shapes), no external assets

## Project Structure

```
index.html                  Entry point
css/style.css               Minimal styling
js/
  config.js                 Game constants, scoring table
  main.js                   Phaser.Game instantiation
  scenes/
    BootScene.js            Texture generation, dictionary build, registry init
    WordPhaseScene.js       Boggle grid, drag-to-swipe input, timer, scoring
    BuildPhaseScene.js      Tower shop popup, placement on map
    WavePhaseScene.js       Enemy waves, tower combat, win/loss
  objects/
    BoggleGrid.js           4x4 grid generation (standard Boggle dice), adjacency
    Dictionary.js           Trie with isWord() and isPrefix()
    Tower.js                Targeting, firing, splash damage
    Enemy.js                Path following, HP, damage
    Bullet.js               Homing projectile, splash AoE
    Castle.js               HP tracking, damage flash
    Path.js                 Waypoint interpolation, rendering
  managers/
    RoundManager.js         Round progression, enemy scaling
    CurrencyManager.js      Earn/spend currency
    WaveManager.js          Enemy spawn timing
  data/
    dice.js                 16 standard Boggle dice
    wordlist.js             ~8,500 English words (3-8 letters)
    mapdata.js              Path waypoints + tower placement spots
    towerdata.js            Tower type definitions
```

## Game Loop

```
BootScene (once)
    |
    v
WordPhaseScene  <---.
    |                |
    v                |
BuildPhaseScene      |
    |                |
    v                |
WavePhaseScene ------'
    |
    v (castle destroyed)
Game Over -> restart
```
