import Phaser from 'phaser';

/**
 * Entity - Base class for all game entities (Player, Enemy, etc.)
 * Extends Phaser.Physics.Arcade.Sprite with common functionality
 */
export abstract class Entity extends Phaser.Physics.Arcade.Sprite {
  protected maxHp: number;
  protected currentHp: number;
  protected moveSpeed: number;
  protected isAlive: boolean = true;
  protected invincible: boolean = false;
  protected invincibilityTimer?: Phaser.Time.TimerEvent;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    maxHp: number,
    speed: number
  ) {
    super(scene, x, y, texture);
    
    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Initialize stats
    this.maxHp = maxHp;
    this.currentHp = maxHp;
    this.moveSpeed = speed;

    // Set up physics body
    this.setCollideWorldBounds(false);
    
    // Set origin to center-bottom for proper ground alignment
    this.setOrigin(0.5, 0.5);
  }

  /**
   * Take damage and handle death
   * @param amount Damage amount
   * @returns true if entity died
   */
  public takeDamage(amount: number): boolean {
    if (!this.isAlive || this.invincible) return false;

    this.currentHp = Math.max(0, this.currentHp - amount);

    // Visual feedback
    this.flashDamage();

    if (this.currentHp <= 0) {
      this.die();
      return true;
    }

    return false;
  }

  /**
   * Heal the entity
   * @param amount Heal amount
   */
  public heal(amount: number): void {
    if (!this.isAlive) return;
    this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
  }

  /**
   * Flash red when taking damage
   */
  protected flashDamage(): void {
    this.setTintFill(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
    });
  }

  /**
   * Set invincibility for a duration
   * @param duration Duration in ms
   */
  public setInvincible(duration: number): void {
    this.invincible = true;
    
    // Flashing effect during invincibility
    const flashTimer = this.scene.time.addEvent({
      delay: 100,
      callback: () => {
        this.setAlpha(this.alpha === 1 ? 0.5 : 1);
      },
      repeat: Math.floor(duration / 100) - 1,
    });

    // Clear invincibility after duration
    this.invincibilityTimer = this.scene.time.delayedCall(duration, () => {
      this.invincible = false;
      this.setAlpha(1);
      flashTimer.destroy();
    });
  }

  /**
   * Handle entity death
   */
  protected die(): void {
    this.isAlive = false;
    this.setVelocity(0, 0);
    
    // Subclasses should override this to add death animation
    this.onDeath();
  }

  /**
   * Called when entity dies - override in subclasses
   */
  protected abstract onDeath(): void;

  /**
   * Update method - called each frame
   */
  public update(_time: number, _delta: number): void {
    // Override in subclasses
  }

  // Getters
  public get hp(): number {
    return this.currentHp;
  }

  public get maxHealth(): number {
    return this.maxHp;
  }

  public get speed(): number {
    return this.moveSpeed;
  }

  public get alive(): boolean {
    return this.isAlive;
  }

  public get hpPercent(): number {
    return this.currentHp / this.maxHp;
  }
}
