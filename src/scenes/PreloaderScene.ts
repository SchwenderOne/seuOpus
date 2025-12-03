import Phaser from 'phaser';
import { SCENE_KEYS, CHARACTER_FRAME_SIZE } from '../config/Constants';

/**
 * PreloaderScene - Loads all game assets based on JSON definitions
 * Shows loading progress bar
 */
export class PreloaderScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private percentText!: Phaser.GameObjects.Text;
  private assetText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SCENE_KEYS.PRELOADER });
  }

  preload(): void {
    this.createLoadingUI();
    this.setupLoadEvents();
    this.loadAllAssets();
  }

  private createLoadingUI(): void {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    // Progress bar background
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRect(centerX - 160, centerY - 25, 320, 50);

    // Progress bar
    this.progressBar = this.add.graphics();

    // Loading text
    this.loadingText = this.add.text(centerX, centerY - 50, 'Loading...', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff',
    });
    this.loadingText.setOrigin(0.5);

    // Percentage text
    this.percentText = this.add.text(centerX, centerY, '0%', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
    });
    this.percentText.setOrigin(0.5);

    // Asset name text
    this.assetText = this.add.text(centerX, centerY + 50, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#aaaaaa',
    });
    this.assetText.setOrigin(0.5);
  }

  private setupLoadEvents(): void {
    this.load.on('progress', (value: number) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0x00ff00, 1);
      this.progressBar.fillRect(
        this.cameras.main.width / 2 - 150,
        this.cameras.main.height / 2 - 15,
        300 * value,
        30
      );
      this.percentText.setText(`${Math.round(value * 100)}%`);
    });

    this.load.on('fileprogress', (file: Phaser.Loader.File) => {
      this.assetText.setText(`Loading: ${file.key}`);
    });

    this.load.on('complete', () => {
      this.progressBar.destroy();
      this.progressBox.destroy();
      this.loadingText.destroy();
      this.percentText.destroy();
      this.assetText.destroy();
    });
  }

  private loadAllAssets(): void {
    // Get the base path from the index
    const basePath = 'craftpix-net-814823-free-roguelike-shoot-em-up-pixel-art-game-kit';

    // Load tileset
    this.load.image(
      'main_tileset',
      `${basePath}/2 Location/1 Tiles/Tileset.png`
    );

    // Load character spritesheets
    this.loadCharacterAssets(basePath);

    // Load enemy spritesheets
    this.loadEnemyAssets(basePath);

    // Load UI assets
    this.loadUIAssets(basePath);

    // Load projectiles
    this.loadProjectileAssets(basePath);

    // Load animated objects (portal, altar)
    this.loadAnimatedObjects(basePath);

    // Load weapon icons for HUD
    this.loadWeaponIcons(basePath);

    // Load decoration assets (XP gems, rocks)
    this.loadDecorationAssets(basePath);

    // Load space station assets
    this.loadSpaceStationAssets();

    // Load supply drop assets
    this.loadSupplyDropAssets(basePath);
  }

  private loadCharacterAssets(basePath: string): void {
    const characterPath = `${basePath}/1 Main Character/1 Character`;
    
    // Walk animations (spritesheet strips)
    this.load.spritesheet('player_walk_down', `${characterPath}/Walk1.png`, {
      frameWidth: CHARACTER_FRAME_SIZE,
      frameHeight: CHARACTER_FRAME_SIZE,
    });
    this.load.spritesheet('player_walk_side', `${characterPath}/Walk2.png`, {
      frameWidth: CHARACTER_FRAME_SIZE,
      frameHeight: CHARACTER_FRAME_SIZE,
    });
    this.load.spritesheet('player_walk_up', `${characterPath}/Walk3.png`, {
      frameWidth: CHARACTER_FRAME_SIZE,
      frameHeight: CHARACTER_FRAME_SIZE,
    });

    // Death animations
    this.load.spritesheet('player_death_down', `${characterPath}/Death1.png`, {
      frameWidth: CHARACTER_FRAME_SIZE,
      frameHeight: CHARACTER_FRAME_SIZE,
    });
    this.load.spritesheet('player_death_side', `${characterPath}/Death2.png`, {
      frameWidth: CHARACTER_FRAME_SIZE,
      frameHeight: CHARACTER_FRAME_SIZE,
    });
    this.load.spritesheet('player_death_up', `${characterPath}/Death3.png`, {
      frameWidth: CHARACTER_FRAME_SIZE,
      frameHeight: CHARACTER_FRAME_SIZE,
    });

    // Weapons
    const weaponPath = `${basePath}/1 Main Character/2 Weapons`;
    for (let i = 1; i <= 9; i++) {
      this.load.spritesheet(`weapon_${i}`, `${weaponPath}/${i}.png`, {
        frameWidth: CHARACTER_FRAME_SIZE,
        frameHeight: CHARACTER_FRAME_SIZE,
      });
    }

    // Effects (8 sets, 3 frames each)
    const effectPath = `${basePath}/1 Main Character/3 Effects`;
    for (let setNum = 1; setNum <= 8; setNum++) {
      for (let frameNum = 1; frameNum <= 3; frameNum++) {
        this.load.image(`effect_${setNum}_${frameNum}`, `${effectPath}/${setNum}_${frameNum}.png`);
      }
    }
  }

  private loadEnemyAssets(basePath: string): void {
    const enemyTypes = [
      { id: 1, name: 'goblin' },
      { id: 2, name: 'skeleton' },
      { id: 3, name: 'eye' },
      { id: 4, name: 'mushroom' },
      { id: 5, name: 'slime' },
      { id: 6, name: 'bat' },
    ];

    for (const enemy of enemyTypes) {
      const enemyPath = `${basePath}/3 Enemies/${enemy.id}`;
      
      // Run animations (SD = Side-Down, SU = Side-Up)
      this.load.spritesheet(`${enemy.name}_run_sd`, `${enemyPath}/RunSD.png`, {
        frameWidth: CHARACTER_FRAME_SIZE,
        frameHeight: CHARACTER_FRAME_SIZE,
      });
      this.load.spritesheet(`${enemy.name}_run_su`, `${enemyPath}/RunSU.png`, {
        frameWidth: CHARACTER_FRAME_SIZE,
        frameHeight: CHARACTER_FRAME_SIZE,
      });

      // Death animations
      this.load.spritesheet(`${enemy.name}_death_sd`, `${enemyPath}/DeathSD.png`, {
        frameWidth: CHARACTER_FRAME_SIZE,
        frameHeight: CHARACTER_FRAME_SIZE,
      });
      this.load.spritesheet(`${enemy.name}_death_su`, `${enemyPath}/DeathSU.png`, {
        frameWidth: CHARACTER_FRAME_SIZE,
        frameHeight: CHARACTER_FRAME_SIZE,
      });
    }
  }

  private loadUIAssets(basePath: string): void {
    const uiPath = `${basePath}/4 GUI`;
    
    this.load.image('ui_tileset', `${uiPath}/1 Interface/Tileset.png`);
    this.load.image('button_set', `${uiPath}/2 Buttons/ButtonSet.png`);
    
    // Load health bars (using correct file names)
    this.load.image('bar_back', `${uiPath}/4 Bars/HPBar_back.png`);
    this.load.image('bar_green', `${uiPath}/4 Bars/HPBar_green.png`);
    this.load.image('bar_red', `${uiPath}/4 Bars/HPBar_red.png`);
    this.load.image('bar_yellow', `${uiPath}/4 Bars/HPBar_yellow.png`);

    // Load icon frames for weapon slots
    for (let i = 1; i <= 4; i++) {
      this.load.image(`icon_frame_${i}`, `${uiPath}/3 Icons/IconFrame${i}.png`);
    }

    // Load interface tiles for UI panels (Tile_01 to Tile_09 use 0-padding, Tile_10+ don't)
    for (let i = 1; i <= 10; i++) {
      const paddedNum = i < 10 ? `0${i}` : `${i}`;
      this.load.image(`ui_tile_${i}`, `${uiPath}/1 Interface/Tile_${paddedNum}.png`);
    }

    // Load cursors (4 types)
    for (let i = 1; i <= 4; i++) {
      this.load.image(`cursor_${i}`, `${uiPath}/7 Cursor/${i}.png`);
    }
  }

  private loadWeaponIcons(basePath: string): void {
    const iconPath = `${basePath}/1 Main Character/4 Icons`;
    
    // Load weapon icons (for HUD display)
    for (let i = 1; i <= 9; i++) {
      this.load.image(`weapon_icon_${i}`, `${iconPath}/Icon_0${i}.png`);
    }
  }

  private loadDecorationAssets(basePath: string): void {
    const objectPath = `${basePath}/2 Location/2 Objects`;
    
    // Load XP gems (5 types)
    for (let i = 1; i <= 5; i++) {
      this.load.image(`xp_gem_${i}`, `${objectPath}/XP/${i}.png`);
    }

    // Load rocks for decorations (all 16)
    for (let i = 1; i <= 16; i++) {
      this.load.image(`rock_${i}`, `${objectPath}/Rocks/${i}.png`);
    }

    // Load grass for decorations (all 16)
    for (let i = 1; i <= 16; i++) {
      this.load.image(`grass_${i}`, `${objectPath}/Grass/${i}.png`);
    }
  }

  private loadProjectileAssets(basePath: string): void {
    const projectilePath = `${basePath}/1 Main Character/2 Weapons/Projectiles`;
    
    // Load commonly used projectiles
    for (let i = 1; i <= 10; i++) {
      this.load.image(`projectile_${i}`, `${projectilePath}/${i}.png`);
    }
  }

  private loadAnimatedObjects(basePath: string): void {
    const objectPath = `${basePath}/2 Location/3 Animated objects`;
    
    // Portal animations
    this.load.spritesheet('portal_idle', `${objectPath}/Portal1_Idle.png`, {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('portal_start', `${objectPath}/Portal1_Start.png`, {
      frameWidth: 48,
      frameHeight: 48,
    });

    // Altar animations
    this.load.spritesheet('altar_idle', `${objectPath}/Altar_Idle.png`, {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('altar_start', `${objectPath}/Altar_Start.png`, {
      frameWidth: 48,
      frameHeight: 48,
    });
  }

  private loadSpaceStationAssets(): void {
    const stationPath = 'spacestation/bgRemover-download';
    
    // Load space station levels (1-5) - background removed versions
    for (let i = 1; i <= 5; i++) {
      this.load.image(`space_station_${i}`, `${stationPath}/level${i}.png`);
    }
    
    // Load material types for station upgrades - background removed versions
    this.load.image('material_chest', `${stationPath}/spacechest1.png`);
    this.load.image('material_junk', `${stationPath}/spacejunk1.png`);
    this.load.image('material_slob', `${stationPath}/spaceslob1.png`);
  }

  private loadSupplyDropAssets(basePath: string): void {
    const enemyPath = `${basePath}/3 Enemies/8 Other`;
    const iconPath = `${basePath}/4 GUI/3 Icons`;
    
    // Load drop pod sprites
    this.load.image('drop_pod_1', `${enemyPath}/DropPod1.png`);
    this.load.image('drop_pod_2', `${enemyPath}/DropPod2.png`);
    
    // Load explosion/boom effects
    this.load.image('boom_1', `${enemyPath}/Boom1.png`);
    this.load.image('boom_2', `${enemyPath}/Boom2.png`);
    
    // Load dust effect
    this.load.image('dust', `${enemyPath}/Dust.png`);
    
    // Load target indicator
    this.load.image('target', `${enemyPath}/Target.png`);
    
    // Load supply drop icons (for different drop types)
    this.load.image('drop_icon_gold', `${iconPath}/Icon_01.png`);      // Coin/gold
    this.load.image('drop_icon_power', `${iconPath}/Icon_03.png`);     // Star/power
    this.load.image('drop_icon_health', `${iconPath}/Icon_05.png`);    // Heart/health
    this.load.image('drop_icon_speed', `${iconPath}/Icon_07.png`);     // Boot/speed
    this.load.image('drop_icon_material', `${iconPath}/Icon_09.png`);  // Crystal/material
  }

  create(): void {
    // Create generated textures
    this.createGeneratedTextures();
    
    // Create all animations
    this.createAnimations();
    
    // Transition to main menu
    this.scene.start(SCENE_KEYS.MAIN_MENU);
  }

  private createGeneratedTextures(): void {
    // Create XP gem texture (cyan diamond shape)
    const gemGraphics = this.make.graphics({ x: 0, y: 0 });
    
    // Outer glow
    gemGraphics.fillStyle(0x00ffff, 0.3);
    gemGraphics.fillCircle(8, 8, 8);
    
    // Inner gem (diamond shape)
    gemGraphics.fillStyle(0x00ffff, 1);
    gemGraphics.beginPath();
    gemGraphics.moveTo(8, 2);  // Top
    gemGraphics.lineTo(14, 8); // Right
    gemGraphics.lineTo(8, 14); // Bottom
    gemGraphics.lineTo(2, 8);  // Left
    gemGraphics.closePath();
    gemGraphics.fillPath();
    
    // Highlight
    gemGraphics.fillStyle(0xffffff, 0.5);
    gemGraphics.fillTriangle(8, 2, 10, 6, 6, 6);
    
    gemGraphics.generateTexture('xp_gem', 16, 16);
    gemGraphics.destroy();
    
    // Create generated textures for space station and materials
    // (fallbacks in case large image files fail to load)
    this.createSpaceStationTextures();
    this.createMaterialTextures();
  }

  /**
   * Create generated space station textures (fallback for large image files)
   */
  private createSpaceStationTextures(): void {
    const size = 256;
    const colors = [
      0x4488aa, // Level 1 - Blue-gray
      0x44aa88, // Level 2 - Teal
      0x88aa44, // Level 3 - Yellow-green
      0xaa8844, // Level 4 - Orange
      0xaa4488, // Level 5 - Magenta
    ];
    
    for (let level = 1; level <= 5; level++) {
      const key = `space_station_${level}`;
      
      // Only create if texture doesn't already exist (image loaded successfully)
      if (this.textures.exists(key)) continue;
      
      const g = this.make.graphics({ x: 0, y: 0 });
      const color = colors[level - 1];
      const innerColor = Phaser.Display.Color.ValueToColor(color).brighten(30).color;
      
      // Base circle (station body)
      g.fillStyle(color, 1);
      g.fillCircle(size / 2, size / 2, size / 2 - 10);
      
      // Inner ring
      g.lineStyle(8, innerColor, 1);
      g.strokeCircle(size / 2, size / 2, size / 3);
      
      // Core
      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(size / 2, size / 2, size / 6);
      
      // Level indicator (stars around the edge)
      g.fillStyle(0xffff00, 1);
      for (let i = 0; i < level; i++) {
        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const starX = size / 2 + Math.cos(angle) * (size / 2 - 30);
        const starY = size / 2 + Math.sin(angle) * (size / 2 - 30);
        g.fillCircle(starX, starY, 8);
      }
      
      // Outer glow ring
      g.lineStyle(4, 0x00ffff, 0.5);
      g.strokeCircle(size / 2, size / 2, size / 2 - 5);
      
      g.generateTexture(key, size, size);
      g.destroy();
    }
  }

  /**
   * Create generated material textures (fallback for large image files)
   */
  private createMaterialTextures(): void {
    const size = 64;
    const materialData = [
      { key: 'material_chest', color: 0xffd700, innerColor: 0xffaa00, symbol: '💰' }, // Gold chest
      { key: 'material_junk', color: 0x888899, innerColor: 0xaaaacc, symbol: '⚙️' },   // Silver junk
      { key: 'material_slob', color: 0x44ff88, innerColor: 0x88ffaa, symbol: '🧪' },   // Green slob
    ];
    
    for (const mat of materialData) {
      // Only create if texture doesn't already exist
      if (this.textures.exists(mat.key)) continue;
      
      const g = this.make.graphics({ x: 0, y: 0 });
      
      // Outer glow
      g.fillStyle(mat.color, 0.3);
      g.fillCircle(size / 2, size / 2, size / 2 - 2);
      
      // Main body (rounded square)
      g.fillStyle(mat.color, 1);
      g.fillRoundedRect(8, 8, size - 16, size - 16, 8);
      
      // Inner highlight
      g.fillStyle(mat.innerColor, 0.7);
      g.fillRoundedRect(12, 12, size - 24, (size - 24) / 2, 4);
      
      // Border
      g.lineStyle(2, 0xffffff, 0.5);
      g.strokeRoundedRect(8, 8, size - 16, size - 16, 8);
      
      // Center sparkle
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(size / 2, size / 2, 6);
      
      g.generateTexture(mat.key, size, size);
      g.destroy();
    }
  }

  private createAnimations(): void {
    // Player walk animations
    this.anims.create({
      key: 'player_walk_down',
      frames: this.anims.generateFrameNumbers('player_walk_down', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: 'player_walk_side',
      frames: this.anims.generateFrameNumbers('player_walk_side', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: 'player_walk_up',
      frames: this.anims.generateFrameNumbers('player_walk_up', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });

    // Player idle (first frame of walk down)
    this.anims.create({
      key: 'player_idle',
      frames: [{ key: 'player_walk_down', frame: 0 }],
      frameRate: 1,
    });

    // Player death
    this.anims.create({
      key: 'player_death',
      frames: this.anims.generateFrameNumbers('player_death_down', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: 0,
    });

    // Enemy animations
    this.createEnemyAnimations();

    // Portal animations
    this.anims.create({
      key: 'portal_idle',
      frames: this.anims.generateFrameNumbers('portal_idle', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1,
    });

    this.anims.create({
      key: 'portal_start',
      frames: this.anims.generateFrameNumbers('portal_start', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: 0,
    });
  }

  private createEnemyAnimations(): void {
    const enemyNames = ['goblin', 'skeleton', 'eye', 'mushroom', 'slime', 'bat'];

    for (const name of enemyNames) {
      // Run animations
      this.anims.create({
        key: `${name}_run_sd`,
        frames: this.anims.generateFrameNumbers(`${name}_run_sd`, { start: 0, end: 5 }),
        frameRate: 8,
        repeat: -1,
      });

      this.anims.create({
        key: `${name}_run_su`,
        frames: this.anims.generateFrameNumbers(`${name}_run_su`, { start: 0, end: 5 }),
        frameRate: 8,
        repeat: -1,
      });

      // Death animations (4 frames: 0-3)
      this.anims.create({
        key: `${name}_death_sd`,
        frames: this.anims.generateFrameNumbers(`${name}_death_sd`, { start: 0, end: 3 }),
        frameRate: 8,
        repeat: 0,
      });

      this.anims.create({
        key: `${name}_death_su`,
        frames: this.anims.generateFrameNumbers(`${name}_death_su`, { start: 0, end: 3 }),
        frameRate: 8,
        repeat: 0,
      });

      // Idle (first frame of run)
      this.anims.create({
        key: `${name}_idle`,
        frames: [{ key: `${name}_run_sd`, frame: 0 }],
        frameRate: 1,
      });
    }
  }
}
