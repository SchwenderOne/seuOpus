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

## Space Station
-   **Safe Zone**: Circular radius around station where enemies cannot enter.
-   **Materials**: 3 types (chest, junk, slob) spawn every 20 seconds.
-   **Upgrades**: Press E near station to upgrade (requires gold + materials).
-   **Station Levels** (cumulative benefits):
    -   *Level 1*: Safe zone only (150px radius).
    -   *Level 2*: HP regeneration while inside (2%/sec).
    -   *Level 3*: +25% damage boost while inside.
    -   *Level 4*: +50% XP gain while inside.
    -   *Level 5*: +20% fire rate while inside.
-   **Upgrade Costs**:
    -   Level 2: 50 gold + 3 materials (5s).
    -   Level 3: 100 gold + 5 materials (10s).
    -   Level 4: 200 gold + 8 materials (15s).
    -   Level 5: 400 gold + 12 materials (20s).

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
