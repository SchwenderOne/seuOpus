import Phaser from 'phaser';
import { DEPTH } from '../config/Constants';
import { MetaProgressionManager, Achievement } from './MetaProgressionManager';

/**
 * AchievementTracker - Tracks achievements during gameplay and shows notifications
 */
export class AchievementTracker {
  private scene: Phaser.Scene;
  private metaManager: MetaProgressionManager;
  private notificationQueue: Achievement[] = [];
  private isShowingNotification: boolean = false;
  
  // Run stats for tracking
  private runStats = {
    kills: 0,
    bossKills: 0,
    timeSurvived: 0,
    levelReached: 1,
    weaponsUnlocked: 1,
    weaponsEvolved: 0,
    goldCollected: 0,
    damageTimestamp: 0, // For "untouched" achievement
    upgradesTaken: 0,
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.metaManager = MetaProgressionManager.getInstance();
  }

  /**
   * Reset run stats at start of new run
   */
  public reset(): void {
    this.runStats = {
      kills: 0,
      bossKills: 0,
      timeSurvived: 0,
      levelReached: 1,
      weaponsUnlocked: 1,
      weaponsEvolved: 0,
      goldCollected: 0,
      damageTimestamp: 0,
      upgradesTaken: 0,
    };
  }

  /**
   * Track an enemy kill
   */
  public trackKill(isBoss: boolean = false): void {
    this.runStats.kills++;
    
    if (isBoss) {
      this.runStats.bossKills++;
      this.checkAndUnlock('boss_hunter');
      
      // Check total boss kills
      if (this.metaManager.getData().totalBossKills + this.runStats.bossKills >= 10) {
        this.checkAndUnlock('boss_slayer');
      }
    }
    
    // First blood
    if (this.runStats.kills === 1) {
      this.checkAndUnlock('first_blood');
    }
    
    // Kill milestones
    if (this.runStats.kills >= 100) {
      this.checkAndUnlock('slayer_100');
    }
    if (this.runStats.kills >= 500) {
      this.checkAndUnlock('slayer_500');
    }
  }

  /**
   * Track time survived
   */
  public trackTime(timeMs: number): void {
    this.runStats.timeSurvived = timeMs;
    
    // Time achievements
    if (timeMs >= 60000) {
      this.checkAndUnlock('survivor_1');
      
      // Check untouched (no damage for 1 minute)
      if (this.runStats.damageTimestamp === 0 || 
          (timeMs - this.runStats.damageTimestamp >= 60000)) {
        this.checkAndUnlock('untouched');
      }
    }
    if (timeMs >= 180000) {
      this.checkAndUnlock('survivor_3');
    }
  }

  /**
   * Track victory (completing the game)
   */
  public trackVictory(timeMs: number): void {
    this.checkAndUnlock('victor');
    
    // Check speedrun
    if (timeMs < 240000) { // Under 4 minutes
      this.checkAndUnlock('speedrun');
    }
    
    // Check minimalist (no upgrades)
    if (this.runStats.upgradesTaken === 0) {
      this.checkAndUnlock('no_upgrade');
    }
  }

  /**
   * Track level up
   */
  public trackLevelUp(level: number): void {
    this.runStats.levelReached = level;
    
    if (level >= 5) this.checkAndUnlock('level_5');
    if (level >= 10) this.checkAndUnlock('level_10');
    if (level >= 20) this.checkAndUnlock('level_20');
  }

  /**
   * Track weapon unlock
   */
  public trackWeaponUnlock(): void {
    this.runStats.weaponsUnlocked++;
    
    if (this.runStats.weaponsUnlocked >= 2) {
      this.checkAndUnlock('weapon_unlock');
    }
    if (this.runStats.weaponsUnlocked >= 4) {
      this.checkAndUnlock('all_weapons');
    }
  }

  /**
   * Track weapon evolution
   */
  public trackWeaponEvolution(): void {
    this.runStats.weaponsEvolved++;
    this.checkAndUnlock('evolution');
  }

  /**
   * Track gold collection
   */
  public trackGold(amount: number): void {
    this.runStats.goldCollected += amount;
    
    const totalGold = this.metaManager.getTotalGoldEarned() + this.runStats.goldCollected;
    
    if (totalGold >= 100) this.checkAndUnlock('gold_100');
    if (totalGold >= 1000) this.checkAndUnlock('gold_1000');
    if (totalGold >= 5000) this.checkAndUnlock('gold_5000');
  }

  /**
   * Track player taking damage
   */
  public trackDamage(timeMs: number): void {
    this.runStats.damageTimestamp = timeMs;
  }

  /**
   * Track upgrade taken
   */
  public trackUpgrade(): void {
    this.runStats.upgradesTaken++;
  }

  /**
   * Check and unlock an achievement if not already unlocked
   */
  private checkAndUnlock(id: string): void {
    const achievement = this.metaManager.unlockAchievement(id);
    if (achievement) {
      this.queueNotification(achievement);
    }
  }

  /**
   * Queue a notification to show
   */
  private queueNotification(achievement: Achievement): void {
    this.notificationQueue.push(achievement);
    if (!this.isShowingNotification) {
      this.showNextNotification();
    }
  }

  /**
   * Show the next queued notification
   */
  private showNextNotification(): void {
    if (this.notificationQueue.length === 0) {
      this.isShowingNotification = false;
      return;
    }

    this.isShowingNotification = true;
    const achievement = this.notificationQueue.shift()!;
    
    // Create notification UI
    const screenWidth = this.scene.scale.width;
    const x = screenWidth - 170;
    const y = -60;
    
    const container = this.scene.add.container(x, y);
    container.setScrollFactor(0);
    container.setDepth(DEPTH.UI + 20);
    
    // Background
    const bg = this.scene.add.rectangle(0, 0, 300, 70, 0x1a1a2e, 0.95);
    bg.setStrokeStyle(2, 0xffd700);
    
    // Trophy icon area
    const iconBg = this.scene.add.circle(-110, 0, 25, 0xffd700, 0.2);
    const icon = this.scene.add.text(-110, 0, achievement.icon, {
      fontSize: '24px',
    }).setOrigin(0.5);
    
    // Achievement text
    const title = this.scene.add.text(-70, -15, 'ACHIEVEMENT UNLOCKED!', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffd700',
    });
    
    const name = this.scene.add.text(-70, 2, achievement.name, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
    });
    
    const reward = this.scene.add.text(-70, 20, `+${achievement.reward} 💰`, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#44ff44',
    });
    
    container.add([bg, iconBg, icon, title, name, reward]);
    
    // Slide in animation
    this.scene.tweens.add({
      targets: container,
      y: 50,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Hold for 2 seconds
        this.scene.time.delayedCall(2000, () => {
          // Slide out
          this.scene.tweens.add({
            targets: container,
            y: -80,
            alpha: 0,
            duration: 400,
            ease: 'Cubic.easeIn',
            onComplete: () => {
              container.destroy();
              this.showNextNotification();
            }
          });
        });
      }
    });
    
    // Optional: play achievement sound
    // this.scene.soundManager?.play(SoundEffect.LEVEL_UP);
  }

  /**
   * Get run stats for end-of-run summary
   */
  public getRunStats(): typeof this.runStats {
    return { ...this.runStats };
  }
}
