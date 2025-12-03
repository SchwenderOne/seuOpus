import Phaser from 'phaser';
import { Entity } from './Entity';
import {
  PLAYER_SPEED,
  PLAYER_MAX_HP,
  PLAYER_INVINCIBILITY_DURATION,
  DEPTH,
} from '../config/Constants';

/**
 * Player - The main player character
 * Handles input, movement, weapons, and collision
 */
export class Player extends Entity {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  
  private lastDirection: 'down' | 'up' | 'side' = 'down';
  private facingRight: boolean = true;
  
  // Stats
  private xp: number = 0;
  private level: number = 1;
  private xpToNextLevel: number = 10;
  
  // Callbacks
  private onLevelUpCallback?: (level: number) => void;
  private onDeathCallback?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player_walk_down', PLAYER_MAX_HP, PLAYER_SPEED);

    // Set up input
    this.setupInput();
    
    // Set depth for proper layering
    this.setDepth(DEPTH.PLAYER);
    
    // Set hitbox (smaller than sprite for better feel)
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(24, 24);
    body.setOffset(12, 20);
    
    // Play idle animation
    this.play('player_idle');
  }

  private setupInput(): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;

    // Arrow keys
    this.cursors = keyboard.createCursorKeys();

    // WASD keys
    this.wasdKeys = {
      W: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  public update(_time: number, _delta: number): void {
    if (!this.isAlive) return;

    this.handleMovement();
    this.updateAnimation();
  }

  private handleMovement(): void {
    // Get input
    const left = this.cursors?.left.isDown || this.wasdKeys?.A.isDown;
    const right = this.cursors?.right.isDown || this.wasdKeys?.D.isDown;
    const up = this.cursors?.up.isDown || this.wasdKeys?.W.isDown;
    const down = this.cursors?.down.isDown || this.wasdKeys?.S.isDown;

    // Calculate velocity
    let velocityX = 0;
    let velocityY = 0;

    if (left) velocityX -= 1;
    if (right) velocityX += 1;
    if (up) velocityY -= 1;
    if (down) velocityY += 1;

    // Normalize diagonal movement
    if (velocityX !== 0 && velocityY !== 0) {
      velocityX *= 0.707; // 1/sqrt(2)
      velocityY *= 0.707;
    }

    // Apply velocity
    this.setVelocity(velocityX * this.moveSpeed, velocityY * this.moveSpeed);

    // Track facing direction
    if (velocityX > 0) this.facingRight = true;
    else if (velocityX < 0) this.facingRight = false;

    // Track last movement direction for animation
    if (velocityY > 0) {
      this.lastDirection = 'down';
    } else if (velocityY < 0) {
      this.lastDirection = 'up';
    } else if (velocityX !== 0) {
      this.lastDirection = 'side';
    }
  }

  private updateAnimation(): void {
    const isMoving = this.body && (this.body.velocity.x !== 0 || this.body.velocity.y !== 0);

    if (isMoving) {
      const animKey = `player_walk_${this.lastDirection}`;
      if (this.anims.currentAnim?.key !== animKey) {
        this.play(animKey);
      }
    } else {
      if (this.anims.currentAnim?.key !== 'player_idle') {
        this.play('player_idle');
      }
    }

    // Flip sprite for left movement
    this.setFlipX(!this.facingRight);
  }

  /**
   * Add XP and check for level up
   */
  public addXP(amount: number): void {
    this.xp += amount;

    while (this.xp >= this.xpToNextLevel) {
      this.xp -= this.xpToNextLevel;
      this.levelUp();
    }
  }

  private levelUp(): void {
    this.level++;
    // XP scaling: each level requires 50% more XP
    this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
    
    // Callback for UI/upgrade system
    if (this.onLevelUpCallback) {
      this.onLevelUpCallback(this.level);
    }
  }

  public takeDamage(amount: number): boolean {
    const died = super.takeDamage(amount);
    
    if (!died && this.isAlive) {
      // Grant invincibility after taking damage
      this.setInvincible(PLAYER_INVINCIBILITY_DURATION);
    }

    return died;
  }

  protected onDeath(): void {
    // Play death animation
    this.play('player_death');
    
    // Wait for animation to complete, then trigger callback
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (this.onDeathCallback) {
        this.onDeathCallback();
      }
    });
  }

  /**
   * Get aim direction towards mouse pointer
   */
  public getAimDirection(): Phaser.Math.Vector2 {
    const pointer = this.scene.input.activePointer;
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    
    const direction = new Phaser.Math.Vector2(
      worldPoint.x - this.x,
      worldPoint.y - this.y
    );
    
    return direction.normalize();
  }

  // Setters for callbacks
  public setOnLevelUp(callback: (level: number) => void): void {
    this.onLevelUpCallback = callback;
  }

  public setOnDeath(callback: () => void): void {
    this.onDeathCallback = callback;
  }

  // Getters
  public get currentXP(): number {
    return this.xp;
  }

  public get requiredXP(): number {
    return this.xpToNextLevel;
  }

  public get currentLevel(): number {
    return this.level;
  }

  public get xpPercent(): number {
    return this.xp / this.xpToNextLevel;
  }

  /**
   * Heal the player
   */
  public heal(amount: number): void {
    this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
    
    // Visual feedback - green flash
    this.setTint(0x00ff00);
    this.scene.time.delayedCall(200, () => {
      this.clearTint();
    });
  }

  /**
   * Increase maximum HP (for upgrades)
   */
  public increaseMaxHP(amount: number): void {
    this.maxHp += amount;
    this.currentHp += amount; // Also heal the amount
  }

  /**
   * Increase movement speed (for upgrades)
   */
  public increaseMoveSpeed(percent: number): void {
    this.moveSpeed = Math.floor(this.moveSpeed * (1 + percent));
  }

  /**
   * Get current movement speed for stats display
   */
  public getMoveSpeed(): number {
    return this.moveSpeed;
  }

  /**
   * Apply temporary speed multiplier (for buffs)
   */
  public applySpeedMultiplier(multiplier: number): void {
    // Store base speed on first call
    if (!(this as any)._baseSpeed) {
      (this as any)._baseSpeed = this.moveSpeed;
    }
    this.moveSpeed = Math.floor((this as any)._baseSpeed * multiplier);
  }

  /**
   * Get total XP collected (across all levels)
   */
  public getTotalXP(): number {
    // Calculate total XP from levels gained
    let total = this.xp;
    let xpNeeded = 10;
    for (let i = 1; i < this.level; i++) {
      total += xpNeeded;
      xpNeeded = Math.floor(xpNeeded * 1.5);
    }
    return total;
  }
}
