# Development Status

**Last Updated**: December 4, 2025  
**Current Version**: 0.12.0 (MiniMap & Bug Fixes)

## Project Overview

Roguelike Shoot 'em Up - A Bullet Heaven/Vampire Survivors-style game built with:
- **Engine**: Phaser 3
- **Language**: TypeScript
- **Build Tool**: Vite
- **Assets**: Craftpix Roguelike Shoot 'em Up Pixel Art Kit

## Implemented Features ✅

### Core Systems
- [x] Project structure with Vite + TypeScript + Phaser 3
- [x] Asset loading system with progress bar (PreloaderScene)
- [x] Procedural dungeon generation using Cellular Automata
- [x] Tilemap rendering with floor and wall layers
- [x] World bounds and physics system

### Player
- [x] Player entity with WASD/Arrow key movement
- [x] 8-directional movement with diagonal normalization
- [x] Walk animations (up, down, side) with sprite flipping
- [x] Health system with damage and invincibility frames
- [x] XP collection and leveling system
- [x] Death handling with animation

### Combat
- [x] Auto-fire projectile system with object pooling
- [x] Auto-aim at nearest enemy within range (300px)
- [x] Muzzle flash VFX when firing
- [x] Projectile-enemy collision detection
- [x] Projectile-wall collision (bullets stop at walls)
- [x] Damage calculation and enemy HP
- [x] Floating damage numbers on hit
- [x] Hit effect VFX on enemy damage
- [x] Red flash on enemy taking damage

### Additional Weapons (NEW in 0.3.0)
- [x] **Throwing Axe** - Boomerang-style weapon that returns to player, piercing enemies
- [x] **Rear Dagger** - Auto-fires behind player for rear protection
- [x] **Orbiting Orb** - Defensive orb that circles the player, damaging enemies on contact
- [x] Weapon unlock system via level-up upgrades
- [x] Weapon upgrade system (level up weapons for increased damage/effects)

### Enemy Projectiles (NEW in 0.3.0)
- [x] EnemyProjectileManager for pooled enemy bullets
- [x] Shooter enemies (Eye) now fire projectiles at player
- [x] Enemy projectile collision with player and walls
- [x] Visual feedback when shooter enemies fire (orange flash)

### Enemies
- [x] 6 enemy types: Goblin, Skeleton, Eye, Mushroom, Slime, Bat
- [x] 4 AI behaviors: Chaser, Shooter, Rusher, Tank
- [x] Wave-based spawning with increasing difficulty
- [x] Off-screen spawning and despawning (optimization)
- [x] Death animations and XP reward

### UI
- [x] Main Menu with start button
- [x] Health bar (red)
- [x] XP bar (cyan)
- [x] Level display
- [x] Survival timer
- [x] FPS counter (debug)
- [x] Controls tooltip (fades after 10 seconds)
- [x] Level-up pause overlay
- [x] Game Over screen with stats

### Scenes
- [x] BootScene - Initial loading
- [x] PreloaderScene - Asset loading with progress
- [x] MainMenuScene - Title screen
- [x] GameScene - Main gameplay
- [x] GameOverScene - Results screen

## Known Issues / Bugs Fixed 🐛

### Fixed in Session 1 (Dec 3, 2025)
1. **Duplicate floor layer**: Removed secondary UI camera that was causing floor tiles to render twice (one layer fixed to screen)
2. **No mechanics explanation**: Added controls tooltip showing WASD, mouse aim, and auto-fire info
3. **Shooting not working**: Changed from mouse-aim to auto-aim at nearest enemy within range (300px)
4. **Missing VFX**: Added muzzle flash effect when firing projectiles
5. **No damage feedback**: Added floating damage numbers and hit effects when enemies take damage
6. **Red blink on damage**: Entity.flashDamage() already existed and now works correctly

### Fixed in Session 2 (Dec 3, 2025)
7. **Enemies not taking damage**: Fixed physics body enable/disable on projectile pool - bodies need to be enabled when firing and disabled when pooled
8. **XP gem drops**: Created XPGemManager with gem spawning, attract-to-player behavior, and collection
9. **Upgrade selection UI**: Created UpgradeSystem with 6 upgrade types and 3-card selection UI on level-up
10. **Victory portal**: Portal spawns after 5 minutes (GAME_DURATION) near player for victory condition
11. **Bullets disappearing instantly**: Added 30px spawn offset in firing direction + small 4px circular hitbox + disabled double-update
12. **Screen shake on damage**: Camera shakes when player takes damage
13. **Kill counter & wave display**: Added UI elements showing enemies killed and current wave
14. **Enemy death particles**: Red particle burst effect when enemies die
15. **404 asset errors**: Fixed bar asset paths (HPBar_back.png etc.) and death animation frame counts (0-3)
16. **Enhanced main menu**: Added floating particles, title shadow/glow, fade transitions, improved button styling
17. **Better instructions**: Added comprehensive instruction panel with game objectives

### Fixed/Implemented in Session 3 (Dec 3, 2025)
18. **getWaveNumber undefined error**: Added guard check for enemySpawner in updateUI() since it's called before createSystems()
19. **Additional weapons system**: Implemented WeaponManager with Axe (boomerang), Dagger (rear), and Orb (orbiting)
20. **Weapon upgrades in level-up**: Added weapon unlock and upgrade options to the level-up selection UI
21. **Enemy shooter projectiles**: Eye enemies now fire red projectiles at the player when in range
22. **EnemyProjectileManager**: Created pooled enemy projectile system with collision detection
23. **Open arena map**: Changed dungeon generation to create fully walkable open arena with only border walls (no cave walls)
24. **Tilemap tile index fix**: Fixed floor tiles using index 1 instead of 0 (Phaser treats index 0 as empty)

### Implemented in Session 4 (Dec 3, 2025) - v0.5.0
25. **Player Stats Menu (M key)**: Full stats menu showing character stats (HP, level, speed), combat stats (kills, bosses, wave), and equipped weapons with damage values
26. **Boss Enemies**: 3 boss types (Boss Slime, Boss Skeleton, Boss Eye) that spawn every 3 waves starting at wave 3
   - Bosses are 2.5x larger with orange tint
   - Stats scale with wave number (+15% per wave after wave 3)
   - Boss warning notification with screen shake
   - Boss kill tracking
27. **Weapon Evolution System**: Weapons can evolve to ultimate forms when reaching max level + player level requirement
   - 🌀 Death Spiral (Axe Lvl 5 + Player Lvl 8): 3x damage, faster cooldown
   - ⚔️ Blade Storm (Dagger Lvl 5 + Player Lvl 8): 8 daggers in all directions
   - 💠 Nova Shield (Orb Lvl 3 + Player Lvl 6): 4x damage, extra orbs
   - Dramatic evolution notification with screen shake
28. **Procedural Decorations**: Arena now has scattered visual elements (no collision)
   - Rocks, bones, plants, rubble with random variants
   - Animated torches with flickering flame and glow effects
   - Safe zone around spawn point (no decorations within 8 tiles)

### Implemented in Session 5 (Dec 3, 2025) - v0.5.1
29. **Enhanced HUD System**:
   - HP bar with sprite background using actual game assets
   - HP text overlay showing current/max health
   - XP bar with styled background
   - Level badge (circular indicator)
   - Timer panel with styled border
   - Kill counter and wave counter
30. **Weapon Icons HUD**:
   - 4 weapon slots displayed at bottom of screen (Wand, Axe, Dagger, Orb)
   - Uses actual weapon icon sprites from asset kit
   - Level indicator badge on each weapon
   - Inactive weapons dimmed (30% opacity)
   - Evolved weapons show ★ symbol
   - Dynamic updates as weapons are unlocked/upgraded
31. **Additional Asset Loading**:
   - Icon frames (4 variants)
   - Weapon icons (9 types)
   - XP gem sprites (5 variants - for future use)
   - Rock sprites (8 variants - for future decorations)
   - UI interface tiles (10 variants)

### Implemented in Session 6 (Dec 3, 2025) - v0.6.0
32. **SoundManager System**:
   - Web Audio API-based procedural sound generation
   - 16 sound effect types (weapons, hits, deaths, pickups, UI, etc.)
   - Master/SFX/Music volume controls
   - Mute toggle and sound cooldowns to prevent spam
   - Sounds integrated throughout: collisions, level up, boss spawn/death, portal, UI
33. **Custom Cursor**:
   - Game cursor replaced with pixel art crosshair from asset kit
   - Cursor follows mouse position with proper offset
34. **Sprite-Based Decorations**:
   - Rocks now use actual rock sprites (16 variants, random scale/flip)
   - Grass/plants use grass sprites (16 variants)
   - Bones use tinted rock sprites for variety
   - Rubble clusters use multiple small rock sprites
   - Torches retain animated flame with rock base
35. **Expanded Visual Effects**:
   - All 8 effect sets now loaded (24 effect frames total)
   - Hit effects randomly select from sets 1-4 with varied tints
   - Boss death explosion effect using sets 5-8
   - Effects have rotation animation for more dynamic visuals
36. **Asset Loading Expansion**:
   - All 16 rock sprites
   - All 16 grass sprites  
   - All 4 cursor sprites
   - All effect sprites (8 sets × 3 frames)

### Implemented in Session 7 (Dec 3, 2025) - v0.7.0
37. **HUD Fix**:
   - Fixed HUD visibility issue caused by camera zoom
   - Now uses `scale.width/height` instead of camera dimensions for UI positioning
38. **Altar/Shrine System**:
   - Interactive altars spawn every 60 seconds (first at 30s)
   - Walk near altar to activate and receive a random buff
   - 6 buff types: Heal, Damage Boost, Speed Boost, Shield, XP Boost, Magnet
   - Visual glow effect and activation particles
   - Buff notifications and expiry warnings
39. **Elite Enemy Variants**:
   - 3 new elite enemy types with unique behaviors:
     - **Elite Goblin (Swarm)**: Fast zigzag movement pattern
     - **Elite Skeleton (Bomber)**: Explodes on death with area effect
     - **Elite Mushroom (Teleporter)**: Periodically teleports near player
   - Elite enemies appear from Wave 7+ with increasing probability
   - Purple tint and slightly larger scale to distinguish from normal enemies
40. **Enhanced Projectile System**:
   - Variable projectile textures (10 types available)
   - Improved muzzle flash effects using varied effect sprites

### Implemented in Session 8 (Dec 3, 2025) - v0.8.0 (Meta-Progression)
41. **Gold Currency System**:
   - Gold coins drop from enemies (40% chance, more from bosses)
   - Pooled GoldManager with animated coin sprites
   - Gold persists between runs via localStorage
   - HUD gold counter displays session gold
42. **Permanent Upgrades (Armory)**:
   - 8 permanent upgrade types purchasable with gold:
     - Vitality (+10 HP per level, max 10)
     - Swiftness (+5% speed per level, max 5)
     - Power (+5% damage per level, max 10)
     - Magnetism (+15% pickup radius per level, max 5)
     - Wisdom (+10% XP gain per level, max 5)
     - Greed (+15% gold gain per level, max 5)
     - Veteran (+1 starting level, max 3)
     - Precision (+5% crit chance per level, max 5)
   - Scaling costs with multiplier per level
43. **Character Unlock System**:
   - 6 playable characters with unique stats:
     - Knight (default, balanced)
     - Rogue (fast, high damage, fragile, +10% crit)
     - Mage (slow, high damage, +20% XP)
     - Berserker (rage at low HP)
     - Merchant (+50% gold find)
     - Vampire (lifesteal on kills)
   - Characters unlocked with gold
44. **Achievement System**:
   - 20 achievements across categories:
     - Kill achievements (First Blood, Slayer, Boss Hunter)
     - Survival achievements (1min, 3min, Victory)
     - Level achievements (5, 10, 20)
     - Weapon achievements (unlock, evolve, arsenal)
     - Gold achievements (100, 1000, 5000 total)
     - Secret achievements (Untouched, Minimalist, Speedrunner)
   - Achievement notifications with gold rewards
   - AchievementTracker for in-run tracking
45. **Meta-Progression Persistence**:
   - MetaProgressionManager singleton with localStorage
   - Saves: gold, kills, bosses, runs, victories, stats
   - Run stats update on game over
46. **New UI Scenes**:
   - UpgradeMenuScene (Armory) with 4 tabs:
     - Upgrades tab (purchase permanent upgrades)
     - Characters tab (unlock and select characters)
     - Achievements tab (view progress and rewards)
     - Statistics tab (lifetime stats and records)
   - Main menu updated with gold display and ARMORY button
   - Game Over shows gold earned and total gold

### Implemented in Session 9 (Dec 3, 2025) - v0.8.1 (Balance & Bug Fixes)
47. **Bug Fixes**:
   - Fixed HUD not visible during gameplay (removed camera zoom that interfered with UI)
   - Fixed victory portal jittering (made portal body immovable/static)
48. **Balance Changes**:
   - Increased enemy spawn rate by 2.5x (spawn interval: 2000ms → 800ms)
   - Increased max enemies on screen by 2.5x (50 → 125)
   - Tripled all boss HP (Slime: 500→1500, Skeleton: 350→1050, Eye: 300→900)
   - Minimum spawn interval reduced (500ms → 200ms)

### Implemented in Session 10 (Dec 3, 2025) - v0.9.0 (Camera Zoom System)
49. **Dual Camera System**:
   - Properly re-implemented camera zoom using dedicated UI camera
   - Main game camera: 2x zoom for better pixel art visibility, follows player
   - UI camera: Fixed, no zoom, renders all HUD elements independently
   - `addToUILayer()` helper method to register UI elements with UI camera
50. **UI Layer Updates**:
   - All HUD elements (HP bar, XP bar, timer, kill counter, wave counter, gold, weapon icons) now rendered on UI camera
   - Level-up selection UI uses screen coordinates (not affected by zoom)
   - Player stats menu (M key) uses screen coordinates
   - Portal notification uses screen coordinates
   - Custom cursor rendered on UI layer
   - FPS counter and debug info on UI layer
   - Controls tooltip on UI layer

### Implemented in Session 10 (Dec 3, 2025) - v0.9.1 (Bug Fixes & Boss HP Bar)
51. **Bug Fixes**:
   - Fixed camera not following player (UI camera was rendering game world, now ignores all game objects)
   - Fixed game crash on second round (weaponIcons array had stale references to destroyed containers)
   - Fixed cursor not visible on menu screens (cursor now restored when leaving GameScene)
   - Fixed armory upgrade buttons always grey (made green color more vibrant: 0x228822)
52. **New Features**:
   - **Boss HP Bar**: Displays at top of screen when boss spawns, shows boss name, HP bar, and HP text
   - **Altar Activation Notifications**: Now displays properly styled notification when player activates an altar
   - `showNotification()` method for UI-layer notifications
53. **UI Improvements**:
   - Cursor visibility ensured across all scenes (GameOverScene, UpgradeMenuScene, MainMenuScene)
   - Boss HP bar updates in real-time and auto-hides when boss dies
   - Altar buff notifications now slide in from top with colored border

### Implemented in Session 11 (Dec 3, 2025) - v0.10.0 (Space Station Safe Zone)
54. **Space Station System**:
   - Space station spawns at random location on map start
   - Visual protection radius (pulsing cyan circle) around station
   - 5 upgradeable station levels with unique sprites
   - Each level increases protection radius (+50px per level)
55. **Safe Zone Mechanic**:
   - When player is inside station radius, enemies stop chasing
   - Enemies enter "wandering" mode - moving randomly at 40% speed
   - When player leaves radius, enemies resume normal attack behavior
   - Protection disabled during station upgrades
56. **Material Collection System**:
   - 3 material types spawn on map (chest, junk, slob)
   - Materials spawn every 20 seconds (max 8 on map)
   - Player collects materials by walking over them
   - Materials required for station upgrades
57. **Station Upgrade System**:
   - Upgrade costs: Gold + Materials
   - Level 2: 50g + 3 mats (5s upgrade time)
   - Level 3: 100g + 5 mats (10s upgrade time)
   - Level 4: 200g + 8 mats (15s upgrade time)
   - Level 5: 400g + 12 mats (20s upgrade time)
   - Press E when near station to upgrade
   - Progress bar displays during upgrade
58. **Station Benefits Per Level**:
   - Level 1 (base): Safe zone only (150px radius)
   - Level 2+: HP regeneration while inside (2%/sec)
   - Level 3+: +25% damage boost while inside
   - Level 4+: +50% XP gain while inside
   - Level 5: +20% fire rate while inside
59. **Space Station UI**:
   - Station level indicator in HUD
   - Materials counter showing collected/required
   - Upgrade requirement notifications
   - Upgrade progress bar at station
60. **New Assets**:
   - 5 space station level sprites
   - 3 material type sprites (spacechest, spacejunk, spaceslob)

### Implemented in Session 12 (Dec 3, 2025) - v0.11.0 (Space Station Enhancements + Supply Drops)
61. **Space Station Asset Update**:
   - Switched to background-removed assets from `bgRemover-download` folder
   - Station size reduced by 20% for better visual balance
   - Material items reduced by 2x in size
   - Enhanced material glow effects with dual-layer pulsing animation
62. **Space Station Safe Zone Mechanics**:
   - Enemies are pushed out of station radius (cannot enter)
   - Player cannot attack while inside the safe zone (weapons disabled)
   - Creates true "safe zone" where player can rest and plan
63. **Supply Drop System** - NEW:
   - Periodic supply drops spawn every 45 seconds (first at 20s)
   - DropPod visual falls from sky with shadow growing effect
   - Boom explosion effect on landing with dust particles
   - 5 drop types with different rewards:
     - Gold (30% chance): 25-75 gold
     - Material (25% chance): +2 station materials
     - Health (20% chance): +30% HP
     - Power (15% chance): +50% damage for 10 seconds
     - Speed (10% chance): +40% speed for 8 seconds
   - Drops despawn after 60 seconds if not collected
   - Visual indicators: colored glows and floating icons
64. **New Assets Utilized**:
   - DropPod1.png, DropPod2.png for supply drop visuals
   - Boom1.png, Boom2.png for explosion effects
   - Dust.png for particle effects
   - 5 GUI icons for drop type indicators

### Bug Fixes in Session 12 (Dec 3, 2025) - v0.11.1
65. **Fixed Enemy Base Exclusion**:
   - Increased push force from 150 to 400
   - Added hard teleport for enemies deep inside the radius (< 70%)
   - Enemies now properly cannot enter the safe zone
66. **Fixed Enemies Stuck to Camera**:
   - Added explicit `setScrollFactor(1)` to all spawned enemies and bosses
   - Ensures enemies properly scroll with camera after boss spawns
67. **Fixed Materials Not Appearing**:
   - Increased material scale from 0.04 to 0.15 (were nearly invisible)
   - Fixed glow effects to follow material during float animation
   - Materials now have larger, more visible glows (radius 20/30)
68. **Added Supply Drop Direction Indicator**:
   - Yellow arrow indicator appears at screen edge pointing to off-screen drops
   - Shows distance in meters to the drop
   - Pulses to attract player attention
   - Auto-hides when drop is on screen, destroys when collected/despawned

### Implemented in Session 13 (Dec 4, 2025) - v0.12.0 (MiniMap & Fixes)
69. **Fixed Camera Sticking Bug**:
   - Added `setScrollFactor(1)` to all dynamically created game objects
   - Fixed: AltarManager (altar sprites, glows, particles)
   - Fixed: SpaceStationManager (materials, glows, heal effects)
   - Fixed: SupplyDropManager (drops, shadows, icons, boom effects)
   - Game elements no longer stick to screen when camera moves
70. **Generated Texture Fallbacks**:
   - Created procedural textures for space station levels 1-5
   - Created procedural textures for all 3 material types (chest, junk, slob)
   - Fallbacks used when large image assets fail to load (browser ERR_FAILED)
   - Station textures: colored circles with level indicators (yellow dots)
   - Material textures: colored rounded squares with sparkle centers
71. **Altar Channeling Mechanic**:
   - Altars now require 2.5 seconds of standing in radius to activate
   - Progress bar displays above altar while channeling
   - Shows remaining time and buff icon
   - Progress resets if player leaves the altar radius
   - Prevents accidental activation from just walking by
72. **Removed Supply Drop Indicators**:
   - Removed off-screen arrow indicators pointing to supply drops
   - Cleaner UI - drops must be discovered through exploration
   - Prepared for minimap implementation
73. **MiniMap System** - NEW:
   - Hold SPACEBAR to open minimap overlay
   - Fog of war system - only explored areas are visible
   - Reveals 400px radius around player as they explore
   - Shows game objects as colored markers:
     - Green dot: Player position
     - Red dots: Enemies (only in explored areas)
     - Cyan circle: Space Station
     - Purple dots: Altars
     - Yellow dots: Supply Drops
     - Gold dots: Materials
   - Legend showing marker meanings
   - Semi-transparent dark overlay for readability
   - Smooth fade in/out animation

## Pending Features / Next Steps 📋

### High Priority
- [x] XP gem drops from killed enemies (visual pickups)
- [x] Upgrade selection UI during level-up (choose from 3 random upgrades)
- [x] Portal spawn for victory condition (survive 5 minutes)
- [x] Additional weapons (Axe, Dagger, Orb as per design docs) ✅ v0.3.0

### Medium Priority
- [x] Sound effects (procedural audio) ✅ v0.6.0
- [ ] Background music (no music assets available yet)
- [x] Screen shake on damage
- [x] Enemy projectiles (for Shooter behavior) ✅ v0.3.0
- [x] Custom cursor ✅ v0.6.0
- [x] Sprite-based decorations ✅ v0.6.0

### Low Priority
- [x] Meta-progression (persistent unlocks between runs) ✅ v0.8.0
- [ ] More enemy types
- [x] Boss enemies ✅ v0.5.0
- [ ] Multiple dungeon biomes
- [x] Weapon evolution/synergies ✅ v0.5.0

## File Structure

```
src/
├── config/
│   ├── Constants.ts      # Game constants, depth layers, scene keys
│   └── GameConfig.ts     # Phaser configuration
├── entities/
│   ├── Entity.ts         # Base class (HP, damage, death)
│   ├── Player.ts         # Player with input, XP, leveling
│   └── Enemy.ts          # Enemy types with AI behaviors
├── scenes/
│   ├── BootScene.ts      # Initial boot
│   ├── PreloaderScene.ts # Asset loading
│   ├── MainMenuScene.ts  # Title screen with ARMORY button
│   ├── GameScene.ts      # Main gameplay
│   ├── GameOverScene.ts  # Results screen with gold display
│   └── UpgradeMenuScene.ts # Armory/meta-progression menu - NEW v0.8.0
└── systems/
    ├── DungeonGenerator.ts      # Cellular automata generation
    ├── EnemySpawner.ts          # Wave spawning logic
    ├── ProjectileManager.ts     # Object-pooled player projectiles
    ├── XPGemManager.ts          # XP gem drops and collection
    ├── UpgradeSystem.ts         # Upgrade definitions and selection
    ├── WeaponManager.ts         # Additional weapons (Axe, Dagger, Orb)
    ├── EnemyProjectileManager.ts # Enemy projectiles for Shooter enemies
    ├── MetaProgressionManager.ts # Persistent progression/localStorage - NEW v0.8.0
    ├── GoldManager.ts           # Gold coin drops and collection - NEW v0.8.0
    ├── AchievementTracker.ts    # Achievement tracking system - NEW v0.8.0
    ├── SpaceStationManager.ts   # Space station safe zone system - NEW v0.10.0
    ├── SupplyDropManager.ts     # Supply drop spawning system - NEW v0.11.0
    └── MiniMapSystem.ts         # Minimap with fog of war - NEW v0.12.0
```

## Running the Project

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Asset Paths

Assets are served from `/public/` which symlinks to:
- `craftpix-net-814823-free-roguelike-shoot-em-up-pixel-art-game-kit/` - All sprite assets
- `assets/` - JSON metadata files

## Important Notes for Next Session

1. **Dual Camera Setup**: 
   - Main camera: 2x zoom, follows player, ignores UI elements
   - UI camera: No zoom, fixed position, renders all HUD elements
   - Use `addToUILayer(gameObject)` method to register UI elements with the UI camera
   - UI elements use screen coordinates (`this.scale.width/height`), not camera scroll offsets

2. **Collision System**: Uses Phaser Arcade Physics with:
   - `collider` for solid collisions (player/walls, enemies/walls)
   - `overlap` for trigger collisions (projectiles/enemies, player/enemies)

3. **Object Pooling**: ProjectileManager uses object pooling for performance. Projectiles are recycled via `deactivate()` method.

4. **Enemy Spawning**: Enemies spawn off-screen at `ENEMY_SPAWN_DISTANCE` from player and despawn at `ENEMY_DESPAWN_DISTANCE` for optimization.

5. **Constants Location**: All magic numbers are centralized in `src/config/Constants.ts`.

6. **Auto-Aim System**: ProjectileManager now auto-targets nearest enemy. Uses `setEnemyGroup()` to link with EnemySpawner. Attack range is 300px (configurable in ProjectileManager).

---

## Prompt for Next Session

Use this prompt to continue development:

```
Continue developing the Roguelike Shoot 'em Up game (Phaser 3 + TypeScript).

Current version: 0.9.1
Last session: Fixed 6 bugs including camera, cursor, crash on restart, armory buttons. Added boss HP bar and altar notifications.

CURRENT STATE:
- Meta-progression system complete (gold, permanent upgrades, characters, achievements)
- Dual camera system: main camera 2x zoom, UI camera for HUD (no zoom)
- Boss HP bar displays at top of screen when boss spawns
- Altar activation shows notification with colored border
- 8 permanent upgrades, 6 unlockable characters, 20 achievements
- Gold coins drop from enemies, persist via localStorage
- Armory menu accessible from main menu

POTENTIAL NEXT STEPS (Phase 5 - Polish):
1. Add background music (need to source/create audio)
2. Add more enemy variety (new types, behaviors)
3. Multiple dungeon biomes/tilesets
4. Screen effects (CRT filter, vignette)
5. Particle effects improvements
6. Save/load game state
7. Leaderboards

Key files:
- src/scenes/GameScene.ts (main gameplay, dual camera setup, boss HP bar)
- src/systems/MetaProgressionManager.ts (persistent data)
- src/systems/AltarManager.ts (altar buffs and notifications)
- src/config/Constants.ts (game balance values)
- DEVELOPMENT_STATUS.md (full changelog)

Key technical notes:
- Use addToUILayer(gameObject) for any new UI elements
- UI uses screen coordinates (this.scale.width/height), not camera scroll
- showNotification(message, color) for temporary UI messages
- Boss HP tracked via currentBoss, showBossHPBar(), updateBossHPBar(), hideBossHPBar()
- Ensure cursor visible: this.input.setDefaultCursor('default') in scene create()
- See DEVELOPMENT_ROADMAP.md for unused asset list

Asset kit path: craftpix-net-814823-free-roguelike-shoot-em-up-pixel-art-game-kit/

Run: npm run dev
Test: http://localhost:3003
```
