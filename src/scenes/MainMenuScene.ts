import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/Constants';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { MetaProgressionManager } from '../systems/MetaProgressionManager';

/**
 * MainMenuScene - Title screen with start game button
 */
export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.MAIN_MENU });
  }

  create(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // Ensure cursor is visible
    this.input.setDefaultCursor('default');

    // Animated background particles
    this.createBackgroundParticles();

    // Title with glow effect
    const titleShadow = this.add.text(centerX + 3, centerY - 147, 'ROGUELIKE\nSHOOT \'EM UP', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#000000',
      align: 'center',
    });
    titleShadow.setOrigin(0.5);
    titleShadow.setAlpha(0.5);

    const title = this.add.text(centerX, centerY - 150, 'ROGUELIKE\nSHOOT \'EM UP', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#ffffff',
      align: 'center',
      stroke: '#ff6600',
      strokeThickness: 3,
    });
    title.setOrigin(0.5);

    // Subtitle with fade-in
    const subtitle = this.add.text(centerX, centerY - 50, '⚔️ A Bullet Heaven Adventure ⚔️', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#aaaaaa',
    });
    subtitle.setOrigin(0.5);
    subtitle.setAlpha(0);
    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 1000,
      delay: 500,
    });

    // Start button
    this.createButton(centerX, centerY + 30, '▶ START GAME', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(500, () => {
        this.scene.start(SCENE_KEYS.GAME);
      });
    });

    // Armory button
    this.createButton(centerX, centerY + 90, '⚔️ ARMORY', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.scene.start('UpgradeMenuScene');
      });
    }, 0x6a4a6a, 0x8a6a8a);

    // Gold display
    const metaManager = MetaProgressionManager.getInstance();
    const goldDisplay = this.add.text(centerX, centerY - 10, `💰 ${metaManager.getGold()} Gold`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffd700',
    });
    goldDisplay.setOrigin(0.5);

    // Instructions panel
    const instrPanel = this.add.rectangle(centerX, centerY + 175, 500, 60, 0x000000, 0.5);
    instrPanel.setStrokeStyle(1, 0x444444);

    const instructions = this.add.text(centerX, centerY + 165, '🎮 WASD to move   •   🎯 Auto-aim enabled   •   ⏱️ Survive 5 minutes!', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#88aaff',
    });
    instructions.setOrigin(0.5);

    const instructions2 = this.add.text(centerX, centerY + 185, '💎 Collect XP gems   •   ⬆️ Level up for upgrades   •   🌀 Find the portal!', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#666666',
    });
    instructions2.setOrigin(0.5);

    // Version
    const version = this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 10, 'v0.8.1', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#444444',
    });
    version.setOrigin(1, 1);

    // Add subtle animation to title
    this.tweens.add({
      targets: [title, titleShadow],
      y: '-=8',
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // Fade in from black
    this.cameras.main.fadeIn(800, 0, 0, 0);
  }

  private createBackgroundParticles(): void {
    // Create floating particles for atmosphere
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * GAME_HEIGHT;
      const size = 1 + Math.random() * 2;
      const particle = this.add.circle(x, y, size, 0x4444ff, 0.3);
      
      // Slow floating animation
      this.tweens.add({
        targets: particle,
        y: y - 50 - Math.random() * 100,
        alpha: 0,
        duration: 3000 + Math.random() * 4000,
        repeat: -1,
        onRepeat: () => {
          particle.x = Math.random() * GAME_WIDTH;
          particle.y = GAME_HEIGHT + 10;
          particle.alpha = 0.3;
        }
      });
    }
  }

  private createButton(x: number, y: number, text: string, callback: () => void, bgColor: number = 0x5566aa, borderColor: number = 0x88aaff): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Button glow/shadow
    const glow = this.add.rectangle(0, 3, 220, 55, 0x000000, 0.4);
    
    // Button background with gradient-like effect
    const bg = this.add.rectangle(0, 0, 220, 50, bgColor);
    bg.setStrokeStyle(3, borderColor);
    
    // Button text
    const buttonText = this.add.text(0, 0, text, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    buttonText.setOrigin(0.5);

    container.add([glow, bg, buttonText]);

    // Make interactive
    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      bg.setFillStyle(bgColor + 0x111111);
      bg.setStrokeStyle(3, borderColor + 0x222222);
      this.tweens.add({
        targets: container,
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 100,
      });
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(bgColor);
      bg.setStrokeStyle(3, borderColor);
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
    });

    bg.on('pointerdown', () => {
      bg.setFillStyle(0x445599);
      container.setScale(0.95);
    });

    bg.on('pointerup', () => {
      callback();
    });

    // Pulse animation for the button
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.4, to: 0.6 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    return container;
  }
}
