import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { 
  DEPTH, 
  MAP_WIDTH, 
  MAP_HEIGHT,
  TILE_SIZE,
  SUPPLY_DROP 
} from '../config/Constants';

/**
 * Types of supply drops
 */
export type DropType = 'gold' | 'material' | 'health' | 'power' | 'speed';

/**
 * Supply drop data
 */
interface SupplyDrop {
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
  icon: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Arc;
  type: DropType;
  x: number;
  y: number;
  collected: boolean;
  spawnTime: number;
}

/**
 * SupplyDropManager - Manages periodic supply drops on the map
 * 
 * Features:
 * - Supply drops spawn periodically from the sky
 * - Different drop types with various rewards
 * - Visual effects: falling animation, explosion on landing
 * - Temporary buffs from power/speed drops
 */
export class SupplyDropManager {
  private scene: Phaser.Scene;
  private player: Player;
  
  // Active drops
  private drops: SupplyDrop[] = [];
  
  // Timing
  private timeSinceLastSpawn: number = 0;
  private gameStartTime: number = 0;
  private firstDropSpawned: boolean = false;
  
  // Active buffs
  private powerBuffActive: boolean = false;
  private powerBuffEndTime: number = 0;
  private speedBuffActive: boolean = false;
  private speedBuffEndTime: number = 0;
  
  // Callbacks
  private onGoldCollected?: (amount: number) => void;
  private onMaterialCollected?: (amount: number) => void;
  private onHealthCollected?: (amount: number) => void;
  private onShowNotification?: (message: string, color: number) => void;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.gameStartTime = scene.time.now;
  }

  /**
   * Update manager each frame
   */
  public update(delta: number): void {
    // Update buff timers
    this.updateBuffs();
    
    // Check spawn timing
    this.timeSinceLastSpawn += delta;
    
    const timeSinceStart = this.scene.time.now - this.gameStartTime;
    
    // First drop after delay
    if (!this.firstDropSpawned && timeSinceStart >= SUPPLY_DROP.FIRST_SPAWN_DELAY) {
      this.spawnDrop();
      this.firstDropSpawned = true;
      this.timeSinceLastSpawn = 0;
    }
    
    // Regular spawns
    if (this.firstDropSpawned && 
        this.timeSinceLastSpawn >= SUPPLY_DROP.SPAWN_INTERVAL &&
        this.drops.length < SUPPLY_DROP.MAX_DROPS_ON_MAP) {
      this.spawnDrop();
      this.timeSinceLastSpawn = 0;
    }
    
    // Check for player collection
    this.checkPlayerCollection();
    
    // Check for despawns
    this.checkDespawns();
  }

  /**
   * Spawn a new supply drop
   */
  private spawnDrop(): void {
    // Random position on map
    const margin = TILE_SIZE * 6;
    const x = margin + Math.random() * (MAP_WIDTH - margin * 2);
    const y = margin + Math.random() * (MAP_HEIGHT - margin * 2);
    
    // Determine drop type
    const type = this.selectDropType();
    
    // Create shadow (starts small, grows as pod falls)
    const shadow = this.scene.add.ellipse(x, y, 30, 15, 0x000000, 0.3);
    shadow.setDepth(DEPTH.SHADOWS);
    shadow.setScale(SUPPLY_DROP.SHADOW_SCALE);
    shadow.setScrollFactor(1); // Ensure it scrolls with camera
    
    // Create drop pod sprite (starts high above target)
    const podType = Math.random() > 0.5 ? 'drop_pod_1' : 'drop_pod_2';
    const sprite = this.scene.add.image(x, y - SUPPLY_DROP.FALL_HEIGHT, podType);
    sprite.setDepth(DEPTH.EFFECTS);
    sprite.setScale(1.5);
    sprite.setScrollFactor(1); // Ensure it scrolls with camera
    
    // Create icon (hidden until pod lands)
    const iconKey = this.getIconKey(type);
    const icon = this.scene.add.image(x, y - 20, iconKey);
    icon.setDepth(DEPTH.EFFECTS + 1);
    icon.setScale(2);
    icon.setAlpha(0);
    icon.setScrollFactor(1); // Ensure it scrolls with camera
    
    // Create glow (hidden until pod lands)
    const glowColor = this.getGlowColor(type);
    const glow = this.scene.add.arc(x, y, 25, 0, 360, false, glowColor, 0.3);
    glow.setDepth(DEPTH.ITEMS - 1);
    glow.setAlpha(0);
    glow.setScrollFactor(1); // Ensure it scrolls with camera
    
    // Store drop data
    const drop: SupplyDrop = {
      sprite,
      shadow,
      icon,
      glow,
      type,
      x,
      y,
      collected: false,
      spawnTime: this.scene.time.now,
    };
    this.drops.push(drop);
    
    // Animate fall
    this.animateFall(drop);
    
    // Show notification
    this.showNotification('📦 Supply drop incoming!', 0xffff00);
  }

  /**
   * Animate the drop pod falling
   */
  private animateFall(drop: SupplyDrop): void {
    // Animate pod falling
    this.scene.tweens.add({
      targets: drop.sprite,
      y: drop.y,
      duration: SUPPLY_DROP.FALL_DURATION,
      ease: 'Quad.easeIn',
      onComplete: () => this.onDropLanded(drop),
    });
    
    // Animate shadow growing
    this.scene.tweens.add({
      targets: drop.shadow,
      scale: 1,
      duration: SUPPLY_DROP.FALL_DURATION,
      ease: 'Quad.easeIn',
    });
  }

  /**
   * Called when drop pod lands
   */
  private onDropLanded(drop: SupplyDrop): void {
    // Screen shake
    this.scene.cameras.main.shake(100, 0.01);
    
    // Explosion effect
    this.createLandingEffect(drop.x, drop.y);
    
    // Hide pod, show icon
    drop.sprite.setAlpha(0.7);
    drop.sprite.setScale(1.2);
    
    // Show icon with pop animation
    drop.icon.setAlpha(1);
    this.scene.tweens.add({
      targets: drop.icon,
      scale: { from: 0, to: 2 },
      duration: 300,
      ease: 'Back.easeOut',
    });
    
    // Show glow with pulse animation
    drop.glow.setAlpha(0.3);
    this.scene.tweens.add({
      targets: drop.glow,
      alpha: { from: 0.2, to: 0.5 },
      scale: { from: 1, to: 1.3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    // Float icon animation
    this.scene.tweens.add({
      targets: drop.icon,
      y: drop.y - 30,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Create landing explosion effect
   */
  private createLandingEffect(x: number, y: number): void {
    // Use boom sprite
    const boom = this.scene.add.image(x, y, 'boom_1');
    boom.setDepth(DEPTH.EFFECTS + 2);
    boom.setScale(0.5);
    boom.setAlpha(0.9);
    boom.setScrollFactor(1); // Ensure it scrolls with camera
    
    this.scene.tweens.add({
      targets: boom,
      scale: 2,
      alpha: 0,
      duration: 400,
      onComplete: () => boom.destroy(),
    });
    
    // Dust particles
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const dust = this.scene.add.image(x, y, 'dust');
      dust.setDepth(DEPTH.EFFECTS);
      dust.setScale(0.8);
      dust.setAlpha(0.7);
      dust.setScrollFactor(1); // Ensure it scrolls with camera
      
      this.scene.tweens.add({
        targets: dust,
        x: x + Math.cos(angle) * 50,
        y: y + Math.sin(angle) * 50,
        alpha: 0,
        scale: 0.3,
        duration: 500,
        onComplete: () => dust.destroy(),
      });
    }
  }

  /**
   * Check if player is near any drops to collect
   */
  private checkPlayerCollection(): void {
    this.drops.forEach((drop) => {
      if (drop.collected) return;
      
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        drop.x, drop.y
      );
      
      if (distance < SUPPLY_DROP.COLLECTION_RADIUS) {
        this.collectDrop(drop);
      }
    });
  }

  /**
   * Collect a drop and apply rewards
   */
  private collectDrop(drop: SupplyDrop): void {
    drop.collected = true;
    
    // Apply rewards based on type
    switch (drop.type) {
      case 'gold':
        const goldAmount = Phaser.Math.Between(
          SUPPLY_DROP.REWARDS.gold.min,
          SUPPLY_DROP.REWARDS.gold.max
        );
        this.onGoldCollected?.(goldAmount);
        this.showNotification(`💰 +${goldAmount} Gold!`, 0xffd700);
        break;
        
      case 'material':
        this.onMaterialCollected?.(SUPPLY_DROP.REWARDS.material.amount);
        this.showNotification(`📦 +${SUPPLY_DROP.REWARDS.material.amount} Materials!`, 0x88ff88);
        break;
        
      case 'health':
        const healAmount = Math.ceil(this.player.maxHealth * SUPPLY_DROP.REWARDS.health.percent);
        this.onHealthCollected?.(healAmount);
        this.showNotification(`❤️ +${healAmount} HP!`, 0xff4444);
        break;
        
      case 'power':
        this.activatePowerBuff();
        this.showNotification('⚔️ POWER BOOST! +50% Damage', 0xff8800);
        break;
        
      case 'speed':
        this.activateSpeedBuff();
        this.showNotification('💨 SPEED BOOST! +40% Speed', 0x00ffff);
        break;
    }
    
    // Collection effect
    this.createCollectionEffect(drop);
    
    // Destroy drop visuals
    this.scene.tweens.add({
      targets: [drop.sprite, drop.icon, drop.shadow, drop.glow],
      alpha: 0,
      scale: 0,
      duration: 200,
      onComplete: () => {
        drop.sprite.destroy();
        drop.icon.destroy();
        drop.shadow.destroy();
        drop.glow.destroy();
      },
    });
  }

  /**
   * Create collection visual effect
   */
  private createCollectionEffect(drop: SupplyDrop): void {
    // Rising particles
    for (let i = 0; i < 6; i++) {
      const particle = this.scene.add.arc(
        drop.x + Phaser.Math.Between(-20, 20),
        drop.y,
        5,
        0, 360, false,
        this.getGlowColor(drop.type),
        0.8
      );
      particle.setDepth(DEPTH.EFFECTS);
      particle.setScrollFactor(1); // Ensure it scrolls with camera
      
      this.scene.tweens.add({
        targets: particle,
        y: drop.y - 60,
        alpha: 0,
        scale: 0.3,
        duration: 600,
        delay: i * 50,
        onComplete: () => particle.destroy(),
      });
    }
  }

  /**
   * Check for drops that should despawn
   */
  private checkDespawns(): void {
    const now = this.scene.time.now;
    
    this.drops = this.drops.filter((drop) => {
      if (drop.collected) return false;
      
      const age = now - drop.spawnTime;
      if (age >= SUPPLY_DROP.DESPAWN_TIME) {
        // Fade out and remove
        this.scene.tweens.add({
          targets: [drop.sprite, drop.icon, drop.shadow, drop.glow],
          alpha: 0,
          duration: 500,
          onComplete: () => {
            drop.sprite.destroy();
            drop.icon.destroy();
            drop.shadow.destroy();
            drop.glow.destroy();
          },
        });
        return false;
      }
      return true;
    });
  }

  /**
   * Select drop type based on weights
   */
  private selectDropType(): DropType {
    const weights = SUPPLY_DROP.DROP_WEIGHTS;
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let random = Math.random() * total;
    
    for (const [type, weight] of Object.entries(weights)) {
      random -= weight;
      if (random <= 0) return type as DropType;
    }
    
    return 'gold'; // Fallback
  }

  /**
   * Get icon key for drop type
   */
  private getIconKey(type: DropType): string {
    switch (type) {
      case 'gold': return 'drop_icon_gold';
      case 'material': return 'drop_icon_material';
      case 'health': return 'drop_icon_health';
      case 'power': return 'drop_icon_power';
      case 'speed': return 'drop_icon_speed';
      default: return 'drop_icon_gold';
    }
  }

  /**
   * Get glow color for drop type
   */
  private getGlowColor(type: DropType): number {
    switch (type) {
      case 'gold': return 0xffd700;
      case 'material': return 0x88ff88;
      case 'health': return 0xff4444;
      case 'power': return 0xff8800;
      case 'speed': return 0x00ffff;
      default: return 0xffffff;
    }
  }

  /**
   * Activate power buff
   */
  private activatePowerBuff(): void {
    this.powerBuffActive = true;
    this.powerBuffEndTime = this.scene.time.now + SUPPLY_DROP.REWARDS.power.duration;
  }

  /**
   * Activate speed buff
   */
  private activateSpeedBuff(): void {
    this.speedBuffActive = true;
    this.speedBuffEndTime = this.scene.time.now + SUPPLY_DROP.REWARDS.speed.duration;
    
    // Apply speed boost to player
    this.player.applySpeedMultiplier(SUPPLY_DROP.REWARDS.speed.multiplier);
  }

  /**
   * Update active buffs
   */
  private updateBuffs(): void {
    const now = this.scene.time.now;
    
    if (this.powerBuffActive && now >= this.powerBuffEndTime) {
      this.powerBuffActive = false;
      this.showNotification('⚔️ Power boost ended', 0x888888);
    }
    
    if (this.speedBuffActive && now >= this.speedBuffEndTime) {
      this.speedBuffActive = false;
      this.player.applySpeedMultiplier(1.0); // Reset speed
      this.showNotification('💨 Speed boost ended', 0x888888);
    }
  }

  /**
   * Show notification via callback
   */
  private showNotification(message: string, color: number): void {
    this.onShowNotification?.(message, color);
  }

  // === Public Getters ===

  /**
   * Get power damage multiplier (for combat systems)
   */
  public getPowerMultiplier(): number {
    return this.powerBuffActive ? SUPPLY_DROP.REWARDS.power.multiplier : 1.0;
  }

  /**
   * Check if power buff is active
   */
  public isPowerBuffActive(): boolean {
    return this.powerBuffActive;
  }

  /**
   * Check if speed buff is active
   */
  public isSpeedBuffActive(): boolean {
    return this.speedBuffActive;
  }

  /**
   * Get all drops for minimap display
   */
  public getDrops(): { x: number; y: number; collected: boolean }[] {
    return this.drops.map(drop => ({
      x: drop.x,
      y: drop.y,
      collected: drop.collected,
    }));
  }

  // === Callback Setters ===

  public setOnGoldCollected(callback: (amount: number) => void): void {
    this.onGoldCollected = callback;
  }

  public setOnMaterialCollected(callback: (amount: number) => void): void {
    this.onMaterialCollected = callback;
  }

  public setOnHealthCollected(callback: (amount: number) => void): void {
    this.onHealthCollected = callback;
  }

  public setOnShowNotification(callback: (message: string, color: number) => void): void {
    this.onShowNotification = callback;
  }
}
