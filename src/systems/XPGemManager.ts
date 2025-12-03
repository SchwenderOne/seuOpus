import Phaser from 'phaser';
import { DEPTH, XP_GEM_VALUE } from '../config/Constants';
import { Player } from '../entities/Player';

/**
 * XP Gem - Collectible that gives XP to player
 */
class XPGem extends Phaser.Physics.Arcade.Sprite {
  private xpValue: number = XP_GEM_VALUE;
  private attractSpeed: number = 0;
  private maxAttractSpeed: number = 400;
  private attractAccel: number = 800;
  private isAttracting: boolean = false;
  private target?: Player;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'xp_gem');
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setDepth(DEPTH.ITEMS);
    this.setActive(false);
    this.setVisible(false);
    
    // Disable body for pooled gems
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = false;
    }
  }

  /**
   * Spawn the gem at position with XP value
   */
  public spawn(x: number, y: number, xpValue: number): void {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.xpValue = xpValue;
    this.attractSpeed = 0;
    this.isAttracting = false;
    
    // Enable physics body
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = true;
      body.setCircle(8);
    }
    
    // Pop-out animation
    const randomAngle = Math.random() * Math.PI * 2;
    const popDistance = 30 + Math.random() * 20;
    const targetX = x + Math.cos(randomAngle) * popDistance;
    const targetY = y + Math.sin(randomAngle) * popDistance;
    
    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      scale: { from: 0, to: 1 },
      duration: 200,
      ease: 'Back.easeOut',
    });
  }

  /**
   * Start attracting toward player
   */
  public startAttract(target: Player): void {
    this.isAttracting = true;
    this.target = target;
  }

  /**
   * Update gem movement
   */
  public update(delta: number): void {
    if (!this.active || !this.isAttracting || !this.target) return;

    // Accelerate toward player
    this.attractSpeed = Math.min(
      this.maxAttractSpeed,
      this.attractSpeed + this.attractAccel * (delta / 1000)
    );

    // Move toward player
    const angle = Phaser.Math.Angle.Between(
      this.x, this.y,
      this.target.x, this.target.y
    );

    const velocityX = Math.cos(angle) * this.attractSpeed;
    const velocityY = Math.sin(angle) * this.attractSpeed;
    this.setVelocity(velocityX, velocityY);
  }

  /**
   * Collect the gem
   */
  public collect(): number {
    const value = this.xpValue;
    
    // Collection effect
    this.scene.tweens.add({
      targets: this,
      scale: 0,
      alpha: 0,
      duration: 100,
      onComplete: () => this.deactivate()
    });
    
    return value;
  }

  /**
   * Deactivate the gem (return to pool)
   */
  public deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);
    this.setScale(1);
    this.setAlpha(1);
    this.isAttracting = false;
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = false;
    }
  }

  public getXPValue(): number {
    return this.xpValue;
  }
}

/**
 * XPGemManager - Manages XP gem spawning and collection
 */
export class XPGemManager {
  private scene: Phaser.Scene;
  private gems: Phaser.GameObjects.Group;
  private player: Player;
  private attractRadius: number = 80; // Auto-attract within this radius

  constructor(scene: Phaser.Scene, player: Player, poolSize: number = 100) {
    this.scene = scene;
    this.player = player;
    
    // Create gem pool
    this.gems = this.scene.add.group({
      classType: XPGem,
      maxSize: poolSize,
      runChildUpdate: false, // We'll update manually
    });

    // Pre-create gems
    for (let i = 0; i < poolSize; i++) {
      const gem = new XPGem(scene, 0, 0);
      this.gems.add(gem);
    }
  }

  /**
   * Spawn an XP gem at position
   */
  public spawnGem(x: number, y: number, xpValue: number = XP_GEM_VALUE): void {
    const gem = this.gems.getFirstDead(false) as XPGem | null;
    
    if (gem) {
      gem.spawn(x, y, xpValue);
    }
  }

  /**
   * Spawn multiple gems (for larger enemies)
   */
  public spawnGems(x: number, y: number, totalXP: number): void {
    // Split XP into gems (max 5 gems per enemy)
    const gemCount = Math.min(5, Math.max(1, Math.floor(totalXP / XP_GEM_VALUE)));
    const xpPerGem = Math.ceil(totalXP / gemCount);
    
    for (let i = 0; i < gemCount; i++) {
      // Slight delay for staggered spawn
      this.scene.time.delayedCall(i * 50, () => {
        this.spawnGem(x, y, xpPerGem);
      });
    }
  }

  /**
   * Update all gems
   */
  public update(delta: number): void {
    this.gems.getChildren().forEach((obj) => {
      const gem = obj as XPGem;
      if (!gem.active) return;

      // Check if gem should start attracting
      const distance = Phaser.Math.Distance.Between(
        gem.x, gem.y,
        this.player.x, this.player.y
      );

      if (distance < this.attractRadius) {
        gem.startAttract(this.player);
      }

      gem.update(delta);
    });
  }

  /**
   * Get the gems group for collision detection
   */
  public getGems(): Phaser.GameObjects.Group {
    return this.gems;
  }

  /**
   * Collect all gems on screen (level-up magnet effect)
   */
  public attractAllGems(): void {
    this.gems.getChildren().forEach((obj) => {
      const gem = obj as XPGem;
      if (gem.active) {
        gem.startAttract(this.player);
      }
    });
  }

  /**
   * Set attract radius
   */
  public setAttractRadius(radius: number): void {
    this.attractRadius = radius;
  }

  /**
   * Get attract radius
   */
  public getAttractRadius(): number {
    return this.attractRadius;
  }
}
