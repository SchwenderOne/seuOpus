import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/Constants';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { 
  MetaProgressionManager, 
  PERMANENT_UPGRADES, 
  CHARACTERS,
} from '../systems/MetaProgressionManager';

type MenuTab = 'upgrades' | 'characters' | 'achievements' | 'stats';

/**
 * UpgradeMenuScene - Persistent upgrades and character select
 */
export class UpgradeMenuScene extends Phaser.Scene {
  private metaManager!: MetaProgressionManager;
  private currentTab: MenuTab = 'upgrades';
  private contentContainer!: Phaser.GameObjects.Container;
  private goldText!: Phaser.GameObjects.Text;
  private tabButtons: Map<MenuTab, Phaser.GameObjects.Container> = new Map();

  constructor() {
    super({ key: 'UpgradeMenuScene' });
  }

  create(): void {
    this.metaManager = MetaProgressionManager.getInstance();
    
    // Ensure cursor is visible
    this.input.setDefaultCursor('default');
    
    const centerX = GAME_WIDTH / 2;
    
    // Background
    this.add.rectangle(centerX, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0a14);
    
    // Title
    this.add.text(centerX, 30, '⚔️ ARMORY ⚔️', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    
    // Gold display
    const goldPanel = this.add.container(centerX, 70);
    const goldBg = this.add.rectangle(0, 0, 200, 30, 0x222244, 0.9);
    goldBg.setStrokeStyle(2, 0xffd700);
    this.goldText = this.add.text(0, 0, `💰 ${this.metaManager.getGold()}`, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffd700',
    }).setOrigin(0.5);
    goldPanel.add([goldBg, this.goldText]);
    
    // Tab buttons
    this.createTabs();
    
    // Content container
    this.contentContainer = this.add.container(0, 0);
    
    // Back button
    this.createButton(80, GAME_HEIGHT - 40, '← BACK', () => {
      this.scene.start(SCENE_KEYS.MAIN_MENU);
    });
    
    // Initial tab
    this.showTab('upgrades');
    
    // Listen for data updates
    this.metaManager.addListener(() => this.refreshGold());
  }

  private createTabs(): void {
    const tabs: { key: MenuTab; label: string }[] = [
      { key: 'upgrades', label: '⬆️ Upgrades' },
      { key: 'characters', label: '👤 Characters' },
      { key: 'achievements', label: '🏆 Achievements' },
      { key: 'stats', label: '📊 Statistics' },
    ];
    
    const tabWidth = 150;
    const startX = GAME_WIDTH / 2 - ((tabs.length - 1) * tabWidth) / 2;
    
    tabs.forEach((tab, i) => {
      const x = startX + i * tabWidth;
      const container = this.add.container(x, 110);
      
      const bg = this.add.rectangle(0, 0, 140, 36, 0x333355, 1);
      bg.setStrokeStyle(2, 0x5555aa);
      
      const text = this.add.text(0, 0, tab.label, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#aaaaaa',
      }).setOrigin(0.5);
      
      container.add([bg, text]);
      container.setData('bg', bg);
      container.setData('text', text);
      
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerup', () => this.showTab(tab.key));
      bg.on('pointerover', () => {
        if (this.currentTab !== tab.key) {
          bg.setFillStyle(0x444466);
        }
      });
      bg.on('pointerout', () => {
        if (this.currentTab !== tab.key) {
          bg.setFillStyle(0x333355);
        }
      });
      
      this.tabButtons.set(tab.key, container);
    });
  }

  private showTab(tab: MenuTab): void {
    this.currentTab = tab;
    
    // Update tab visuals
    this.tabButtons.forEach((container, key) => {
      const bg = container.getData('bg') as Phaser.GameObjects.Rectangle;
      const text = container.getData('text') as Phaser.GameObjects.Text;
      
      if (key === tab) {
        bg.setFillStyle(0x5566aa);
        bg.setStrokeStyle(2, 0x88aaff);
        text.setColor('#ffffff');
      } else {
        bg.setFillStyle(0x333355);
        bg.setStrokeStyle(2, 0x5555aa);
        text.setColor('#aaaaaa');
      }
    });
    
    // Clear content
    this.contentContainer.removeAll(true);
    
    // Show appropriate content
    switch (tab) {
      case 'upgrades':
        this.showUpgrades();
        break;
      case 'characters':
        this.showCharacters();
        break;
      case 'achievements':
        this.showAchievements();
        break;
      case 'stats':
        this.showStats();
        break;
    }
  }

  private showUpgrades(): void {
    const startY = 160;
    const itemHeight = 65;
    const columns = 2;
    const columnWidth = 350;
    const startX = GAME_WIDTH / 2 - columnWidth / 2;
    
    PERMANENT_UPGRADES.forEach((upgrade, i) => {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const x = startX + col * columnWidth;
      const y = startY + row * itemHeight;
      
      const level = this.metaManager.getUpgradeLevel(upgrade.type);
      const cost = this.metaManager.getUpgradeCost(upgrade.type);
      const value = this.metaManager.getUpgradeValue(upgrade.type);
      const canAfford = this.metaManager.canUpgrade(upgrade.type);
      const maxed = level >= upgrade.maxLevel;
      
      const container = this.add.container(x, y);
      
      // Background
      const bg = this.add.rectangle(0, 0, 320, 55, 0x1a1a2e, 0.9);
      bg.setStrokeStyle(2, canAfford ? 0x44aa44 : (maxed ? 0xffd700 : 0x444466));
      
      // Icon
      const icon = this.add.text(-140, 0, upgrade.icon, {
        fontSize: '24px',
      }).setOrigin(0.5);
      
      // Name and level
      const name = this.add.text(-110, -12, upgrade.name, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
      });
      
      const levelText = this.add.text(-110, 6, `Level ${level}/${upgrade.maxLevel}`, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: maxed ? '#ffd700' : '#888888',
      });
      
      // Value display
      const valueStr = upgrade.valueType === 'percent' ? 
        `+${value}%` : `+${value}`;
      const valueText = this.add.text(30, -12, valueStr, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#44ff44',
      });
      
      // Description
      const desc = this.add.text(30, 6, upgrade.description, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#666666',
      });
      
      // Buy button or maxed indicator
      let buyBtn: Phaser.GameObjects.Container | null = null;
      if (maxed) {
        const maxLabel = this.add.text(120, 0, 'MAX', {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#ffd700',
        }).setOrigin(0.5);
        container.add(maxLabel);
      } else {
        buyBtn = this.createSmallButton(120, 0, `💰 ${cost}`, canAfford, () => {
          if (this.metaManager.purchaseUpgrade(upgrade.type)) {
            this.showTab('upgrades'); // Refresh
          }
        });
        container.add(buyBtn);
      }
      
      container.add([bg, icon, name, levelText, valueText, desc]);
      this.contentContainer.add(container);
    });
  }

  private showCharacters(): void {
    const startY = 170;
    const itemHeight = 90;
    const centerX = GAME_WIDTH / 2;
    
    CHARACTERS.forEach((character, i) => {
      const y = startY + i * itemHeight;
      const container = this.add.container(centerX, y);
      
      const isUnlocked = this.metaManager.isCharacterUnlocked(character.id);
      const isSelected = this.metaManager.getSelectedCharacter().id === character.id;
      const canAfford = this.metaManager.getGold() >= character.unlockCost;
      
      // Background
      const bg = this.add.rectangle(0, 0, 500, 80, 0x1a1a2e, 0.9);
      bg.setStrokeStyle(2, isSelected ? 0x44ff44 : (isUnlocked ? 0x5555aa : 0x444444));
      
      // Icon
      const icon = this.add.text(-220, 0, character.icon, {
        fontSize: '36px',
      }).setOrigin(0.5);
      if (!isUnlocked) icon.setAlpha(0.4);
      
      // Name
      const name = this.add.text(-180, -20, character.name, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: isUnlocked ? '#ffffff' : '#666666',
      });
      
      // Description
      const desc = this.add.text(-180, 2, character.description, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#888888',
      });
      
      // Stats preview
      const stats = character.stats;
      const statsText = `HP: ${stats.hp}%  SPD: ${stats.speed}%  DMG: ${stats.damage}%`;
      const statsLabel = this.add.text(-180, 20, statsText, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: isUnlocked ? '#aaaaff' : '#555555',
      });
      
      // Special ability
      if (character.specialAbility) {
        const ability = this.add.text(80, -20, character.specialAbility, {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#ffaa00',
        });
        container.add(ability);
      }
      
      container.add([bg, icon, name, desc, statsLabel]);
      
      // Action button
      if (!isUnlocked) {
        // Unlock requirement text
        if (character.unlockRequirement) {
          const reqText = this.add.text(160, 5, character.unlockRequirement, {
            fontFamily: 'monospace',
            fontSize: '9px',
            color: '#ff6666',
          }).setOrigin(0.5);
          container.add(reqText);
        }
        
        const unlockBtn = this.createSmallButton(160, 25, `💰 ${character.unlockCost}`, canAfford, () => {
          if (this.metaManager.unlockCharacter(character.id)) {
            this.showTab('characters');
          }
        });
        container.add(unlockBtn);
      } else if (!isSelected) {
        const selectBtn = this.createSmallButton(160, 0, 'SELECT', true, () => {
          this.metaManager.selectCharacter(character.id);
          this.showTab('characters');
        });
        container.add(selectBtn);
      } else {
        const selectedLabel = this.add.text(160, 0, '✓ SELECTED', {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#44ff44',
        }).setOrigin(0.5);
        container.add(selectedLabel);
      }
      
      this.contentContainer.add(container);
    });
  }

  private showAchievements(): void {
    const achievements = this.metaManager.getAchievements();
    const startY = 160;
    const columns = 3;
    const itemWidth = 200;
    const itemHeight = 80;
    const startX = GAME_WIDTH / 2 - ((columns - 1) * itemWidth) / 2;
    
    // Filter out secret achievements that aren't unlocked
    const visibleAchievements = achievements.filter(a => 
      a.unlocked || !a.achievement.isSecret
    );
    
    visibleAchievements.forEach((data, i) => {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const x = startX + col * itemWidth;
      const y = startY + row * itemHeight;
      
      const container = this.add.container(x, y);
      
      const bg = this.add.rectangle(0, 0, 185, 70, 0x1a1a2e, 0.9);
      bg.setStrokeStyle(2, data.unlocked ? 0xffd700 : 0x333344);
      
      const icon = this.add.text(-70, 0, data.achievement.icon, {
        fontSize: '24px',
      }).setOrigin(0.5);
      if (!data.unlocked) icon.setAlpha(0.3);
      
      const name = this.add.text(-45, -18, data.achievement.name, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: data.unlocked ? '#ffd700' : '#555555',
      });
      
      const desc = this.add.text(-45, -2, data.achievement.description, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: data.unlocked ? '#888888' : '#444444',
        wordWrap: { width: 120 },
      });
      
      const reward = this.add.text(-45, 20, `+${data.achievement.reward} 💰`, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: data.unlocked ? '#44ff44' : '#333333',
      });
      
      container.add([bg, icon, name, desc, reward]);
      this.contentContainer.add(container);
    });
    
    // Summary
    const unlocked = achievements.filter(a => a.unlocked).length;
    const total = achievements.length;
    const summary = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, 
      `${unlocked}/${total} Achievements Unlocked`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#aaaaaa',
    }).setOrigin(0.5);
    this.contentContainer.add(summary);
  }

  private showStats(): void {
    const data = this.metaManager.getData();
    const centerX = GAME_WIDTH / 2;
    const startY = 170;
    
    const stats = [
      { label: 'Total Gold Earned', value: data.totalGoldEarned.toLocaleString(), icon: '💰' },
      { label: 'Total Runs', value: data.totalRuns.toString(), icon: '🎮' },
      { label: 'Total Victories', value: data.totalVictories.toString(), icon: '🏆' },
      { label: 'Total Kills', value: data.totalKills.toLocaleString(), icon: '💀' },
      { label: 'Total Boss Kills', value: data.totalBossKills.toString(), icon: '👑' },
      { label: 'Highest Wave', value: data.highestWave.toString(), icon: '🌊' },
      { label: 'Highest Level', value: data.highestLevel.toString(), icon: '⭐' },
      { label: 'Longest Survival', value: this.formatTime(data.longestSurvival), icon: '⏱️' },
      { label: 'Total Play Time', value: this.formatTime(data.statistics.totalPlayTime), icon: '🕐' },
      { label: 'Fastest Victory', value: data.statistics.fastestVictory ? 
        this.formatTime(data.statistics.fastestVictory) : 'N/A', icon: '⚡' },
    ];
    
    stats.forEach((stat, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = centerX - 150 + col * 300;
      const y = startY + row * 50;
      
      const container = this.add.container(x, y);
      
      const icon = this.add.text(-100, 0, stat.icon, {
        fontSize: '20px',
      }).setOrigin(0.5);
      
      const label = this.add.text(-75, -8, stat.label, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#888888',
      });
      
      const value = this.add.text(-75, 10, stat.value, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffffff',
      });
      
      container.add([icon, label, value]);
      this.contentContainer.add(container);
    });
    
    // Reset button at bottom
    const resetBtn = this.createButton(GAME_WIDTH - 120, GAME_HEIGHT - 40, '🗑️ RESET', () => {
      // Show confirmation
      this.showResetConfirmation();
    });
    this.contentContainer.add(resetBtn);
  }

  private showResetConfirmation(): void {
    const overlay = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8);
    overlay.setDepth(100);
    
    const panel = this.add.container(GAME_WIDTH/2, GAME_HEIGHT/2);
    panel.setDepth(101);
    
    const bg = this.add.rectangle(0, 0, 400, 200, 0x1a1a2e, 1);
    bg.setStrokeStyle(3, 0xff4444);
    
    const title = this.add.text(0, -60, '⚠️ RESET PROGRESS?', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ff4444',
    }).setOrigin(0.5);
    
    const warning = this.add.text(0, -20, 'This will delete ALL your progress!\nThis action cannot be undone.', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#aaaaaa',
      align: 'center',
    }).setOrigin(0.5);
    
    const confirmBtn = this.createButton(-80, 50, 'RESET', () => {
      this.metaManager.resetProgress();
      overlay.destroy();
      panel.destroy();
      this.showTab('stats');
    });
    
    const cancelBtn = this.createButton(80, 50, 'CANCEL', () => {
      overlay.destroy();
      panel.destroy();
    });
    
    panel.add([bg, title, warning, confirmBtn, cancelBtn]);
    
    overlay.setInteractive();
    overlay.on('pointerup', () => {
      overlay.destroy();
      panel.destroy();
    });
  }

  private createSmallButton(x: number, y: number, text: string, enabled: boolean, callback: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    
    // Use more vibrant colors: bright green when enabled, dark grey when disabled
    const bg = this.add.rectangle(0, 0, 80, 28, enabled ? 0x228822 : 0x333333, 1);
    bg.setStrokeStyle(2, enabled ? 0x44ff44 : 0x444444);
    
    const label = this.add.text(0, 0, text, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: enabled ? '#ffffff' : '#666666',
    }).setOrigin(0.5);
    
    container.add([bg, label]);
    
    if (enabled) {
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => bg.setFillStyle(0x33aa33));
      bg.on('pointerout', () => bg.setFillStyle(0x228822));
      bg.on('pointerup', callback);
    }
    
    return container;
  }

  private createButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    
    const bg = this.add.rectangle(0, 0, 120, 36, 0x4a4a6a, 1);
    bg.setStrokeStyle(2, 0x6a6a8a);
    
    const label = this.add.text(0, 0, text, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5);
    
    container.add([bg, label]);
    
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setFillStyle(0x5a5a7a));
    bg.on('pointerout', () => bg.setFillStyle(0x4a4a6a));
    bg.on('pointerup', callback);
    
    return container;
  }

  private refreshGold(): void {
    this.goldText.setText(`💰 ${this.metaManager.getGold()}`);
  }

  private formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
