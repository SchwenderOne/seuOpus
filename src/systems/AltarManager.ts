import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { DEPTH, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../config/Constants';

/**
 * Buff types that altars can provide
 */
export enum AltarBuffType {
  HEAL = 'heal',
  DAMAGE_BOOST = 'damage_boost',
  SPEED_BOOST = 'speed_boost',
  SHIELD = 'shield',
  XP_BOOST = 'xp_boost',
  MAGNET = 'magnet',
}

/**
 * Buff definition
 */
interface AltarBuff {
  type: AltarBuffType;
  name: string;
  description: string;
  icon: string;
  color: number;
  duration?: number; // ms, undefined = instant
  value: number;
}

/**
 * Available altar buffs
 */
const ALTAR_BUFFS: AltarBuff[] = [
  {
    type: AltarBuffType.HEAL,
    name: 'Divine Healing',
    description: 'Restore 50% HP',
    icon: '❤️',
    color: 0xff4444,
    value: 0.5, // 50% of max HP
  },
  {
    type: AltarBuffType.DAMAGE_BOOST,
    name: 'Warrior\'s Fury',
    description: '+50% damage for 30s',
    icon: '⚔️',
    color: 0xff6600,
    duration: 30000,
    value: 1.5, // 50% increase
  },
  {
    type: AltarBuffType.SPEED_BOOST,
    name: 'Swift Steps',
    description: '+30% speed for 20s',
    icon: '💨',
    color: 0x00ff88,
    duration: 20000,
    value: 1.3, // 30% increase
  },
  {
    type: AltarBuffType.SHIELD,
    name: 'Divine Protection',
    description: 'Immunity for 5s',
    icon: '🛡️',
    color: 0x4488ff,
    duration: 5000,
    value: 1,
  },
  {
    type: AltarBuffType.XP_BOOST,
    name: 'Wisdom',
    description: '+100% XP for 45s',
    icon: '📚',
    color: 0xaa44ff,
    duration: 45000,
    value: 2, // Double XP
  },
  {
    type: AltarBuffType.MAGNET,
    name: 'Magnetic Aura',
    description: 'Attract all XP gems',
    icon: '🧲',
    color: 0xffff00,
    value: 1,
  },
];

/**
 * Altar sprite with interaction data
 */
interface Altar extends Phaser.Physics.Arcade.Sprite {
  isActivated: boolean;
  buff: AltarBuff;
  glowEffect?: Phaser.GameObjects.Arc;
  interactionRange: number;
  // Channeling progress (player must stand in radius for a duration)
  channelProgress: number;
  channelBar?: Phaser.GameObjects.Graphics;
  channelText?: Phaser.GameObjects.Text;
}

/**
 * AltarManager - Spawns and manages interactive altars that provide buffs
 */
export class AltarManager {
  private scene: Phaser.Scene;
  private player: Player;
  private altars: Phaser.GameObjects.Group;
  private activeBuffs: Map<AltarBuffType, { endTime: number; value: number }> = new Map();
  
  // Spawn configuration
  private spawnInterval: number = 60000; // Spawn altar every 60 seconds
  private timeSinceLastSpawn: number = 30000; // Start with some time so first altar spawns at 30s
  private maxAltars: number = 2;
  private interactionRange: number = 60;
  
  // Channeling configuration (player must stand in altar radius for this duration)
  private channelDuration: number = 2500; // 2.5 seconds to activate
  
  // Callbacks
  private onBuffApplied?: (buff: AltarBuff) => void;
  private onMagnetActivated?: () => void;
  private onShowNotification?: (message: string, color: number, icon: string) => void;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    
    this.altars = this.scene.add.group();
    
    // Create altar animations if not exists
    this.createAnimations();
  }

  private createAnimations(): void {
    if (!this.scene.anims.exists('altar_idle')) {
      this.scene.anims.create({
        key: 'altar_idle',
        frames: this.scene.anims.generateFrameNumbers('altar_idle', { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1,
      });
    }

    if (!this.scene.anims.exists('altar_start')) {
      this.scene.anims.create({
        key: 'altar_start',
        frames: this.scene.anims.generateFrameNumbers('altar_start', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: 0,
      });
    }
  }

  /**
   * Update altars each frame
   */
  public update(delta: number): void {
    this.timeSinceLastSpawn += delta;
    
    // Try to spawn new altar
    if (this.timeSinceLastSpawn >= this.spawnInterval && this.altars.getLength() < this.maxAltars) {
      this.spawnAltar();
      this.timeSinceLastSpawn = 0;
    }
    
    // Check player proximity to altars
    this.checkAltarInteraction();
    
    // Update active buffs (remove expired ones)
    this.updateActiveBuffs();
  }

  private spawnAltar(): void {
    // Find spawn position away from player but within map
    const spawnPos = this.getSpawnPosition();
    if (!spawnPos) return;

    // Select random buff
    const buff = ALTAR_BUFFS[Math.floor(Math.random() * ALTAR_BUFFS.length)];

    // Create altar sprite
    const altar = this.scene.physics.add.sprite(spawnPos.x, spawnPos.y, 'altar_idle') as Altar;
    altar.setDepth(DEPTH.ITEMS);
    altar.setScale(1.2);
    altar.setScrollFactor(1); // Ensure it scrolls with camera
    altar.play('altar_idle');
    
    // Set altar properties
    altar.isActivated = false;
    altar.buff = buff;
    altar.interactionRange = this.interactionRange;
    altar.channelProgress = 0; // Initialize channel progress
    
    // Add glow effect
    const glow = this.scene.add.circle(spawnPos.x, spawnPos.y + 8, 30, buff.color, 0.2);
    glow.setDepth(DEPTH.ITEMS - 1);
    glow.setScrollFactor(1); // Ensure it scrolls with camera
    altar.glowEffect = glow;
    
    // Animate glow
    this.scene.tweens.add({
      targets: glow,
      alpha: { from: 0.2, to: 0.4 },
      scale: { from: 1, to: 1.2 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });
    
    this.altars.add(altar);
    
    // Show spawn notification
    this.showAltarSpawnNotification(buff);
  }

  private getSpawnPosition(): { x: number; y: number } | null {
    const playerX = this.player.x;
    const playerY = this.player.y;
    
    // Try multiple times to find valid position
    for (let attempt = 0; attempt < 10; attempt++) {
      // Spawn 200-400 pixels from player
      const distance = 200 + Math.random() * 200;
      const angle = Math.random() * Math.PI * 2;
      
      const x = playerX + Math.cos(angle) * distance;
      const y = playerY + Math.sin(angle) * distance;
      
      // Check bounds (with margin)
      const margin = TILE_SIZE * 3;
      if (x > margin && x < MAP_WIDTH - margin && y > margin && y < MAP_HEIGHT - margin) {
        return { x, y };
      }
    }
    
    return null;
  }

  private checkAltarInteraction(): void {
    this.altars.getChildren().forEach((obj) => {
      const altar = obj as Altar;
      
      if (altar.isActivated) return;
      
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        altar.x, altar.y
      );
      
      if (distance < altar.interactionRange) {
        // Player is in range - update channel progress
        const delta = this.scene.game.loop.delta;
        altar.channelProgress += delta;
        
        // Update visual progress indicator
        this.updateChannelProgress(altar);
        
        // Check if channeling complete
        if (altar.channelProgress >= this.channelDuration) {
          this.activateAltar(altar);
        }
      } else {
        // Player left range - reset progress
        if (altar.channelProgress > 0) {
          altar.channelProgress = 0;
          this.updateChannelProgress(altar);
        }
      }
    });
  }

  /**
   * Update the channel progress bar visual
   */
  private updateChannelProgress(altar: Altar): void {
    const progress = altar.channelProgress / this.channelDuration;
    
    // Create channel bar if doesn't exist
    if (!altar.channelBar) {
      altar.channelBar = this.scene.add.graphics();
      altar.channelBar.setDepth(DEPTH.UI);
      altar.channelBar.setScrollFactor(1);
      
      altar.channelText = this.scene.add.text(altar.x, altar.y - 50, 'Stand still...', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(DEPTH.UI).setScrollFactor(1);
    }
    
    // Clear and redraw
    altar.channelBar.clear();
    
    if (progress > 0 && progress < 1) {
      // Show progress bar
      altar.channelBar.setVisible(true);
      altar.channelText?.setVisible(true);
      
      const barWidth = 60;
      const barHeight = 8;
      const x = altar.x - barWidth / 2;
      const y = altar.y - 40;
      
      // Background
      altar.channelBar.fillStyle(0x000000, 0.7);
      altar.channelBar.fillRoundedRect(x - 2, y - 2, barWidth + 4, barHeight + 4, 4);
      
      // Progress fill
      altar.channelBar.fillStyle(altar.buff.color, 1);
      altar.channelBar.fillRoundedRect(x, y, barWidth * progress, barHeight, 3);
      
      // Border
      altar.channelBar.lineStyle(2, 0xffffff, 0.5);
      altar.channelBar.strokeRoundedRect(x - 2, y - 2, barWidth + 4, barHeight + 4, 4);
      
      // Update text
      const remaining = Math.ceil((this.channelDuration - altar.channelProgress) / 1000);
      altar.channelText?.setText(`${altar.buff.icon} ${remaining}s`);
    } else {
      // Hide when not channeling or complete
      altar.channelBar.setVisible(false);
      altar.channelText?.setVisible(false);
    }
  }

  private activateAltar(altar: Altar): void {
    altar.isActivated = true;
    
    // Clean up channel bar and text
    altar.channelBar?.destroy();
    altar.channelText?.destroy();
    
    // Play activation animation
    altar.play('altar_start');
    
    // Apply buff
    this.applyBuff(altar.buff);
    
    // Visual feedback
    this.createActivationEffect(altar.x, altar.y, altar.buff.color);
    
    // Callback
    if (this.onBuffApplied) {
      this.onBuffApplied(altar.buff);
    }
    
    // Special handling for magnet
    if (altar.buff.type === AltarBuffType.MAGNET && this.onMagnetActivated) {
      this.onMagnetActivated();
    }
    
    // Remove altar after animation
    altar.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      // Fade out
      this.scene.tweens.add({
        targets: [altar, altar.glowEffect],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          altar.glowEffect?.destroy();
          altar.destroy();
        }
      });
    });
  }

  private applyBuff(buff: AltarBuff): void {
    switch (buff.type) {
      case AltarBuffType.HEAL:
        const healAmount = Math.floor(this.player.maxHealth * buff.value);
        this.player.heal(healAmount);
        break;
        
      case AltarBuffType.DAMAGE_BOOST:
      case AltarBuffType.SPEED_BOOST:
      case AltarBuffType.SHIELD:
      case AltarBuffType.XP_BOOST:
        // Store timed buff
        if (buff.duration) {
          this.activeBuffs.set(buff.type, {
            endTime: this.scene.time.now + buff.duration,
            value: buff.value,
          });
        }
        break;
        
      case AltarBuffType.MAGNET:
        // Instant effect, handled by callback
        break;
    }
    
    // Show buff notification
    this.showBuffNotification(buff);
  }

  private updateActiveBuffs(): void {
    const now = this.scene.time.now;
    
    this.activeBuffs.forEach((data, type) => {
      if (now >= data.endTime) {
        this.activeBuffs.delete(type);
        this.showBuffExpiredNotification(type);
      }
    });
  }

  private createActivationEffect(x: number, y: number, color: number): void {
    // Particle burst
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const particle = this.scene.add.circle(x, y, 4, color, 1);
      particle.setDepth(DEPTH.EFFECTS);
      particle.setScrollFactor(1); // Ensure it scrolls with camera
      
      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 60,
        y: y + Math.sin(angle) * 60,
        alpha: 0,
        scale: 0.5,
        duration: 500,
        onComplete: () => particle.destroy()
      });
    }
    
    // Central flash
    const flash = this.scene.add.circle(x, y, 40, color, 0.8);
    flash.setDepth(DEPTH.EFFECTS);
    flash.setScrollFactor(1); // Ensure it scrolls with camera
    this.scene.tweens.add({
      targets: flash,
      scale: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy()
    });
  }

  private showAltarSpawnNotification(buff: AltarBuff): void {
    const screenWidth = this.scene.scale.width;
    const notification = this.scene.add.text(
      screenWidth / 2,
      100,
      `${buff.icon} Altar appeared! ${buff.icon}`,
      {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: `#${buff.color.toString(16).padStart(6, '0')}`,
        stroke: '#000000',
        strokeThickness: 3,
      }
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.UI + 5);

    this.scene.tweens.add({
      targets: notification,
      alpha: 0,
      y: 80,
      duration: 2000,
      delay: 1500,
      onComplete: () => notification.destroy()
    });
  }

  private showBuffNotification(buff: AltarBuff): void {
    const durationText = buff.duration ? ` (${buff.duration / 1000}s)` : '';
    const message = `${buff.name}${durationText}\n${buff.description}`;
    
    // Use callback if set (will display on UI layer)
    if (this.onShowNotification) {
      this.onShowNotification(message, buff.color, buff.icon);
      return;
    }
    
    // Fallback: show notification directly (won't be on UI layer)
    const screenWidth = this.scene.scale.width;
    const notification = this.scene.add.text(
      screenWidth / 2,
      150,
      `${buff.icon} ${message}`,
      {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center',
      }
    )
      .setOrigin(0.5)
      .setDepth(DEPTH.UI + 5);

    this.scene.tweens.add({
      targets: notification,
      alpha: 0,
      y: 130,
      duration: 2500,
      delay: 1000,
      onComplete: () => notification.destroy()
    });
  }

  private showBuffExpiredNotification(type: AltarBuffType): void {
    const buff = ALTAR_BUFFS.find(b => b.type === type);
    if (!buff) return;

    const screenWidth = this.scene.scale.width;
    const notification = this.scene.add.text(
      screenWidth / 2,
      120,
      `${buff.icon} ${buff.name} expired`,
      {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#888888',
        stroke: '#000000',
        strokeThickness: 2,
      }
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.UI + 5);

    this.scene.tweens.add({
      targets: notification,
      alpha: 0,
      duration: 1500,
      onComplete: () => notification.destroy()
    });
  }

  // === Public API for buff checks ===

  /**
   * Check if a buff is currently active
   */
  public hasActiveBuff(type: AltarBuffType): boolean {
    return this.activeBuffs.has(type);
  }

  /**
   * Get the multiplier for a buff type (1.0 if not active)
   */
  public getBuffMultiplier(type: AltarBuffType): number {
    const buff = this.activeBuffs.get(type);
    return buff ? buff.value : 1.0;
  }

  /**
   * Check if player has shield buff (immunity)
   */
  public hasShield(): boolean {
    return this.hasActiveBuff(AltarBuffType.SHIELD);
  }

  /**
   * Get damage multiplier from buff
   */
  public getDamageMultiplier(): number {
    return this.getBuffMultiplier(AltarBuffType.DAMAGE_BOOST);
  }

  /**
   * Get speed multiplier from buff
   */
  public getSpeedMultiplier(): number {
    return this.getBuffMultiplier(AltarBuffType.SPEED_BOOST);
  }

  /**
   * Get XP multiplier from buff
   */
  public getXPMultiplier(): number {
    return this.getBuffMultiplier(AltarBuffType.XP_BOOST);
  }

  /**
   * Set callback for when buff is applied
   */
  public setOnBuffApplied(callback: (buff: AltarBuff) => void): void {
    this.onBuffApplied = callback;
  }

  /**
   * Set callback for magnet effect (attract all XP)
   */
  public setOnMagnetActivated(callback: () => void): void {
    this.onMagnetActivated = callback;
  }

  /**
   * Get altars group for collision detection
   */
  public getAltars(): Phaser.GameObjects.Group {
    return this.altars;
  }

  /**
   * Set callback for showing notifications on UI layer
   */
  public setOnShowNotification(callback: (message: string, color: number, icon: string) => void): void {
    this.onShowNotification = callback;
  }
}
