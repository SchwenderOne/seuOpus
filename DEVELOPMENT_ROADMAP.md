# Development Roadmap

**Created**: December 3, 2025  
**Game**: Roguelike Shoot 'em Up (Vampire Survivors-style)

## Asset Analysis

### Currently Used Assets ✅

| Category | Assets |
|----------|--------|
| **Tileset** | Main tileset (floor/walls) |
| **Character** | Walk animations (3 directions), Death animations (3 directions) |
| **Weapons** | Sprites 1-9, Projectiles 1-10 |
| **Enemies** | 6 types (goblin, skeleton, eye, mushroom, slime, bat) - Run/Death animations |
| **UI** | HP bars (back, green, red, yellow), Button set, UI tileset |
| **Objects** | Portal animations, Altar animations |
| **Effects** | Effect set 1 (3 frames) |
| **NEW** | Icon frames 1-4, Weapon icons 1-9, XP gems 1-5, Rocks 1-8 |

### Unused Assets (Opportunities) 🎯

| Category | Assets | Potential Use |
|----------|--------|---------------|
| **GUI/Icons** | 32 icons (Icon_01-32), Iconsets 1-10 | Buff/debuff indicators, power-up icons, inventory |
| **GUI/Bars** | BarSet, BarTiles 1-10 | Cooldown bars, boss HP, shield bar |
| **GUI/Interface** | 40 interface tiles | Custom menu panels, tooltips |
| **GUI/Buttons** | ButtonSet | Main menu, pause menu, settings |
| **GUI/Scrolling** | 5 scrolling elements | Background parallax, title screen |
| **GUI/Cursor** | 4 cursors | Custom game cursor |
| **GUI/Logo** | Logo image | Title screen |
| **Location/Grass** | 16 grass sprites | Arena decorations |
| **Location/Rocks** | 16 rocks (8 more unused) | Arena obstacles/decorations |
| **Location/Portals** | 4 portal variants | Different portal types |
| **Location/Altars** | 2 altar objects | Shrine mechanics |
| **Character/Effects** | Effect sets 2-8 (21 more) | Hit effects, death effects, power-ups |
| **Character/Projectiles** | Projectiles 11-22 (12 more) | More weapon varieties |

---

## Development Phases

### Phase 1: Visual Polish ✅
- [x] Enhanced HUD with sprite-based health bars
- [x] Weapon icon display with level indicators
- [x] HP text overlay
- [x] Timer with styled panel
- [x] Replace procedural decorations with actual sprites

### Phase 2: Audio & Effects ✅
**Goal**: Add sound effects and visual polish

Completed:
1. **SoundManager System** - Procedural Web Audio API sounds:
   - 16 sound effect types (weapons, hits, deaths, pickups, UI)
   - Volume controls (master, SFX, music)
   - Mute toggle and cooldowns
   
2. **Expanded visual effects** - All Effect sets 1-8:
   - Varied hit effects (random from sets 1-4)
   - Boss death explosions (sets 5-8)
   - Rotation animation on effects
   
3. **Custom cursor** - Pixel art crosshair
4. **Sprite decorations** - 16 rock + 16 grass variants

### Phase 3: Content Expansion ✅
**Goal**: More variety and replayability

Completed:
1. **Elite enemy variants** - 3 new types with unique behaviors:
   - Swarm (zigzag movement)
   - Bomber (explodes on death)
   - Teleporter (warps near player)
2. **Projectile variety** - Variable projectile textures support
3. **Altar/Shrine mechanic** - Interactive altars with 6 buff types
4. **HUD fix** - Corrected UI positioning with camera zoom

### Phase 4: Meta-Progression (Next Session)
**Goal**: Persistent unlocks between runs

Tasks:
1. **Currency system** - Gold drops from enemies
2. **Permanent upgrades** - Starting HP, damage, speed
3. **Character unlocks** - Different starting loadouts
4. **Achievement system** - Track milestones

### Phase 5: Polish & Balance
**Goal**: Game feel and balance

Tasks:
1. **Title screen** - Use Logo asset, custom buttons
2. **Settings menu** - Volume, controls
3. **Pause menu** - Styled with Interface tiles
4. **Balance pass** - Enemy HP/damage, weapon scaling, boss difficulty
5. **Screen effects** - Parallax background using Scrolling assets

---

## Session Prompts

### Next Session Prompt (Audio & Effects):
```
Continue developing the Roguelike Shoot 'em Up game.

Read DEVELOPMENT_STATUS.md and DEVELOPMENT_ROADMAP.md for context.

Current state:
- Enhanced HUD with HP bar sprites, weapon icons, level badges
- Boss enemies every 3 waves with visual warning
- Weapon evolution system (3 evolutions)
- Player stats menu (M key)
- Procedural decorations (rocks, bones, plants, torches)

This session focus on Phase 2 (Audio & Effects):
1. Find/source audio assets (or create placeholder sounds)
2. Implement sound manager with volume control
3. Expand visual effects using Effect sets 2-8 from asset kit
4. Add custom cursor from GUI/Cursor assets
5. Consider screen shake improvements

Asset paths:
- Effects: craftpix.../1 Main Character/3 Effects/
- Cursors: craftpix.../4 GUI/7 Cursor/

Run: npm run dev
Test: http://localhost:3000
```

### Content Expansion Session Prompt:
```
Continue developing the Roguelike Shoot 'em Up game.

Read DEVELOPMENT_STATUS.md and DEVELOPMENT_ROADMAP.md for context.

This session focus on Phase 3 (Content Expansion):
1. Add 2-3 new enemy types or enemy variants
2. Implement altar/shrine mechanic using existing altar sprites
3. Add more projectile types for weapon variety
4. Replace procedural decorations with actual sprite assets
5. Consider adding grass decorations

Asset paths:
- Altars: craftpix.../2 Location/2 Objects/Altar1.png, Altar2.png
- Grass: craftpix.../2 Location/2 Objects/Grass/
- Projectiles: craftpix.../1 Main Character/2 Weapons/Projectiles/

Run: npm run dev
Test: http://localhost:3000
```

### Meta-Progression Session Prompt:
```
Continue developing the Roguelike Shoot 'em Up game.

Read DEVELOPMENT_STATUS.md and DEVELOPMENT_ROADMAP.md for context.

This session focus on Phase 4 (Meta-Progression):
1. Add gold/currency drops from enemies
2. Create shop/upgrade menu between runs
3. Implement persistent upgrades (localStorage)
4. Design unlock tree for abilities/weapons
5. Add main menu with "Upgrades" button

Use GUI assets for menu styling:
- Buttons: craftpix.../4 GUI/2 Buttons/
- Interface: craftpix.../4 GUI/1 Interface/
- Icons: craftpix.../4 GUI/3 Icons/

Run: npm run dev
Test: http://localhost:3000
```

---

## Technical Notes

### Asset Loading
All assets should be loaded in `PreloaderScene.ts`:
- Use `this.load.image()` for static images
- Use `this.load.spritesheet()` for animations
- Frame sizes: Characters/enemies = 48x48, Effects vary (check each)

### Depth Layers (z-index)
```typescript
DEPTH = {
  FLOOR: 0,
  DECORATIONS: 10,
  SHADOWS: 20,
  ITEMS: 30,
  ENEMIES: 40,
  PLAYER: 50,
  PROJECTILES: 60,
  EFFECTS: 70,
  UI: 100,
}
```

### Key Files to Modify
- `PreloaderScene.ts` - Asset loading
- `GameScene.ts` - Main game logic, UI
- `WeaponManager.ts` - Weapon systems
- `EnemySpawner.ts` - Enemy spawning
- `UpgradeSystem.ts` - Upgrade definitions

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.5.0 | Dec 3, 2025 | Boss enemies, weapon evolutions, player menu |
| 0.5.1 | Dec 3, 2025 | Enhanced HUD, weapon icons, asset loading |
| 0.6.0 | Dec 3, 2025 | SoundManager, custom cursor, sprite decorations, expanded effects |
| 0.7.0 | Dec 3, 2025 | Altar system, elite enemies, HUD fix, projectile variety |
