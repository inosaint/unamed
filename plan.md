# Word Defense - Tower Defense + Boggle Prototype

## Context
Brand new repo (`/Users/trine/Documents/GitHub/unamed`). Building a browser game prototype that combines tower defense with Boggle-style word finding. Currency is earned by swiping words on a 4x4 letter grid, then spent placing defenses on a TD map. Reference: https://boggle.brennan.computer for Boggle UX.

## Core Game Loop (Sequential Phases Per Round)
1. **Word Phase** (30s timer): Swipe words on a 4x4 Boggle grid. Each valid word earns currency (longer = more).
2. **Build Phase**: Spend currency placing/upgrading towers on predefined spots along the path.
3. **Wave Phase**: Enemies march along a path toward the castle. Towers auto-attack. If castle HP hits 0, game over.
4. New round: fresh Boggle board, more enemies. Repeat.

## Tech Stack
- **Phaser 3** via CDN (v3.90.0) - no build tools
- All scripts loaded via `<script>` tags, shared `window.Game` namespace
- Placeholder assets generated in code (colored shapes) - no external files needed
- Embedded word list (~12K words as JS array), Trie for fast lookup + prefix checking

## File Structure
```
index.html
css/style.css
js/
  config.js              -- Constants, scoring table, game dimensions
  main.js                -- Phaser.Game instantiation
  scenes/
    BootScene.js         -- Generate placeholder textures, build dictionary
    WordPhaseScene.js    -- Boggle grid, drag input, timer, scoring
    BuildPhaseScene.js   -- Tower shop, placement on map
    WavePhaseScene.js    -- Enemy waves, tower combat, win/loss
  objects/
    BoggleGrid.js        -- Grid generation (standard Boggle dice), adjacency, selection tracking
    Dictionary.js        -- Trie with isWord() + isPrefix() for real-time drag feedback
    Tower.js             -- Range, damage, fire rate, targeting nearest enemy
    Enemy.js             -- Follows path waypoints, has HP bar
    Bullet.js            -- Projectile from tower to enemy
    Castle.js            -- HP tracking + display
    Path.js              -- Renders path, provides waypoint data
  managers/
    RoundManager.js      -- Phase transitions, round scaling
    CurrencyManager.js   -- Track/spend/earn currency
    WaveManager.js       -- Enemy spawn timing
  data/
    dice.js              -- 16 Boggle dice (post-1987 distribution)
    wordlist.js          -- ~12K English words (3-8 letters)
    mapdata.js           -- Hardcoded path waypoints + tower placement spots
    towerdata.js         -- Tower type definitions (cost, damage, range)
```

## Key Design Decisions

| Area | Decision | Why |
|------|----------|-----|
| State | `Phaser.Registry` shared across scenes | Built-in, no extra code |
| Dictionary | Trie built at boot from embedded JS array | `isPrefix()` enables real-time drag feedback |
| Assets | Generated textures in BootScene | Zero external files |
| Path | Hardcoded S-curve waypoints | No pathfinding needed, enemies lerp between points |
| Tower spots | Predefined positions near path | Avoids grid snapping complexity |
| Q handling | Q is just the letter Q (single char, no "Qu" special case) | Simplicity |

## Scoring & Balance
| Word Length | Currency | | Tower | Cost |
|-------------|----------|-|-------|------|
| 3 letters   | 1        | | Wall (slows) | 3 |
| 4 letters   | 2        | | Basic tower  | 5 |
| 5 letters   | 4        | | Archer tower | 10 |
| 6 letters   | 8        | |
| 7 letters   | 12       | |
| 8+ letters  | 18       | |

Finding 5-8 short words per round affords one basic tower. Longer words give meaningful advantage.

## Implementation Order (with Subagent Strategy)

We'll use parallel subagents for independent workstreams:

### Wave 1: Foundation (parallel agents)
- **Agent A - Skeleton**: `index.html`, `css/style.css`, `config.js`, `main.js`, `BootScene.js`
- **Agent B - Boggle Core**: `dice.js`, `wordlist.js`, `Dictionary.js`, `BoggleGrid.js`
- **Agent C - Map & Data**: `mapdata.js`, `towerdata.js`, `Path.js`, `Castle.js`

### Wave 2: Game Objects (parallel agents)
- **Agent D - Word Phase Scene**: `WordPhaseScene.js` (drag input, timer, scoring, found-words list)
- **Agent E - TD Objects**: `Tower.js`, `Enemy.js`, `Bullet.js`, `CurrencyManager.js`

### Wave 3: Game Loop (parallel agents)
- **Agent F - Build Phase**: `BuildPhaseScene.js` (tower shop, placement UI)
- **Agent G - Wave Phase**: `WavePhaseScene.js`, `WaveManager.js` (combat loop)

### Wave 4: Integration
- **Agent H**: `RoundManager.js`, phase transitions, game over screen, balance tuning

## Tricky Parts to Watch
1. **Boggle drag input** - Must handle adjacency, no-reuse, drag-back-to-undo, and both mouse/touch
2. **Script load order** - No modules; data first, then objects, then managers, then scenes, then main
4. **Tower targeting** - Brute-force nearest-in-range is fine for prototype enemy counts

## Agent Task Management

Each subagent wave gets its own `agent-todo-{name}.md` file in the project root to track tasks. Agents manage their own file. The main agent (me) coordinates across files.

```
plan.md                      -- This plan (copied from .claude/plans/)
agent-todo-skeleton.md       -- Agent A: HTML shell, config, boot scene
agent-todo-boggle.md         -- Agent B: Dice, wordlist, dictionary, grid logic
agent-todo-map.md            -- Agent C: Map data, path, castle
agent-todo-word-scene.md     -- Agent D: WordPhaseScene (drag, timer, scoring)
agent-todo-td-objects.md     -- Agent E: Tower, Enemy, Bullet, CurrencyManager
agent-todo-build-scene.md    -- Agent F: BuildPhaseScene (shop, placement)
agent-todo-wave-scene.md     -- Agent G: WavePhaseScene, WaveManager
agent-todo-integration.md    -- Agent H: RoundManager, transitions, game over
```

Each file follows the format:
```
# Agent [Letter] - [Name]
## Tasks
- [ ] Task 1 description
- [ ] Task 2 description
...
## Notes
(Agent writes implementation notes/decisions here as it works)
```

## Verification
1. Open `index.html` in browser (or `python3 -m http.server 8000`)
2. Word Phase: drag to form words, verify timer counts down, words validate, currency accumulates
3. Build Phase: place towers on spots, verify currency deducts
4. Wave Phase: enemies follow path, towers shoot, enemies die or damage castle
5. Round loop: new Boggle board appears, enemy count increases each round
6. Game Over: castle HP reaches 0, game over screen shows
