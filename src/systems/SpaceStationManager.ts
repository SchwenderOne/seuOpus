import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { 
  DEPTH, 
  TILE_SIZE, 
  MAP_WIDTH, 
  MAP_HEIGHT,
  SPACE_STATION 
} from '../config/Constants';

/**
 * Material types that can be collected for station upgrades
 */
export type MaterialType = 'chest' | 'junk' | 'slob';

/**
 * Materials collected by type
 */
export interface MaterialCounts {
  chest: number;
  junk: number;
  slob: number;
  total: number;
}

/**
 * Lingering buff types that persist after leaving the station
 */
export type LingeringBuffType = 'damage' | 'xp' | 'fireRate' | 'speed' | 'regen';

/**
 * A lingering buff that persists after leaving the safe zone
 */
export interface LingeringBuff {
  type: LingeringBuffType;
  multiplier: number;
  remainingTime: number;
  maxDuration: number;
}

/**
 * Module types for horizontal progression
 */
export type ModuleType = 'shield' | 'medical' | 'power' | 'sensor';

/**
 * Module tier levels (0 = not unlocked, 1-3 = tier levels)
 */
export interface ModuleTiers {
  shield: number;
  medical: number;
  power: number;
  sensor: number;
}

/**
 * Active buffs state for UI display
 */
export interface ActiveBuffsState {
  sanctuaryShieldReady: boolean;
  sanctuaryShieldCooldown: number;
  lingeringBuffs: LingeringBuff[];
  insideZone: boolean;
}

/**
 * Material sprite with collection data
 */
interface Material extends Phaser.Physics.Arcade.Sprite {
  materialType: MaterialType;
  collect: () => number;
}

/**
 * SpaceStationManager - Manages the space station safe zone and upgrades
 * 
 * Features:
 * - Station spawns at random location on map start
 * - Visual protection radius that pulses
 * - Enemies stop chasing when player is inside radius
 * - Materials spawn on map for upgrades
 * - Upgrade system with gold + materials + time
 * - Benefits stack with each level
 */
export class SpaceStationManager {
  private scene: Phaser.Scene;
  private player: Player;
  
  // Station state
  private stationLevel: number = 1;
  private stationSprite!: Phaser.GameObjects.Image;
  private stationX: number = 0;
  private stationY: number = 0;
  private protectionRadius!: Phaser.GameObjects.Graphics;
  private radiusGlow!: Phaser.GameObjects.Arc;
  
  // Materials
  private materials: Phaser.GameObjects.Group;
  private collectedMaterials: number = 0;
  private materialsByType: { chest: number; junk: number; slob: number } = { chest: 0, junk: 0, slob: 0 };
  private timeSinceLastMaterialSpawn: number = 10000; // Spawn first material after 10s
  
  // Station UI Panel (shown when near station)
  private stationPanel: Phaser.GameObjects.Container | null = null;
  private panelBg: Phaser.GameObjects.Rectangle | null = null;
  private panelTitleText: Phaser.GameObjects.Text | null = null;
  private panelLevelText: Phaser.GameObjects.Text | null = null;
  private panelMaterialsText: Phaser.GameObjects.Text | null = null;
  private panelBenefitsText: Phaser.GameObjects.Text | null = null;
  private panelUpgradeText: Phaser.GameObjects.Text | null = null;
  private panelStarsContainer: Phaser.GameObjects.Container | null = null;
  private isPanelVisible: boolean = false;
  
  // Upgrade state
  private isUpgrading: boolean = false;
  private upgradeStartTime: number = 0;
  private upgradeProgressBar: Phaser.GameObjects.Graphics | null = null;
  private upgradeProgressBg: Phaser.GameObjects.Rectangle | null = null;
  private upgradeText: Phaser.GameObjects.Text | null = null;
  
  // Player state tracking
  private playerInsideRadius: boolean = false;
  private hpRegenAccumulator: number = 0;
  
  // Lingering buff system (buffs that persist after leaving the zone)
  private lingeringBuffs: LingeringBuff[] = [];
  
  // Sanctuary Shield (Level 2 benefit)
  private sanctuaryShieldAmount: number = 0;
  private sanctuaryShieldCooldownEnd: number = 0;
  
  // Station Modules (horizontal progression)
  private moduleTiers: ModuleTiers = {
    shield: 0,
    medical: 0,
    power: 0,
    sensor: 0
  };
  
  // Module UI elements (reserved for future expanded UI)
  // private modulePanel: Phaser.GameObjects.Container | null = null;
  // private moduleButtons: Map<ModuleType, Phaser.GameObjects.Container> = new Map();
  
  // Callbacks
  private onPlayerEnterRadius?: () => void;
  private onPlayerLeaveRadius?: () => void;
  private onMaterialCollected?: (total: number, type: MaterialType) => void;
  private onUpgradeStart?: () => void;
  private onUpgradeComplete?: (newLevel: number) => void;
  private onShowNotification?: (message: string, color: number) => void;
  private getSessionGold?: () => number;
  private spendSessionGold?: (amount: number) => boolean;
  private getEnemiesGroup?: () => Phaser.GameObjects.Group;
  
  
  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    
    // Create materials group
    this.materials = this.scene.add.group();
    
    // Spawn station at random position
    this.spawnStation();
    
    // Set up E key for upgrades
    this.setupUpgradeKey();
  }

  /**
   * Spawn the space station at a random valid position
   */
  private spawnStation(): void {
    // Find a position away from player spawn but within map bounds
    const margin = TILE_SIZE * 5;
    const playerSpawnX = this.player.x;
    const playerSpawnY = this.player.y;
    
    let attempts = 0;
    let validPosition = false;
    
    while (!validPosition && attempts < 50) {
      // Random position within map bounds
      this.stationX = margin + Math.random() * (MAP_WIDTH - margin * 2);
      this.stationY = margin + Math.random() * (MAP_HEIGHT - margin * 2);
      
      // Check distance from player spawn (at least 200px away)
      const distFromPlayer = Phaser.Math.Distance.Between(
        playerSpawnX, playerSpawnY,
        this.stationX, this.stationY
      );
      
      if (distFromPlayer > 200 && distFromPlayer < 600) {
        validPosition = true;
      }
      attempts++;
    }
    
    // Create station sprite
    this.stationSprite = this.scene.add.image(
      this.stationX, 
      this.stationY, 
      `space_station_${this.stationLevel}`
    );
    this.stationSprite.setDepth(DEPTH.STATION);
    this.stationSprite.setScale(0.72); // 6x larger than previous 0.12 scale
    
    // Create protection radius visualization
    this.createProtectionRadius();
    
    // Show station spawn notification
    this.showNotification('🛸 Space Station detected! Safe zone active.', 0x00ffff);
  }

  /**
   * Create the visual protection radius around the station
   */
  private createProtectionRadius(): void {
    const radius = this.getCurrentRadius();
    
    // Outer glow circle
    this.radiusGlow = this.scene.add.circle(
      this.stationX, 
      this.stationY, 
      radius, 
      0x00ffff, 
      0.1
    );
    this.radiusGlow.setDepth(DEPTH.SHADOWS);
    
    // Protection radius outline
    this.protectionRadius = this.scene.add.graphics();
    this.protectionRadius.setDepth(DEPTH.SHADOWS);
    this.drawProtectionRadius();
    
    // Animate the glow
    this.scene.tweens.add({
      targets: this.radiusGlow,
      alpha: { from: 0.1, to: 0.25 },
      scale: { from: 1, to: 1.05 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Draw the protection radius circle outline
   */
  private drawProtectionRadius(): void {
    const radius = this.getCurrentRadius();
    const color = this.isUpgrading ? 0xff4400 : 0x00ffff;
    const alpha = this.isUpgrading ? 0.3 : 0.5;
    
    this.protectionRadius.clear();
    this.protectionRadius.lineStyle(3, color, alpha);
    this.protectionRadius.strokeCircle(this.stationX, this.stationY, radius);
    
    // Draw dashed inner circle
    this.protectionRadius.lineStyle(1, color, alpha * 0.5);
    this.protectionRadius.strokeCircle(this.stationX, this.stationY, radius * 0.7);
  }

  /**
   * Get current protection radius based on station level
   */
  public getCurrentRadius(): number {
    return SPACE_STATION.BASE_RADIUS + (this.stationLevel - 1) * SPACE_STATION.RADIUS_PER_LEVEL;
  }

  /**
   * Update the manager each frame
   */
  public update(delta: number): void {
    // Handle upgrade progress
    if (this.isUpgrading) {
      this.updateUpgradeProgress();
    }
    
    // Check player position relative to station
    this.checkPlayerPosition(delta);
    
    // Spawn materials (with module bonus)
    this.updateMaterialSpawning(delta);
    
    // Apply benefits if player is inside
    if (this.playerInsideRadius && !this.isUpgrading) {
      this.applyBenefits(delta);
    }
    
    // Update lingering buffs (countdown timers)
    this.updateLingeringBuffs(delta);
    
    // Apply lingering regen if active
    this.applyLingeringRegen(delta);
    
    // Push enemies out of station radius (enemies can't enter)
    this.pushEnemiesOutOfRadius();
    
    // Update station panel visibility
    this.updateStationPanel();
  }

  /**
   * Update lingering buff timers - decrement and remove expired
   */
  private updateLingeringBuffs(delta: number): void {
    for (let i = this.lingeringBuffs.length - 1; i >= 0; i--) {
      this.lingeringBuffs[i].remainingTime -= delta;
      if (this.lingeringBuffs[i].remainingTime <= 0) {
        const expiredBuff = this.lingeringBuffs.splice(i, 1)[0];
        this.onBuffExpired(expiredBuff.type);
      }
    }
  }

  /**
   * Apply lingering HP regen (from Level 3+ after leaving zone)
   */
  private applyLingeringRegen(delta: number): void {
    if (this.playerInsideRadius) return; // Only applies outside zone
    
    const regenBuff = this.lingeringBuffs.find(b => b.type === 'regen');
    if (!regenBuff) return;
    
    if (this.player.hp < this.player.maxHealth) {
      this.hpRegenAccumulator += delta;
      const regenInterval = 1000;
      
      if (this.hpRegenAccumulator >= regenInterval) {
        const healAmount = Math.ceil(this.player.maxHealth * SPACE_STATION.BENEFITS.HP_REGEN.RATE_LINGERING);
        this.player.heal(healAmount);
        this.hpRegenAccumulator = 0;
        this.createHealEffect(0x88ff88); // Lighter green for lingering
      }
    }
  }

  /**
   * Called when a lingering buff expires
   */
  private onBuffExpired(_type: LingeringBuffType): void {
    // Intentionally silent for now - could add visual/audio feedback here
    // Example: this.showNotification(`${buffName} buff expired`, 0x888888);
  }

  /**
   * Create the station info panel (called once when player first approaches)
   */
  private createStationPanel(): void {
    if (this.stationPanel) return;
    
    const panelWidth = 220;
    const panelHeight = 180;
    
    // Create container at station position
    this.stationPanel = this.scene.add.container(this.stationX, this.stationY - 120);
    this.stationPanel.setDepth(DEPTH.UI - 1);
    
    // Background
    this.panelBg = this.scene.add.rectangle(0, 0, panelWidth, panelHeight, 0x000000, 0.85);
    this.panelBg.setStrokeStyle(2, 0x00ffff);
    this.stationPanel.add(this.panelBg);
    
    // Title
    this.panelTitleText = this.scene.add.text(0, -70, '🛸 SPACE STATION', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#00ffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    this.stationPanel.add(this.panelTitleText);
    
    // Level stars container
    this.panelStarsContainer = this.scene.add.container(0, -48);
    this.stationPanel.add(this.panelStarsContainer);
    
    // Level text
    this.panelLevelText = this.scene.add.text(0, -30, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    this.stationPanel.add(this.panelLevelText);
    
    // Materials text
    this.panelMaterialsText = this.scene.add.text(0, -8, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#88ff88',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    this.stationPanel.add(this.panelMaterialsText);
    
    // Benefits text
    this.panelBenefitsText = this.scene.add.text(0, 25, '', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 1,
      align: 'center',
    }).setOrigin(0.5);
    this.stationPanel.add(this.panelBenefitsText);
    
    // Upgrade prompt text
    this.panelUpgradeText = this.scene.add.text(0, 70, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
    }).setOrigin(0.5);
    this.stationPanel.add(this.panelUpgradeText);
    
    // Start hidden
    this.stationPanel.setVisible(false);
    this.stationPanel.setAlpha(0);
  }

  /**
   * Update the station panel content and visibility
   */
  private updateStationPanel(): void {
    const isNear = this.isPlayerNearStation();
    
    // Create panel if it doesn't exist and player is near
    if (isNear && !this.stationPanel) {
      this.createStationPanel();
    }
    
    if (!this.stationPanel) return;
    
    // Handle visibility transitions
    if (isNear && !this.isPanelVisible) {
      this.isPanelVisible = true;
      this.stationPanel.setVisible(true);
      this.scene.tweens.add({
        targets: this.stationPanel,
        alpha: 1,
        duration: 200,
        ease: 'Power2'
      });
      this.refreshPanelContent();
    } else if (!isNear && this.isPanelVisible) {
      this.isPanelVisible = false;
      this.scene.tweens.add({
        targets: this.stationPanel,
        alpha: 0,
        duration: 200,
        ease: 'Power2',
        onComplete: () => {
          if (this.stationPanel) this.stationPanel.setVisible(false);
        }
      });
    }
    
    // Update content if visible
    if (this.isPanelVisible) {
      this.refreshPanelContent();
    }
  }

  /**
   * Refresh the station panel content
   */
  private refreshPanelContent(): void {
    if (!this.stationPanel) return;
    
    // Update level stars
    if (this.panelStarsContainer) {
      this.panelStarsContainer.removeAll(true);
      for (let i = 1; i <= SPACE_STATION.MAX_LEVEL; i++) {
        const starX = (i - 3) * 22;
        const isFilled = i <= this.stationLevel;
        const star = this.scene.add.text(starX, 0, isFilled ? '★' : '☆', {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: isFilled ? '#ffdd00' : '#444444',
        }).setOrigin(0.5);
        this.panelStarsContainer.add(star);
      }
    }
    
    // Update level text
    if (this.panelLevelText) {
      this.panelLevelText.setText(`Level ${this.stationLevel}/${SPACE_STATION.MAX_LEVEL}`);
    }
    
    // Update materials breakdown
    if (this.panelMaterialsText) {
      const mats = this.materialsByType;
      this.panelMaterialsText.setText(
        `📦 Chest: ${mats.chest}  Junk: ${mats.junk}  Slob: ${mats.slob}`
      );
    }
    
    // Update benefits text
    if (this.panelBenefitsText) {
      const benefits: string[] = [];
      if (this.stationLevel >= 2) benefits.push('🛡️ Shield');
      if (this.stationLevel >= 3) benefits.push('❤️ Regen');
      if (this.stationLevel >= 4) benefits.push('⚔️ Combat');
      if (this.stationLevel >= 5) benefits.push('🔥 Ultimate');
      
      // Show lingering buff status
      const activeBuffs = this.lingeringBuffs.length;
      
      if (benefits.length > 0 || activeBuffs > 0) {
        let text = benefits.length > 0 ? benefits.join(' | ') : '';
        if (activeBuffs > 0) {
          const avgTime = Math.round(
            this.lingeringBuffs.reduce((s, b) => s + b.remainingTime, 0) / activeBuffs / 1000
          );
          text += text ? `\n⚡ ${activeBuffs} buffs (${avgTime}s)` : `⚡ ${activeBuffs} buffs (${avgTime}s)`;
        }
        this.panelBenefitsText.setText(text);
        this.panelBenefitsText.setColor('#00ff88');
      } else {
        this.panelBenefitsText.setText('No active benefits yet');
        this.panelBenefitsText.setColor('#666666');
      }
    }
    
    // Update upgrade prompt
    if (this.panelUpgradeText) {
      if (this.isUpgrading) {
        this.panelUpgradeText.setText('⏳ Upgrading...');
        this.panelUpgradeText.setColor('#ff4400');
      } else if (this.stationLevel >= SPACE_STATION.MAX_LEVEL) {
        this.panelUpgradeText.setText('✓ Maximum Level Reached!');
        this.panelUpgradeText.setColor('#00ff00');
      } else {
        const [goldCost, materialCost] = SPACE_STATION.UPGRADE_COSTS[this.stationLevel];
        const currentGold = this.getSessionGold?.() ?? 0;
        const canUpgrade = currentGold >= goldCost && this.collectedMaterials >= materialCost;
        
        if (canUpgrade) {
          this.panelUpgradeText.setText(`[E] UPGRADE\n💰 ${goldCost} + 📦 ${materialCost}`);
          this.panelUpgradeText.setColor('#00ff00');
        } else {
          this.panelUpgradeText.setText(`Need: 💰 ${currentGold}/${goldCost} 📦 ${this.collectedMaterials}/${materialCost}`);
          this.panelUpgradeText.setColor('#ffaa00');
        }
      }
    }
  }

  /**
   * Push any enemies inside the station radius back outside
   * Uses aggressive collision prevention - teleports ALL intruders out immediately
   * Also creates a buffer zone to prevent high-speed enemies from bursting in
   */
  private pushEnemiesOutOfRadius(): void {
    if (!this.getEnemiesGroup) return;
    
    const enemies = this.getEnemiesGroup();
    const radius = this.getCurrentRadius();
    const bufferRadius = radius + 30; // Buffer zone for fast enemies
    const pushForce = 800; // Very strong push force
    
    enemies.getChildren().forEach((obj) => {
      const enemy = obj as Phaser.Physics.Arcade.Sprite;
      if (!enemy.active) return;
      
      const distance = Phaser.Math.Distance.Between(
        enemy.x, enemy.y,
        this.stationX, this.stationY
      );
      
      // If enemy is inside the main radius, immediately teleport them out
      if (distance < radius) {
        // Calculate angle from station to enemy
        let angle = Phaser.Math.Angle.Between(
          this.stationX, this.stationY,
          enemy.x, enemy.y
        );
        
        // Handle edge case where enemy is exactly on station
        if (distance < 10) {
          angle = Math.random() * Math.PI * 2;
        }
        
        // Teleport enemy to just outside the buffer zone
        // Use setPosition() to properly sync physics body with sprite
        const teleportDist = bufferRadius + 10;
        const newX = this.stationX + Math.cos(angle) * teleportDist;
        const newY = this.stationY + Math.sin(angle) * teleportDist;
        enemy.setPosition(newX, newY);
        
        // Stop any momentum and apply strong outward push
        const body = enemy.body as Phaser.Physics.Arcade.Body;
        if (body) {
          body.velocity.x = Math.cos(angle) * pushForce;
          body.velocity.y = Math.sin(angle) * pushForce;
        }
      }
      // If enemy is in buffer zone, apply strong repulsion
      else if (distance < bufferRadius) {
        const angle = Phaser.Math.Angle.Between(
          this.stationX, this.stationY,
          enemy.x, enemy.y
        );
        
        const body = enemy.body as Phaser.Physics.Arcade.Body;
        if (body) {
          // Calculate how far into buffer zone (0-1, where 1 = at radius edge)
          const bufferDepth = 1 - ((distance - radius) / 30);
          const force = pushForce * bufferDepth;
          
          // Override velocity with strong outward push
          body.velocity.x = Math.cos(angle) * force;
          body.velocity.y = Math.sin(angle) * force;
        }
      }
    });
  }

  /**
   * Check if player is inside protection radius
   */
  private checkPlayerPosition(_delta: number): void {
    const distance = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      this.stationX, this.stationY
    );
    
    const radius = this.getCurrentRadius();
    const wasInside = this.playerInsideRadius;
    
    // During upgrade, protection is disabled
    this.playerInsideRadius = !this.isUpgrading && distance < radius;
    
    // Trigger callbacks on state change
    if (this.playerInsideRadius && !wasInside) {
      // Player just entered the zone
      this.onPlayerEnterRadius?.();
      this.onPlayerEnterZone();
    } else if (!this.playerInsideRadius && wasInside) {
      // Player just left the zone
      this.onPlayerLeaveRadius?.();
      this.onPlayerLeaveZone();
      this.hpRegenAccumulator = 0; // Reset regen accumulator
    }
  }

  /**
   * Called when player enters the safe zone
   * Triggers Sanctuary Shield (Level 2+) and emergency heal (Medical Bay Tier 2)
   */
  private onPlayerEnterZone(): void {
    const now = this.scene.time.now;
    
    // Level 2+: Sanctuary Shield
    if (this.stationLevel >= 2 && now >= this.sanctuaryShieldCooldownEnd) {
      const shieldPercent = SPACE_STATION.BENEFITS.SANCTUARY_SHIELD.PERCENT;
      // Add shield bonus from Shield Generator module
      const shieldBonus = this.moduleTiers.shield >= 2 
        ? SPACE_STATION.MODULES.SHIELD.EFFECTS.TIER_2.SHIELD_BONUS 
        : 0;
      const totalShield = shieldPercent + shieldBonus;
      
      this.sanctuaryShieldAmount = Math.ceil(this.player.maxHealth * totalShield);
      // Note: Shield should be applied via Player class - for now we heal
      // In a full implementation, Player would have a shield system
      this.player.heal(this.sanctuaryShieldAmount);
      
      this.sanctuaryShieldCooldownEnd = now + SPACE_STATION.BENEFITS.SANCTUARY_SHIELD.COOLDOWN;
      this.showNotification(`🛡️ Sanctuary Shield: +${this.sanctuaryShieldAmount} HP`, 0x00ffff);
      this.createShieldEffect();
    }
    
    // Medical Bay Tier 2: Emergency heal when entering below threshold
    if (this.moduleTiers.medical >= 2) {
      const threshold = SPACE_STATION.MODULES.MEDICAL.EFFECTS.TIER_2.EMERGENCY_HEAL_THRESHOLD;
      const healAmount = SPACE_STATION.MODULES.MEDICAL.EFFECTS.TIER_2.EMERGENCY_HEAL_AMOUNT;
      
      if (this.player.hp < this.player.maxHealth * threshold) {
        const heal = Math.ceil(this.player.maxHealth * healAmount);
        this.player.heal(heal);
        this.showNotification(`🏥 Emergency Heal: +${heal} HP`, 0xff88ff);
        this.createHealEffect(0xff88ff);
      }
    }
  }

  /**
   * Called when player leaves the safe zone
   * Grants lingering buffs based on station level and modules
   */
  private onPlayerLeaveZone(): void {
    // Clear any existing lingering buffs (refresh them)
    this.lingeringBuffs = [];
    
    // Calculate duration bonuses from Power Core module
    const durationBonus = this.moduleTiers.power >= 1 
      ? SPACE_STATION.MODULES.POWER.EFFECTS.TIER_1.BUFF_DURATION_BONUS 
      : 0;
    
    // Level 3+: Lingering HP Regen
    if (this.stationLevel >= 3) {
      let regenDuration = SPACE_STATION.BENEFITS.HP_REGEN.LINGER_DURATION;
      // Medical Bay Tier 3 extends regen duration
      if (this.moduleTiers.medical >= 3) {
        regenDuration += SPACE_STATION.MODULES.MEDICAL.EFFECTS.TIER_3.LINGER_DURATION_BONUS;
      }
      
      this.lingeringBuffs.push({
        type: 'regen',
        multiplier: 1.0,
        remainingTime: regenDuration + durationBonus,
        maxDuration: regenDuration + durationBonus
      });
    }
    
    // Level 4+: Combat Buffs (Damage + XP)
    if (this.stationLevel >= 4) {
      const combatDuration = SPACE_STATION.BENEFITS.COMBAT_BUFFS.DURATION + durationBonus;
      let damageBoost = SPACE_STATION.BENEFITS.COMBAT_BUFFS.DAMAGE_BOOST;
      
      // Power Core Tier 2 increases damage bonus
      if (this.moduleTiers.power >= 2) {
        damageBoost += SPACE_STATION.MODULES.POWER.EFFECTS.TIER_2.DAMAGE_BONUS;
      }
      
      this.lingeringBuffs.push({
        type: 'damage',
        multiplier: damageBoost,
        remainingTime: combatDuration,
        maxDuration: combatDuration
      });
      
      this.lingeringBuffs.push({
        type: 'xp',
        multiplier: SPACE_STATION.BENEFITS.COMBAT_BUFFS.XP_BOOST,
        remainingTime: combatDuration,
        maxDuration: combatDuration
      });
    }
    
    // Level 5: Ultimate Buffs (Fire Rate + Speed)
    if (this.stationLevel >= 5) {
      const ultimateDuration = SPACE_STATION.BENEFITS.ULTIMATE_BUFFS.DURATION + durationBonus;
      
      this.lingeringBuffs.push({
        type: 'fireRate',
        multiplier: SPACE_STATION.BENEFITS.ULTIMATE_BUFFS.FIRE_RATE_BOOST,
        remainingTime: ultimateDuration,
        maxDuration: ultimateDuration
      });
      
      this.lingeringBuffs.push({
        type: 'speed',
        multiplier: SPACE_STATION.BENEFITS.ULTIMATE_BUFFS.SPEED_BOOST,
        remainingTime: ultimateDuration,
        maxDuration: ultimateDuration
      });
    }
    
    // Show buff notification if any buffs granted
    if (this.lingeringBuffs.length > 0) {
      const buffCount = this.lingeringBuffs.length;
      const avgDuration = Math.round(
        this.lingeringBuffs.reduce((sum, b) => sum + b.maxDuration, 0) / buffCount / 1000
      );
      this.showNotification(`⚡ ${buffCount} buffs active for ~${avgDuration}s!`, 0xffff00);
    }
  }

  /**
   * Create sanctuary shield visual effect
   */
  private createShieldEffect(): void {
    // Create expanding shield ring around player
    const ring = this.scene.add.circle(
      this.player.x,
      this.player.y,
      30,
      0x00ffff,
      0.6
    );
    ring.setDepth(DEPTH.EFFECTS);
    ring.setStrokeStyle(3, 0x00ffff, 1);
    ring.setScrollFactor(1);
    
    this.scene.tweens.add({
      targets: ring,
      radius: 60,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => ring.destroy()
    });
  }

  /**
   * Apply station benefits to player (while inside zone)
   */
  private applyBenefits(delta: number): void {
    // Level 3+: HP Regeneration inside zone
    if (this.stationLevel >= 3 && this.player.hp < this.player.maxHealth) {
      this.hpRegenAccumulator += delta;
      const regenInterval = 1000; // Check every second
      
      if (this.hpRegenAccumulator >= regenInterval) {
        let regenRate = SPACE_STATION.BENEFITS.HP_REGEN.RATE_INSIDE;
        
        // Medical Bay Tier 1 doubles regen rate
        if (this.moduleTiers.medical >= 1) {
          regenRate *= SPACE_STATION.MODULES.MEDICAL.EFFECTS.TIER_1.REGEN_MULTIPLIER;
        }
        
        const healAmount = Math.ceil(this.player.maxHealth * regenRate);
        this.player.heal(healAmount);
        this.hpRegenAccumulator = 0;
        
        // Visual feedback
        this.createHealEffect();
      }
    }
    
    // Shield Generator Tier 3: Shield regeneration inside zone
    if (this.moduleTiers.shield >= 3 && this.sanctuaryShieldAmount < this.player.maxHealth * 0.25) {
      // Passive shield regen - simplified for now
      // Full implementation would track shield separately from HP
    }
  }

  /**
   * Create visual heal effect on player
   * @param color Optional color override (default green)
   */
  private createHealEffect(color: number = 0x00ff00): void {
    const healParticle = this.scene.add.circle(
      this.player.x, 
      this.player.y - 20, 
      6, 
      color, 
      0.8
    );
    healParticle.setDepth(DEPTH.EFFECTS);
    healParticle.setScrollFactor(1); // Ensure it scrolls with camera
    
    this.scene.tweens.add({
      targets: healParticle,
      y: this.player.y - 50,
      alpha: 0,
      scale: 0.3,
      duration: 500,
      onComplete: () => healParticle.destroy()
    });
  }

  /**
   * Spawn materials on the map
   */
  private updateMaterialSpawning(delta: number): void {
    this.timeSinceLastMaterialSpawn += delta;
    
    if (this.timeSinceLastMaterialSpawn >= SPACE_STATION.MATERIAL_SPAWN_INTERVAL) {
      if (this.materials.getLength() < SPACE_STATION.MAX_MATERIALS_ON_MAP) {
        this.spawnMaterial();
      }
      this.timeSinceLastMaterialSpawn = 0;
    }
  }

  /**
   * Spawn a single material at random position
   */
  private spawnMaterial(): void {
    const types: MaterialType[] = ['chest', 'junk', 'slob'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    // Random position away from player
    const angle = Math.random() * Math.PI * 2;
    const distance = SPACE_STATION.MATERIAL_SPAWN_DISTANCE_MIN + 
      Math.random() * (SPACE_STATION.MATERIAL_SPAWN_DISTANCE_MAX - SPACE_STATION.MATERIAL_SPAWN_DISTANCE_MIN);
    
    let x = this.player.x + Math.cos(angle) * distance;
    let y = this.player.y + Math.sin(angle) * distance;
    
    // Clamp to map bounds
    const margin = TILE_SIZE * 3;
    x = Phaser.Math.Clamp(x, margin, MAP_WIDTH - margin);
    y = Phaser.Math.Clamp(y, margin, MAP_HEIGHT - margin);
    
    // Create material sprite
    const textureKey = `material_${type}`;
    const material = this.scene.physics.add.sprite(x, y, textureKey) as Material;
    material.setDepth(DEPTH.ITEMS);
    material.setScale(0.195); // Visible size (0.15 * 1.3 = 30% larger)
    material.setScrollFactor(1); // Ensure it scrolls with camera
    material.materialType = type;
    
    // Add subtle glow effect with pulsing animation
    const glowColor = this.getMaterialColor(type);
    const glow = this.scene.add.circle(x, y, 20, glowColor, 0.25);
    glow.setDepth(DEPTH.ITEMS - 1);
    glow.setScrollFactor(1); // Ensure it scrolls with camera
    
    // Outer glow ring
    const outerGlow = this.scene.add.circle(x, y, 30, glowColor, 0.15);
    outerGlow.setDepth(DEPTH.ITEMS - 2);
    outerGlow.setScrollFactor(1); // Ensure it scrolls with camera
    
    // Store glow references for cleanup
    (material as any).glow = glow;
    (material as any).outerGlow = outerGlow;
    
    // Add floating animation that moves material AND glows together
    this.scene.tweens.add({
      targets: [material, glow, outerGlow],
      y: y - 10,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    // Animate glow pulse (alpha only, no scale to avoid desync)
    this.scene.tweens.add({
      targets: [glow, outerGlow],
      alpha: { from: 0.15, to: 0.5 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    // Collection method
    material.collect = () => {
      const matType = material.materialType;
      glow.destroy();
      outerGlow.destroy();
      material.destroy();
      this.collectedMaterials++;
      this.materialsByType[matType]++;
      this.onMaterialCollected?.(this.collectedMaterials, matType);
      return 1;
    };
    
    this.materials.add(material);
  }

  /**
   * Get color for material type
   */
  private getMaterialColor(type: MaterialType): number {
    switch (type) {
      case 'chest': return 0xffd700; // Gold
      case 'junk': return 0x888899;  // Silver/gray
      case 'slob': return 0x44ff88;  // Green
      default: return 0xffffff;
    }
  }

  /**
   * Set up E key for station upgrades and module keys
   */
  private setupUpgradeKey(): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;

    // E key for level upgrade
    keyboard.on('keydown-E', () => {
      if (this.canUpgrade() && this.isPlayerNearStation()) {
        this.startUpgrade();
      } else if (this.isPlayerNearStation() && !this.isUpgrading) {
        this.showUpgradeRequirements();
      }
    });

    // Module upgrade keys (1-4)
    keyboard.on('keydown-ONE', () => this.tryUpgradeModule('shield'));
    keyboard.on('keydown-TWO', () => this.tryUpgradeModule('medical'));
    keyboard.on('keydown-THREE', () => this.tryUpgradeModule('power'));
    keyboard.on('keydown-FOUR', () => this.tryUpgradeModule('sensor'));
  }

  /**
   * Try to upgrade a specific module
   */
  private tryUpgradeModule(moduleType: ModuleType): void {
    if (!this.isPlayerNearStation()) return;
    if (this.isUpgrading) return;
    
    // Modules unlock at station level 2
    if (this.stationLevel < SPACE_STATION.MODULES.UNLOCK_LEVEL) {
      this.showNotification(`🔒 Modules unlock at Station Level ${SPACE_STATION.MODULES.UNLOCK_LEVEL}`, 0xffaa00);
      return;
    }
    
    if (this.canUpgradeModule(moduleType)) {
      this.upgradeModule(moduleType);
    } else {
      this.showModuleRequirements(moduleType);
    }
  }

  /**
   * Check if a module can be upgraded
   */
  private canUpgradeModule(moduleType: ModuleType): boolean {
    const currentTier = this.moduleTiers[moduleType];
    if (currentTier >= SPACE_STATION.MODULES.MAX_TIER) return false;
    
    const moduleConfig = this.getModuleConfig(moduleType);
    const cost = moduleConfig.COSTS[currentTier]; // Cost for next tier
    
    if (moduleConfig.MATERIAL_TYPE === 'any') {
      return this.collectedMaterials >= cost;
    } else {
      const matType = moduleConfig.MATERIAL_TYPE as MaterialType;
      return this.materialsByType[matType] >= cost;
    }
  }

  /**
   * Get module configuration from constants
   */
  private getModuleConfig(moduleType: ModuleType) {
    switch (moduleType) {
      case 'shield': return SPACE_STATION.MODULES.SHIELD;
      case 'medical': return SPACE_STATION.MODULES.MEDICAL;
      case 'power': return SPACE_STATION.MODULES.POWER;
      case 'sensor': return SPACE_STATION.MODULES.SENSOR;
    }
  }

  /**
   * Upgrade a module
   */
  private upgradeModule(moduleType: ModuleType): void {
    const currentTier = this.moduleTiers[moduleType];
    const moduleConfig = this.getModuleConfig(moduleType);
    const cost = moduleConfig.COSTS[currentTier];
    
    // Spend materials
    if (moduleConfig.MATERIAL_TYPE === 'any') {
      // Spend from total (distribute across types)
      let remaining = cost;
      for (const type of ['chest', 'junk', 'slob'] as MaterialType[]) {
        const available = this.materialsByType[type];
        const spend = Math.min(available, remaining);
        this.materialsByType[type] -= spend;
        this.collectedMaterials -= spend;
        remaining -= spend;
        if (remaining <= 0) break;
      }
    } else {
      const matType = moduleConfig.MATERIAL_TYPE as MaterialType;
      this.materialsByType[matType] -= cost;
      this.collectedMaterials -= cost;
    }
    
    // Upgrade the module
    this.moduleTiers[moduleType]++;
    const newTier = this.moduleTiers[moduleType];
    
    // Show notification
    const tierNames = ['', 'I', 'II', 'III'];
    const effectDesc = this.getModuleEffectDescription(moduleType, newTier);
    this.showNotification(
      `⬆️ ${moduleConfig.NAME} upgraded to Tier ${tierNames[newTier]}!\n${effectDesc}`,
      0x00ff88
    );
    
    // Visual effect
    this.createModuleUpgradeEffect();
  }

  /**
   * Get description of module effect at tier
   */
  private getModuleEffectDescription(moduleType: ModuleType, tier: number): string {
    switch (moduleType) {
      case 'shield':
        switch (tier) {
          case 1: return '🛡️ +15% damage reduction inside';
          case 2: return '🛡️ +10% Sanctuary Shield capacity';
          case 3: return '🛡️ Shield regenerates inside zone';
        }
        break;
      case 'medical':
        switch (tier) {
          case 1: return '💚 HP regen rate doubled';
          case 2: return '🏥 Emergency heal when entering low HP';
          case 3: return '💚 Lingering regen +5s duration';
        }
        break;
      case 'power':
        switch (tier) {
          case 1: return '⚡ All buff durations +5s';
          case 2: return '⚔️ Damage bonus +10%';
          case 3: return '🩸 3% lifesteal during buffs';
        }
        break;
      case 'sensor':
        switch (tier) {
          case 1: return '📡 Material spawn rate +50%';
          case 2: return '🧲 Magnet range +100% inside';
          case 3: return '🗺️ Materials revealed on minimap';
        }
        break;
    }
    return '';
  }

  /**
   * Show module upgrade requirements
   */
  private showModuleRequirements(moduleType: ModuleType): void {
    const currentTier = this.moduleTiers[moduleType];
    const moduleConfig = this.getModuleConfig(moduleType);
    
    if (currentTier >= SPACE_STATION.MODULES.MAX_TIER) {
      this.showNotification(`✓ ${moduleConfig.NAME} at maximum tier!`, 0x00ff00);
      return;
    }
    
    const cost = moduleConfig.COSTS[currentTier];
    const tierNames = ['I', 'II', 'III'];
    let materialInfo: string;
    
    if (moduleConfig.MATERIAL_TYPE === 'any') {
      materialInfo = `📦 ${this.collectedMaterials}/${cost} any materials`;
    } else {
      const matType = moduleConfig.MATERIAL_TYPE as MaterialType;
      const typeEmoji = matType === 'chest' ? '📦' : matType === 'junk' ? '🔧' : '🧪';
      materialInfo = `${typeEmoji} ${this.materialsByType[matType]}/${cost} ${matType}`;
    }
    
    this.showNotification(
      `${moduleConfig.NAME} → Tier ${tierNames[currentTier]}\n${materialInfo}`,
      0xffaa00
    );
  }

  /**
   * Create visual effect for module upgrade
   */
  private createModuleUpgradeEffect(): void {
    // Create glowing ring effect around station
    const ring = this.scene.add.circle(
      this.stationX,
      this.stationY,
      60,
      0x00ff88,
      0
    );
    ring.setStrokeStyle(3, 0x00ff88, 0.8);
    ring.setDepth(DEPTH.EFFECTS);
    
    this.scene.tweens.add({
      targets: ring,
      radius: 120,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => ring.destroy()
    });
  }

  /**
   * Check if player is close enough to station for interaction
   */
  private isPlayerNearStation(): boolean {
    const distance = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      this.stationX, this.stationY
    );
    return distance < 100;
  }

  /**
   * Check if station can be upgraded
   */
  public canUpgrade(): boolean {
    if (this.stationLevel >= SPACE_STATION.MAX_LEVEL) return false;
    if (this.isUpgrading) return false;
    
    const [goldCost, materialCost] = SPACE_STATION.UPGRADE_COSTS[this.stationLevel];
    const currentGold = this.getSessionGold?.() ?? 0;
    
    return currentGold >= goldCost && this.collectedMaterials >= materialCost;
  }

  /**
   * Show upgrade requirements notification
   */
  private showUpgradeRequirements(): void {
    if (this.stationLevel >= SPACE_STATION.MAX_LEVEL) {
      this.showNotification('🛸 Station at maximum level!', 0x00ff00);
      return;
    }
    
    const [goldCost, materialCost] = SPACE_STATION.UPGRADE_COSTS[this.stationLevel];
    const currentGold = this.getSessionGold?.() ?? 0;
    const upgradeTime = this.getUpgradeTime() / 1000;
    
    const goldOk = currentGold >= goldCost ? '✓' : '✗';
    const matsOk = this.collectedMaterials >= materialCost ? '✓' : '✗';
    
    this.showNotification(
      `Upgrade to Lvl ${this.stationLevel + 1}:\n${goldOk} Gold: ${currentGold}/${goldCost} | ${matsOk} Materials: ${this.collectedMaterials}/${materialCost}\nTime: ${upgradeTime}s`,
      0xffaa00
    );
  }

  /**
   * Get upgrade time for current level
   */
  private getUpgradeTime(): number {
    return SPACE_STATION.BASE_UPGRADE_TIME + (this.stationLevel - 1) * SPACE_STATION.UPGRADE_TIME_PER_LEVEL;
  }

  /**
   * Start the upgrade process
   */
  private startUpgrade(): void {
    const [goldCost, materialCost] = SPACE_STATION.UPGRADE_COSTS[this.stationLevel];
    
    // Spend resources
    this.spendSessionGold?.(goldCost);
    this.collectedMaterials -= materialCost;
    
    this.isUpgrading = true;
    this.upgradeStartTime = this.scene.time.now;
    
    // Update visual to show disabled protection
    this.drawProtectionRadius();
    this.radiusGlow.setFillStyle(0xff4400, 0.1);
    
    // Show upgrade progress UI
    this.showUpgradeProgressUI();
    
    // Trigger callback
    this.onUpgradeStart?.();
    
    const upgradeTime = this.getUpgradeTime() / 1000;
    this.showNotification(`🔧 Upgrading station... (${upgradeTime}s)\n⚠️ Protection disabled!`, 0xff4400);
  }

  /**
   * Show upgrade progress bar
   */
  private showUpgradeProgressUI(): void {
    const barWidth = 120;
    const barHeight = 12;
    
    // Background
    this.upgradeProgressBg = this.scene.add.rectangle(
      this.stationX, 
      this.stationY - 80, 
      barWidth + 4, 
      barHeight + 4, 
      0x000000, 
      0.8
    );
    this.upgradeProgressBg.setDepth(DEPTH.EFFECTS);
    this.upgradeProgressBg.setStrokeStyle(2, 0xff4400);
    
    // Progress bar
    this.upgradeProgressBar = this.scene.add.graphics();
    this.upgradeProgressBar.setDepth(DEPTH.EFFECTS + 1);
    
    // Text
    this.upgradeText = this.scene.add.text(
      this.stationX, 
      this.stationY - 95, 
      `Upgrading to Lvl ${this.stationLevel + 1}`, 
      {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ff4400',
        stroke: '#000000',
        strokeThickness: 2,
      }
    ).setOrigin(0.5).setDepth(DEPTH.EFFECTS + 2);
  }

  /**
   * Update upgrade progress
   */
  private updateUpgradeProgress(): void {
    const elapsed = this.scene.time.now - this.upgradeStartTime;
    const upgradeTime = this.getUpgradeTime();
    const progress = Math.min(elapsed / upgradeTime, 1);
    
    // Update progress bar
    if (this.upgradeProgressBar) {
      const barWidth = 120;
      const barHeight = 12;
      
      this.upgradeProgressBar.clear();
      this.upgradeProgressBar.fillStyle(0xff4400);
      this.upgradeProgressBar.fillRect(
        this.stationX - barWidth / 2,
        this.stationY - 80 - barHeight / 2,
        barWidth * progress,
        barHeight
      );
    }
    
    // Check if upgrade complete
    if (progress >= 1) {
      this.completeUpgrade();
    }
  }

  /**
   * Complete the upgrade
   */
  private completeUpgrade(): void {
    this.isUpgrading = false;
    this.stationLevel++;
    
    // Update station sprite
    this.stationSprite.setTexture(`space_station_${this.stationLevel}`);
    
    // Update protection radius
    this.radiusGlow.setRadius(this.getCurrentRadius());
    this.radiusGlow.setFillStyle(0x00ffff, 0.1);
    this.drawProtectionRadius();
    
    // Clean up progress UI
    this.upgradeProgressBg?.destroy();
    this.upgradeProgressBar?.destroy();
    this.upgradeText?.destroy();
    this.upgradeProgressBg = null;
    this.upgradeProgressBar = null;
    this.upgradeText = null;
    
    // Visual celebration
    this.createUpgradeEffect();
    
    // Show benefit notification
    const benefit = this.getBenefitDescription();
    this.showNotification(`🎉 Station upgraded to Level ${this.stationLevel}!\n${benefit}`, 0x00ff00);
    
    // Trigger callback
    this.onUpgradeComplete?.(this.stationLevel);
  }

  /**
   * Get description of new benefit
   */
  private getBenefitDescription(): string {
    switch (this.stationLevel) {
      case 2: return '🛡️ Sanctuary Shield when entering!';
      case 3: return '❤️ HP Regen + lingering heal after leaving!';
      case 4: return '⚔️ +20% DMG & +30% XP for 12s after leaving!';
      case 5: return '🔥 +15% Fire Rate & +10% Speed after leaving!';
      default: return 'All benefits active!';
    }
  }

  /**
   * Create visual upgrade effect
   */
  private createUpgradeEffect(): void {
    // Expanding ring effect
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.circle(
        this.stationX, 
        this.stationY, 
        50 + i * 30, 
        0x00ff00, 
        0
      );
      ring.setStrokeStyle(4 - i, 0x00ff00, 0.8);
      ring.setDepth(DEPTH.EFFECTS);
      
      this.scene.tweens.add({
        targets: ring,
        radius: this.getCurrentRadius() + 50,
        alpha: 0,
        duration: 800,
        delay: i * 150,
        onComplete: () => ring.destroy()
      });
    }
    
    // Particle burst
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const particle = this.scene.add.circle(
        this.stationX, 
        this.stationY, 
        6, 
        0x00ffff, 
        1
      );
      particle.setDepth(DEPTH.EFFECTS);
      
      this.scene.tweens.add({
        targets: particle,
        x: this.stationX + Math.cos(angle) * 100,
        y: this.stationY + Math.sin(angle) * 100,
        alpha: 0,
        scale: 0.3,
        duration: 600,
        onComplete: () => particle.destroy()
      });
    }
  }

  /**
   * Show notification via callback or fallback
   */
  private showNotification(message: string, color: number): void {
    if (this.onShowNotification) {
      this.onShowNotification(message, color);
    }
  }

  // === Public Getters for Game Systems ===

  /**
   * Check if player is currently inside the protection radius
   */
  public isPlayerInSafeZone(): boolean {
    return this.playerInsideRadius;
  }

  /**
   * Get current station level
   */
  public getStationLevel(): number {
    return this.stationLevel;
  }

  /**
   * Get collected materials count
   */
  public getCollectedMaterials(): number {
    return this.collectedMaterials;
  }

  /**
   * Get damage multiplier from lingering buff (Level 4+)
   * Now checks LINGERING buffs instead of inside-zone status
   */
  public getDamageMultiplier(): number {
    const damageBuff = this.lingeringBuffs.find(b => b.type === 'damage');
    return damageBuff ? damageBuff.multiplier : 1.0;
  }

  /**
   * Get XP multiplier from lingering buff (Level 4+)
   */
  public getXPMultiplier(): number {
    const xpBuff = this.lingeringBuffs.find(b => b.type === 'xp');
    return xpBuff ? xpBuff.multiplier : 1.0;
  }

  /**
   * Get fire rate multiplier from lingering buff (Level 5)
   */
  public getFireRateMultiplier(): number {
    const fireRateBuff = this.lingeringBuffs.find(b => b.type === 'fireRate');
    return fireRateBuff ? fireRateBuff.multiplier : 1.0;
  }

  /**
   * Get speed multiplier from lingering buff (Level 5)
   */
  public getSpeedMultiplier(): number {
    const speedBuff = this.lingeringBuffs.find(b => b.type === 'speed');
    return speedBuff ? speedBuff.multiplier : 1.0;
  }

  /**
   * Check if Sanctuary Shield is available (not on cooldown)
   */
  public isSanctuaryShieldReady(): boolean {
    return this.stationLevel >= 2 && this.scene.time.now >= this.sanctuaryShieldCooldownEnd;
  }

  /**
   * Get remaining Sanctuary Shield cooldown in seconds
   */
  public getSanctuaryShieldCooldown(): number {
    const remaining = this.sanctuaryShieldCooldownEnd - this.scene.time.now;
    return Math.max(0, Math.ceil(remaining / 1000));
  }

  /**
   * Get active buffs state for UI display
   */
  public getActiveBuffsState(): ActiveBuffsState {
    return {
      sanctuaryShieldReady: this.isSanctuaryShieldReady(),
      sanctuaryShieldCooldown: this.getSanctuaryShieldCooldown(),
      lingeringBuffs: [...this.lingeringBuffs],
      insideZone: this.playerInsideRadius
    };
  }

  /**
   * Get module tiers
   */
  public getModuleTiers(): ModuleTiers {
    return { ...this.moduleTiers };
  }

  /**
   * Get station position
   */
  public getStationPosition(): { x: number; y: number } {
    return { x: this.stationX, y: this.stationY };
  }

  /**
   * Check if currently upgrading
   */
  public isCurrentlyUpgrading(): boolean {
    return this.isUpgrading;
  }

  /**
   * Get next upgrade cost
   */
  public getNextUpgradeCost(): { gold: number; materials: number } | null {
    if (this.stationLevel >= SPACE_STATION.MAX_LEVEL) return null;
    const [gold, materials] = SPACE_STATION.UPGRADE_COSTS[this.stationLevel];
    return { gold, materials };
  }

  /**
   * Get materials group for collision detection
   */
  public getMaterials(): Phaser.GameObjects.Group {
    return this.materials;
  }

  /**
   * Get station sprite for camera ignore
   */
  public getStationSprite(): Phaser.GameObjects.Image {
    return this.stationSprite;
  }

  /**
   * Get all visual elements for camera ignore
   */
  public getVisualElements(): Phaser.GameObjects.GameObject[] {
    const elements: Phaser.GameObjects.GameObject[] = [
      this.stationSprite, 
      this.protectionRadius, 
      this.radiusGlow
    ];
    
    // Include station panel if it exists
    if (this.stationPanel) {
      elements.push(this.stationPanel);
    }
    
    return elements;
  }

  /**
   * Get station panel for camera management (may be null)
   */
  public getStationPanel(): Phaser.GameObjects.Container | null {
    return this.stationPanel;
  }

  // === Callback Setters ===

  public setOnPlayerEnterRadius(callback: () => void): void {
    this.onPlayerEnterRadius = callback;
  }

  public setOnPlayerLeaveRadius(callback: () => void): void {
    this.onPlayerLeaveRadius = callback;
  }

  public setOnMaterialCollected(callback: (total: number, type: MaterialType) => void): void {
    this.onMaterialCollected = callback;
  }

  /**
   * Get materials breakdown by type
   */
  public getMaterialsByType(): MaterialCounts {
    return {
      ...this.materialsByType,
      total: this.collectedMaterials
    };
  }

  /**
   * Add materials (used by supply drops)
   */
  public addMaterials(amount: number, type?: MaterialType): void {
    this.collectedMaterials += amount;
    if (type) {
      this.materialsByType[type] += amount;
    } else {
      // Distribute evenly if no type specified
      const types: MaterialType[] = ['chest', 'junk', 'slob'];
      for (let i = 0; i < amount; i++) {
        const t = types[i % types.length];
        this.materialsByType[t]++;
      }
    }
  }

  public setOnUpgradeStart(callback: () => void): void {
    this.onUpgradeStart = callback;
  }

  public setOnUpgradeComplete(callback: (newLevel: number) => void): void {
    this.onUpgradeComplete = callback;
  }

  public setOnShowNotification(callback: (message: string, color: number) => void): void {
    this.onShowNotification = callback;
  }

  public setGoldAccessors(
    getGold: () => number, 
    spendGold: (amount: number) => boolean
  ): void {
    this.getSessionGold = getGold;
    this.spendSessionGold = spendGold;
  }

  public setEnemiesGroup(getEnemies: () => Phaser.GameObjects.Group): void {
    this.getEnemiesGroup = getEnemies;
  }

  /**
   * Check if player can attack (false when in safe zone)
   * Used by projectile and weapon systems to disable firing
   */
  public canPlayerAttack(): boolean {
    // Player cannot attack while inside the safe zone
    return !this.playerInsideRadius;
  }

  /**
   * Clean up all resources on scene shutdown
   * Per Phaser docs: killTweensOf() "Stops all Tweens which affect the given target"
   */
  public destroy(): void {
    // === TWEENS ===
    // Kill tweens on visual elements
    this.scene.tweens.killTweensOf(this.radiusGlow);
    if (this.stationPanel) {
      this.scene.tweens.killTweensOf(this.stationPanel);
    }
    
    // Kill material tweens (materials have attached glow objects)
    this.materials.getChildren().forEach((obj) => {
      this.scene.tweens.killTweensOf(obj);
      const material = obj as any;
      if (material.glow) {
        this.scene.tweens.killTweensOf(material.glow);
        material.glow.destroy();
      }
      if (material.outerGlow) {
        this.scene.tweens.killTweensOf(material.outerGlow);
        material.outerGlow.destroy();
      }
    });
    
    // === GROUPS ===
    // Per Phaser docs: group.destroy(destroyChildren, removeFromScene)
    this.materials.destroy(true, true);
    
    // === VISUAL ELEMENTS ===
    this.stationSprite?.destroy();
    this.protectionRadius?.destroy();
    this.radiusGlow?.destroy();
    this.stationPanel?.destroy(true);
    this.upgradeProgressBg?.destroy();
    this.upgradeProgressBar?.destroy();
    this.upgradeText?.destroy();
    
    // === KEYBOARD LISTENERS ===
    this.scene.input.keyboard?.off('keydown-E');
    this.scene.input.keyboard?.off('keydown-ONE');
    this.scene.input.keyboard?.off('keydown-TWO');
    this.scene.input.keyboard?.off('keydown-THREE');
    this.scene.input.keyboard?.off('keydown-FOUR');
    
    // === CLEAR LINGERING BUFFS ===
    this.lingeringBuffs = [];
    
    // === CLEAR CALLBACKS ===
    this.onPlayerEnterRadius = undefined;
    this.onPlayerLeaveRadius = undefined;
    this.onMaterialCollected = undefined;
    this.onUpgradeStart = undefined;
    this.onUpgradeComplete = undefined;
    this.onShowNotification = undefined;
    this.getSessionGold = undefined;
    this.spendSessionGold = undefined;
    this.getEnemiesGroup = undefined;
  }
}
