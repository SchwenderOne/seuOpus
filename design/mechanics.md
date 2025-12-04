# Game Mechanics

## Combat System
-   **Player Weapons**:
    -   **Primary**: Starting weapon (e.g., Magic Wand). Fires straight.
    -   **Secondary**: Acquired via Level Up.
        -   *Axe*: Thrown in an arc (high damage, short range).
        -   *Dagger*: Thrown behind (protects rear).
        -   *Orb*: Circles the player (defensive zone).
-   **Aiming**:
    -   **Manual**: Mouse cursor determines shooting direction.
    -   **Auto-Fire**: Weapons fire automatically on cooldown.
-   **Damage**:
    -   `Damage = Base Damage * Multipliers`.
    -   Critical Hit chance.

## Stats
-   **HP**: Health Points.
-   **Speed**: Movement speed.
-   **Fire Rate**: Cooldown between shots.
-   **Projectile Speed**: How fast bullets travel.
-   **Pickup Range**: Radius to attract XP gems.
-   **Luck**: Affects drop rates and upgrade rarity.

## Enemies
-   **AI Behaviors**:
    -   *Chaser*: Moves directly towards player (Goblin, Skeleton).
    -   *Shooter*: Stops at range and fires projectile (Eye).
    -   *Rusher*: Charges quickly then rests (Bat).
    -   *Tank*: Slow, high HP (Slime).
-   **Spawning**:
    -   Spawns off-screen.
    -   Despawns if too far (optimization).
    -   Spawn rate increases over time.

## Dungeon Generation
-   **Grid**: 32x32 tiles.
-   **Algorithm**: **Cellular Automata** (Cave-like) or **Random Walk** (Corridors).
    -   *Decision*: **Cellular Automata** creates nice organic "caves" or "dungeons" which fit the asset style better than rigid rooms.
-   **Features**:
    -   Walls (Collidable).
    -   Floor (Walkable).
    -   Decorations (Grass, Rocks - destructible?).

## Upgrades
-   **Pool**: List of possible upgrades.
-   **Rarity**: Common, Rare, Legendary.
-   **Synergies**: (Advanced) Weapon A + Weapon B = Evolved Weapon.

## Altars
-   **Spawning**: Altars spawn every 60 seconds (first at 30s), max 2 on map.
-   **Activation**: Player must stand in altar radius for **2.5 seconds** to activate.
    -   Progress bar shows channeling progress above altar.
    -   Leaving radius resets progress.
-   **Buff Types**:
    -   *Heal*: Restore 50% HP (instant).
    -   *Damage Boost*: +50% damage for 30 seconds.
    -   *Speed Boost*: +30% speed for 20 seconds.
    -   *Shield*: Immunity for 5 seconds.
    -   *XP Boost*: +100% XP for 45 seconds.
    -   *Magnet*: Attract all XP gems (instant).

## Space Station 2.0

### Core Mechanic: Charge & Fight Loop
The Station now uses a **lingering buff system** - combat bonuses persist AFTER leaving the safe zone, encouraging a tactical "charge up → fight" gameplay loop.

### Safe Zone
-   Circular protection radius around station where enemies cannot enter.
-   Player **cannot attack** inside the safe zone.
-   Radius grows with level: 200px base + 50px per level.

### Materials (3 Types)
-   **Chest** (📦 gold) - Used for Medical Bay module.
-   **Junk** (🔧 silver) - Used for Shield Generator module.
-   **Slob** (🧪 green) - Used for Power Core module.
-   Spawn every 20 seconds, max 8 on map.

### Station Levels (Press E to upgrade)
| Level | Cost | Benefit |
|-------|------|---------|
| 1 | Free | Safe zone (200px radius) |
| 2 | 50g + 3 mats | **Sanctuary Shield**: 15% max HP shield when entering (30s CD) |
| 3 | 100g + 5 mats | **HP Regen**: 2%/s inside + 0.5%/s for 10s after leaving |
| 4 | 200g + 8 mats | **Combat Buffs**: +20% DMG, +30% XP for 12s after leaving |
| 5 | 400g + 12 mats | **Ultimate**: +15% Fire Rate, +10% Speed for 12s + larger radius |

### Station Modules (Horizontal Progression)
Unlock at Level 2. Upgrade with specific material types (keys 1-4 near station).

**Shield Generator** (🔧 Junk materials - 5/10/15):
-   Tier 1: +15% damage reduction inside zone.
-   Tier 2: +10% Sanctuary Shield capacity.
-   Tier 3: Passive shield regeneration inside.

**Medical Bay** (📦 Chest materials - 5/10/15):
-   Tier 1: HP regen rate doubled.
-   Tier 2: Emergency heal 20% HP when entering below 30% HP.
-   Tier 3: Lingering regen duration +5s.

**Power Core** (🧪 Slob materials - 5/10/15):
-   Tier 1: All lingering buff durations +5s.
-   Tier 2: Damage bonus +10% (stacks with Level 4).
-   Tier 3: 3% lifesteal during buff period.

**Sensor Array** (Any materials - 5/10/15):
-   Tier 1: Material spawn rate +50%.
-   Tier 2: XP magnet range +100% inside zone.
-   Tier 3: Materials revealed on minimap.

### Controls
-   **E** - Upgrade station level (near station).
-   **1** - Upgrade Shield Generator.
-   **2** - Upgrade Medical Bay.
-   **3** - Upgrade Power Core.
-   **4** - Upgrade Sensor Array.

## MiniMap
-   **Toggle**: Hold SPACEBAR to view.
-   **Fog of War**: Only explored areas visible (400px reveal radius).
-   **Markers**:
    -   🟢 Player (green).
    -   🔴 Enemies (red, only in explored areas).
    -   🔵 Space Station (cyan).
    -   🟣 Altars (purple).
    -   🟡 Supply Drops (yellow).
    -   🟠 Materials (gold).
