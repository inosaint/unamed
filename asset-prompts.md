# Asset Generation Prompts

Prompts for generating game assets for Word Defense. Designed for AI image generators (Gemini, Midjourney, DALL-E, etc.).

All game sprites are small (32x32 or 64x64 pixels) viewed from a **top-down perspective** on a fantasy/medieval themed tower defense map.

**Important:** Most AI generators fail at producing actual transparent PNGs. Instead, all sprite prompts request a **solid bright magenta (#FF00FF) background** so we can cleanly chroma-key it out without damaging dark outlines on the sprite.

---

## Style Guide

Use this as a prefix/suffix for consistency across all prompts:

> **Style suffix:** `pixel art, top-down view, fantasy medieval theme, clean edges, solid bright magenta (#FF00FF) background, game sprite, 2D`

For tiles/backgrounds that fill the full image (grass, path, scene backgrounds), no chroma-key is needed — those use their natural colors.

---

## Towers

### Basic Tower (32x32)
```
A small wooden guard tower with a crossbow mounted on top, viewed from directly above,
pixel art style, fantasy medieval theme, blue-tinted wood and stone base, simple compact
design, clean edges, solid bright magenta (#FF00FF) background, 2D game sprite, 32x32 pixels
```

### Archer Tower (32x32) — DONE (assets/Archer-tower.png)
```
An elven archer tower with a tall green crystal spire, viewed from directly above,
pixel art style, fantasy medieval theme, emerald green glowing accents, elegant narrow
design with pointed roof, clean edges, solid bright magenta (#FF00FF) background,
2D game sprite, 32x32 pixels
```

### Cannon Tower (32x32)
```
A heavy dwarven cannon emplacement with a bronze barrel pointing upward, viewed from
directly above, pixel art style, fantasy medieval theme, brown and bronze metal,
chunky triangular fortified base, smoke wisps, clean edges, solid bright magenta
(#FF00FF) background, 2D game sprite, 32x32 pixels
```

---

## Enemies

### Basic Enemy (32x32)
```
A small goblin warrior carrying a shield, viewed from directly above walking downward,
pixel art style, fantasy medieval theme, red-tinted skin, dark leather armor, menacing
but simple design, clean edges, solid bright magenta (#FF00FF) background, 2D game
sprite, 32x32 pixels
```

### Enemy Spritesheet (32x32, 4 frames)
```
A goblin warrior walking animation spritesheet, 4 frames in a horizontal strip,
viewed from directly above walking downward, pixel art style, fantasy medieval theme,
red skin, dark armor, each frame showing a different step of the walk cycle,
solid bright magenta (#FF00FF) background, 2D game sprite, 128x32 pixels total
```

---

## Projectiles

### Basic Bullet (8x8)
```
A small glowing yellow crossbow bolt viewed from above, pixel art style, fantasy
medieval theme, bright yellow energy trail, simple pointed shape, clean edges,
solid bright magenta (#FF00FF) background, 2D game sprite, 8x8 pixels
```

### Archer Arrow (8x8)
```
A sleek green-tipped elven arrow viewed from above, pixel art style, fantasy medieval
theme, green magical glow, thin elegant shaft, clean edges, solid bright magenta
(#FF00FF) background, 2D game sprite, 8x8 pixels
```

### Cannonball (12x12)
```
A heavy iron cannonball with an orange fire trail viewed from above, pixel art style,
fantasy medieval theme, dark iron sphere with ember glow, clean edges, solid bright
magenta (#FF00FF) background, 2D game sprite, 12x12 pixels
```

### Cannon Explosion / Splash Effect (64x64)
```
A circular explosion impact on the ground viewed from above, pixel art style, fantasy
medieval theme, orange and red fire burst with debris, radial shockwave ring,
solid bright magenta (#FF00FF) background, 2D game sprite, 64x64 pixels
```

---

## Castle

### Castle (64x48)
```
A small medieval stone castle with two turrets and a gate, viewed from directly above,
pixel art style, fantasy medieval theme, gray stone walls, blue banner flags, compact
fortified design, clean edges, solid bright magenta (#FF00FF) background, 2D game
sprite, 64x48 pixels
```

### Castle Damaged (64x48)
```
The same medieval stone castle but heavily damaged, cracks in walls, one turret
crumbling, fire and smoke, viewed from directly above, pixel art style, fantasy
medieval theme, dark gray crumbling stone, clean edges, solid bright magenta
(#FF00FF) background, 2D game sprite, 64x48 pixels
```

---

## Map Elements

### Path Tile (64x64)
```
A dirt road tile viewed from directly above, pixel art style, fantasy medieval theme,
worn brown dirt path with subtle cobblestone edges, grass tufts on the borders,
seamless tileable, 2D game sprite, 64x64 pixels
```

### Grass / Map Background (64x64) — DONE (assets/grass.png)
```
A lush green grass tile viewed from directly above, pixel art style, fantasy medieval
theme, varied green shades with tiny flowers and pebbles, seamless tileable,
2D game sprite, 64x64 pixels
```

### Word Phase Background Tile (64x64)
```
A dark stone dungeon floor tile viewed from directly above, pixel art style, fantasy
medieval theme, dark purple-gray cobblestone with faint glowing blue rune cracks,
moody and atmospheric, seamless tileable, 2D game sprite, 64x64 pixels
```

### Tower Placement Spot (40x40)
```
A circular stone foundation pad on grass viewed from directly above, pixel art style,
fantasy medieval theme, light gray cobblestone circle with a faint green glow indicating
it is buildable, clean edges, solid bright magenta (#FF00FF) background, 2D game
sprite, 40x40 pixels
```

---

## UI Elements

### Boggle Letter Tile (64x64)
```
A carved wooden tile with a raised beveled edge, warm brown wood grain texture,
viewed from directly above, pixel art style, fantasy medieval theme, empty center
where a letter would be stamped, clean edges, solid bright magenta (#FF00FF)
background, 2D game sprite, 64x64 pixels
```

### Gold Coin Icon (24x24)
```
A shiny gold coin with a sword emblem stamped in the center, pixel art style,
fantasy medieval theme, golden yellow with subtle shine highlight, clean edges,
solid bright magenta (#FF00FF) background, 2D game UI icon, 24x24 pixels
```

### Heart / HP Icon (24x24)
```
A red crystal heart icon, pixel art style, fantasy medieval theme, bright red with
a small white shine highlight, clean edges, solid bright magenta (#FF00FF) background,
2D game UI icon, 24x24 pixels
```

---

## Post-Processing

After generating each sprite, drop the image into `assets/` and I can run a chroma-key script to:
1. Replace all magenta (#FF00FF) pixels with transparency
2. Crop to the sprite bounds
3. Resize to the target game dimensions

This preserves all dark outlines and detail that would be lost with color-similarity-based background removal.

---

## Notes

- **Magenta background** ensures clean separation — magenta almost never appears in fantasy sprites
- **Consistent style** matters more than detail — these are small sprites, keep them readable at actual size
- If your generator doesn't handle pixel art well at small sizes, generate at 4x scale (e.g. 128x128 for a 32x32 sprite) and downscale
- For spritesheets (animated enemies), you may need to generate individual frames and stitch them together
- Tower textures are referenced by key in the code: `tower_basic`, `tower_archer`, `tower_cannon`, `enemy`, `bullet`, `castle`, `placement_spot`, `path_tile`

## Asset Checklist

### Done (in `assets/` or `assets/processed/`)
- [x] Grass tile — `assets/grass.png`
- [x] Archer tower — `assets/archer-tower.png`
- [x] Basic tower — `assets/basic-tower.png`
- [x] Cannon tower — `assets/cannon.png`
- [x] Goblin spritesheet (8 frames, 4x2 grid) — `assets/processed/goblin_sheet.png`
- [x] Basic bullet (arrow) — `assets/arrow-basic.png`
- [x] Cannonball — `assets/cannonball.png`
- [x] Castle (3-frame spritesheet: intact/damaged/destroyed) — `assets/castle-sprite.png`
- [x] Path tile (vertical) — `assets/processed/path_tile.png`
- [x] Placement spot — `assets/placement.png`
- [x] Floor tile (stone dungeon) — `assets/processed/floor_tile.png`
- [x] Boggle letter tile — `assets/processed/letter_tile.png`
- [x] Heart icon — `assets/heart.png`

### Still Needed
- [ ] Dungeon wall tile (horizontal, seamless) — for Moonlighter-style word phase room walls
- [ ] Dungeon wall corner tile — corner piece for room walls
- [ ] Window/torch wall decoration — wall detail sprites for visual interest

---

## New Prompts: Dungeon Room Walls

### Dungeon Wall Tile - Horizontal (256x72)
```
A horizontal seamless stone dungeon wall viewed from above at a slight angle showing
depth, pixel art style, dark purple-gray stone bricks with mortar lines, fantasy
medieval theme, Moonlighter game aesthetic, moody and atmospheric, dark color palette
with subtle blue-purple tones, seamless tileable horizontally, 2D game sprite,
256x72 pixels
```

### Dungeon Wall Tile - Vertical (72x256)
```
A vertical seamless stone dungeon wall viewed from above at a slight angle showing
depth, pixel art style, dark purple-gray stone bricks with mortar lines, fantasy
medieval theme, Moonlighter game aesthetic, moody and atmospheric, dark color palette
with subtle blue-purple tones, seamless tileable vertically, 2D game sprite,
72x256 pixels
```

### Dungeon Wall Corner (72x72)
```
A corner piece of a stone dungeon wall viewed from above, pixel art style, dark
purple-gray stone bricks forming an L-shaped corner, fantasy medieval theme,
Moonlighter game aesthetic, thicker pillar-like construction at the corner joint,
dark color palette, solid bright magenta (#FF00FF) background outside the corner,
2D game sprite, 72x72 pixels
```

### Dungeon Floor Tile (64x64)
```
A dark stone dungeon floor tile viewed from directly above, pixel art style, fantasy
medieval theme, dark teal-green cobblestone with subtle cracks and moss, Moonlighter
game aesthetic, moody atmospheric coloring, seamless tileable, 2D game sprite,
64x64 pixels
```

### Wall Torch / Sconce (32x48)
```
A wall-mounted torch or sconce viewed from above casting a warm glow, pixel art style,
fantasy medieval theme, iron bracket holding a flickering flame, warm orange light
pool beneath, solid bright magenta (#FF00FF) background, 2D game sprite, 32x48 pixels
```
