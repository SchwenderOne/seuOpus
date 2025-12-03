import Phaser from 'phaser';
import { Entity } from './Entity';
import { DEPTH } from '../config/Constants';
import { Player } from './Player';

/**
 * Enemy behavior types
 */
export enum EnemyBehavior {
  CHASER = 'chaser',     // Moves directly toward player
  SHOOTER = 'shooter',   // Stops at range and fires
  RUSHER = 'rusher',     // Charges quickly then rests
  TANK = 'tank',         // Slow but high HP
  SWARM = 'swarm',       // Very fast, moves in zigzag pattern
  BOMBER = 'bomber',     // Explodes on death
  TELEPORTER = 'teleporter', // Occasionally teleports closer
}

/**
 * Enemy configuration
 */
export interface EnemyConfig {
  type: string;
  hp: number;
  speed: number;
  damage: number;
  behavior: EnemyBehavior;
  xpValue: number;
}

/**
 * Predefined enemy types matching the asset kit
 */
export const ENEMY_TYPES: Record<string, EnemyConfig> = {
  goblin: {
    type: 'goblin',
    hp: 20,
    speed: 80,
    damage: 10,
    behavior: EnemyBehavior.CHASER,
    xpValue: 1,
  },
  skeleton: {
    type: 'skeleton',
    hp: 30,
    speed: 60,
    damage: 15,
    behavior: EnemyBehavior.CHASER,
    xpValue: 2,
  },
  eye: {
    type: 'eye',
    hp: 15,
    speed: 40,
    damage: 20,
    behavior: EnemyBehavior.SHOOTER,
    xpValue: 3,
  },
  mushroom: {
    type: 'mushroom',
    hp: 25,
    speed: 50,
    damage: 10,
    behavior: EnemyBehavior.CHASER,
    xpValue: 2,
  },
  slime: {
    type: 'slime',
    hp: 60,
    speed: 30,
    damage: 20,
    behavior: EnemyBehavior.TANK,
    xpValue: 5,
  },
  bat: {
    type: 'bat',
    hp: 10,
    speed: 150,
    damage: 5,
    behavior: EnemyBehavior.RUSHER,
    xpValue: 1,
  },
  // === NEW ELITE VARIANTS ===
  elite_goblin: {
    type: 'goblin',
    hp: 40,
    speed: 100,
    damage: 15,
    behavior: EnemyBehavior.SWARM,
    xpValue: 3,
  },
  elite_skeleton: {
    type: 'skeleton',
    hp: 50,
    speed: 45,
    damage: 30,
    behavior: EnemyBehavior.BOMBER,
    xpValue: 5,
  },
  elite_mushroom: {
    type: 'mushroom',
    hp: 35,
    speed: 70,
    damage: 15,
    behavior: EnemyBehavior.TELEPORTER,
    xpValue: 4,
  },
};

/**
 * Boss enemy types - appear at wave milestones
 */
export const BOSS_TYPES: Record<string, EnemyConfig & { isBoss: boolean }> = {
  boss_slime: {
    type: 'slime',
    hp: 1500, // 3x original (500)
    speed: 40,
    damage: 35,
    behavior: EnemyBehavior.TANK,
    xpValue: 50,
    isBoss: true,
  },
  boss_skeleton: {
    type: 'skeleton',
    hp: 1050, // 3x original (350)
    speed: 70,
    damage: 25,
    behavior: EnemyBehavior.CHASER,
    xpValue: 40,
    isBoss: true,
  },
  boss_eye: {
    type: 'eye',
    hp: 900, // 3x original (300)
    speed: 50,
    damage: 40,
    behavior: EnemyBehavior.SHOOTER,
    xpValue: 45,
    isBoss: true,
  },
};

/**
 * Enemy - Base class for all enemy entities
 */
export class Enemy extends Entity {
  private target: Player;
  private config: EnemyConfig;
  private damage: number;
  private xpValue: number;
  private behavior: EnemyBehavior;
  public isBoss: boolean = false;
  
  // Behavior-specific state
  private isResting: boolean = false;
  private restTimer: number = 0;
  private chargeTimer: number = 0;
  private facingRight: boolean = true;
  
  // New behavior state
  private swarmAngleOffset: number = 0;
  private teleportCooldown: number = 3000;
  private isElite: boolean = false;
  
  // Shooter behavior
  private shootCooldown: number = 0;
  private shootInterval: number = 1500; // 1.5 seconds between shots
  private onShootCallback?: (x: number, y: number, damage: number) => void;
  
  // Wandering behavior (for space station safe zone)
  private isWandering: boolean = false;
  private wanderTargetX: number = 0;
  private wanderTargetY: number = 0;
  private wanderTimer: number = 0;
  private wanderChangeInterval: number = 2000; // Change direction every 2 seconds
  
  // Callbacks
  private onDeathCallback?: (enemy: Enemy) => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    target: Player,
    config: EnemyConfig
  ) {
    super(scene, x, y, `${config.type}_run_sd`, config.hp, config.speed);
    
    this.target = target;
    this.config = config;
    this.damage = config.damage;
    this.xpValue = config.xpValue;
    this.behavior = config.behavior;

    // Set depth
    this.setDepth(DEPTH.ENEMIES);
    
    // Set hitbox - larger for bosses
    const body = this.body as Phaser.Physics.Arcade.Body;
    if ((config as any).isBoss) {
      this.isBoss = true;
      body.setSize(40, 40);
      body.setOffset(4, 8);
      this.setScale(2.5); // Bosses are bigger
      this.setTint(0xff4400); // Orange tint for bosses
    } else {
      body.setSize(24, 24);
      body.setOffset(12, 20);
    }
    
    // Check if elite variant (by behavior type)
    if (config.behavior === EnemyBehavior.SWARM || 
        config.behavior === EnemyBehavior.BOMBER || 
        config.behavior === EnemyBehavior.TELEPORTER) {
      this.isElite = true;
      // Elite tint (purple-ish)
      if (!this.isBoss) {
        this.setTint(0xff44ff);
        this.setScale(1.2);
      }
    }
    
    // Play idle animation
    this.play(`${config.type}_run_sd`);
  }

  public update(_time: number, delta: number): void {
    if (!this.isAlive || !this.target.alive) {
      this.setVelocity(0, 0);
      return;
    }

    // If wandering (player in safe zone), use wandering behavior instead
    if (this.isWandering) {
      this.executeWanderingBehavior(delta);
      this.updateAnimation();
      return;
    }

    // Execute normal behavior
    switch (this.behavior) {
      case EnemyBehavior.CHASER:
        this.executeChaserBehavior();
        break;
      case EnemyBehavior.SHOOTER:
        this.executeShooterBehavior(delta);
        break;
      case EnemyBehavior.RUSHER:
        this.executeRusherBehavior(delta);
        break;
      case EnemyBehavior.TANK:
        this.executeTankBehavior();
        break;
      case EnemyBehavior.SWARM:
        this.executeSwarmBehavior(delta);
        break;
      case EnemyBehavior.BOMBER:
        this.executeBomberBehavior();
        break;
      case EnemyBehavior.TELEPORTER:
        this.executeTeleporterBehavior(delta);
        break;
    }

    // Update animation based on movement
    this.updateAnimation();
  }

  private executeChaserBehavior(): void {
    // Move directly toward player
    this.moveTowardTarget(this.moveSpeed);
  }

  private executeShooterBehavior(delta: number): void {
    const distance = Phaser.Math.Distance.Between(
      this.x, this.y,
      this.target.x, this.target.y
    );

    // Stop at range and shoot
    if (distance < 200) {
      this.setVelocity(0, 0);
      
      // Fire projectile at player
      this.shootCooldown -= delta;
      if (this.shootCooldown <= 0 && this.onShootCallback) {
        this.onShootCallback(this.x, this.y, this.damage);
        this.shootCooldown = this.shootInterval;
        
        // Flash when shooting
        this.setTint(0xff8800);
        this.scene.time.delayedCall(100, () => {
          this.clearTint();
        });
      }
    } else {
      this.moveTowardTarget(this.moveSpeed);
    }
  }

  private executeRusherBehavior(delta: number): void {
    if (this.isResting) {
      this.restTimer -= delta;
      if (this.restTimer <= 0) {
        this.isResting = false;
        this.chargeTimer = 1000; // 1 second charge
      }
      this.setVelocity(0, 0);
    } else {
      // Charge toward player at high speed
      this.moveTowardTarget(this.moveSpeed * 2);
      
      this.chargeTimer -= delta;
      if (this.chargeTimer <= 0) {
        this.isResting = true;
        this.restTimer = 1500; // 1.5 second rest
      }
    }
  }

  private executeTankBehavior(): void {
    // Slow but steady movement toward player
    this.moveTowardTarget(this.moveSpeed);
  }

  private executeSwarmBehavior(delta: number): void {
    // Fast zigzag movement toward player
    this.swarmAngleOffset += delta * 0.01;
    
    const baseAngle = Phaser.Math.Angle.Between(
      this.x, this.y,
      this.target.x, this.target.y
    );
    
    // Add zigzag offset
    const zigzag = Math.sin(this.swarmAngleOffset * 5) * 0.5;
    const finalAngle = baseAngle + zigzag;
    
    const velocityX = Math.cos(finalAngle) * this.moveSpeed;
    const velocityY = Math.sin(finalAngle) * this.moveSpeed;
    
    this.setVelocity(velocityX, velocityY);
    this.facingRight = velocityX >= 0;
  }

  private executeBomberBehavior(): void {
    // Moves toward player like a chaser - explosion happens on death
    this.moveTowardTarget(this.moveSpeed);
  }

  /**
   * Wandering behavior - used when player is in space station safe zone
   * Enemies move randomly instead of chasing the player
   */
  private executeWanderingBehavior(delta: number): void {
    this.wanderTimer += delta;
    
    // Pick a new wander target periodically
    if (this.wanderTimer >= this.wanderChangeInterval || 
        (this.wanderTargetX === 0 && this.wanderTargetY === 0)) {
      // Pick a random direction
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 100;
      
      this.wanderTargetX = this.x + Math.cos(angle) * distance;
      this.wanderTargetY = this.y + Math.sin(angle) * distance;
      
      // Clamp to world bounds
      const bounds = this.scene.physics.world.bounds;
      const margin = 50;
      this.wanderTargetX = Phaser.Math.Clamp(this.wanderTargetX, margin, bounds.width - margin);
      this.wanderTargetY = Phaser.Math.Clamp(this.wanderTargetY, margin, bounds.height - margin);
      
      this.wanderTimer = 0;
      // Randomize next change interval
      this.wanderChangeInterval = 1500 + Math.random() * 2000;
    }
    
    // Move toward wander target at reduced speed
    const distToTarget = Phaser.Math.Distance.Between(
      this.x, this.y,
      this.wanderTargetX, this.wanderTargetY
    );
    
    if (distToTarget > 10) {
      const angle = Phaser.Math.Angle.Between(
        this.x, this.y,
        this.wanderTargetX, this.wanderTargetY
      );
      
      // Wander at 40% of normal speed
      const wanderSpeed = this.moveSpeed * 0.4;
      const velocityX = Math.cos(angle) * wanderSpeed;
      const velocityY = Math.sin(angle) * wanderSpeed;
      
      this.setVelocity(velocityX, velocityY);
      this.facingRight = velocityX >= 0;
    } else {
      // Reached target, stop briefly
      this.setVelocity(0, 0);
    }
  }

  private executeTeleporterBehavior(delta: number): void {
    // Move toward player but occasionally teleport closer
    this.teleportCooldown -= delta;
    
    if (this.teleportCooldown <= 0) {
      const distance = Phaser.Math.Distance.Between(
        this.x, this.y,
        this.target.x, this.target.y
      );
      
      // Only teleport if far enough away
      if (distance > 150) {
        // Teleport to random position near player
        const angle = Math.random() * Math.PI * 2;
        const teleportDist = 80 + Math.random() * 60;
        
        const newX = this.target.x + Math.cos(angle) * teleportDist;
        const newY = this.target.y + Math.sin(angle) * teleportDist;
        
        // Teleport effect at old position
        this.createTeleportEffect(this.x, this.y);
        
        // Move to new position
        this.setPosition(newX, newY);
        
        // Teleport effect at new position
        this.createTeleportEffect(newX, newY);
        
        // Flash purple
        this.setTint(0xff00ff);
        this.scene.time.delayedCall(200, () => {
          if (this.isElite && !this.isBoss) {
            this.setTint(0xff44ff);
          } else {
            this.clearTint();
          }
        });
      }
      
      this.teleportCooldown = 2500 + Math.random() * 1500; // 2.5-4 seconds
    }
    
    // Normal movement between teleports
    this.moveTowardTarget(this.moveSpeed);
  }

  private createTeleportEffect(x: number, y: number): void {
    // Purple particle burst
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const particle = this.scene.add.circle(x, y, 4, 0xff00ff, 0.8);
      particle.setDepth(DEPTH.EFFECTS);
      
      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 30,
        y: y + Math.sin(angle) * 30,
        alpha: 0,
        scale: 0.3,
        duration: 200,
        onComplete: () => particle.destroy()
      });
    }
  }

  private moveTowardTarget(speed: number): void {
    const angle = Phaser.Math.Angle.Between(
      this.x, this.y,
      this.target.x, this.target.y
    );

    const velocityX = Math.cos(angle) * speed;
    const velocityY = Math.sin(angle) * speed;

    this.setVelocity(velocityX, velocityY);

    // Track facing direction
    this.facingRight = velocityX >= 0;
  }

  private updateAnimation(): void {
    const isMoving = this.body && (
      Math.abs(this.body.velocity.x) > 1 || 
      Math.abs(this.body.velocity.y) > 1
    );

    if (isMoving) {
      // Determine if moving up or down for animation
      const movingUp = this.body!.velocity.y < -10;
      const animKey = movingUp 
        ? `${this.config.type}_run_su` 
        : `${this.config.type}_run_sd`;
      
      if (this.anims.currentAnim?.key !== animKey) {
        this.play(animKey);
      }
    }

    // Flip sprite based on horizontal direction
    this.setFlipX(!this.facingRight);
  }

  protected onDeath(): void {
    // Play death animation
    const deathAnim = `${this.config.type}_death_sd`;
    this.play(deathAnim);

    // Handle bomber explosion
    if (this.behavior === EnemyBehavior.BOMBER) {
      this.createBomberExplosion();
    } else {
      // Normal death particles
      this.spawnDeathParticles();
    }

    // Callback for spawning XP, etc.
    if (this.onDeathCallback) {
      this.onDeathCallback(this);
    }

    // Destroy after animation
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.destroy();
    });
  }

  private createBomberExplosion(): void {
    // Large explosion effect
    const explosionRadius = 80;
    
    // Visual explosion
    const flash = this.scene.add.circle(this.x, this.y, explosionRadius, 0xff6600, 0.6);
    flash.setDepth(DEPTH.EFFECTS);
    
    this.scene.tweens.add({
      targets: flash,
      scale: 1.5,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy()
    });
    
    // Many particles
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const dist = 30 + Math.random() * 50;
      
      const particle = this.scene.add.circle(
        this.x + Math.cos(angle) * 10,
        this.y + Math.sin(angle) * 10,
        4 + Math.random() * 3,
        [0xff6600, 0xff4400, 0xffaa00][Math.floor(Math.random() * 3)],
        1
      );
      particle.setDepth(DEPTH.EFFECTS);
      
      this.scene.tweens.add({
        targets: particle,
        x: this.x + Math.cos(angle) * dist,
        y: this.y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 400 + Math.random() * 200,
        onComplete: () => particle.destroy()
      });
    }
    
    // Note: Damage to player would need to be handled by GameScene via callback
    // This is just the visual effect
  }

  private spawnDeathParticles(): void {
    // Create simple particle burst effect
    const particleCount = 6;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 50 + Math.random() * 50;
      
      const particle = this.scene.add.circle(
        this.x,
        this.y,
        3 + Math.random() * 2,
        0xff4444,
        0.8
      );
      particle.setDepth(DEPTH.EFFECTS);
      
      // Animate outward and fade
      this.scene.tweens.add({
        targets: particle,
        x: this.x + Math.cos(angle) * speed,
        y: this.y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.3,
        duration: 300 + Math.random() * 200,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }

  // Setters
  public setOnDeath(callback: (enemy: Enemy) => void): void {
    this.onDeathCallback = callback;
  }

  public setOnShoot(callback: (x: number, y: number, damage: number) => void): void {
    this.onShootCallback = callback;
  }

  /**
   * Set wandering mode (used when player is in space station safe zone)
   * When true, enemy wanders randomly instead of chasing player
   */
  public setWandering(wandering: boolean): void {
    if (this.isWandering !== wandering) {
      this.isWandering = wandering;
      // Reset wander state when entering wander mode
      if (wandering) {
        this.wanderTimer = this.wanderChangeInterval; // Immediately pick new target
      }
    }
  }

  /**
   * Check if enemy is currently wandering
   */
  public getIsWandering(): boolean {
    return this.isWandering;
  }

  // Getters
  public getDamage(): number {
    return this.damage;
  }

  public getXPValue(): number {
    return this.xpValue;
  }

  public getConfig(): EnemyConfig {
    return this.config;
  }
}
