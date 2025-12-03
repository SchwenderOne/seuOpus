import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/Constants';

/**
 * BootScene - Initial scene that sets up basic game settings
 * and loads the minimal assets needed for the preloader
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.BOOT });
  }

  preload(): void {
    // Load the asset index JSON that contains paths to all other asset definitions
    this.load.json('assetIndex', 'assets/index.json');
  }

  create(): void {
    // Set up any global game settings here
    this.scale.refresh();
    
    // Transition to the preloader scene
    this.scene.start(SCENE_KEYS.PRELOADER);
  }
}
