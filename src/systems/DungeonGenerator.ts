import { MAP_WIDTH_TILES, MAP_HEIGHT_TILES } from '../config/Constants';

/**
 * Tile types for dungeon generation
 */
export enum TileType {
  FLOOR = 0,
  WALL = 1,
}

/**
 * Decoration types for visual variety
 */
export interface Decoration {
  x: number;
  y: number;
  type: 'rock' | 'bone' | 'plant' | 'rubble' | 'torch';
  variant: number;
}

/**
 * DungeonGenerator - Generates procedural dungeons using Cellular Automata
 * Creates cave-like organic dungeons suitable for a roguelike game
 */
export class DungeonGenerator {
  private width: number;
  private height: number;
  private grid: TileType[][];
  private decorations: Decoration[] = [];
  
  // Cellular automata parameters
  private initialFloorChance: number = 0.45; // 45% chance of initial floor
  private birthLimit: number = 4; // Become floor if >= 4 floor neighbors
  private deathLimit: number = 3; // Become wall if < 3 floor neighbors
  private iterations: number = 4; // Number of smoothing iterations

  constructor(width: number = MAP_WIDTH_TILES, height: number = MAP_HEIGHT_TILES) {
    this.width = width;
    this.height = height;
    this.grid = this.createEmptyGrid();
  }

  /**
   * Generate a new dungeon
   * @returns 2D array of tile types
   */
  public generate(): TileType[][] {
    // Create open arena - all floor tiles with border walls only
    this.createOpenArena();
    return this.grid;
  }

  /**
   * Create an open arena with only border walls
   * Makes the entire playable area walkable
   */
  private createOpenArena(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // Border is wall, everything else is floor
        if (x === 0 || y === 0 || x === this.width - 1 || y === this.height - 1) {
          this.grid[y][x] = TileType.WALL;
        } else {
          this.grid[y][x] = TileType.FLOOR;
        }
      }
    }
    
    // Generate decorations
    this.generateDecorations();
  }

  /**
   * Generate procedural decorations scattered around the arena
   */
  private generateDecorations(): void {
    this.decorations = [];
    const spawnPos = this.getSpawnPosition();
    const safeRadius = 8; // Keep decorations away from spawn
    
    // Decoration types and their weights
    const decorationTypes: Array<{ type: Decoration['type']; weight: number }> = [
      { type: 'rock', weight: 30 },
      { type: 'bone', weight: 25 },
      { type: 'plant', weight: 20 },
      { type: 'rubble', weight: 20 },
      { type: 'torch', weight: 5 },
    ];
    
    // Calculate total weight
    const totalWeight = decorationTypes.reduce((sum, d) => sum + d.weight, 0);
    
    // Number of decorations based on map size (6% of tiles for rich visual variety)
    const decorationCount = Math.floor((this.width * this.height) * 0.06); // 6% of tiles (tripled from 2%)
    
    for (let i = 0; i < decorationCount; i++) {
      // Random position (avoiding borders and spawn area)
      const x = 3 + Math.floor(Math.random() * (this.width - 6));
      const y = 3 + Math.floor(Math.random() * (this.height - 6));
      
      // Check if too close to spawn
      const distToSpawn = Math.sqrt(
        Math.pow(x - spawnPos.x, 2) + Math.pow(y - spawnPos.y, 2)
      );
      if (distToSpawn < safeRadius) continue;
      
      // Weighted random type selection
      let random = Math.random() * totalWeight;
      let selectedType: Decoration['type'] = 'rock';
      for (const dt of decorationTypes) {
        random -= dt.weight;
        if (random <= 0) {
          selectedType = dt.type;
          break;
        }
      }
      
      this.decorations.push({
        x,
        y,
        type: selectedType,
        variant: Math.floor(Math.random() * 3), // 0-2 variants
      });
    }
  }

  /**
   * Generate a cave-style dungeon (original algorithm, not currently used)
   * @returns 2D array of tile types
   */
  public generateCave(): TileType[][] {
    // Step 1: Random initialization
    this.initializeRandom();

    // Step 2: Apply cellular automata
    for (let i = 0; i < this.iterations; i++) {
      this.doSimulationStep();
    }

    // Step 3: Ensure border walls
    this.addBorderWalls();

    // Step 4: Ensure player spawn area is clear
    this.clearSpawnArea();

    return this.grid;
  }

  /**
   * Create an empty grid filled with walls
   */
  private createEmptyGrid(): TileType[][] {
    const grid: TileType[][] = [];
    for (let y = 0; y < this.height; y++) {
      grid[y] = [];
      for (let x = 0; x < this.width; x++) {
        grid[y][x] = TileType.WALL;
      }
    }
    return grid;
  }

  /**
   * Initialize grid with random floor/wall tiles
   */
  private initializeRandom(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // Border is always wall
        if (x === 0 || y === 0 || x === this.width - 1 || y === this.height - 1) {
          this.grid[y][x] = TileType.WALL;
        } else {
          this.grid[y][x] = Math.random() < this.initialFloorChance 
            ? TileType.FLOOR 
            : TileType.WALL;
        }
      }
    }
  }

  /**
   * Perform one step of cellular automata simulation
   */
  private doSimulationStep(): void {
    const newGrid = this.createEmptyGrid();

    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        const floorNeighbors = this.countFloorNeighbors(x, y);

        if (this.grid[y][x] === TileType.FLOOR) {
          // Floor stays floor if enough floor neighbors
          newGrid[y][x] = floorNeighbors >= this.deathLimit 
            ? TileType.FLOOR 
            : TileType.WALL;
        } else {
          // Wall becomes floor if enough floor neighbors
          newGrid[y][x] = floorNeighbors >= this.birthLimit 
            ? TileType.FLOOR 
            : TileType.WALL;
        }
      }
    }

    this.grid = newGrid;
  }

  /**
   * Count floor neighbors in a 3x3 area around a tile
   */
  private countFloorNeighbors(x: number, y: number): number {
    let count = 0;

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        
        const nx = x + dx;
        const ny = y + dy;

        if (this.isInBounds(nx, ny) && this.grid[ny][nx] === TileType.FLOOR) {
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Ensure the map has solid border walls
   */
  private addBorderWalls(): void {
    for (let x = 0; x < this.width; x++) {
      this.grid[0][x] = TileType.WALL;
      this.grid[this.height - 1][x] = TileType.WALL;
    }
    for (let y = 0; y < this.height; y++) {
      this.grid[y][0] = TileType.WALL;
      this.grid[y][this.width - 1] = TileType.WALL;
    }
  }

  /**
   * Clear a spawn area in the center for the player
   */
  private clearSpawnArea(): void {
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);
    const radius = 5;

    for (let y = centerY - radius; y <= centerY + radius; y++) {
      for (let x = centerX - radius; x <= centerX + radius; x++) {
        if (this.isInBounds(x, y)) {
          // Create a circular clear area
          const dist = Math.sqrt(
            Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
          );
          if (dist <= radius) {
            this.grid[y][x] = TileType.FLOOR;
          }
        }
      }
    }
  }

  /**
   * Check if coordinates are within bounds
   */
  private isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * Get a random floor tile position
   */
  public getRandomFloorPosition(): { x: number; y: number } | null {
    const floorTiles: { x: number; y: number }[] = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x] === TileType.FLOOR) {
          floorTiles.push({ x, y });
        }
      }
    }

    if (floorTiles.length === 0) return null;

    return floorTiles[Math.floor(Math.random() * floorTiles.length)];
  }

  /**
   * Get the spawn position (center of the map)
   */
  public getSpawnPosition(): { x: number; y: number } {
    return {
      x: Math.floor(this.width / 2),
      y: Math.floor(this.height / 2),
    };
  }

  /**
   * Check if a tile is walkable
   */
  public isWalkable(x: number, y: number): boolean {
    if (!this.isInBounds(x, y)) return false;
    return this.grid[y][x] === TileType.FLOOR;
  }

  /**
   * Get the grid
   */
  public getGrid(): TileType[][] {
    return this.grid;
  }

  /**
   * Get dimensions
   */
  public getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /**
   * Get decorations
   */
  public getDecorations(): Decoration[] {
    return this.decorations;
  }
}
