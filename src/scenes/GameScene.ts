import Phaser from 'phaser';
import { 
  SCENE_KEYS, 
  TILE_SIZE, 
  MAP_WIDTH, 
  MAP_HEIGHT,
  DEPTH,
  GAME_DURATION,
} from '../config/Constants';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { DungeonGenerator } from '../systems/DungeonGenerator';
import { EnemySpawner } from '../systems/EnemySpawner';
import { ProjectileManager } from '../systems/ProjectileManager';
import { XPGemManager } from '../systems/XPGemManager';
import { UpgradeSystem, Upgrade } from '../systems/UpgradeSystem';
import { WeaponManager } from '../systems/WeaponManager';
import { EnemyProjectileManager } from '../systems/EnemyProjectileManager';
import { SoundManager, SoundEffect } from '../systems/SoundManager';
import { AltarManager } from '../systems/AltarManager';
import { GoldManager } from '../systems/GoldManager';
import { AchievementTracker } from '../systems/AchievementTracker';
import { MetaProgressionManager } from '../systems/MetaProgressionManager';
import { SpaceStationManager } from '../systems/SpaceStationManager';
import { SupplyDropManager } from '../systems/SupplyDropManager';
import { MiniMapSystem } from '../systems/MiniMapSystem';

/**
 * GameScene - Main gameplay scene
 * Handles dungeon rendering, player, enemies, and game loop
 */
export class GameScene extends Phaser.Scene {
  // Core game objects
  private player!: Player;
  private dungeonGenerator!: DungeonGenerator;
  
  // Tilemap
  private map!: Phaser.Tilemaps.Tilemap;
  private floorLayer!: Phaser.Tilemaps.TilemapLayer;
  private wallLayer!: Phaser.Tilemaps.TilemapLayer;
  
  // Systems
  private enemySpawner!: EnemySpawner;
  private projectileManager!: ProjectileManager;
  private xpGemManager!: XPGemManager;
  private upgradeSystem!: UpgradeSystem;
  private weaponManager!: WeaponManager;
  private enemyProjectileManager!: EnemyProjectileManager;
  private soundManager!: SoundManager;
  private altarManager!: AltarManager;
  private goldManager!: GoldManager;
  private achievementTracker!: AchievementTracker;
  private metaManager!: MetaProgressionManager;
  private spaceStationManager!: SpaceStationManager;
  private supplyDropManager!: SupplyDropManager;
  private miniMapSystem!: MiniMapSystem;
  private sessionGold: number = 0;
  
  // Space Station UI
  private stationLevelText!: Phaser.GameObjects.Text;
  private materialsText!: Phaser.GameObjects.Text;
  
  // Game state
  private gameStartTime: number = 0;
  private score: number = 0;
  private enemiesKilled: number = 0;
  private isPaused: boolean = false;
  private portal?: Phaser.Physics.Arcade.Sprite;
  private portalSpawned: boolean = false;
  private menuOpen: boolean = false;
  private menuElements: Phaser.GameObjects.GameObject[] = [];
  private bossesKilled: number = 0;
  private goldText!: Phaser.GameObjects.Text;

  // UI Elements
  private healthBar!: Phaser.GameObjects.Graphics;
  private xpBar!: Phaser.GameObjects.Graphics;
  private timerText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private killText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private hpText!: Phaser.GameObjects.Text;
  private weaponIcons: Phaser.GameObjects.Container[] = [];
  
  // Camera system
  private uiCamera!: Phaser.Cameras.Scene2D.Camera;
  private uiElements: Phaser.GameObjects.GameObject[] = [];
  
  // Boss HP bar
  private bossHPBarContainer: Phaser.GameObjects.Container | null = null;
  private bossHPBar: Phaser.GameObjects.Graphics | null = null;
  private bossHPText: Phaser.GameObjects.Text | null = null;
  private currentBoss: Enemy | null = null;
  
  // Decorations group
  private decorationsGroup!: Phaser.GameObjects.Group;

  constructor() {
    super({ key: SCENE_KEYS.GAME });
  }

  create(): void {
    // Initialize game state
    this.gameStartTime = this.time.now;
    this.score = 0;
    this.enemiesKilled = 0;
    this.isPaused = false;
    
    // Clear arrays from previous runs to prevent stale references
    this.weaponIcons = [];
    this.uiElements = [];
    this.menuElements = [];

    // Generate and render dungeon
    this.createDungeon();

    // Create player at spawn point
    this.createPlayer();

    // Set up camera
    this.setupCamera();

    // Create UI
    this.createUI();

    // Create game systems
    this.createSystems();

    // Set up collision
    this.setupCollision();

    // Debug: Show FPS
    this.createDebugInfo();

    // Set up M key for player menu
    this.setupMenuKey();

    // Schedule portal spawn after 5 minutes
    this.time.delayedCall(GAME_DURATION, () => {
      this.spawnVictoryPortal();
    });

    // Initialize sound manager
    this.soundManager = new SoundManager(this);

    // Set up custom cursor
    this.setupCustomCursor();
  }

  private setupCustomCursor(): void {
    // Hide default cursor and use custom cursor sprite
    this.input.setDefaultCursor('none');
    
    // Create cursor sprite that follows mouse (on UI layer so it's not zoomed)
    const cursor = this.add.image(0, 0, 'cursor_1');
    cursor.setDepth(DEPTH.UI + 100);
    cursor.setScale(1);
    cursor.setOrigin(0.15, 0.15); // Offset for crosshair center
    this.addToUILayer(cursor);
    
    // Update cursor position
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      cursor.setPosition(pointer.x, pointer.y);
    });
  }

  private createDungeon(): void {
    // Generate dungeon layout
    this.dungeonGenerator = new DungeonGenerator();
    const dungeonGrid = this.dungeonGenerator.generate();
    const decorations = this.dungeonGenerator.getDecorations();

    // Create tilemap from data
    const mapData: number[][] = [];
    const wallData: number[][] = [];
    
    for (let y = 0; y < dungeonGrid.length; y++) {
      mapData[y] = [];
      wallData[y] = [];
      for (let x = 0; x < dungeonGrid[y].length; x++) {
        // TileType.FLOOR = 0, TileType.WALL = 1
        const tileValue = dungeonGrid[y][x];
        if (tileValue === 0) { // FLOOR
          // Floor tiles - use index 1 only (open arena)
          mapData[y][x] = 1;
          wallData[y][x] = -1; // No wall
        } else {
          mapData[y][x] = -1; // No floor
          // Wall tiles - use index 8 only
          wallData[y][x] = 8;
        }
      }
    }

    // Create the tilemap
    this.map = this.make.tilemap({
      data: mapData,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    });

    // Create a second tilemap for walls
    const wallMap = this.make.tilemap({
      data: wallData,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    });

    // Add tileset
    const tileset = this.map.addTilesetImage('main_tileset', 'main_tileset', TILE_SIZE, TILE_SIZE);
    const wallTileset = wallMap.addTilesetImage('main_tileset', 'main_tileset', TILE_SIZE, TILE_SIZE);

    if (!tileset || !wallTileset) {
      console.error('Failed to load tileset');
      return;
    }

    // Create layers
    const floorLayer = this.map.createLayer(0, tileset, 0, 0);
    const wallLayer = wallMap.createLayer(0, wallTileset, 0, 0);

    if (!floorLayer || !wallLayer) {
      console.error('Failed to create layers');
      return;
    }

    this.floorLayer = floorLayer;
    this.wallLayer = wallLayer;

    // Set depths
    this.floorLayer.setDepth(DEPTH.FLOOR);
    this.wallLayer.setDepth(DEPTH.DECORATIONS);

    // Enable collision on wall layer
    this.wallLayer.setCollisionByExclusion([-1]);

    // Set world bounds
    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Spawn decorations
    this.spawnDecorations(decorations);
  }

  private spawnDecorations(decorations: Array<{ x: number; y: number; type: string; variant: number }>): void {
    // Create decorations group for camera management
    this.decorationsGroup = this.add.group();
    
    decorations.forEach((deco) => {
      const worldX = deco.x * TILE_SIZE + TILE_SIZE / 2;
      const worldY = deco.y * TILE_SIZE + TILE_SIZE / 2;
      
      // Create decoration based on type using actual sprites
      let decoration: Phaser.GameObjects.Image | Phaser.GameObjects.Container | null = null;
      
      switch (deco.type) {
        case 'rock':
          decoration = this.createRockDecoration(worldX, worldY);
          break;
        case 'bone':
          decoration = this.createBoneDecoration(worldX, worldY);
          break;
        case 'plant':
          decoration = this.createGrassDecoration(worldX, worldY);
          break;
        case 'rubble':
          decoration = this.createRubbleDecoration(worldX, worldY);
          break;
        case 'torch':
          decoration = this.createTorchDecoration(worldX, worldY);
          break;
        default:
          return;
      }
      
      if (decoration) {
        decoration.setDepth(DEPTH.DECORATIONS);
        this.decorationsGroup.add(decoration);
      }
    });
  }

  private createRockDecoration(x: number, y: number): Phaser.GameObjects.Image {
    // Use random rock sprite (1-16)
    const rockNum = Phaser.Math.Between(1, 16);
    const rock = this.add.image(x, y, `rock_${rockNum}`);
    rock.setScale(0.8 + Math.random() * 0.4);
    rock.setAlpha(0.9);
    // Random flip for variety
    if (Math.random() > 0.5) rock.setFlipX(true);
    return rock;
  }

  private createBoneDecoration(x: number, y: number): Phaser.GameObjects.Image {
    // Use small rock sprites for bones (they look similar)
    const rockNum = Phaser.Math.Between(11, 16); // Smaller rocks
    const bone = this.add.image(x, y, `rock_${rockNum}`);
    bone.setScale(0.5 + Math.random() * 0.3);
    bone.setAlpha(0.7);
    bone.setTint(0xccccaa); // Bone color tint
    bone.setRotation(Math.random() * Math.PI * 2);
    return bone;
  }

  private createGrassDecoration(x: number, y: number): Phaser.GameObjects.Image {
    // Use grass sprites (1-16)
    const grassNum = Phaser.Math.Between(1, 16);
    const grass = this.add.image(x, y, `grass_${grassNum}`);
    grass.setScale(0.7 + Math.random() * 0.3);
    grass.setAlpha(0.85);
    if (Math.random() > 0.5) grass.setFlipX(true);
    return grass;
  }

  private createRubbleDecoration(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    
    // Create cluster of small rocks using sprites
    const count = Phaser.Math.Between(2, 4);
    for (let i = 0; i < count; i++) {
      const rockNum = Phaser.Math.Between(11, 16); // Small rock variants
      const piece = this.add.image(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16,
        `rock_${rockNum}`
      );
      piece.setScale(0.3 + Math.random() * 0.2);
      piece.setAlpha(0.6);
      container.add(piece);
    }
    
    return container;
  }

  private createTorchDecoration(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    
    // Use a rock as base for torch holder
    const base = this.add.image(0, 6, 'rock_3');
    base.setScale(0.6);
    base.setTint(0x554433);
    container.add(base);
    
    // Flame (animated with tween) - using graphics for better effect
    const flame = this.add.ellipse(0, -4, 6, 10, 0xff6600, 0.8);
    container.add(flame);
    
    // Inner flame
    const innerFlame = this.add.ellipse(0, -3, 3, 6, 0xffff00, 0.9);
    container.add(innerFlame);
    
    // Animate flame
    this.tweens.add({
      targets: [flame, innerFlame],
      scaleX: { from: 1, to: 0.8 },
      scaleY: { from: 1, to: 1.2 },
      y: { from: flame.y, to: flame.y - 2 },
      duration: 200 + Math.random() * 100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    // Light glow
    const glow = this.add.circle(0, -4, 24, 0xff8800, 0.15);
    container.add(glow);
    
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.15, to: 0.3 },
      scale: { from: 1, to: 1.3 },
      duration: 300 + Math.random() * 150,
      yoyo: true,
      repeat: -1,
    });
    
    return container;
  }

  private createPlayer(): void {
    // Get spawn position from dungeon generator
    const spawnPos = this.dungeonGenerator.getSpawnPosition();
    
    // Convert tile position to world position
    const worldX = spawnPos.x * TILE_SIZE + TILE_SIZE / 2;
    const worldY = spawnPos.y * TILE_SIZE + TILE_SIZE / 2;

    // Create player
    this.player = new Player(this, worldX, worldY);

    // Set up callbacks
    this.player.setOnDeath(() => {
      this.gameOver(false);
    });

    this.player.setOnLevelUp((level) => {
      this.showLevelUpUI(level);
    });
  }

  private setupCamera(): void {
    // === MAIN GAME CAMERA ===
    // Make camera follow player with smooth lerp
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    
    // Set camera bounds to map size
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    
    // Apply zoom for better pixel art visibility
    // 2x zoom makes the 32px tiles appear larger and more detailed
    this.cameras.main.setZoom(2);
    
    // === UI CAMERA ===
    // Create a separate camera for UI elements that won't be affected by zoom
    this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height, false, 'uiCamera');
    this.uiCamera.setScroll(0, 0);
    // UI camera doesn't need bounds or zoom
    
    // Make UI camera ignore all game world objects (it should only render UI elements)
    // The UI elements will be added via addToUILayer() which makes main camera ignore them
    this.uiCamera.ignore([this.floorLayer, this.wallLayer, this.player]);
    
    // Also ignore decorations group (created in createDungeon before camera setup)
    this.uiCamera.ignore(this.decorationsGroup);
  }
  
  /**
   * Add a game object to the UI layer (visible only on UI camera, not affected by zoom)
   */
  private addToUILayer(gameObject: Phaser.GameObjects.GameObject): void {
    // Main camera ignores this UI element
    this.cameras.main.ignore(gameObject);
    // Track for cleanup
    this.uiElements.push(gameObject);
  }

  private createUI(): void {
    // UI elements are rendered on a separate UI camera (no zoom)
    // Position using the actual screen dimensions
    const screenWidth = this.scale.width;
    // Note: screenHeight used in createWeaponIconsHUD and createControlsTooltip via this.scale.height
    
    const barWidth = 180;
    const barHeight = 16;
    const barX = 20;
    const barY = 16;

    // === TOP LEFT: HP and XP Bars with sprite backgrounds ===
    
    // HP Bar background (using actual sprite)
    const hpBarBg = this.add.image(barX + barWidth / 2, barY + barHeight / 2, 'bar_back')
      .setDisplaySize(barWidth + 8, barHeight + 8)
      .setDepth(DEPTH.UI);
    this.addToUILayer(hpBarBg);
    
    // HP Bar fill
    this.healthBar = this.add.graphics()
      .setDepth(DEPTH.UI + 1);
    this.addToUILayer(this.healthBar);

    // HP Text overlay
    this.hpText = this.add.text(barX + barWidth / 2, barY + barHeight / 2, '100/100', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI + 2);
    this.addToUILayer(this.hpText);

    // XP Bar background
    const xpBarBg = this.add.rectangle(barX + barWidth / 2, barY + barHeight + 12, barWidth + 4, 10, 0x222244, 0.9)
      .setStrokeStyle(1, 0x4444aa)
      .setDepth(DEPTH.UI);
    this.addToUILayer(xpBarBg);

    // XP Bar fill
    this.xpBar = this.add.graphics()
      .setDepth(DEPTH.UI + 1);
    this.addToUILayer(this.xpBar);

    // Level badge
    const levelBadge = this.add.circle(barX + barWidth + 20, barY + 8, 16, 0x4444aa, 1)
      .setStrokeStyle(2, 0x8888ff)
      .setDepth(DEPTH.UI);
    this.addToUILayer(levelBadge);
    
    this.levelText = this.add.text(barX + barWidth + 20, barY + 8, '1', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI + 1);
    this.addToUILayer(this.levelText);

    // === TOP RIGHT: Timer, Kills, Wave ===
    
    // Timer with background panel
    const timerBg = this.add.rectangle(screenWidth - 50, 28, 80, 36, 0x000000, 0.7)
      .setStrokeStyle(2, 0xffffff)
      .setDepth(DEPTH.UI);
    this.addToUILayer(timerBg);

    this.timerText = this.add.text(screenWidth - 50, 28, '0:00', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI + 1);
    this.addToUILayer(this.timerText);

    // Kill counter
    this.killText = this.add.text(screenWidth - 20, 60, '💀 0', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ff6666',
      stroke: '#000000',
      strokeThickness: 2,
    })
      .setOrigin(1, 0)
      .setDepth(DEPTH.UI);
    this.addToUILayer(this.killText);

    // Wave counter
    this.waveText = this.add.text(screenWidth - 20, 80, '🌊 Wave 1', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#66aaff',
      stroke: '#000000',
      strokeThickness: 2,
    })
      .setOrigin(1, 0)
      .setDepth(DEPTH.UI);
    this.addToUILayer(this.waveText);

    // Gold counter
    this.goldText = this.add.text(screenWidth - 20, 100, '💰 0', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    })
      .setOrigin(1, 0)
      .setDepth(DEPTH.UI);
    this.addToUILayer(this.goldText);

    // === TOP RIGHT: Space Station Info ===
    // Station level
    this.stationLevelText = this.add.text(screenWidth - 20, 120, '🛸 Lvl 1', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#00ffff',
      stroke: '#000000',
      strokeThickness: 2,
    })
      .setOrigin(1, 0)
      .setDepth(DEPTH.UI);
    this.addToUILayer(this.stationLevelText);

    // Materials counter
    this.materialsText = this.add.text(screenWidth - 20, 140, '📦 0/3', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#88ff88',
      stroke: '#000000',
      strokeThickness: 2,
    })
      .setOrigin(1, 0)
      .setDepth(DEPTH.UI);
    this.addToUILayer(this.materialsText);

    // === BOTTOM: Weapon Icons ===
    this.createWeaponIconsHUD();

    // Initial UI update
    this.updateUI();

    // Add controls tooltip
    this.createControlsTooltip();
  }

  private createWeaponIconsHUD(): void {
    const iconSize = 32;
    const padding = 8;
    const startX = 20;
    const startY = this.scale.height - 50;

    // Weapon slot mappings: icon number -> weapon info
    const weaponSlots = [
      { iconNum: 1, name: 'Wand', active: true }, // Wand always active
      { iconNum: 3, name: 'Axe', type: 'axe' },
      { iconNum: 5, name: 'Dagger', type: 'dagger' },
      { iconNum: 7, name: 'Orb', type: 'orb' },
    ];

    weaponSlots.forEach((slot, index) => {
      const x = startX + index * (iconSize + padding) + iconSize / 2;
      const y = startY;

      // Create container for each weapon slot
      const container = this.add.container(x, y);
      container.setDepth(DEPTH.UI);

      // Background frame
      const frame = this.add.image(0, 0, 'icon_frame_1')
        .setDisplaySize(iconSize + 4, iconSize + 4);
      container.add(frame);

      // Weapon icon
      const icon = this.add.image(0, 0, `weapon_icon_${slot.iconNum}`)
        .setDisplaySize(iconSize - 4, iconSize - 4);
      container.add(icon);

      // Level indicator (small badge)
      const levelBadge = this.add.circle(iconSize / 2 - 4, -iconSize / 2 + 4, 8, 0x000000, 0.8);
      const levelNum = this.add.text(iconSize / 2 - 4, -iconSize / 2 + 4, '1', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ffff00',
      }).setOrigin(0.5);
      container.add([levelBadge, levelNum]);

      // Store reference with metadata
      (container as any).weaponType = slot.type;
      (container as any).levelText = levelNum;
      (container as any).isActive = slot.active || false;
      
      // Dim inactive weapons
      if (!slot.active) {
        container.setAlpha(0.3);
      }

      // Add to UI layer
      this.addToUILayer(container);
      this.weaponIcons.push(container);
    });
  }

  private createControlsTooltip(): void {
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;
    const tooltipY = screenHeight - 60;

    // Controls background panel
    const panelWidth = 400;
    const panelHeight = 50;
    const panelX = screenWidth / 2;

    const panelBg = this.add.rectangle(panelX, tooltipY, panelWidth, panelHeight, 0x000000, 0.7)
      .setDepth(DEPTH.UI);
    this.addToUILayer(panelBg);

    // Controls text
    const controlsText = this.add.text(
      panelX,
      tooltipY - 8,
      '⌨️ WASD - Move   |   🔫 Auto-Fire   |   📋 M - Stats',
      {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
      }
    )
      .setOrigin(0.5)
      .setDepth(DEPTH.UI);
    this.addToUILayer(controlsText);

    // Objective text
    const objectiveText = this.add.text(
      panelX,
      tooltipY + 10,
      '💀 Kill enemies to gain XP   |   ⬆️ Level up to get stronger   |   ❤️ Survive!',
      {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#aaaaaa',
      }
    )
      .setOrigin(0.5)
      .setDepth(DEPTH.UI);
    this.addToUILayer(objectiveText);

    // Fade out tooltip after 10 seconds
    this.time.delayedCall(10000, () => {
      this.tweens.add({
        targets: [controlsText, objectiveText, panelBg],
        alpha: 0,
        duration: 1000,
        onComplete: () => {
          controlsText.destroy();
          objectiveText.destroy();
          panelBg.destroy();
        }
      });
      // Keep a minimal hint
      const hintText = this.add.text(
        panelX,
        tooltipY,
        'WASD to move • Auto-fire enabled • M for stats menu',
        {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#666666',
        }
      )
        .setOrigin(0.5)
        .setDepth(DEPTH.UI)
        .setAlpha(0.7);
      this.addToUILayer(hintText);
    });
  }

  private updateUI(): void {
    if (!this.player) return;

    const barWidth = 180;
    const barHeight = 16;
    const barX = 20;
    const barY = 16;

    // Update health bar with color based on HP
    this.healthBar.clear();
    const hpPercent = this.player.hpPercent;
    let barColor: number;
    if (hpPercent > 0.5) {
      barColor = 0x00ff00; // Green when healthy
    } else if (hpPercent > 0.25) {
      barColor = 0xffff00; // Yellow when hurt
    } else {
      barColor = 0xff0000; // Red when critical
    }
    this.healthBar.fillStyle(barColor);
    this.healthBar.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    
    // Update HP text
    this.hpText.setText(`${this.player.hp}/${this.player.maxHealth}`);
    
    // Update XP bar
    this.xpBar.clear();
    this.xpBar.fillStyle(0x00ffff);
    this.xpBar.fillRect(barX, barY + barHeight + 7, barWidth * this.player.xpPercent, 8);

    // Update level text
    this.levelText.setText(`${this.player.currentLevel}`);

    // Update kill counter
    this.killText.setText(`💀 ${this.enemiesKilled}`);

    // Update wave counter
    const waveNum = this.enemySpawner ? this.enemySpawner.getWaveNumber() : 1;
    this.waveText.setText(`🌊 Wave ${waveNum}`);

    // Update gold counter
    this.goldText.setText(`💰 ${this.sessionGold}`);

    // Update timer
    const elapsed = Math.floor((this.time.now - this.gameStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);

    // Update weapon icons
    this.updateWeaponIcons();
  }

  private updateWeaponIcons(): void {
    if (!this.weaponManager) return;

    this.weaponIcons.forEach((container) => {
      // Skip destroyed containers (can happen during scene transition)
      if (!container || !container.active) return;
      
      const weaponType = (container as any).weaponType as string | undefined;
      const levelText = (container as any).levelText as Phaser.GameObjects.Text;
      
      if (!weaponType) {
        // Wand is always active
        container.setAlpha(1);
        return;
      }

      // Check if weapon is active
      const isActive = this.weaponManager.hasWeapon(weaponType as any);
      container.setAlpha(isActive ? 1 : 0.3);
      
      if (isActive && levelText && levelText.active) {
        const level = this.weaponManager.getWeaponLevel(weaponType as any);
        levelText.setText(`${level}`);
        
        // Evolved weapons get special treatment
        if (this.weaponManager.isWeaponEvolved(weaponType as any)) {
          levelText.setColor('#ff00ff');
          levelText.setText('★');
        }
      }
    });
  }

  private createSystems(): void {
    // Initialize meta progression manager
    this.metaManager = MetaProgressionManager.getInstance();
    
    // Create achievement tracker
    this.achievementTracker = new AchievementTracker(this);
    this.achievementTracker.reset();
    
    // Create XP gem manager
    this.xpGemManager = new XPGemManager(this, this.player);
    
    // Create gold manager and its texture
    GoldManager.createCoinTexture(this);
    this.goldManager = new GoldManager(this, this.player);
    this.goldManager.setOnCollect((gold) => {
      this.sessionGold += gold;
      this.achievementTracker.trackGold(gold);
    });

    // Create enemy projectile manager
    this.enemyProjectileManager = new EnemyProjectileManager(this, this.player);

    // Create enemy spawner
    this.enemySpawner = new EnemySpawner(this, this.player);
    this.enemySpawner.setOnEnemyKilled((enemy, xp) => {
      // Spawn XP gems at enemy position instead of direct XP
      this.xpGemManager.spawnGems(enemy.x, enemy.y, xp);
      this.enemiesKilled++;
      this.score += xp * 10;
      
      // Track achievement and spawn gold
      this.achievementTracker.trackKill(false);
      this.goldManager.spawnFromEnemy(enemy.x, enemy.y, Math.ceil(xp / 2), 0.4);
    });

    // Wire up enemy shooting to projectile manager
    this.enemySpawner.setOnEnemyShoot((x, y, damage) => {
      this.enemyProjectileManager.fire(x, y, damage);
    });

    // Track boss kills with explosion effect
    this.enemySpawner.setOnBossKilled((enemy) => {
      this.bossesKilled++;
      // Play boss death sound
      this.soundManager.play(SoundEffect.BOSS_DEATH);
      // Visual explosion effect at player position (boss just died near player)
      this.spawnExplosionEffect(this.player.x, this.player.y);
      // Track achievement and spawn boss gold
      this.achievementTracker.trackKill(true);
      this.goldManager.spawnFromBoss(enemy.x, enemy.y, 25 + this.bossesKilled * 10);
    });

    // Play sound on enemy death
    this.enemySpawner.setOnEnemyDeath(() => {
      this.soundManager.play(SoundEffect.ENEMY_DEATH, { volume: 0.3 });
    });

    // Play sound and show HP bar on boss spawn
    this.enemySpawner.setOnBossSpawn((boss) => {
      this.soundManager.play(SoundEffect.BOSS_SPAWN);
      this.showBossHPBar(boss);
    });

    // Create projectile manager and link to enemies for auto-aim
    this.projectileManager = new ProjectileManager(this);
    this.projectileManager.setEnemyGroup(this.enemySpawner.getEnemies());

    // Create weapon manager for additional weapons
    this.weaponManager = new WeaponManager(this, this.player);
    this.weaponManager.setEnemyGroup(this.enemySpawner.getEnemies());
    
    // Note: canAttack callbacks set after spaceStationManager is created

    // Create upgrade system with weapon manager
    this.upgradeSystem = new UpgradeSystem(this.player, this.projectileManager, this.xpGemManager, this.weaponManager);

    // Create altar manager for shrine buffs
    this.altarManager = new AltarManager(this, this.player);
    
    // Wire up altar magnet effect to XP gem manager
    this.altarManager.setOnMagnetActivated(() => {
      this.xpGemManager.attractAllGems();
      this.soundManager.play(SoundEffect.XP_PICKUP);
    });
    
    // Play sound when buff is applied
    this.altarManager.setOnBuffApplied((_buff) => {
      this.soundManager.play(SoundEffect.LEVEL_UP); // Reuse level up sound for buff
    });
    
    // Show altar buff notifications on UI layer
    this.altarManager.setOnShowNotification((message, color, icon) => {
      this.showNotification(`${icon} ${message}`, color);
    });
    
    // Create space station manager for safe zone mechanic
    this.spaceStationManager = new SpaceStationManager(this, this.player);
    
    // Wire up space station callbacks
    this.spaceStationManager.setOnShowNotification((message, color) => {
      this.showNotification(message, color);
    });
    
    // Gold accessors for station upgrades
    this.spaceStationManager.setGoldAccessors(
      () => this.sessionGold,
      (amount) => {
        if (this.sessionGold >= amount) {
          this.sessionGold -= amount;
          return true;
        }
        return false;
      }
    );
    
    // Toggle enemy wandering when player enters/leaves safe zone
    this.spaceStationManager.setOnPlayerEnterRadius(() => {
      this.setAllEnemiesWandering(true);
      this.showNotification('🛡️ Entered safe zone - enemies distracted', 0x00ffff);
    });
    
    this.spaceStationManager.setOnPlayerLeaveRadius(() => {
      this.setAllEnemiesWandering(false);
    });
    
    // Track material collection for UI
    this.spaceStationManager.setOnMaterialCollected((_total, _type) => {
      this.soundManager.play(SoundEffect.XP_PICKUP, { volume: 0.6 });
      this.updateStationUI();
    });
    
    // Handle upgrade events
    this.spaceStationManager.setOnUpgradeStart(() => {
      this.soundManager.play(SoundEffect.UI_CLICK);
      this.setAllEnemiesWandering(false); // Protection disabled during upgrade
    });
    
    this.spaceStationManager.setOnUpgradeComplete((_newLevel) => {
      this.soundManager.play(SoundEffect.LEVEL_UP);
      this.updateStationUI();
    });
    
    // Wire up enemies group for station radius exclusion
    this.spaceStationManager.setEnemiesGroup(() => this.enemySpawner.getEnemies());
    
    // Let enemy spawner know when player is in safe zone (for new spawns)
    this.enemySpawner.setIsPlayerInSafeZone(() => this.spaceStationManager.isPlayerInSafeZone());
    
    // Disable attacks when player is in safe zone
    this.projectileManager.setCanAttackCallback(() => this.spaceStationManager.canPlayerAttack());
    this.weaponManager.setCanAttackCallback(() => this.spaceStationManager.canPlayerAttack());
    
    // Create supply drop manager
    this.supplyDropManager = new SupplyDropManager(this, this.player);
    
    // Wire up supply drop callbacks
    this.supplyDropManager.setOnShowNotification((message, color) => {
      this.showNotification(message, color);
    });
    
    this.supplyDropManager.setOnGoldCollected((amount) => {
      this.sessionGold += amount;
      this.soundManager.play(SoundEffect.XP_PICKUP, { volume: 0.8 });
    });
    
    this.supplyDropManager.setOnMaterialCollected((amount) => {
      // Add to station materials using the proper method
      this.spaceStationManager.addMaterials(amount);
      this.updateStationUI();
      this.soundManager.play(SoundEffect.XP_PICKUP, { volume: 0.6 });
    });
    
    this.supplyDropManager.setOnHealthCollected((amount) => {
      this.player.heal(amount);
      this.soundManager.play(SoundEffect.LEVEL_UP, { volume: 0.5 });
    });
    
    // Make UI camera ignore all game world objects (enemies, projectiles, gems, etc.)
    // This ensures UI camera only renders UI elements
    this.uiCamera.ignore(this.enemySpawner.getEnemies());
    this.uiCamera.ignore(this.projectileManager.getProjectiles());
    this.uiCamera.ignore(this.xpGemManager.getGems());
    this.uiCamera.ignore(this.goldManager.getCoins());
    this.uiCamera.ignore(this.weaponManager.getAxes());
    this.uiCamera.ignore(this.weaponManager.getDaggers());
    this.uiCamera.ignore(this.weaponManager.getOrbs());
    this.uiCamera.ignore(this.enemyProjectileManager.getProjectiles());
    this.uiCamera.ignore(this.altarManager.getAltars());
    this.uiCamera.ignore(this.spaceStationManager.getMaterials());
    
    // Ignore space station visual elements
    this.spaceStationManager.getVisualElements().forEach(el => {
      this.uiCamera.ignore(el);
    });
    
    // Create minimap system
    this.miniMapSystem = new MiniMapSystem(this, this.player);
    this.miniMapSystem.setGetEnemies(() => this.enemySpawner.getEnemies());
    this.miniMapSystem.setGetAltars(() => this.altarManager.getAltars());
    this.miniMapSystem.setGetDrops(() => this.supplyDropManager.getDrops());
    this.miniMapSystem.setGetMaterials(() => this.spaceStationManager.getMaterials());
    this.miniMapSystem.setGetStationPosition(() => this.spaceStationManager.getStationPosition());
  }

  /**
   * Spawn floating damage number at position
   */
  private spawnDamageNumber(x: number, y: number, damage: number): void {
    const damageText = this.add.text(x, y - 20, damage.toString(), {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 3,
    })
      .setOrigin(0.5)
      .setDepth(DEPTH.EFFECTS);

    // Animate floating up and fading
    this.tweens.add({
      targets: damageText,
      y: y - 50,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => damageText.destroy()
    });
  }

  private setupCollision(): void {
    // Player vs walls
    this.physics.add.collider(this.player, this.wallLayer);

    // Enemies vs walls
    this.physics.add.collider(this.enemySpawner.getEnemies(), this.wallLayer);

    // Player vs enemies
    this.physics.add.overlap(
      this.player,
      this.enemySpawner.getEnemies(),
      this.handlePlayerEnemyCollision,
      undefined,
      this
    );

    // Player vs XP gems
    this.physics.add.overlap(
      this.player,
      this.xpGemManager.getGems(),
      this.handlePlayerGemCollision,
      undefined,
      this
    );

    // Player vs Gold coins
    this.physics.add.overlap(
      this.player,
      this.goldManager.getCoins(),
      this.handlePlayerGoldCollision,
      undefined,
      this
    );

    // Projectiles vs enemies
    this.physics.add.overlap(
      this.projectileManager.getProjectiles(),
      this.enemySpawner.getEnemies(),
      this.handleProjectileEnemyCollision,
      undefined,
      this
    );

    // Projectiles vs walls
    this.physics.add.collider(
      this.projectileManager.getProjectiles(),
      this.wallLayer,
      this.handleProjectileWallCollision,
      undefined,
      this
    );

    // Axes vs enemies (piercing)
    this.physics.add.overlap(
      this.weaponManager.getAxes(),
      this.enemySpawner.getEnemies(),
      this.handleAxeEnemyCollision,
      undefined,
      this
    );

    // Daggers vs enemies
    this.physics.add.overlap(
      this.weaponManager.getDaggers(),
      this.enemySpawner.getEnemies(),
      this.handleDaggerEnemyCollision,
      undefined,
      this
    );

    // Orbs vs enemies (continuous damage)
    this.physics.add.overlap(
      this.weaponManager.getOrbs(),
      this.enemySpawner.getEnemies(),
      this.handleOrbEnemyCollision,
      undefined,
      this
    );

    // Enemy projectiles vs player
    this.physics.add.overlap(
      this.enemyProjectileManager.getProjectiles(),
      this.player,
      this.handleEnemyProjectilePlayerCollision,
      undefined,
      this
    );

    // Enemy projectiles vs walls
    this.physics.add.collider(
      this.enemyProjectileManager.getProjectiles(),
      this.wallLayer,
      this.handleEnemyProjectileWallCollision,
      undefined,
      this
    );

    // Player vs Materials (space station)
    this.physics.add.overlap(
      this.player,
      this.spaceStationManager.getMaterials(),
      this.handlePlayerMaterialCollision,
      undefined,
      this
    );
  }

  /**
   * Set all enemies to wandering or normal behavior
   * Used when player enters/leaves space station safe zone
   */
  private setAllEnemiesWandering(wandering: boolean): void {
    this.enemySpawner.getEnemies().getChildren().forEach((obj) => {
      const enemy = obj as Enemy;
      if (enemy.active && enemy.alive) {
        enemy.setWandering(wandering);
      }
    });
  }

  /**
   * Update the space station UI display
   */
  private updateStationUI(): void {
    const level = this.spaceStationManager.getStationLevel();
    const materials = this.spaceStationManager.getCollectedMaterials();
    const nextCost = this.spaceStationManager.getNextUpgradeCost();
    
    // Update station level text
    if (this.stationLevelText) {
      this.stationLevelText.setText(`🛸 Lvl ${level}`);
    }
    
    // Update materials text
    if (this.materialsText) {
      if (nextCost) {
        this.materialsText.setText(`📦 ${materials}/${nextCost.materials}`);
      } else {
        this.materialsText.setText(`📦 ${materials} (MAX)`);
      }
    }
  }

  /**
   * Handle player collecting materials
   */
  private handlePlayerMaterialCollision: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    _playerObj,
    materialObj
  ): void => {
    const material = materialObj as Phaser.Physics.Arcade.Sprite & { collect: () => number };
    
    if (material.active) {
      material.collect();
    }
  };

  private handlePlayerEnemyCollision: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    playerObj,
    enemyObj
  ): void => {
    const player = playerObj as Player;
    const enemy = enemyObj as Enemy;
    
    if (player.alive && enemy.alive) {
      const tookDamage = player.takeDamage(enemy.getDamage());
      if (tookDamage !== false) {
        // Screen shake on damage
        this.cameras.main.shake(100, 0.01);
        // Play player hit sound
        this.soundManager.play(SoundEffect.PLAYER_HIT);
      }
    }
  };

  private handlePlayerGemCollision: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    _playerObj,
    gemObj
  ): void => {
    const gem = gemObj as Phaser.Physics.Arcade.Sprite & { collect: () => number };
    
    if (gem.active) {
      const xp = gem.collect();
      this.player.addXP(xp);
      // Play XP pickup sound
      this.soundManager.play(SoundEffect.XP_PICKUP, { volume: 0.5 });
    }
  };

  private handlePlayerGoldCollision: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    _playerObj,
    coinObj
  ): void => {
    const coin = coinObj as Phaser.Physics.Arcade.Sprite & { collect: () => number };
    
    if (coin.active) {
      const gold = coin.collect();
      this.goldManager.addSessionGold(gold);
      // Play coin pickup sound (reuse XP sound with higher pitch)
      this.soundManager.play(SoundEffect.XP_PICKUP, { volume: 0.7 });
    }
  };

  private handleProjectileEnemyCollision: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    projectileObj,
    enemyObj
  ): void => {
    const projectile = projectileObj as Phaser.Physics.Arcade.Sprite & { getDamage: () => number; deactivate: () => void };
    const enemy = enemyObj as Enemy;
    
    if (projectile.active && enemy.alive) {
      const damage = projectile.getDamage();
      enemy.takeDamage(damage);
      projectile.deactivate();
      
      // Show floating damage number
      this.spawnDamageNumber(enemy.x, enemy.y, damage);
      
      // Spawn hit effect
      this.spawnHitEffect(enemy.x, enemy.y);
      
      // Play hit sound
      this.soundManager.play(SoundEffect.ENEMY_HIT, { volume: 0.4 });
    }
  };

  /**
   * Spawn hit effect at position using varied effect sprites
   */
  private spawnHitEffect(x: number, y: number, effectType: number = 1): void {
    // Use effect sets 1-4 for hit effects (randomly if not specified)
    const effectSet = effectType || Phaser.Math.Between(1, 4);
    const effectFrame = Phaser.Math.Between(1, 3);
    
    const effect = this.add.image(x, y, `effect_${effectSet}_${effectFrame}`);
    effect.setDepth(DEPTH.EFFECTS);
    effect.setScale(0.5);
    
    // Different tints based on effect type
    const tints = [0xff6600, 0xff4444, 0xffaa00, 0xff00ff];
    effect.setTint(tints[(effectSet - 1) % tints.length]);
    
    this.tweens.add({
      targets: effect,
      alpha: 0,
      scale: 0.8,
      rotation: Math.random() * 0.5,
      duration: 150,
      onComplete: () => effect.destroy()
    });
  }

  /**
   * Spawn larger explosion effect for boss/special deaths
   */
  private spawnExplosionEffect(x: number, y: number): void {
    // Use effect sets 5-8 for explosions
    for (let i = 0; i < 4; i++) {
      const effectSet = Phaser.Math.Between(5, 8);
      const effectFrame = Phaser.Math.Between(1, 3);
      const offsetX = (Math.random() - 0.5) * 30;
      const offsetY = (Math.random() - 0.5) * 30;
      
      const effect = this.add.image(x + offsetX, y + offsetY, `effect_${effectSet}_${effectFrame}`);
      effect.setDepth(DEPTH.EFFECTS);
      effect.setScale(0.6 + Math.random() * 0.3);
      effect.setTint(0xffaa00);
      
      this.tweens.add({
        targets: effect,
        alpha: 0,
        scale: 1.2,
        duration: 200 + i * 50,
        delay: i * 30,
        onComplete: () => effect.destroy()
      });
    }
  }

  private handleProjectileWallCollision: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    projectileObj,
    _tile
  ): void => {
    const projectile = projectileObj as Phaser.Physics.Arcade.Sprite & { deactivate: () => void };
    if (projectile.active) {
      projectile.deactivate();
    }
  };

  private handleAxeEnemyCollision: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    axeObj,
    enemyObj
  ): void => {
    const axe = axeObj as Phaser.Physics.Arcade.Sprite & { 
      getDamage: () => number; 
      canHitEnemy: (enemy: Enemy) => boolean;
    };
    const enemy = enemyObj as Enemy;
    
    if (axe.active && enemy.alive && axe.canHitEnemy(enemy)) {
      const damage = axe.getDamage();
      enemy.takeDamage(damage);
      this.spawnDamageNumber(enemy.x, enemy.y, damage);
      this.spawnHitEffect(enemy.x, enemy.y);
      // Play axe hit sound
      this.soundManager.play(SoundEffect.WEAPON_AXE, { volume: 0.5 });
    }
  };

  private handleDaggerEnemyCollision: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    daggerObj,
    enemyObj
  ): void => {
    const dagger = daggerObj as Phaser.Physics.Arcade.Sprite & { 
      getDamage: () => number; 
      deactivate: () => void;
    };
    const enemy = enemyObj as Enemy;
    
    if (dagger.active && enemy.alive) {
      const damage = dagger.getDamage();
      enemy.takeDamage(damage);
      dagger.deactivate();
      this.spawnDamageNumber(enemy.x, enemy.y, damage);
      this.spawnHitEffect(enemy.x, enemy.y);
      // Play dagger hit sound
      this.soundManager.play(SoundEffect.WEAPON_DAGGER, { volume: 0.4 });
    }
  };

  private handleOrbEnemyCollision: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    orbObj,
    enemyObj
  ): void => {
    const orb = orbObj as Phaser.Physics.Arcade.Sprite & { 
      getDamage: () => number;
      canDamageEnemy: (enemy: Enemy) => boolean;
    };
    const enemy = enemyObj as Enemy;
    
    if (orb.active && enemy.alive && orb.canDamageEnemy(enemy)) {
      const damage = orb.getDamage();
      enemy.takeDamage(damage);
      this.spawnDamageNumber(enemy.x, enemy.y, damage);
    }
  };

  private handleEnemyProjectilePlayerCollision: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    projectileObj,
    playerObj
  ): void => {
    const projectile = projectileObj as Phaser.Physics.Arcade.Sprite & { 
      getDamage: () => number;
      deactivate: () => void;
    };
    const player = playerObj as Player;
    
    if (projectile.active && player.alive) {
      const damage = projectile.getDamage();
      const tookDamage = player.takeDamage(damage);
      projectile.deactivate();
      
      if (tookDamage !== false) {
        // Screen shake on damage
        this.cameras.main.shake(100, 0.01);
        // Play player hit sound
        this.soundManager.play(SoundEffect.PLAYER_HIT);
      }
    }
  };

  private handleEnemyProjectileWallCollision: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    projectileObj,
    _tile
  ): void => {
    const projectile = projectileObj as Phaser.Physics.Arcade.Sprite & { deactivate: () => void };
    if (projectile.active) {
      projectile.deactivate();
    }
  };

  private setupMenuKey(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;

    keyboard.on('keydown-M', () => {
      if (this.menuOpen) {
        this.closePlayerMenu();
      } else {
        this.openPlayerMenu();
      }
    });

    // ESC also closes menu
    keyboard.on('keydown-ESC', () => {
      if (this.menuOpen) {
        this.closePlayerMenu();
      }
    });
  }

  private openPlayerMenu(): void {
    if (this.menuOpen) return;
    this.menuOpen = true;
    this.isPaused = true;
    this.physics.pause();

    // Use screen coordinates for UI camera
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;

    // Overlay
    const overlay = this.add.rectangle(
      centerX,
      centerY,
      screenWidth,
      screenHeight,
      0x000000,
      0.85
    ).setDepth(DEPTH.UI + 10);
    this.addToUILayer(overlay);
    this.menuElements.push(overlay);

    // Menu panel background
    const panelWidth = 500;
    const panelHeight = 400;
    const panel = this.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0x1a1a2e, 0.98)
      .setStrokeStyle(3, 0x4444ff)
      .setDepth(DEPTH.UI + 11);
    this.addToUILayer(panel);
    this.menuElements.push(panel);

    // Title
    const title = this.add.text(centerX, centerY - 170, '⚔️ PLAYER STATS ⚔️', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(DEPTH.UI + 12);
    this.addToUILayer(title);
    this.menuElements.push(title);

    // Close hint
    const closeHint = this.add.text(centerX, centerY - 140, 'Press M or ESC to close', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#888888',
    }).setOrigin(0.5).setDepth(DEPTH.UI + 12);
    this.addToUILayer(closeHint);
    this.menuElements.push(closeHint);

    // Stats section
    const leftX = centerX - 110;
    const rightX = centerX + 110;
    let yPos = centerY - 100;
    const lineHeight = 28;

    // Create stat line helper (adds to UI layer automatically)
    const addStatLine = (label: string, value: string, x: number, y: number, color: string = '#ffffff') => {
      const labelText = this.add.text(x - 90, y, label, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#aaaaaa',
      }).setDepth(DEPTH.UI + 12);
      const valueText = this.add.text(x + 90, y, value, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: color,
      }).setOrigin(1, 0).setDepth(DEPTH.UI + 12);
      this.addToUILayer(labelText);
      this.addToUILayer(valueText);
      this.menuElements.push(labelText, valueText);
    };

    // Left column - Character Stats
    const charHeader = this.add.text(leftX, yPos, '📊 CHARACTER', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#66aaff',
    }).setOrigin(0.5).setDepth(DEPTH.UI + 12);
    this.addToUILayer(charHeader);
    this.menuElements.push(charHeader);
    yPos += lineHeight;

    addStatLine('Level', `${this.player.currentLevel}`, leftX, yPos, '#ffff00');
    yPos += lineHeight;
    addStatLine('HP', `${this.player.hp}/${this.player.maxHealth}`, leftX, yPos, '#ff4444');
    yPos += lineHeight;
    addStatLine('Move Speed', `${this.player.getMoveSpeed()}`, leftX, yPos, '#44ff44');
    yPos += lineHeight;
    addStatLine('XP Progress', `${this.player.currentXP}/${this.player.requiredXP}`, leftX, yPos, '#00ffff');
    yPos += lineHeight;
    addStatLine('Total XP', `${this.player.getTotalXP()}`, leftX, yPos, '#aa88ff');

    // Right column - Combat Stats
    yPos = centerY - 100;
    const combatHeader = this.add.text(rightX, yPos, '⚔️ COMBAT', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ff6666',
    }).setOrigin(0.5).setDepth(DEPTH.UI + 12);
    this.addToUILayer(combatHeader);
    this.menuElements.push(combatHeader);
    yPos += lineHeight;

    addStatLine('Enemies Killed', `${this.enemiesKilled}`, rightX, yPos, '#ff6666');
    yPos += lineHeight;
    addStatLine('Bosses Killed', `${this.bossesKilled}`, rightX, yPos, '#ff00ff');
    yPos += lineHeight;
    addStatLine('Current Wave', `${this.enemySpawner.getWaveNumber()}`, rightX, yPos, '#66aaff');
    yPos += lineHeight;
    addStatLine('Wand Damage', `${this.projectileManager.getDamage()}`, rightX, yPos, '#ffaa00');
    yPos += lineHeight;
    addStatLine('Fire Rate', `${this.projectileManager.getFireRate()}ms`, rightX, yPos, '#ff6600');

    // Weapons section
    yPos = centerY + 60;
    const weaponHeader = this.add.text(centerX, yPos, '🗡️ WEAPONS', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffaa00',
    }).setOrigin(0.5).setDepth(DEPTH.UI + 12);
    this.addToUILayer(weaponHeader);
    this.menuElements.push(weaponHeader);
    yPos += 30;

    // Main wand
    const wandText = this.add.text(centerX, yPos, `✨ Magic Wand - Lvl MAX | DMG: ${this.projectileManager.getDamage()}`, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#00ffff',
    }).setOrigin(0.5).setDepth(DEPTH.UI + 12);
    this.addToUILayer(wandText);
    this.menuElements.push(wandText);
    yPos += 22;

    // Additional weapons
    const activeWeapons = this.weaponManager.getActiveWeapons();
    if (activeWeapons.length > 0) {
      activeWeapons.forEach(weapon => {
        const icon = weapon.type === 'axe' ? '🪓' : weapon.type === 'dagger' ? '🗡️' : '🔮';
        const weaponLine = this.add.text(centerX, yPos, `${icon} ${weapon.name} - Lvl ${weapon.level} | DMG: ${weapon.damage}`, {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#aaffaa',
        }).setOrigin(0.5).setDepth(DEPTH.UI + 12);
        this.addToUILayer(weaponLine);
        this.menuElements.push(weaponLine);
        yPos += 22;
      });
    } else {
      const noWeapons = this.add.text(centerX, yPos, '(Level up to unlock more weapons!)', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#666666',
      }).setOrigin(0.5).setDepth(DEPTH.UI + 12);
      this.addToUILayer(noWeapons);
      this.menuElements.push(noWeapons);
    }

    // Game time
    const elapsed = Math.floor((this.time.now - this.gameStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeText = this.add.text(centerX, centerY + 165, `⏱️ Time: ${minutes}:${seconds.toString().padStart(2, '0')} / 5:00`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(DEPTH.UI + 12);
    this.addToUILayer(timeText);
    this.menuElements.push(timeText);
  }

  private closePlayerMenu(): void {
    if (!this.menuOpen) return;
    this.menuOpen = false;

    // Destroy all menu elements
    this.menuElements.forEach(el => el.destroy());
    this.menuElements = [];

    // Resume game
    this.isPaused = false;
    this.physics.resume();
  }

  private createDebugInfo(): void {
    // FPS counter (top right, under timer)
    const fpsText = this.add.text(this.scale.width - 20, 130, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#00ff00',
    })
      .setOrigin(1, 0)
      .setDepth(DEPTH.UI);
    this.addToUILayer(fpsText);

    // Update FPS every frame
    this.time.addEvent({
      delay: 500,
      callback: () => {
        fpsText.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
      },
      loop: true,
    });
  }

  private showLevelUpUI(level: number): void {
    // Play level up sound
    this.soundManager.play(SoundEffect.LEVEL_UP);
    
    // Pause game
    this.isPaused = true;
    this.physics.pause();

    // Collect all XP gems when leveling up
    this.xpGemManager.attractAllGems();

    // Use screen coordinates for UI camera (not affected by zoom)
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;
    const uiElements: Phaser.GameObjects.GameObject[] = [];

    // Create overlay (full screen)
    const overlay = this.add.rectangle(
      centerX,
      centerY,
      screenWidth,
      screenHeight,
      0x000000,
      0.8
    ).setDepth(DEPTH.UI + 10);
    this.addToUILayer(overlay);
    uiElements.push(overlay);

    // Level up text
    const levelUpText = this.add.text(
      centerX,
      60,
      `LEVEL ${level}!`,
      {
        fontFamily: 'monospace',
        fontSize: '40px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 6,
      }
    )
      .setOrigin(0.5)
      .setDepth(DEPTH.UI + 11);
    this.addToUILayer(levelUpText);
    uiElements.push(levelUpText);

    // Subtitle
    const subtitleText = this.add.text(
      centerX,
      100,
      'Choose an upgrade:',
      {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffffff',
      }
    )
      .setOrigin(0.5)
      .setDepth(DEPTH.UI + 11);
    this.addToUILayer(subtitleText);
    uiElements.push(subtitleText);

    // Get 3 random upgrades
    const upgrades = this.upgradeSystem.getRandomUpgrades(3);
    const cardWidth = 160;
    const cardHeight = 180;
    const cardSpacing = 20;
    const totalWidth = (cardWidth * 3) + (cardSpacing * 2);
    const startX = centerX - totalWidth / 2 + cardWidth / 2;
    const cardY = centerY + 20;

    // Create upgrade cards
    upgrades.forEach((upgrade, index) => {
      const cardX = startX + index * (cardWidth + cardSpacing);
      this.createUpgradeCard(cardX, cardY, cardWidth, cardHeight, upgrade, uiElements, () => {
        // Apply upgrade
        this.upgradeSystem.applyUpgrade(upgrade);
        
        // Clean up UI
        uiElements.forEach(el => el.destroy());
        
        // Resume game
        this.isPaused = false;
        this.physics.resume();
      });
    });
  }

  private createUpgradeCard(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    upgrade: Upgrade,
    uiElements: Phaser.GameObjects.GameObject[],
    onSelect: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    container.setDepth(DEPTH.UI + 12);
    this.addToUILayer(container);
    uiElements.push(container);

    // Card background
    const bg = this.add.rectangle(0, 0, width, height, 0x333344, 0.95)
      .setStrokeStyle(3, upgrade.color);
    container.add(bg);

    // Icon
    const icon = this.add.text(0, -50, upgrade.icon, {
      fontSize: '40px',
    }).setOrigin(0.5);
    container.add(icon);

    // Name
    const name = this.add.text(0, 0, upgrade.name, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: width - 20 },
    }).setOrigin(0.5);
    container.add(name);

    // Description
    const desc = this.add.text(0, 40, upgrade.description, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#aaaaaa',
      align: 'center',
      wordWrap: { width: width - 20 },
    }).setOrigin(0.5);
    container.add(desc);

    // Make interactive
    bg.setInteractive({ useHandCursor: true });
    
    bg.on('pointerover', () => {
      bg.setFillStyle(0x444466);
      container.setScale(1.05);
      this.soundManager.play(SoundEffect.UI_HOVER);
    });
    
    bg.on('pointerout', () => {
      bg.setFillStyle(0x333344);
      container.setScale(1);
    });
    
    bg.on('pointerup', () => {
      this.soundManager.play(SoundEffect.UI_CLICK);
      onSelect();
    });

    return container;
  }

  private spawnVictoryPortal(): void {
    if (this.portalSpawned) return;
    this.portalSpawned = true;

    // Play portal spawn sound
    this.soundManager.play(SoundEffect.PORTAL_SPAWN);

    // Spawn portal near player
    const spawnDistance = 150;
    const angle = Math.random() * Math.PI * 2;
    const portalX = this.player.x + Math.cos(angle) * spawnDistance;
    const portalY = this.player.y + Math.sin(angle) * spawnDistance;

    // Create portal sprite (use regular sprite, not physics)
    this.portal = this.physics.add.sprite(portalX, portalY, 'portal_idle');
    this.portal.setDepth(DEPTH.ITEMS);
    this.portal.setScale(1.5);
    
    // Make portal body static/immovable to prevent jittering
    const portalBody = this.portal.body as Phaser.Physics.Arcade.Body;
    if (portalBody) {
      portalBody.setImmovable(true);
      portalBody.setAllowGravity(false);
      portalBody.moves = false;
    }
    
    // Play start animation then loop idle
    this.portal.play('portal_start');
    this.portal.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.portal?.play('portal_idle');
    });

    // Add collision with player
    this.physics.add.overlap(
      this.player,
      this.portal,
      this.handlePortalCollision,
      undefined,
      this
    );

    // Show portal notification
    this.showPortalNotification();
  }

  private showPortalNotification(): void {
    // Use screen coordinates for UI camera
    const centerX = this.scale.width / 2;
    const notifY = 150;

    const notification = this.add.text(
      centerX,
      notifY,
      '🌀 VICTORY PORTAL APPEARED! 🌀',
      {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#00ffff',
        stroke: '#000000',
        strokeThickness: 4,
      }
    )
      .setOrigin(0.5)
      .setDepth(DEPTH.UI + 5);
    this.addToUILayer(notification);

    // Pulse animation
    this.tweens.add({
      targets: notification,
      scale: { from: 1, to: 1.1 },
      alpha: { from: 1, to: 0.8 },
      duration: 500,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.tweens.add({
          targets: notification,
          alpha: 0,
          duration: 1000,
          onComplete: () => notification.destroy()
        });
      }
    });
  }

  /**
   * Show boss HP bar at top of screen
   */
  private showBossHPBar(boss: Enemy): void {
    // Remove any existing boss HP bar
    this.hideBossHPBar();
    
    this.currentBoss = boss;
    const screenWidth = this.scale.width;
    const barWidth = 400;
    const barHeight = 20;
    const barX = screenWidth / 2;
    const barY = 50;
    
    // Create container for boss HP bar
    this.bossHPBarContainer = this.add.container(barX, barY);
    this.bossHPBarContainer.setDepth(DEPTH.UI + 10);
    
    // Background
    const bg = this.add.rectangle(0, 0, barWidth + 10, barHeight + 10, 0x000000, 0.8);
    bg.setStrokeStyle(2, 0xff4400);
    
    // HP bar background
    const hpBg = this.add.rectangle(0, 0, barWidth, barHeight, 0x330000);
    
    // HP bar fill (will be updated)
    this.bossHPBar = this.add.graphics();
    this.bossHPBar.fillStyle(0xff4400);
    this.bossHPBar.fillRect(-barWidth / 2, -barHeight / 2, barWidth, barHeight);
    
    // Boss name text
    const bossName = this.add.text(0, -25, `⚠️ ${boss.getConfig().type.toUpperCase()} BOSS ⚠️`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ff4400',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    
    // HP text
    this.bossHPText = this.add.text(0, 0, `${boss.hp}/${boss.maxHealth}`, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    
    this.bossHPBarContainer.add([bg, hpBg, this.bossHPBar, bossName, this.bossHPText]);
    this.addToUILayer(this.bossHPBarContainer);
  }
  
  /**
   * Update boss HP bar
   */
  private updateBossHPBar(): void {
    if (!this.currentBoss || !this.bossHPBar || !this.bossHPText) return;
    
    // Check if boss is dead
    if (!this.currentBoss.active || this.currentBoss.hp <= 0) {
      this.hideBossHPBar();
      return;
    }
    
    const barWidth = 400;
    const barHeight = 20;
    const hpPercent = this.currentBoss.hp / this.currentBoss.maxHealth;
    
    // Update HP bar fill
    this.bossHPBar.clear();
    this.bossHPBar.fillStyle(hpPercent > 0.3 ? 0xff4400 : 0xff0000);
    this.bossHPBar.fillRect(-barWidth / 2, -barHeight / 2, barWidth * hpPercent, barHeight);
    
    // Update HP text
    this.bossHPText.setText(`${this.currentBoss.hp}/${this.currentBoss.maxHealth}`);
  }
  
  /**
   * Hide boss HP bar
   */
  private hideBossHPBar(): void {
    if (this.bossHPBarContainer) {
      this.bossHPBarContainer.destroy();
      this.bossHPBarContainer = null;
    }
    this.bossHPBar = null;
    this.bossHPText = null;
    this.currentBoss = null;
  }

  /**
   * Show a notification message on the UI layer (for altar buffs, achievements, etc.)
   */
  private showNotification(message: string, color: number = 0xffffff): void {
    const centerX = this.scale.width / 2;
    const notifY = 180;
    
    // Create container for notification
    const container = this.add.container(centerX, notifY - 50);
    container.setDepth(DEPTH.UI + 15);
    
    // Background panel
    const bg = this.add.rectangle(0, 0, 350, 70, 0x000000, 0.85);
    bg.setStrokeStyle(2, color);
    
    // Message text
    const colorHex = `#${color.toString(16).padStart(6, '0')}`;
    const text = this.add.text(0, 0, message, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: colorHex,
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    
    container.add([bg, text]);
    this.addToUILayer(container);
    
    // Slide in from top
    this.tweens.add({
      targets: container,
      y: notifY,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Hold for 2 seconds then fade out
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: container,
            y: notifY - 50,
            alpha: 0,
            duration: 300,
            ease: 'Cubic.easeIn',
            onComplete: () => container.destroy()
          });
        });
      }
    });
  }

  private handlePortalCollision: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (): void => {
    if (this.portal && this.portal.active) {
      this.portal.setActive(false);
      this.gameOver(true);
    }
  };

  private gameOver(victory: boolean): void {
    const timeSurvived = this.time.now - this.gameStartTime;

    // Restore default cursor before leaving scene
    this.input.setDefaultCursor('default');

    // Track achievements
    this.achievementTracker.trackTime(timeSurvived);
    if (victory) {
      this.achievementTracker.trackVictory(timeSurvived);
    }

    // Save meta progression
    this.metaManager.addGold(this.sessionGold);
    this.metaManager.updateRunStats({
      kills: this.enemiesKilled,
      bossKills: this.bossesKilled,
      waveReached: this.enemySpawner.getWaveNumber(),
      levelReached: this.player.currentLevel,
      timeSurvived: timeSurvived,
      goldCollected: this.sessionGold,
      victory: victory,
    });

    this.scene.start(SCENE_KEYS.GAME_OVER, {
      score: this.score,
      enemiesKilled: this.enemiesKilled,
      timeSurvived: timeSurvived,
      levelReached: this.player.currentLevel,
      victory: victory,
      goldEarned: this.sessionGold,
      bossesKilled: this.bossesKilled,
    });
  }

  update(time: number, delta: number): void {
    if (this.isPaused) return;

    // Update player
    this.player.update(time, delta);

    // Update enemy spawner
    this.enemySpawner.update(time, delta);

    // Update projectile manager (auto-aims at nearest enemy)
    this.projectileManager.update(
      delta,
      this.player.x,
      this.player.y
    );

    // Update XP gem manager
    this.xpGemManager.update(delta);

    // Update weapon manager (axes, daggers, orbs)
    this.weaponManager.update(delta);

    // Update enemy projectiles
    this.enemyProjectileManager.update(delta);

    // Update altar manager
    this.altarManager.update(delta);

    // Update gold manager
    this.goldManager.update(delta);

    // Update space station manager
    this.spaceStationManager.update(delta);

    // Update supply drop manager
    this.supplyDropManager.update(delta);

    // Update minimap system
    this.miniMapSystem.update(delta);

    // Track survival time achievements
    const currentTime = this.time.now - this.gameStartTime;
    this.achievementTracker.trackTime(currentTime);

    // Update UI
    this.updateUI();
    this.updateStationUI();
    
    // Update boss HP bar if present
    this.updateBossHPBar();
  }
}
