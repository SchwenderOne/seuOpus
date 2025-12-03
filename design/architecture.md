# Technical Architecture

## Tech Stack
-   **Engine**: Phaser 3 (via npm `phaser`).
-   **Language**: TypeScript.
-   **Build Tool**: Vite.

## Class Structure

### Core
-   `Main.ts`: Bootstraps the game.
-   `GameConfig.ts`: Phaser configuration (physics, scale, scenes).

### Scenes
-   `Preloader`:
    -   Loads `assets/index.json`.
    -   Recursively loads category JSONs.
    -   Loads images/spritesheets defined in JSONs.
    -   Creates Animations from JSON data.
-   `GameScene`:
    -   `create()`: Init Dungeon, Player, WaveManager.
    -   `update()`: Player input, Camera follow, WaveManager update.

### Entities
-   `Entity` (extends `Phaser.Physics.Arcade.Sprite`)
    -   Properties: `hp`, `speed`.
    -   Methods: `takeDamage()`, `die()`.
-   `Player` (extends `Entity`)
    -   Input handling (WASD).
    -   Weapon management.
-   `Enemy` (extends `Entity`)
    -   Target: `Player`.
    -   AI logic.

### Systems
-   `DungeonGenerator`:
    -   Returns a 2D array of tile indices.
    -   Handles wall autotiling (if tileset supports it) or simple mapping.
-   `ProjectileManager`:
    -   Object Pool for bullets (performance).

## Data Management
-   **Asset Registry**: A singleton or helper to access asset paths by ID.
-   **Game State**: Global state for the current run (Score, Level, Inventory).
