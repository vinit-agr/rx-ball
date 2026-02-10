import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    
    // Gradient background
    const bg = this.add.graphics();
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      const ratio = i / steps;
      const r = Math.floor(26 + ratio * 48);
      const g = Math.floor(26);
      const b = Math.floor(74 + ratio * 24);
      const color = (r << 16) | (g << 8) | b;
      bg.fillStyle(color, 1);
      bg.fillRect(0, (height / steps) * i, width, height / steps + 1);
    }
    
    // Decorative floating balls in background
    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(50, width - 50);
      const y = Phaser.Math.Between(100, height - 100);
      const ball = this.add.circle(x, y, Phaser.Math.Between(5, 15), 0xffffff, 0.1);
      
      this.tweens.add({
        targets: ball,
        y: ball.y + Phaser.Math.Between(-30, 30),
        x: ball.x + Phaser.Math.Between(-20, 20),
        alpha: { from: 0.05, to: 0.15 },
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
    
    // Title with glow effect
    const titleShadow = this.add.text(width / 2, 180, 'RX-BALL', {
      fontSize: '72px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#4488ff'
    }).setOrigin(0.5).setAlpha(0.5);
    
    const title = this.add.text(width / 2, 175, 'RX-BALL', {
      fontSize: '72px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Subtitle
    this.add.text(width / 2, 250, 'Brick Breaker', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#88aaff'
    }).setOrigin(0.5);
    
    // Pulsing title effect
    this.tweens.add({
      targets: [title, titleShadow],
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Draw a sample paddle and ball
    this.add.image(width / 2, 450, 'paddle');
    const demoBall = this.add.image(width / 2, 400, 'ball');
    
    this.tweens.add({
      targets: demoBall,
      y: 380,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Tap to start text
    const startText = this.add.text(width / 2, 550, 'TAP TO START', {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Blinking effect
    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1
    });
    
    // Controls info
    this.add.text(width / 2, 650, 'Move paddle with touch or mouse', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#8888aa'
    }).setOrigin(0.5);
    
    this.add.text(width / 2, 680, 'Break all bricks to advance!', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#8888aa'
    }).setOrigin(0.5);
    
    // High score display
    const highScore = localStorage.getItem('rxball_highscore') || '0';
    this.add.text(width / 2, 740, `High Score: ${highScore}`, {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffdd44'
    }).setOrigin(0.5);
    
    // Input handling
    this.input.on('pointerdown', () => {
      this.scene.start('GameScene', { level: 1, score: 0, lives: 3 });
    });
  }
}
