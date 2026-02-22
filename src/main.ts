import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { LevelCompleteScene } from './scenes/LevelCompleteScene';
import { GameOverScene } from './scenes/GameOverScene';

// Debug mode: add ?debug to URL to enable (e.g., localhost:5173?debug)
const DEBUG = window.location.search.includes('debug');

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#0a0a1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 480,
    height: 800
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: DEBUG
    }
  },
  scene: [BootScene, MenuScene, GameScene, LevelCompleteScene, GameOverScene],
  input: {
    activePointers: 3
  }
};

new Phaser.Game(config);
