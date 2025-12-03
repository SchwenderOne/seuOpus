import Phaser from 'phaser';
import { DEPTH } from '../config/Constants';
import { Player } from '../entities/Player';

/**
 * Gold Coin - Collectible that gives gold to player (persists after run)
 */
class GoldCoin extends Phaser.Physics.Arcade.Sprite {
  private goldValue: number = 1;
  private attractSpeed: number = 0;
  private maxAttractSpeed: number = 350;
  private attractAccel: number = 700;
  private isAttracting: boolean = false;
  private target?: Player;
  private glowTimer: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Use a circular graphics object as placeholder (gold colored)
    super(scene, x, y, 'gold_coin');
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setDepth(DEPTH.ITEMS + 1);
    this.setActive(false);
    this.setVisible(false);
    
    // Disable body for pooled coins
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = false;
    }
  }

  /**
   * Spawn the coin at position with gold value
   */
  public spawn(x: number, y: number, goldValue: number): void {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.goldValue = goldValue;
    this.attractSpeed = 0;
    this.isAttracting = false;
    this.glowTimer = 0;
    this.setTint(0xffffff);
    
    // Enable physics body
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = true;
      body.setCircle(6);
    }
    
    // Pop-out animation with spin
    const randomAngle = Math.random() * Math.PI * 2;
    const popDistance = 20 + Math.random() * 30;
    const targetX = x + Math.cos(randomAngle) * popDistance;
    const targetY = y + Math.sin(randomAngle) * popDistance;
    
    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      scale: { from: 0, to: 1 },
      angle: { from: 0, to: 360 },
      duration: 300,
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
   * Update coin movement
   */
  public updateCoin(delta: number): void {
    if (!this.active) return;

    // Sparkle effect
    this.glowTimer += delta;
    if (this.glowTimer > 200) {
      this.glowTimer = 0;
      const brightness = 0.8 + Math.random() * 0.2;
      const r = Math.floor(255 * brightness);
      const g = Math.floor(215 * brightness);
      const b = Math.floor(0);
      this.setTint(Phaser.Display.Color.GetColor(r, g, b));
    }

    if (!this.isAttracting || !this.target) return;

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
   * Collect the coin
   */
  public collect(): number {
    const value = this.goldValue;
    
    // Collection effect - golden flash
    this.scene.tweens.add({
      targets: this,
      scale: 1.5,
      alpha: 0,
      duration: 150,
      onComplete: () => this.deactivate()
    });
    
    return value;
  }

  /**
   * Deactivate the coin (return to pool)
   */
  public deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);
    this.setScale(1);
    this.setAlpha(1);
    this.setAngle(0);
    this.isAttracting = false;
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = false;
    }
  }

  public getGoldValue(): number {
    return this.goldValue;
  }
}

/**
 * GoldManager - Manages gold coin spawning and collection
 */
export class GoldManager {
  private scene: Phaser.Scene;
  private coins: Phaser.GameObjects.Group;
  private player: Player;
  private attractRadius: number = 60;
  private sessionGold: number = 0;
  private onCollectCallback?: (gold: number) => void;

  constructor(scene: Phaser.Scene, player: Player, poolSize: number = 50) {
    this.scene = scene;
    this.player = player;
    
    // Create coin pool
    this.coins = this.scene.add.group({
      classType: GoldCoin,
      maxSize: poolSize,
      runChildUpdate: false,
    });

    // Pre-create coins
    for (let i = 0; i < poolSize; i++) {
      const coin = new GoldCoin(scene, 0, 0);
      this.coins.add(coin);
    }
  }

  /**
   * Create the gold coin texture (golden circle with shine)
   */
  public static createCoinTexture(scene: Phaser.Scene): void {
    // Check if texture already exists
    if (scene.textures.exists('gold_coin')) return;

    const graphics = scene.add.graphics();
    const size = 12;
    
    // Outer glow
    graphics.fillStyle(0xffdd00, 0.3);
    graphics.fillCircle(size, size, size);
    
    // Main coin body
    graphics.fillStyle(0xffd700, 1);
    graphics.fillCircle(size, size, size - 2);
    
    // Inner highlight
    graphics.fillStyle(0xffee88, 1);
    graphics.fillCircle(size - 2, size - 2, size / 3);
    
    // Small shine
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillCircle(size - 3, size - 3, 2);
    
    graphics.generateTexture('gold_coin', size * 2, size * 2);
    graphics.destroy();
  }

  /**
   * Spawn a gold coin at position
   */
  public spawnCoin(x: number, y: number, goldValue: number = 1): void {
    const coin = this.coins.getFirstDead(false) as GoldCoin | null;
    
    if (coin) {
      coin.spawn(x, y, goldValue);
    }
  }

  /**
   * Spawn gold from enemy death (based on enemy type)
   */
  public spawnFromEnemy(x: number, y: number, baseGold: number, dropChance: number = 0.3): void {
    // Random chance to drop gold
    if (Math.random() > dropChance) return;
    
    // Bosses always drop gold
    const goldAmount = Math.max(1, Math.floor(baseGold));
    
    // Split into multiple coins for larger amounts
    if (goldAmount <= 3) {
      this.spawnCoin(x, y, goldAmount);
    } else {
      const coinCount = Math.min(5, Math.ceil(goldAmount / 3));
      const goldPerCoin = Math.ceil(goldAmount / coinCount);
      
      for (let i = 0; i < coinCount; i++) {
        this.scene.time.delayedCall(i * 50, () => {
          this.spawnCoin(x, y, goldPerCoin);
        });
      }
    }
  }

  /**
   * Spawn gold from boss death (guaranteed)
   */
  public spawnFromBoss(x: number, y: number, goldAmount: number): void {
    const coinCount = Math.min(10, Math.max(5, Math.ceil(goldAmount / 5)));
    const goldPerCoin = Math.ceil(goldAmount / coinCount);
    
    for (let i = 0; i < coinCount; i++) {
      this.scene.time.delayedCall(i * 80, () => {
        const offsetX = (Math.random() - 0.5) * 40;
        const offsetY = (Math.random() - 0.5) * 40;
        this.spawnCoin(x + offsetX, y + offsetY, goldPerCoin);
      });
    }
  }

  /**
   * Update all coins
   */
  public update(delta: number): void {
    this.coins.getChildren().forEach((obj) => {
      const coin = obj as GoldCoin;
      if (!coin.active) return;

      // Check if coin should start attracting
      const distance = Phaser.Math.Distance.Between(
        coin.x, coin.y,
        this.player.x, this.player.y
      );

      if (distance < this.attractRadius) {
        coin.startAttract(this.player);
      }

      coin.updateCoin(delta);
    });
  }

  /**
   * Get the coins group for collision detection
   */
  public getCoins(): Phaser.GameObjects.Group {
    return this.coins;
  }

  /**
   * Collect all coins on screen (magnet effect)
   */
  public attractAllCoins(): void {
    this.coins.getChildren().forEach((obj) => {
      const coin = obj as GoldCoin;
      if (coin.active) {
        coin.startAttract(this.player);
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
   * Get session gold collected
   */
  public getSessionGold(): number {
    return this.sessionGold;
  }

  /**
   * Add to session gold (called when coin collected)
   */
  public addSessionGold(amount: number): void {
    this.sessionGold += amount;
    if (this.onCollectCallback) {
      this.onCollectCallback(amount);
    }
  }

  /**
   * Set callback for gold collection
   */
  public setOnCollect(callback: (gold: number) => void): void {
    this.onCollectCallback = callback;
  }

  /**
   * Reset session gold
   */
  public resetSessionGold(): void {
    this.sessionGold = 0;
  }
}
