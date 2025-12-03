import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { 
  DEPTH, 
  MAP_WIDTH, 
  MAP_HEIGHT 
} from '../config/Constants';

/**
 * MiniMap configuration
 */
const MINIMAP_CONFIG = {
  // Size when opened (in pixels)
  WIDTH: 400,
  HEIGHT: 400,
  // Margin from screen center
  PADDING: 20,
  // Fog of war tile size (in world units)
  FOG_TILE_SIZE: 64,
  // Reveal radius around player (in world units)
  REVEAL_RADIUS: 400,
  // Marker sizes
  PLAYER_SIZE: 8,
  ENEMY_SIZE: 4,
  STATION_SIZE: 12,
  ALTAR_SIZE: 6,
  DROP_SIZE: 5,
  MATERIAL_SIZE: 3,
  // Colors
  PLAYER_COLOR: 0x00ff00,
  ENEMY_COLOR: 0xff0000,
  STATION_COLOR: 0x00ffff,
  ALTAR_COLOR: 0xaa44ff,
  DROP_COLOR: 0xffff00,
  MATERIAL_COLOR: 0xffd700,
  FOG_COLOR: 0x000000,
  EXPLORED_COLOR: 0x222233,
  BACKGROUND_COLOR: 0x111122,
};

/**
 * MiniMapSystem - Displays a minimap overlay when spacebar is held
 * 
 * Features:
 * - Fog of war (only shows explored areas)
 * - Shows player, enemies, station, altars, drops, materials
 * - Opens when spacebar is held, closes when released
 */
export class MiniMapSystem {
  private scene: Phaser.Scene;
  private player: Player;
  
  // Container for all minimap elements
  private container: Phaser.GameObjects.Container | null = null;
  private background: Phaser.GameObjects.Rectangle | null = null;
  private mapGraphics: Phaser.GameObjects.Graphics | null = null;
  private fogGraphics: Phaser.GameObjects.Graphics | null = null;
  private markerGraphics: Phaser.GameObjects.Graphics | null = null;
  
  // Fog of war tracking (grid of explored tiles)
  private exploredTiles: Set<string> = new Set();
  private fogTileCountX: number;
  private fogTileCountY: number;
  
  // Visibility state
  private isVisible: boolean = false;
  
  // Callbacks to get game objects
  private getEnemies?: () => Phaser.GameObjects.Group;
  private getAltars?: () => Phaser.GameObjects.Group;
  private getDrops?: () => { x: number; y: number; collected: boolean }[];
  private getMaterials?: () => Phaser.GameObjects.Group;
  private getStationPosition?: () => { x: number; y: number };
  
  // Scale factor (world to minimap)
  private scaleX: number;
  private scaleY: number;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    
    // Calculate fog grid dimensions
    this.fogTileCountX = Math.ceil(MAP_WIDTH / MINIMAP_CONFIG.FOG_TILE_SIZE);
    this.fogTileCountY = Math.ceil(MAP_HEIGHT / MINIMAP_CONFIG.FOG_TILE_SIZE);
    
    // Calculate scale factors
    this.scaleX = MINIMAP_CONFIG.WIDTH / MAP_WIDTH;
    this.scaleY = MINIMAP_CONFIG.HEIGHT / MAP_HEIGHT;
    
    // Create minimap elements (hidden initially)
    this.createMinimap();
    
    // Set up spacebar input
    this.setupInput();
  }

  /**
   * Create all minimap visual elements
   */
  private createMinimap(): void {
    const screenWidth = this.scene.scale.width;
    const screenHeight = this.scene.scale.height;
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;
    
    // Create container at screen center
    this.container = this.scene.add.container(centerX, centerY);
    this.container.setDepth(DEPTH.UI + 100);
    this.container.setScrollFactor(0); // Fixed to screen
    this.container.setVisible(false);
    this.container.setAlpha(0);
    
    // Semi-transparent dark overlay for the whole screen
    const overlay = this.scene.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0.5);
    this.container.add(overlay);
    
    // Background for minimap
    this.background = this.scene.add.rectangle(
      0, 0,
      MINIMAP_CONFIG.WIDTH + MINIMAP_CONFIG.PADDING * 2,
      MINIMAP_CONFIG.HEIGHT + MINIMAP_CONFIG.PADDING * 2,
      MINIMAP_CONFIG.BACKGROUND_COLOR, 0.95
    );
    this.background.setStrokeStyle(3, 0x4488ff);
    this.container.add(this.background);
    
    // Title
    const title = this.scene.add.text(0, -MINIMAP_CONFIG.HEIGHT / 2 - 25, '🗺️ MAP', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.container.add(title);
    
    // Graphics for fog of war
    this.fogGraphics = this.scene.add.graphics();
    this.container.add(this.fogGraphics);
    
    // Graphics for map background (explored areas)
    this.mapGraphics = this.scene.add.graphics();
    this.container.add(this.mapGraphics);
    
    // Graphics for markers (player, enemies, etc.)
    this.markerGraphics = this.scene.add.graphics();
    this.container.add(this.markerGraphics);
    
    // Legend
    this.createLegend();
    
    // Instructions
    const instructions = this.scene.add.text(0, MINIMAP_CONFIG.HEIGHT / 2 + 25, 'Hold SPACE to view map', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#888888',
    }).setOrigin(0.5);
    this.container.add(instructions);
  }

  /**
   * Create legend showing what each marker means
   */
  private createLegend(): void {
    const legendItems = [
      { color: MINIMAP_CONFIG.PLAYER_COLOR, label: 'You' },
      { color: MINIMAP_CONFIG.ENEMY_COLOR, label: 'Enemy' },
      { color: MINIMAP_CONFIG.STATION_COLOR, label: 'Station' },
      { color: MINIMAP_CONFIG.ALTAR_COLOR, label: 'Altar' },
      { color: MINIMAP_CONFIG.DROP_COLOR, label: 'Drop' },
    ];
    
    const startX = -MINIMAP_CONFIG.WIDTH / 2;
    const startY = MINIMAP_CONFIG.HEIGHT / 2 + 45;
    
    legendItems.forEach((item, index) => {
      const x = startX + index * 75;
      
      // Color dot
      const dot = this.scene.add.circle(x, startY, 4, item.color);
      this.container!.add(dot);
      
      // Label
      const label = this.scene.add.text(x + 10, startY, item.label, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#aaaaaa',
      }).setOrigin(0, 0.5);
      this.container!.add(label);
    });
  }

  /**
   * Set up spacebar input for showing/hiding minimap
   */
  private setupInput(): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;
    
    // Show on keydown
    keyboard.on('keydown-SPACE', () => {
      if (!this.isVisible) {
        this.show();
      }
    });
    
    // Hide on keyup
    keyboard.on('keyup-SPACE', () => {
      if (this.isVisible) {
        this.hide();
      }
    });
  }

  /**
   * Update the minimap each frame
   */
  public update(_delta: number): void {
    // Always update fog of war based on player position
    this.revealAroundPlayer();
    
    // Only redraw if visible
    if (this.isVisible) {
      this.redrawMinimap();
    }
  }

  /**
   * Reveal fog of war around current player position
   */
  private revealAroundPlayer(): void {
    const playerTileX = Math.floor(this.player.x / MINIMAP_CONFIG.FOG_TILE_SIZE);
    const playerTileY = Math.floor(this.player.y / MINIMAP_CONFIG.FOG_TILE_SIZE);
    const revealTiles = Math.ceil(MINIMAP_CONFIG.REVEAL_RADIUS / MINIMAP_CONFIG.FOG_TILE_SIZE);
    
    // Reveal tiles in a circular area around player
    for (let dx = -revealTiles; dx <= revealTiles; dx++) {
      for (let dy = -revealTiles; dy <= revealTiles; dy++) {
        const tileX = playerTileX + dx;
        const tileY = playerTileY + dy;
        
        // Skip out of bounds
        if (tileX < 0 || tileX >= this.fogTileCountX || tileY < 0 || tileY >= this.fogTileCountY) {
          continue;
        }
        
        // Check if within circular radius
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= revealTiles) {
          const key = `${tileX},${tileY}`;
          this.exploredTiles.add(key);
        }
      }
    }
  }

  /**
   * Redraw all minimap elements
   */
  private redrawMinimap(): void {
    if (!this.mapGraphics || !this.fogGraphics || !this.markerGraphics) return;
    
    // Clear previous drawings
    this.mapGraphics.clear();
    this.fogGraphics.clear();
    this.markerGraphics.clear();
    
    const offsetX = -MINIMAP_CONFIG.WIDTH / 2;
    const offsetY = -MINIMAP_CONFIG.HEIGHT / 2;
    
    // Draw explored areas (background)
    this.mapGraphics.fillStyle(MINIMAP_CONFIG.EXPLORED_COLOR, 1);
    this.exploredTiles.forEach((key) => {
      const [tileX, tileY] = key.split(',').map(Number);
      const x = offsetX + tileX * MINIMAP_CONFIG.FOG_TILE_SIZE * this.scaleX;
      const y = offsetY + tileY * MINIMAP_CONFIG.FOG_TILE_SIZE * this.scaleY;
      const w = MINIMAP_CONFIG.FOG_TILE_SIZE * this.scaleX;
      const h = MINIMAP_CONFIG.FOG_TILE_SIZE * this.scaleY;
      this.mapGraphics!.fillRect(x, y, w, h);
    });
    
    // Draw fog (unexplored areas)
    this.fogGraphics.fillStyle(MINIMAP_CONFIG.FOG_COLOR, 0.9);
    for (let tx = 0; tx < this.fogTileCountX; tx++) {
      for (let ty = 0; ty < this.fogTileCountY; ty++) {
        const key = `${tx},${ty}`;
        if (!this.exploredTiles.has(key)) {
          const x = offsetX + tx * MINIMAP_CONFIG.FOG_TILE_SIZE * this.scaleX;
          const y = offsetY + ty * MINIMAP_CONFIG.FOG_TILE_SIZE * this.scaleY;
          const w = MINIMAP_CONFIG.FOG_TILE_SIZE * this.scaleX;
          const h = MINIMAP_CONFIG.FOG_TILE_SIZE * this.scaleY;
          this.fogGraphics!.fillRect(x, y, w, h);
        }
      }
    }
    
    // Draw markers (only in explored areas)
    this.drawMarkers(offsetX, offsetY);
  }

  /**
   * Draw all game object markers on the minimap
   */
  private drawMarkers(offsetX: number, offsetY: number): void {
    if (!this.markerGraphics) return;
    
    // Draw station
    if (this.getStationPosition) {
      const station = this.getStationPosition();
      if (this.isExplored(station.x, station.y)) {
        const x = offsetX + station.x * this.scaleX;
        const y = offsetY + station.y * this.scaleY;
        this.markerGraphics.fillStyle(MINIMAP_CONFIG.STATION_COLOR, 1);
        this.markerGraphics.fillCircle(x, y, MINIMAP_CONFIG.STATION_SIZE);
        // Add inner ring
        this.markerGraphics.lineStyle(2, 0xffffff, 0.5);
        this.markerGraphics.strokeCircle(x, y, MINIMAP_CONFIG.STATION_SIZE + 3);
      }
    }
    
    // Draw altars
    if (this.getAltars) {
      const altars = this.getAltars();
      altars.getChildren().forEach((obj) => {
        const altar = obj as Phaser.GameObjects.Sprite;
        if (altar.active && this.isExplored(altar.x, altar.y)) {
          const x = offsetX + altar.x * this.scaleX;
          const y = offsetY + altar.y * this.scaleY;
          this.markerGraphics!.fillStyle(MINIMAP_CONFIG.ALTAR_COLOR, 1);
          this.markerGraphics!.fillCircle(x, y, MINIMAP_CONFIG.ALTAR_SIZE);
        }
      });
    }
    
    // Draw supply drops
    if (this.getDrops) {
      const drops = this.getDrops();
      drops.forEach((drop) => {
        if (!drop.collected && this.isExplored(drop.x, drop.y)) {
          const x = offsetX + drop.x * this.scaleX;
          const y = offsetY + drop.y * this.scaleY;
          this.markerGraphics!.fillStyle(MINIMAP_CONFIG.DROP_COLOR, 1);
          this.markerGraphics!.fillCircle(x, y, MINIMAP_CONFIG.DROP_SIZE);
        }
      });
    }
    
    // Draw materials
    if (this.getMaterials) {
      const materials = this.getMaterials();
      materials.getChildren().forEach((obj) => {
        const material = obj as Phaser.GameObjects.Sprite;
        if (material.active && this.isExplored(material.x, material.y)) {
          const x = offsetX + material.x * this.scaleX;
          const y = offsetY + material.y * this.scaleY;
          this.markerGraphics!.fillStyle(MINIMAP_CONFIG.MATERIAL_COLOR, 0.8);
          this.markerGraphics!.fillCircle(x, y, MINIMAP_CONFIG.MATERIAL_SIZE);
        }
      });
    }
    
    // Draw enemies (only in explored areas)
    if (this.getEnemies) {
      const enemies = this.getEnemies();
      enemies.getChildren().forEach((obj) => {
        const enemy = obj as Phaser.GameObjects.Sprite;
        if (enemy.active && this.isExplored(enemy.x, enemy.y)) {
          const x = offsetX + enemy.x * this.scaleX;
          const y = offsetY + enemy.y * this.scaleY;
          this.markerGraphics!.fillStyle(MINIMAP_CONFIG.ENEMY_COLOR, 1);
          this.markerGraphics!.fillCircle(x, y, MINIMAP_CONFIG.ENEMY_SIZE);
        }
      });
    }
    
    // Draw player (always visible, on top)
    const playerX = offsetX + this.player.x * this.scaleX;
    const playerY = offsetY + this.player.y * this.scaleY;
    
    // Player arrow/triangle pointing in movement direction
    this.markerGraphics.fillStyle(MINIMAP_CONFIG.PLAYER_COLOR, 1);
    this.markerGraphics.fillCircle(playerX, playerY, MINIMAP_CONFIG.PLAYER_SIZE);
    
    // White outline
    this.markerGraphics.lineStyle(2, 0xffffff, 1);
    this.markerGraphics.strokeCircle(playerX, playerY, MINIMAP_CONFIG.PLAYER_SIZE);
  }

  /**
   * Check if a world position has been explored
   */
  private isExplored(worldX: number, worldY: number): boolean {
    const tileX = Math.floor(worldX / MINIMAP_CONFIG.FOG_TILE_SIZE);
    const tileY = Math.floor(worldY / MINIMAP_CONFIG.FOG_TILE_SIZE);
    return this.exploredTiles.has(`${tileX},${tileY}`);
  }

  /**
   * Show the minimap with fade-in animation
   */
  private show(): void {
    if (!this.container || this.isVisible) return;
    
    this.isVisible = true;
    this.container.setVisible(true);
    
    // Redraw immediately
    this.redrawMinimap();
    
    // Fade in
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 150,
      ease: 'Power2',
    });
  }

  /**
   * Hide the minimap with fade-out animation
   */
  private hide(): void {
    if (!this.container || !this.isVisible) return;
    
    this.isVisible = false;
    
    // Fade out
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 150,
      ease: 'Power2',
      onComplete: () => {
        if (this.container) {
          this.container.setVisible(false);
        }
      },
    });
  }

  // === Setter methods for game object callbacks ===
  
  public setGetEnemies(callback: () => Phaser.GameObjects.Group): void {
    this.getEnemies = callback;
  }

  public setGetAltars(callback: () => Phaser.GameObjects.Group): void {
    this.getAltars = callback;
  }

  public setGetDrops(callback: () => { x: number; y: number; collected: boolean }[]): void {
    this.getDrops = callback;
  }

  public setGetMaterials(callback: () => Phaser.GameObjects.Group): void {
    this.getMaterials = callback;
  }

  public setGetStationPosition(callback: () => { x: number; y: number }): void {
    this.getStationPosition = callback;
  }

  /**
   * Get the container for camera management
   */
  public getContainer(): Phaser.GameObjects.Container | null {
    return this.container;
  }

  /**
   * Check if minimap is currently visible
   */
  public isMapVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.container) {
      this.container.destroy(true);
      this.container = null;
    }
    this.exploredTiles.clear();
  }
}
