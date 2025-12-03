# Roguelike Shoot 'em Up

A Bullet Heaven / Vampire Survivors-style roguelike game built with Phaser 3 and TypeScript.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (opens at http://localhost:3000)
npm run dev

# Build for production
npm run build
```

## Development Status

See [DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md) for:
- Current implemented features
- Known issues and fixes
- Pending features / roadmap
- Important notes for continuing development

## Overview
This documentation covers the **Roguelike Shoot 'em Up Pixel Art Game Kit**. It provides both human-readable guides and machine-readable metadata to assist coding agents in utilizing these assets.

## Structure
- **Assets Metadata** (`assets/`): JSON files describing file paths, dimensions, and animations.
    - [Master Index](assets/index.json)
    - [Characters](assets/characters/characters.json)
    - [Tilesets](assets/tiles/tilesets.json)
    - [Enemies](assets/enemies/enemies.json)
    - [UI](assets/ui/ui.json)
- **Documentation** (`docs/`): Detailed markdown guides.
    - [Characters](docs/characters.md)
    - [Tiles](docs/tiles.md)
    - [Enemies](docs/enemies.md)
    - [UI](docs/ui.md)
- **Design** (`design/`): High-level concepts.
    - [Game Concept](design/game_concept.md)
    - [Visual Style](design/visual_style.md)
    - [Game Loop](design/game_loop.md)
    - [Mechanics](design/mechanics.md)
    - [Architecture](design/architecture.md)

## Quick Start for Agents
1.  **Read `assets/index.json`** to find the relevant category file.
2.  **Load the specific JSON** (e.g., `assets/characters/characters.json`) to get file paths and frame sizes.
3.  **Cross-reference with `docs/`** for usage context (e.g., animation logic, tile collision rules).

## Key Specs
- **Tile Size**: 32x32 pixels.
- **Character Size**: 48x48 pixels (frames).
- **UI Grid**: 32x32 pixels.
