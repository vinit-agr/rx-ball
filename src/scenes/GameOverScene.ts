import Phaser from 'phaser';
import * as Audio from '../utils/audio';

export class GameOverScene extends Phaser.Scene {
  private score: number = 0;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: { score: number }): void {
    this.score = data.score;
  }

  create(): void {
    const { width, height } = this.scale;
    
    Audio.playGameOver();
    
    // Dark background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a1a, 0.95);
    
    // Game Over text
    const gameOverText = this.add.text(width / 2, height / 2 - 100, 'GAME OVER', {
      fontSize: '48px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ff4444'
    }).setOrigin(0.5);
    
    // Shake effect
    this.tweens.add({
      targets: gameOverText,
      x: { from: width / 2 - 10, to: width / 2 + 10 },
      duration: 100,
      repeat: 3,
      yoyo: true,
      onComplete: () => {
        gameOverText.x = width / 2;
      }
    });
    
    // Score
    this.add.text(width / 2, height / 2, `Final Score: ${this.score}`, {
      fontSize: '32px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // High score check
    const highScore = parseInt(localStorage.getItem('rxball_highscore') || '0');
    
    if (this.score > highScore) {
      localStorage.setItem('rxball_highscore', this.score.toString());
      
      const newHighText = this.add.text(width / 2, height / 2 + 50, '★ NEW HIGH SCORE! ★', {
        fontSize: '24px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffd700'
      }).setOrigin(0.5);
      
      this.tweens.add({
        targets: newHighText,
        scale: { from: 1, to: 1.1 },
        duration: 500,
        yoyo: true,
        repeat: -1
      });
    } else {
      this.add.text(width / 2, height / 2 + 50, `High Score: ${highScore}`, {
        fontSize: '20px',
        fontFamily: 'Arial, sans-serif',
        color: '#888888'
      }).setOrigin(0.5);
    }
    
    // Play again button
    const buttonY = height / 2 + 140;
    const button = this.add.container(width / 2, buttonY);
    
    const buttonBg = this.add.rectangle(0, 0, 200, 50, 0x4488ff, 1);
    buttonBg.setStrokeStyle(2, 0x66aaff);
    
    const buttonText = this.add.text(0, 0, 'PLAY AGAIN', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    button.add([buttonBg, buttonText]);
    
    // Button hover effect
    buttonBg.setInteractive({ useHandCursor: true });
    
    buttonBg.on('pointerover', () => {
      buttonBg.setFillStyle(0x66aaff);
    });
    
    buttonBg.on('pointerout', () => {
      buttonBg.setFillStyle(0x4488ff);
    });
    
    buttonBg.on('pointerdown', () => {
      this.scene.start('GameScene', { level: 1, score: 0, lives: 3 });
    });
    
    // Menu option
    const menuText = this.add.text(width / 2, height / 2 + 210, 'or tap here for menu', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#666688'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    menuText.on('pointerover', () => menuText.setColor('#8888aa'));
    menuText.on('pointerout', () => menuText.setColor('#666688'));
    menuText.on('pointerdown', () => this.scene.start('MenuScene'));
    
    // Falling ball particles (sad effect)
    for (let i = 0; i < 10; i++) {
      this.time.delayedCall(i * 300, () => {
        const x = Phaser.Math.Between(50, width - 50);
        const ball = this.add.circle(x, -20, 8, 0xffffff, 0.5);
        
        this.tweens.add({
          targets: ball,
          y: height + 50,
          alpha: 0,
          duration: 2000,
          ease: 'Quad.easeIn',
          onComplete: () => ball.destroy()
        });
      });
    }
  }
}
