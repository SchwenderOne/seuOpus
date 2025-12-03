import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { PreloaderScene } from '../scenes/PreloaderScene';
import { MainMenuScene } from '../scenes/MainMenuScene';
import { GameScene } from '../scenes/GameScene';
import { GameOverScene } from '../scenes/GameOverScene';
import { UpgradeMenuScene } from '../scenes/UpgradeMenuScene';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const GameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false, // Set to true for development debugging
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    PreloaderScene,
    MainMenuScene,
    GameScene,
    GameOverScene,
    UpgradeMenuScene,
  ],
};
