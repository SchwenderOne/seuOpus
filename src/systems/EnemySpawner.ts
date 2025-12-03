import Phaser from 'phaser';
import { Enemy, ENEMY_TYPES, BOSS_TYPES, EnemyConfig } from '../entities/Enemy';
import { Player } from '../entities/Player';
import {
  ENEMY_SPAWN_DISTANCE,
  ENEMY_DESPAWN_DISTANCE,
  INITIAL_SPAWN_INTERVAL,
  MIN_SPAWN_INTERVAL,
  SPAWN_INTERVAL_DECREASE_RATE,
  MAX_ENEMIES_ON_SCREEN,
} from '../config/Constants';

/**
 * EnemySpawner - Manages enemy spawning and despawning
 */
export class EnemySpawner {
  private scene: Phaser.Scene;
  private player: Player;
  private enemies: Phaser.GameObjects.Group;
  
  private spawnInterval: number;
  private timeSinceLastSpawn: number = 0;
  private waveNumber: number = 1;
  private totalEnemiesSpawned: number = 0;
  private lastBossWave: number = 0;
  private bossSpawnedThisWave: boolean = false;
  
  // Callbacks
  private onEnemyKilledCallback?: (enemy: Enemy, xp: number) => void;
  private onEnemyShootCallback?: (x: number, y: number, damage: number) => void;
  private onBossKilledCallback?: (enemy: Enemy) => void;
  private onEnemyDeathCallback?: () => void;
  private onBossSpawnCallback?: (boss: Enemy) => void;
  private isPlayerInSafeZoneCallback?: () => boolean;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.spawnInterval = INITIAL_SPAWN_INTERVAL;
    
    // Create enemies group with physics
    this.enemies = this.scene.add.group({
      classType: Enemy,
      runChildUpdate: true,
    });
  }

  /**
   * Update spawner each frame
   */
  public update(time: number, delta: number): void {
    this.timeSinceLastSpawn += delta;

    // Spawn enemies at interval
    if (this.timeSinceLastSpawn >= this.spawnInterval) {
      this.trySpawnEnemy();
      this.timeSinceLastSpawn = 0;
    }

    // Despawn far enemies
    this.despawnFarEnemies();

    // Update spawn interval (gets faster over time)
    this.updateDifficulty(time);
  }

  private trySpawnEnemy(): void {
    // Check max enemies limit
    if (this.enemies.getLength() >= MAX_ENEMIES_ON_SCREEN) {
      return;
    }

    // Get spawn position (off-screen, near player)
    const spawnPos = this.getSpawnPosition();
    if (!spawnPos) return;

    // Select enemy type based on wave
    const enemyConfig = this.selectEnemyType();
    
    // Create enemy
    const enemy = new Enemy(
      this.scene,
      spawnPos.x,
      spawnPos.y,
      this.player,
      enemyConfig
    );

    // Ensure enemy scrolls with camera (fix for enemies stuck to screen)
    enemy.setScrollFactor(1);

    // Set up death callback
    enemy.setOnDeath((deadEnemy) => {
      this.onEnemyDeath(deadEnemy);
    });

    // Set up shoot callback for shooter enemies
    if (this.onEnemyShootCallback) {
      enemy.setOnShoot(this.onEnemyShootCallback);
    }

    // If player is in safe zone, set enemy to wander immediately
    if (this.isPlayerInSafeZoneCallback?.()) {
      enemy.setWandering(true);
    }

    // Add to group
    this.enemies.add(enemy);
    this.totalEnemiesSpawned++;
  }

  private getSpawnPosition(): { x: number; y: number } | null {
    const playerX = this.player.x;
    const playerY = this.player.y;

    // Random angle around player
    const angle = Math.random() * Math.PI * 2;
    
    // Random distance (at least spawn distance, within despawn distance)
    const distance = ENEMY_SPAWN_DISTANCE + Math.random() * 100;

    const x = playerX + Math.cos(angle) * distance;
    const y = playerY + Math.sin(angle) * distance;

    // Ensure within world bounds
    const worldBounds = this.scene.physics.world.bounds;
    if (x < 0 || x > worldBounds.width || y < 0 || y > worldBounds.height) {
      return null;
    }

    return { x, y };
  }

  private selectEnemyType(): EnemyConfig {
    // Base enemy types (no elites)
    const baseTypes = ['goblin', 'skeleton', 'eye', 'mushroom', 'slime', 'bat'];
    // Elite enemy types
    const eliteTypes = ['elite_goblin', 'elite_skeleton', 'elite_mushroom'];
    
    // Early waves: only weak enemies
    let availableTypes: string[];
    
    if (this.waveNumber <= 2) {
      availableTypes = ['goblin', 'bat'];
    } else if (this.waveNumber <= 4) {
      availableTypes = ['goblin', 'bat', 'skeleton', 'mushroom'];
    } else if (this.waveNumber <= 6) {
      // Introduce all base enemies
      availableTypes = baseTypes;
    } else {
      // Wave 7+: Include elite enemies with increasing probability
      // 20% chance for elite at wave 7, increasing by 5% per wave (max 50%)
      const eliteChance = Math.min(0.5, 0.2 + (this.waveNumber - 7) * 0.05);
      
      if (Math.random() < eliteChance) {
        const randomElite = eliteTypes[Math.floor(Math.random() * eliteTypes.length)];
        return ENEMY_TYPES[randomElite];
      }
      
      availableTypes = baseTypes;
    }

    // Random selection
    const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    return ENEMY_TYPES[randomType];
  }

  private despawnFarEnemies(): void {
    const playerX = this.player.x;
    const playerY = this.player.y;

    this.enemies.getChildren().forEach((obj) => {
      const enemy = obj as Enemy;
      const distance = Phaser.Math.Distance.Between(
        playerX, playerY,
        enemy.x, enemy.y
      );

      if (distance > ENEMY_DESPAWN_DISTANCE) {
        enemy.destroy();
      }
    });
  }

  private updateDifficulty(_time: number): void {
    // Increase difficulty based on enemies spawned
    const newWave = Math.floor(this.totalEnemiesSpawned / 20) + 1;
    
    if (newWave > this.waveNumber) {
      this.waveNumber = newWave;
      this.bossSpawnedThisWave = false;
      
      // Decrease spawn interval
      this.spawnInterval = Math.max(
        MIN_SPAWN_INTERVAL,
        this.spawnInterval - SPAWN_INTERVAL_DECREASE_RATE
      );

      // Spawn boss every 3 waves starting at wave 3
      if (this.waveNumber >= 3 && this.waveNumber % 3 === 0 && this.lastBossWave !== this.waveNumber) {
        this.spawnBoss();
        this.lastBossWave = this.waveNumber;
      }
    }
  }

  private spawnBoss(): void {
    const spawnPos = this.getSpawnPosition();
    if (!spawnPos) return;

    // Select boss type based on wave
    const bossKeys = Object.keys(BOSS_TYPES);
    const bossIndex = Math.floor((this.waveNumber / 3 - 1) % bossKeys.length);
    const bossConfig = BOSS_TYPES[bossKeys[bossIndex]];

    // Scale boss stats with wave number
    const scaleFactor = 1 + (this.waveNumber - 3) * 0.15;
    const scaledConfig = {
      ...bossConfig,
      hp: Math.floor(bossConfig.hp * scaleFactor),
      damage: Math.floor(bossConfig.damage * scaleFactor),
      xpValue: Math.floor(bossConfig.xpValue * scaleFactor),
    };

    const boss = new Enemy(
      this.scene,
      spawnPos.x,
      spawnPos.y,
      this.player,
      scaledConfig
    );

    // Ensure boss scrolls with camera (fix for enemies stuck to screen)
    boss.setScrollFactor(1);

    // If player is in safe zone, set boss to wander immediately
    if (this.isPlayerInSafeZoneCallback?.()) {
      boss.setWandering(true);
    }

    boss.setOnDeath((deadBoss) => {
      this.onEnemyDeath(deadBoss);
      if (this.onBossKilledCallback) {
        this.onBossKilledCallback(deadBoss);
      }
    });

    if (this.onEnemyShootCallback) {
      boss.setOnShoot(this.onEnemyShootCallback);
    }

    this.enemies.add(boss);
    this.bossSpawnedThisWave = true;

    // Trigger boss spawn callback with boss reference
    if (this.onBossSpawnCallback) {
      this.onBossSpawnCallback(boss);
    }

    // Show boss warning
    this.showBossWarning();
  }

  private showBossWarning(): void {
    const centerX = this.scene.cameras.main.width / 2;
    const warning = this.scene.add.text(
      centerX,
      80,
      `⚠️ WAVE ${this.waveNumber} BOSS! ⚠️`,
      {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#ff4400',
        stroke: '#000000',
        strokeThickness: 5,
      }
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100);

    // Pulse and fade animation
    this.scene.tweens.add({
      targets: warning,
      scale: { from: 1, to: 1.2 },
      alpha: { from: 1, to: 0.7 },
      duration: 300,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.scene.tweens.add({
          targets: warning,
          alpha: 0,
          y: 60,
          duration: 500,
          onComplete: () => warning.destroy()
        });
      }
    });

    // Screen shake
    this.scene.cameras.main.shake(500, 0.02);
  }

  private onEnemyDeath(enemy: Enemy): void {
    // Trigger callback (for XP, score, etc.)
    if (this.onEnemyKilledCallback) {
      this.onEnemyKilledCallback(enemy, enemy.getXPValue());
    }
    // Trigger death sound callback
    if (this.onEnemyDeathCallback) {
      this.onEnemyDeathCallback();
    }
  }

  /**
   * Get the enemies group for collision detection
   */
  public getEnemies(): Phaser.GameObjects.Group {
    return this.enemies;
  }

  /**
   * Set callback for when enemy is killed
   */
  public setOnEnemyKilled(callback: (enemy: Enemy, xp: number) => void): void {
    this.onEnemyKilledCallback = callback;
  }

  /**
   * Set callback for when shooter enemy fires
   */
  public setOnEnemyShoot(callback: (x: number, y: number, damage: number) => void): void {
    this.onEnemyShootCallback = callback;
  }

  /**
   * Get current wave number
   */
  public getWaveNumber(): number {
    return this.waveNumber;
  }

  /**
   * Get total enemies killed
   */
  public getEnemiesKilled(): number {
    return this.totalEnemiesSpawned - this.enemies.getLength();
  }

  /**
   * Set callback for when a boss is killed
   */
  public setOnBossKilled(callback: (enemy: Enemy) => void): void {
    this.onBossKilledCallback = callback;
  }

  /**
   * Set callback for when any enemy dies (for sound effects)
   */
  public setOnEnemyDeath(callback: () => void): void {
    this.onEnemyDeathCallback = callback;
  }

  /**
   * Set callback for when a boss spawns (receives boss enemy reference)
   */
  public setOnBossSpawn(callback: (boss: Enemy) => void): void {
    this.onBossSpawnCallback = callback;
  }

  /**
   * Set callback to check if player is in safe zone
   * Used to make newly spawned enemies wander instead of chase
   */
  public setIsPlayerInSafeZone(callback: () => boolean): void {
    this.isPlayerInSafeZoneCallback = callback;
  }
}
