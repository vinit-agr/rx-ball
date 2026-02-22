import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    // Generate textures programmatically
    this.createTextures();
    
    // Go to menu
    this.scene.start('MenuScene');
  }

  private createTextures(): void {
    // Ball texture (glowing circle)
    const ballGraphics = this.make.graphics({ x: 0, y: 0 });
    const ballRadius = 8;
    
    // Glow effect
    for (let i = 3; i >= 0; i--) {
      const alpha = 0.3 - i * 0.07;
      ballGraphics.fillStyle(0xffffff, alpha);
      ballGraphics.fillCircle(ballRadius + 4, ballRadius + 4, ballRadius + i * 2);
    }
    // Core
    ballGraphics.fillStyle(0xffffff, 1);
    ballGraphics.fillCircle(ballRadius + 4, ballRadius + 4, ballRadius);
    ballGraphics.generateTexture('ball', (ballRadius + 4) * 2, (ballRadius + 4) * 2);
    
    // Paddle texture
    const paddleGraphics = this.make.graphics({ x: 0, y: 0 });
    const paddleWidth = 80;
    const paddleHeight = 16;
    
    // Gradient effect using rectangles
    paddleGraphics.fillStyle(0x4488ff, 1);
    paddleGraphics.fillRoundedRect(0, 0, paddleWidth, paddleHeight, 6);
    paddleGraphics.fillStyle(0x66aaff, 1);
    paddleGraphics.fillRoundedRect(2, 2, paddleWidth - 4, paddleHeight / 2, 4);
    paddleGraphics.generateTexture('paddle', paddleWidth, paddleHeight);
    
    // Laser texture
    const laserGraphics = this.make.graphics({ x: 0, y: 0 });
    laserGraphics.fillStyle(0xff00ff, 1);
    laserGraphics.fillRect(0, 0, 4, 16);
    laserGraphics.fillStyle(0xffffff, 1);
    laserGraphics.fillRect(1, 0, 2, 16);
    laserGraphics.generateTexture('laser', 4, 16);
    
    // Create brick textures for each color
    this.createBrickTexture('brick_red', 0xff4444, 0xcc2222);
    this.createBrickTexture('brick_blue', 0x4444ff, 0x2222cc);
    this.createBrickTexture('brick_green', 0x44ff44, 0x22cc22);
    this.createBrickTexture('brick_yellow', 0xffff44, 0xcccc22);
    this.createBrickTexture('brick_purple', 0xaa44ff, 0x8822cc);
    this.createBrickTexture('brick_silver', 0xcccccc, 0x999999);
    this.createBrickTexture('brick_gold', 0xffd700, 0xcc9900);
    this.createBrickTexture('brick_metal', 0x666688, 0x444466);
    this.createBrickTexture('brick_explosive', 0xff6600, 0xcc4400);
    
    // Cracked overlay
    const crackGraphics = this.make.graphics({ x: 0, y: 0 });
    crackGraphics.lineStyle(2, 0x000000, 0.5);
    crackGraphics.beginPath();
    crackGraphics.moveTo(25, 0);
    crackGraphics.lineTo(20, 10);
    crackGraphics.lineTo(30, 15);
    crackGraphics.lineTo(22, 24);
    crackGraphics.stroke();
    crackGraphics.moveTo(35, 5);
    crackGraphics.lineTo(40, 15);
    crackGraphics.lineTo(35, 20);
    crackGraphics.stroke();
    crackGraphics.generateTexture('crack', 50, 24);
    
    // Power-up textures
    this.createPowerUpTexture('powerup_expand', 0x44ff44, 'E');
    this.createPowerUpTexture('powerup_shrink', 0xff4444, 'S');
    this.createPowerUpTexture('powerup_multi', 0x4444ff, 'M');
    this.createPowerUpTexture('powerup_catch', 0xffff44, 'C');
    this.createPowerUpTexture('powerup_laser', 0xaa44ff, 'L');
    this.createPowerUpTexture('powerup_slow', 0x44ffff, '-');
    this.createPowerUpTexture('powerup_fast', 0xff8800, '+');
    this.createPowerUpTexture('powerup_life', 0xff66aa, '♥');
    
    // Life icon (small ball)
    const lifeGraphics = this.make.graphics({ x: 0, y: 0 });
    lifeGraphics.fillStyle(0xffffff, 1);
    lifeGraphics.fillCircle(6, 6, 6);
    lifeGraphics.generateTexture('life_icon', 12, 12);

    // Mobile arrow buttons
    this.createArrowButton('btn_left', true);
    this.createArrowButton('btn_right', false);
  }

  private createArrowButton(key: string, facingLeft: boolean): void {
    const size = 56;
    const g = this.make.graphics({ x: 0, y: 0 });
    // Semi-transparent circle background
    g.fillStyle(0xffffff, 0.15);
    g.fillCircle(size / 2, size / 2, size / 2);
    g.fillStyle(0xffffff, 0.25);
    g.fillCircle(size / 2, size / 2, size / 2 - 4);
    // Arrow triangle
    g.fillStyle(0xffffff, 0.7);
    const cx = size / 2;
    const cy = size / 2;
    if (facingLeft) {
      g.fillTriangle(cx - 10, cy, cx + 6, cy - 10, cx + 6, cy + 10);
    } else {
      g.fillTriangle(cx + 10, cy, cx - 6, cy - 10, cx - 6, cy + 10);
    }
    g.generateTexture(key, size, size);
    g.destroy();
  }
  
  private createBrickTexture(key: string, color: number, shadowColor: number): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    const width = 50;
    const height = 24;
    
    // Shadow/border
    graphics.fillStyle(shadowColor, 1);
    graphics.fillRoundedRect(0, 0, width, height, 4);
    
    // Main color
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(1, 1, width - 2, height - 3, 3);
    
    // Highlight
    graphics.fillStyle(0xffffff, 0.3);
    graphics.fillRoundedRect(3, 3, width - 6, 8, 2);
    
    graphics.generateTexture(key, width, height);
  }
  
  private createPowerUpTexture(key: string, color: number, _symbol: string): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    const size = 24;
    
    // Glow
    graphics.fillStyle(color, 0.3);
    graphics.fillCircle(size / 2, size / 2, size / 2);
    
    // Main circle
    graphics.fillStyle(color, 1);
    graphics.fillCircle(size / 2, size / 2, size / 2 - 2);
    
    // Inner highlight
    graphics.fillStyle(0xffffff, 0.4);
    graphics.fillCircle(size / 2, size / 2 - 2, size / 4);
    
    graphics.generateTexture(key, size, size);
    
    // We'll draw the symbol in the game scene since graphics can't draw text
  }
}
