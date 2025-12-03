import Phaser from 'phaser';
import {
  PROJECTILE_SPEED,
  PROJECTILE_LIFESPAN,
  PROJECTILE_POOL_SIZE,
  DEPTH,
} from '../config/Constants';
import { Enemy } from '../entities/Enemy';

/**
 * Projectile - Individual projectile sprite
 */
class Projectile extends Phaser.Physics.Arcade.Sprite {
  private damage: number = 10;
  private lifespan: number = 0;
  private maxLifespan: number = PROJECTILE_LIFESPAN;
  private projectileType: number = 1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'projectile_1');
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setDepth(DEPTH.PROJECTILES);
    this.setActive(false);
    this.setVisible(false);
    this.setScale(0.8); // Scale down the projectile sprite
    
    // Set up physics body with small circular hitbox
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = false;
      body.setCircle(4); // Small 4px radius hitbox
      body.setOffset(this.width / 2 - 4, this.height / 2 - 4); // Center the hitbox
    }
  }

  /**
   * Fire the projectile in a direction
   */
  public fire(
    x: number,
    y: number,
    directionX: number,
    directionY: number,
    damage: number,
    speed: number = PROJECTILE_SPEED,
    projectileType: number = 1
  ): void {
    // Set projectile texture based on type (1-10 available)
    this.projectileType = Math.min(10, Math.max(1, projectileType));
    this.setTexture(`projectile_${this.projectileType}`);
    // Normalize direction first
    const length = Math.sqrt(directionX * directionX + directionY * directionY);
    if (length === 0) return;
    
    const normalX = directionX / length;
    const normalY = directionY / length;
    
    // Offset spawn position 30px in firing direction to avoid wall collision
    const spawnOffset = 30;
    const spawnX = x + normalX * spawnOffset;
    const spawnY = y + normalY * spawnOffset;
    
    this.setPosition(spawnX, spawnY);
    this.setActive(true);
    this.setVisible(true);
    
    // Enable physics body
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = true;
    }
    
    this.damage = damage;
    this.lifespan = 0;
    this.maxLifespan = PROJECTILE_LIFESPAN;

    // Apply velocity
    this.setVelocity(normalX * speed, normalY * speed);
    
    // Rotate to face direction
    this.setRotation(Math.atan2(normalY, normalX));
  }

  /**
   * Deactivate the projectile (return to pool)
   */
  public deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);
    
    // Disable physics body when pooled
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = false;
    }
  }

  /**
   * Update projectile each frame
   */
  public update(delta: number): void {
    if (!this.active) return;

    this.lifespan += delta;
    
    if (this.lifespan >= this.maxLifespan) {
      this.deactivate();
    }
  }

  public getDamage(): number {
    return this.damage;
  }
}

/**
 * ProjectileManager - Object pool for projectiles
 */
export class ProjectileManager {
  private scene: Phaser.Scene;
  private projectiles: Phaser.GameObjects.Group;
  private autoFireTimer: number = 0;
  private autoFireInterval: number = 300; // ms between shots
  private baseDamage: number = 10;
  private attackRange: number = 300; // Range to detect enemies
  private enemyGroup?: Phaser.GameObjects.Group;
  private canAttackCallback?: () => boolean;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    
    // Create projectile pool (runChildUpdate disabled - we update manually)
    this.projectiles = this.scene.add.group({
      classType: Projectile,
      maxSize: PROJECTILE_POOL_SIZE,
      runChildUpdate: false,
    });

    // Pre-create projectiles
    for (let i = 0; i < PROJECTILE_POOL_SIZE; i++) {
      const projectile = new Projectile(scene, 0, 0);
      this.projectiles.add(projectile);
    }
  }

  /**
   * Set the enemy group for auto-targeting
   */
  public setEnemyGroup(group: Phaser.GameObjects.Group): void {
    this.enemyGroup = group;
  }

  /**
   * Find the nearest enemy within attack range
   */
  private findNearestEnemy(playerX: number, playerY: number): Enemy | null {
    if (!this.enemyGroup) return null;

    let nearestEnemy: Enemy | null = null;
    let nearestDistance = this.attackRange;

    this.enemyGroup.getChildren().forEach((obj) => {
      const enemy = obj as Enemy;
      if (!enemy.active || !enemy.alive) return;

      const distance = Phaser.Math.Distance.Between(
        playerX, playerY,
        enemy.x, enemy.y
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestEnemy = enemy;
      }
    });

    return nearestEnemy;
  }

  /**
   * Spawn muzzle flash effect at position using varied effects
   */
  private spawnMuzzleFlash(x: number, y: number, angle: number): void {
    // Use random effect sprite from sets 1-3
    const effectSet = Phaser.Math.Between(1, 3);
    const effectFrame = Phaser.Math.Between(1, 3);
    
    const flash = this.scene.add.image(x, y, `effect_${effectSet}_${effectFrame}`);
    flash.setDepth(DEPTH.EFFECTS);
    flash.setScale(0.4);
    flash.setRotation(angle);
    flash.setTint(0xffff00); // Yellow tint for muzzle flash

    // Animate and destroy
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 0.6,
      duration: 80,
      onComplete: () => flash.destroy()
    });
  }

  /**
   * Update manager each frame - auto-aims at nearest enemy
   */
  public update(
    delta: number,
    playerX: number,
    playerY: number
  ): void {
    // Update all projectiles
    this.projectiles.getChildren().forEach((obj) => {
      const projectile = obj as Projectile;
      projectile.update(delta);
    });

    // Auto-fire at nearest enemy
    this.autoFireTimer += delta;
    
    // Check if attacking is allowed (not in safe zone)
    const canAttack = this.canAttackCallback ? this.canAttackCallback() : true;
    
    if (canAttack && this.autoFireTimer >= this.autoFireInterval) {
      const nearestEnemy = this.findNearestEnemy(playerX, playerY);
      
      if (nearestEnemy) {
        // Calculate direction to enemy
        const dirX = nearestEnemy.x - playerX;
        const dirY = nearestEnemy.y - playerY;
        
        // Fire projectile
        const projectile = this.fire(playerX, playerY, dirX, dirY, this.baseDamage);
        
        if (projectile) {
          // Spawn muzzle flash
          const angle = Math.atan2(dirY, dirX);
          this.spawnMuzzleFlash(playerX + Math.cos(angle) * 20, playerY + Math.sin(angle) * 20, angle);
        }
      }
      
      this.autoFireTimer = 0;
    }
  }

  /**
   * Set callback to check if player can attack
   */
  public setCanAttackCallback(callback: () => boolean): void {
    this.canAttackCallback = callback;
  }

  /**
   * Fire a projectile
   */
  public fire(
    x: number,
    y: number,
    directionX: number,
    directionY: number,
    damage: number,
    speed: number = PROJECTILE_SPEED
  ): Projectile | null {
    // Get inactive projectile from pool
    const projectile = this.projectiles.getFirstDead(false) as Projectile | null;
    
    if (projectile) {
      projectile.fire(x, y, directionX, directionY, damage, speed);
      return projectile;
    }
    
    return null;
  }

  /**
   * Get the projectiles group for collision detection
   */
  public getProjectiles(): Phaser.GameObjects.Group {
    return this.projectiles;
  }

  /**
   * Set auto-fire interval
   */
  public setFireRate(interval: number): void {
    this.autoFireInterval = interval;
  }

  /**
   * Set base damage
   */
  public setDamage(damage: number): void {
    this.baseDamage = damage;
  }

  /**
   * Get active projectile count
   */
  public getActiveCount(): number {
    return this.projectiles.getChildren().filter((p) => p.active).length;
  }

  /**
   * Get current base damage
   */
  public getDamage(): number {
    return this.baseDamage;
  }

  /**
   * Get current fire rate interval
   */
  public getFireRate(): number {
    return this.autoFireInterval;
  }
}
