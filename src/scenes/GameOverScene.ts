import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/Constants';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { MetaProgressionManager } from '../systems/MetaProgressionManager';

interface GameOverData {
  score: number;
  enemiesKilled: number;
  timeSurvived: number;
  levelReached: number;
  victory: boolean;
  goldEarned?: number;
  bossesKilled?: number;
}

/**
 * GameOverScene - Displays game results and allows restart
 */
export class GameOverScene extends Phaser.Scene {
  private gameData!: GameOverData;

  constructor() {
    super({ key: SCENE_KEYS.GAME_OVER });
  }

  init(data: GameOverData): void {
    this.gameData = data || {
      score: 0,
      enemiesKilled: 0,
      timeSurvived: 0,
      levelReached: 1,
      victory: false,
    };
  }

  create(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // Ensure cursor is visible
    this.input.setDefaultCursor('default');

    // Fade in effect
    this.cameras.main.fadeIn(500);

    // Title based on victory/defeat
    const titleText = this.gameData.victory ? 'VICTORY!' : 'GAME OVER';
    const titleColor = this.gameData.victory ? '#00ff00' : '#ff4444';
    
    const title = this.add.text(centerX, centerY - 180, titleText, {
      fontFamily: 'monospace',
      fontSize: '56px',
      color: titleColor,
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);

    // Stats panel
    this.createStatsPanel(centerX, centerY - 20);

    // Buttons
    this.createButton(centerX - 110, centerY + 140, 'RESTART', () => {
      this.scene.start(SCENE_KEYS.GAME);
    });

    this.createButton(centerX + 110, centerY + 140, 'MENU', () => {
      this.scene.start(SCENE_KEYS.MAIN_MENU);
    });

    // Animate title
    this.tweens.add({
      targets: title,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private createStatsPanel(x: number, y: number): void {
    // Background panel
    const panel = this.add.rectangle(x, y, 300, 230, 0x222222, 0.9);
    panel.setStrokeStyle(2, 0x4a4a6a);

    const metaManager = MetaProgressionManager.getInstance();
    const totalGold = metaManager.getGold();

    const stats = [
      { label: 'Score', value: this.gameData.score.toLocaleString() },
      { label: 'Enemies Killed', value: this.gameData.enemiesKilled.toString() },
      { label: 'Time Survived', value: this.formatTime(this.gameData.timeSurvived) },
      { label: 'Level Reached', value: this.gameData.levelReached.toString() },
      { label: 'Gold Earned', value: `+${this.gameData.goldEarned || 0} 💰`, color: '#ffd700' },
      { label: 'Total Gold', value: `${totalGold} 💰`, color: '#ffd700' },
    ];

    stats.forEach((stat, index) => {
      const statY = y - 80 + index * 35;
      
      // Label
      this.add.text(x - 130, statY, stat.label, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#aaaaaa',
      });

      // Value
      const valueText = this.add.text(x + 130, statY, stat.value, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: (stat as any).color || '#ffffff',
      });
      valueText.setOrigin(1, 0);
    });
  }

  private formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private createButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 180, 45, 0x4a4a6a);
    bg.setStrokeStyle(2, 0x6a6a8a);
    
    const buttonText = this.add.text(0, 0, text, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
    });
    buttonText.setOrigin(0.5);

    container.add([bg, buttonText]);

    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      bg.setFillStyle(0x5a5a7a);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x4a4a6a);
    });

    bg.on('pointerup', callback);

    return container;
  }
}
