import Phaser from 'phaser';
import { LEVELS } from '../data/levels';
import * as Audio from '../utils/audio';

export class LevelCompleteScene extends Phaser.Scene {
  private level: number = 1;
  private score: number = 0;
  private lives: number = 3;

  constructor() {
    super({ key: 'LevelCompleteScene' });
  }

  init(data: { level: number; score: number; lives: number }): void {
    this.level = data.level;
    this.score = data.score;
    this.lives = data.lives;
  }

  create(): void {
    const { width, height } = this.scale;
    
    Audio.playLevelComplete();
    
    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a4a, 0.95);
    
    // Level complete text
    const completeText = this.add.text(width / 2, height / 2 - 100, 'LEVEL COMPLETE!', {
      fontSize: '36px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#44ff44'
    }).setOrigin(0.5);
    
    // Celebration effect
    this.tweens.add({
      targets: completeText,
      scale: { from: 0.5, to: 1 },
      duration: 500,
      ease: 'Back.easeOut'
    });
    
    // Level info
    const levelName = LEVELS[this.level - 1]?.name || `Level ${this.level}`;
    this.add.text(width / 2, height / 2 - 40, `"${levelName}"`, {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#88aaff'
    }).setOrigin(0.5);
    
    // Score
    this.add.text(width / 2, height / 2 + 20, `Score: ${this.score}`, {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Lives remaining
    this.add.text(width / 2, height / 2 + 60, `Lives: ${this.lives}`, {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#aaaaaa'
    }).setOrigin(0.5);
    
    // Particles celebration
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(50, width - 50);
      const y = Phaser.Math.Between(100, height - 100);
      const colors = [0x44ff44, 0xffff44, 0x44ffff, 0xff44ff];
      const color = Phaser.Utils.Array.GetRandom(colors);
      
      const particle = this.add.circle(x, height + 50, Phaser.Math.Between(4, 8), color);
      
      this.tweens.add({
        targets: particle,
        y: y,
        alpha: { from: 1, to: 0 },
        duration: Phaser.Math.Between(1000, 2000),
        delay: i * 100,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
    
    // Check if there's a next level
    if (this.level < LEVELS.length) {
      const nextText = this.add.text(width / 2, height / 2 + 140, 'TAP FOR NEXT LEVEL', {
        fontSize: '22px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff'
      }).setOrigin(0.5);
      
      this.tweens.add({
        targets: nextText,
        alpha: 0.4,
        duration: 600,
        yoyo: true,
        repeat: -1
      });
      
      this.input.on('pointerdown', () => {
        this.scene.start('GameScene', {
          level: this.level + 1,
          score: this.score,
          lives: this.lives
        });
      });
    } else {
      // Game complete!
      this.add.text(width / 2, height / 2 + 120, '🎉 YOU WIN! 🎉', {
        fontSize: '32px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffd700'
      }).setOrigin(0.5);
      
      // Save high score
      const highScore = parseInt(localStorage.getItem('rxball_highscore') || '0');
      if (this.score > highScore) {
        localStorage.setItem('rxball_highscore', this.score.toString());
        this.add.text(width / 2, height / 2 + 170, 'NEW HIGH SCORE!', {
          fontSize: '24px',
          fontFamily: 'Arial, sans-serif',
          color: '#ff6644'
        }).setOrigin(0.5);
      }
      
      const menuText = this.add.text(width / 2, height / 2 + 220, 'TAP FOR MENU', {
        fontSize: '20px',
        fontFamily: 'Arial, sans-serif',
        color: '#aaaaaa'
      }).setOrigin(0.5);
      
      this.tweens.add({
        targets: menuText,
        alpha: 0.4,
        duration: 600,
        yoyo: true,
        repeat: -1
      });
      
      this.input.on('pointerdown', () => {
        this.scene.start('MenuScene');
      });
    }
  }
}
