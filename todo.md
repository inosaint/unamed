# Word Defense - Bug Fixes (from gameplay recording)

## High Priority

- [ ] **Towers not firing** — No bullet sprites visible during the entire wave phase despite multiple towers being placed. Goblins walk past towers unharmed. Likely cause: tower targeting/shooting logic, bullet spawning, or bullet rendering issue.

- [ ] **Enemy count text not updating** — "Enemies: 11 remaining" stays static throughout the wave phase. The `updateEnemyCountText()` or `waveManager.getRemaining()` may not be reflecting kills/removals correctly.

- [ ] **Castle too small / barely visible** — The castle sprite is tiny and sits at the very bottom edge of the screen. Needs larger scale and/or repositioned so it's clearly visible as the thing players are defending.

## Medium Priority

- [ ] **Castle HP suspiciously low by round 4** — Castle HP shows 1/20 entering round 4, meaning 19 HP was lost in just 3 rounds. Could indicate: enemies dealing too much damage, towers not working (see above), or HP not resetting between test runs.

- [ ] **Game Over overlay transparency** — The dark overlay on Game Over lets enemies and map bleed through quite a bit. Consider increasing opacity or cleaning up sprites behind the overlay.

## Low Priority

- [ ] **Tower placement spots** — Some spots still appear to be in slightly odd positions relative to the path. Review and adjust for better visual alignment.

## Notes

- Path rendering with rounded corners is working correctly
- Goblin walk animation is playing and sprites flip when changing direction
- Three-column WordPhaseScene layout (scoring table, grid, found words) looks good
- Press Start 2P font is rendering throughout all scenes
- Game scaling (FIT mode) appears to be working
- Castle damage states (intact -> damaged -> destroyed) appear to be transitioning
