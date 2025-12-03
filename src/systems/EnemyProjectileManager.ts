import Phaser from 'phaser';
import { DEPTH } from '../config/Constants';
import { Player } from '../entities/Player';

/**
 * Enemy projectile that travels toward the player
 */
class EnemyProjectile extends Phaser.Physics.Arcade.Sprite {
  private damage: number = 10;
  private lifespan: number = 0;
  private maxLifespan: number = 3000;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'projectile_4'); // Use a different projectile sprite for enemies
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setDepth(DEPTH.PROJECTILES);
    this.setActive(false);
    this.setVisible(false);
    this.setScale(0.8);
    this.setTint(0xff4444); // Red tint for enemy projectiles
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = false;
      body.setCircle(6);
      body.setOffset(this.width / 2 - 6, this.height / 2 - 6);
    }
  }

  public fire(x: number, y: number, targetX: number, targetY: number, damage: number, speed: number = 150): void {
    const dirX = targetX - x;
    const dirY = targetY - y;
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    if (length === 0) return;
    
    const normalX = dirX / length;
    const normalY = dirY / length;
    
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.damage = damage;
    this.lifespan = 0;
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.enable = true;
    
    this.setVelocity(normalX * speed, normalY * speed);
    this.setRotation(Math.atan2(normalY, normalX));
  }

  public update(delta: number): void {
    if (!this.active) return;
    
    this.lifespan += delta;
    if (this.lifespan >= this.maxLifespan) {
      this.deactivate();
    }
  }

  public deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.enable = false;
  }

  public getDamage(): number {
    return this.damage;
  }
}

/**
 * EnemyProjectileManager - Manages all enemy projectiles
 */
export class EnemyProjectileManager {
  private projectiles: Phaser.GameObjects.Group;
  private player: Player;

  constructor(scene: Phaser.Scene, player: Player) {
    this.player = player;
    
    // Create projectile pool
    this.projectiles = scene.add.group({
      classType: EnemyProjectile,
      runChildUpdate: false,
    });

    // Pre-create projectiles
    for (let i = 0; i < 50; i++) {
      this.projectiles.add(new EnemyProjectile(scene, 0, 0));
    }
  }

  /**
   * Fire a projectile from an enemy toward the player
   */
  public fire(x: number, y: number, damage: number, speed: number = 150): void {
    const projectile = this.projectiles.getFirstDead(false) as EnemyProjectile | null;
    if (projectile) {
      projectile.fire(x, y, this.player.x, this.player.y, damage, speed);
    }
  }

  /**
   * Update all projectiles
   */
  public update(delta: number): void {
    this.projectiles.getChildren().forEach(obj => {
      (obj as EnemyProjectile).update(delta);
    });
  }

  /**
   * Get the projectiles group for collision detection
   */
  public getProjectiles(): Phaser.GameObjects.Group {
    return this.projectiles;
  }
}
