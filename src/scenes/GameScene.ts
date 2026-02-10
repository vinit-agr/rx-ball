import Phaser from 'phaser';
import { LEVELS, BRICK_COLORS } from '../data/levels';
import * as Audio from '../utils/audio';

interface PowerUpType {
  key: string;
  color: number;
  symbol: string;
  good: boolean;
}

const POWER_UPS: PowerUpType[] = [
  { key: 'expand', color: 0x44ff44, symbol: 'E', good: true },
  { key: 'shrink', color: 0xff4444, symbol: 'S', good: false },
  { key: 'multi', color: 0x4444ff, symbol: 'M', good: true },
  { key: 'catch', color: 0xffff44, symbol: 'C', good: true },
  { key: 'laser', color: 0xaa44ff, symbol: 'L', good: true },
  { key: 'slow', color: 0x44ffff, symbol: '-', good: true },
  { key: 'fast', color: 0xff8800, symbol: '+', good: false },
  { key: 'life', color: 0xff66aa, symbol: '♥', good: true }
];

export class GameScene extends Phaser.Scene {
  private paddle!: Phaser.Physics.Arcade.Image;
  private balls!: Phaser.Physics.Arcade.Group;
  private bricks!: Phaser.Physics.Arcade.StaticGroup;
  private powerUps!: Phaser.Physics.Arcade.Group;
  private lasers!: Phaser.Physics.Arcade.Group;
  
  private score: number = 0;
  private lives: number = 3;
  private level: number = 1;
  
  private scoreText!: Phaser.GameObjects.Text;
  private livesContainer!: Phaser.GameObjects.Container;
  private ballSpeed: number = 350;
  private baseSpeed: number = 350;
  private paddleWidth: number = 80;
  private isLaunched: boolean = false;
  private isCatching: boolean = false;
  private hasLaser: boolean = false;
  private laserTimer?: Phaser.Time.TimerEvent;
  
  private brickHitCounts: Map<Phaser.Physics.Arcade.Sprite, number> = new Map();
  
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { level: number; score: number; lives: number }): void {
    this.level = data.level || 1;
    this.score = data.score || 0;
    this.lives = data.lives || 3;
    this.isLaunched = false;
    this.isCatching = false;
    this.hasLaser = false;
    this.paddleWidth = 80;
    this.baseSpeed = 350 + (this.level - 1) * 15;
    this.ballSpeed = this.baseSpeed;
    this.brickHitCounts.clear();
  }

  create(): void {
    // Background gradient
    this.createBackground();
    
    // Create game objects
    this.createPaddle();
    this.createBall();
    this.createBricks();
    this.createHUD();
    
    // Groups for power-ups and lasers
    this.powerUps = this.physics.add.group();
    this.lasers = this.physics.add.group();
    
    // Physics collisions
    this.setupCollisions();
    
    // Input handling
    this.setupInput();
    
    // Walls
    this.physics.world.setBoundsCollision(true, true, true, false);
  }

  private createBackground(): void {
    const { width, height } = this.scale as { width: number; height: number };
    const bg = this.add.graphics();
    
    // Create gradient effect with rectangles
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
  }

  private createPaddle(): void {
    const { width, height } = this.scale;
    
    this.paddle = this.physics.add.image(width / 2, height - 60, 'paddle');
    this.paddle.setImmovable(true);
    this.paddle.setCollideWorldBounds(true);
    (this.paddle.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    (this.paddle.body as Phaser.Physics.Arcade.Body).setSize(this.paddleWidth, 16);
  }

  private createBall(): void {
    const { width, height } = this.scale;
    
    this.balls = this.physics.add.group();
    
    const ball = this.physics.add.image(width / 2, height - 85, 'ball');
    ball.setCollideWorldBounds(true);
    ball.setBounce(1, 1);
    (ball.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    (ball.body as Phaser.Physics.Arcade.Body).setCircle(8, 4, 4);
    
    this.balls.add(ball);
  }

  private createBricks(): void {
    this.bricks = this.physics.add.staticGroup();
    
    const levelData = LEVELS[this.level - 1] || LEVELS[0];
    const brickWidth = 50;
    const brickHeight = 24;
    const startX = (this.scale.width - (8 * brickWidth + 7 * 4)) / 2 + brickWidth / 2;
    const startY = 100;
    
    levelData.bricks.forEach((row, rowIndex) => {
      row.forEach((brickType, colIndex) => {
        if (brickType === 0) return;
        
        const x = startX + colIndex * (brickWidth + 4);
        const y = startY + rowIndex * (brickHeight + 4);
        
        const textureKey = this.getBrickTexture(brickType);
        const brick = this.bricks.create(x, y, textureKey) as Phaser.Physics.Arcade.Sprite;
        brick.setData('type', brickType);
        
        // Set hit counts for multi-hit bricks
        if (brickType === 6) {
          this.brickHitCounts.set(brick, 2); // Silver = 2 hits
        } else if (brickType === 7) {
          this.brickHitCounts.set(brick, 3); // Gold = 3 hits
        } else if (brickType === 8) {
          this.brickHitCounts.set(brick, 999); // Metal = indestructible
        } else {
          this.brickHitCounts.set(brick, 1);
        }
        
        // Glowing effect for explosive bricks
        if (brickType === 9) {
          this.tweens.add({
            targets: brick,
            alpha: 0.7,
            duration: 500,
            yoyo: true,
            repeat: -1
          });
        }
      });
    });
  }

  private getBrickTexture(type: number): string {
    const textures: { [key: number]: string } = {
      1: 'brick_red',
      2: 'brick_blue',
      3: 'brick_green',
      4: 'brick_yellow',
      5: 'brick_purple',
      6: 'brick_silver',
      7: 'brick_gold',
      8: 'brick_metal',
      9: 'brick_explosive'
    };
    return textures[type] || 'brick_red';
  }

  private createHUD(): void {
    const { width } = this.scale;
    
    // Score
    this.scoreText = this.add.text(20, 20, `Score: ${this.score}`, {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff'
    });
    
    // Level
    this.add.text(width / 2, 20, `Level ${this.level}`, {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffdd44'
    }).setOrigin(0.5, 0);
    
    // Lives
    this.livesContainer = this.add.container(width - 20, 20);
    this.updateLivesDisplay();
  }

  private updateLivesDisplay(): void {
    this.livesContainer.removeAll(true);
    
    for (let i = 0; i < this.lives; i++) {
      const lifeIcon = this.add.image(-i * 18, 6, 'life_icon');
      this.livesContainer.add(lifeIcon);
    }
  }

  private setupCollisions(): void {
    // Ball vs Paddle
    this.physics.add.collider(this.balls, this.paddle, this.ballHitPaddle, undefined, this);
    
    // Ball vs Bricks
    this.physics.add.collider(this.balls, this.bricks, this.ballHitBrick, undefined, this);
    
    // Power-ups vs Paddle
    this.physics.add.overlap(this.paddle, this.powerUps, this.collectPowerUp, undefined, this);
    
    // Lasers vs Bricks
    this.physics.add.overlap(this.lasers, this.bricks, this.laserHitBrick, undefined, this);
  }

  private setupInput(): void {
    // Mouse/touch movement
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.paddle.x = Phaser.Math.Clamp(pointer.x, this.paddleWidth / 2, this.scale.width - this.paddleWidth / 2);
      
      // Move ball with paddle if not launched
      if (!this.isLaunched) {
        const ball = this.balls.getChildren()[0] as Phaser.Physics.Arcade.Image;
        if (ball) {
          ball.x = this.paddle.x;
        }
      }
    });
    
    // Launch ball / release caught ball
    this.input.on('pointerdown', () => {
      if (!this.isLaunched) {
        this.launchBall();
      } else if (this.isCatching) {
        this.releaseCaughtBalls();
      }
    });
  }

  private launchBall(): void {
    this.isLaunched = true;
    const ball = this.balls.getChildren()[0] as Phaser.Physics.Arcade.Image;
    if (ball && ball.body) {
      const angle = Phaser.Math.Between(-60, 60) * (Math.PI / 180);
      const vx = Math.sin(angle) * this.ballSpeed;
      const vy = -Math.cos(angle) * this.ballSpeed;
      (ball.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy);
    }
  }

  private ballHitPaddle(paddle: any, ball: any): void {
    Audio.playPaddleHit();
    
    if (this.isCatching) {
      // Catch the ball
      (ball.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      ball.y = this.paddle.y - 25;
      return;
    }
    
    // Calculate bounce angle based on hit position
    const hitPoint = (ball.x - paddle.x) / (this.paddleWidth / 2);
    const angle = hitPoint * 60 * (Math.PI / 180); // Max 60 degrees
    
    const speed = Math.sqrt(ball.body.velocity.x ** 2 + ball.body.velocity.y ** 2) || this.ballSpeed;
    const vx = Math.sin(angle) * speed;
    const vy = -Math.abs(Math.cos(angle) * speed);
    
    (ball.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy);
  }

  private releaseCaughtBalls(): void {
    this.balls.getChildren().forEach((ball: any) => {
      if (ball.body.velocity.x === 0 && ball.body.velocity.y === 0) {
        const angle = Phaser.Math.Between(-30, 30) * (Math.PI / 180);
        const vx = Math.sin(angle) * this.ballSpeed;
        const vy = -Math.abs(Math.cos(angle) * this.ballSpeed);
        (ball.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy);
      }
    });
  }

  private ballHitBrick(_ball: any, brick: any): void {
    const brickType = brick.getData('type') as number;
    let hitsLeft = this.brickHitCounts.get(brick) || 1;
    
    hitsLeft--;
    this.brickHitCounts.set(brick, hitsLeft);
    
    if (brickType === 8) {
      // Metal brick - just bounce
      Audio.playBrickHit();
      return;
    }
    
    if (hitsLeft > 0) {
      // Brick damaged but not destroyed
      Audio.playBrickHit();
      
      // Show crack for silver/gold
      if (brickType === 6 || brickType === 7) {
        const crack = this.add.image(brick.x, brick.y, 'crack');
        crack.setAlpha(0.7);
      }
      
      // Flash effect
      this.tweens.add({
        targets: brick,
        alpha: 0.5,
        duration: 50,
        yoyo: true
      });
      
      return;
    }
    
    // Brick destroyed
    this.destroyBrick(brick, brickType);
  }

  private destroyBrick(brick: any, brickType: number): void {
    Audio.playBrickBreak();
    
    // Explosive brick
    if (brickType === 9) {
      Audio.playExplosion();
      this.explodeAround(brick.x, brick.y);
    }
    
    // Score based on brick type
    const points: { [key: number]: number } = {
      1: 10, 2: 10, 3: 10, 4: 10, 5: 10,
      6: 25, 7: 50, 9: 15
    };
    this.score += points[brickType] || 10;
    this.scoreText.setText(`Score: ${this.score}`);
    
    // Destruction effect
    this.createDestructionEffect(brick.x, brick.y, BRICK_COLORS[brickType]);
    
    // Maybe drop power-up
    if (Math.random() < 0.2 && brickType !== 8) {
      this.spawnPowerUp(brick.x, brick.y);
    }
    
    brick.destroy();
    
    // Check win condition
    this.checkWinCondition();
  }

  private explodeAround(x: number, y: number): void {
    const radius = 60;
    
    // Visual explosion
    const explosion = this.add.circle(x, y, 10, 0xff6600, 1);
    this.tweens.add({
      targets: explosion,
      radius: radius,
      alpha: 0,
      duration: 300,
      onComplete: () => explosion.destroy()
    });
    
    // Destroy nearby bricks
    this.bricks.getChildren().forEach((brick: any) => {
      const dist = Phaser.Math.Distance.Between(x, y, brick.x, brick.y);
      if (dist < radius && dist > 0) {
        const brickType = brick.getData('type') as number;
        if (brickType !== 8) { // Not metal
          this.time.delayedCall(50, () => {
            if (brick.active) {
              this.destroyBrick(brick, brickType);
            }
          });
        }
      }
    });
  }

  private createDestructionEffect(x: number, y: number, color: number): void {
    for (let i = 0; i < 8; i++) {
      const particle = this.add.rectangle(x, y, 6, 6, color);
      const angle = (Math.PI * 2 / 8) * i;
      const speed = Phaser.Math.Between(50, 150);
      
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }

  private spawnPowerUp(x: number, y: number): void {
    const powerUpType = Phaser.Utils.Array.GetRandom(POWER_UPS);
    
    const powerUp = this.add.container(x, y);
    
    // Background circle
    const bg = this.add.circle(0, 0, 14, powerUpType.color, 1);
    const glow = this.add.circle(0, 0, 16, powerUpType.color, 0.3);
    const symbol = this.add.text(0, 0, powerUpType.symbol, {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    powerUp.add([glow, bg, symbol]);
    powerUp.setData('type', powerUpType.key);
    
    this.physics.world.enable(powerUp);
    (powerUp.body as Phaser.Physics.Arcade.Body).setVelocity(0, 120);
    (powerUp.body as Phaser.Physics.Arcade.Body).setSize(28, 28);
    
    this.powerUps.add(powerUp);
    
    // Pulse effect
    this.tweens.add({
      targets: glow,
      scale: 1.3,
      alpha: 0.1,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
  }

  private collectPowerUp(_paddle: any, powerUp: any): void {
    const type = powerUp.getData('type');
    
    // Check if good or bad power-up for sound
    const powerUpDef = POWER_UPS.find(p => p.key === type);
    if (powerUpDef?.good) {
      Audio.playPowerUp();
    } else {
      Audio.playPowerDown();
    }
    
    this.applyPowerUp(type);
    powerUp.destroy();
  }

  private applyPowerUp(type: string): void {
    switch (type) {
      case 'expand':
        this.paddleWidth = Math.min(160, this.paddleWidth + 30);
        this.updatePaddleSize();
        break;
        
      case 'shrink':
        this.paddleWidth = Math.max(40, this.paddleWidth - 20);
        this.updatePaddleSize();
        break;
        
      case 'multi':
        this.createMultiBalls();
        break;
        
      case 'catch':
        this.isCatching = true;
        // Auto-disable after 15 seconds
        this.time.delayedCall(15000, () => { this.isCatching = false; });
        break;
        
      case 'laser':
        this.hasLaser = true;
        this.enableLaser();
        break;
        
      case 'slow':
        this.ballSpeed = Math.max(200, this.ballSpeed - 80);
        this.updateBallSpeeds();
        break;
        
      case 'fast':
        this.ballSpeed = Math.min(600, this.ballSpeed + 80);
        this.updateBallSpeeds();
        break;
        
      case 'life':
        this.lives++;
        this.updateLivesDisplay();
        break;
    }
  }

  private updatePaddleSize(): void {
    this.paddle.setDisplaySize(this.paddleWidth, 16);
    (this.paddle.body as Phaser.Physics.Arcade.Body).setSize(this.paddleWidth, 16);
  }

  private createMultiBalls(): void {
    const existingBalls = this.balls.getChildren() as Phaser.Physics.Arcade.Image[];
    
    existingBalls.forEach(ball => {
      for (let i = 0; i < 2; i++) {
        const newBall = this.physics.add.image(ball.x, ball.y, 'ball');
        newBall.setCollideWorldBounds(true);
        newBall.setBounce(1, 1);
        (newBall.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        (newBall.body as Phaser.Physics.Arcade.Body).setCircle(8, 4, 4);
        
        const angle = (i === 0 ? -30 : 30) * (Math.PI / 180);
        const speed = this.ballSpeed;
        (newBall.body as Phaser.Physics.Arcade.Body).setVelocity(
          Math.sin(angle) * speed,
          -Math.cos(angle) * speed
        );
        
        this.balls.add(newBall);
      }
    });
    
    // Re-setup collisions for new balls
    this.physics.add.collider(this.balls, this.paddle, this.ballHitPaddle, undefined, this);
    this.physics.add.collider(this.balls, this.bricks, this.ballHitBrick, undefined, this);
  }

  private updateBallSpeeds(): void {
    this.balls.getChildren().forEach((ball: any) => {
      const body = ball.body as Phaser.Physics.Arcade.Body;
      const currentSpeed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
      if (currentSpeed > 0) {
        const ratio = this.ballSpeed / currentSpeed;
        body.setVelocity(body.velocity.x * ratio, body.velocity.y * ratio);
      }
    });
  }

  private enableLaser(): void {
    if (this.laserTimer) {
      this.laserTimer.destroy();
    }
    
    this.laserTimer = this.time.addEvent({
      delay: 300,
      callback: () => {
        if (this.hasLaser) {
          this.shootLaser();
        }
      },
      loop: true
    });
    
    // Auto-disable after 10 seconds
    this.time.delayedCall(10000, () => {
      this.hasLaser = false;
      if (this.laserTimer) {
        this.laserTimer.destroy();
      }
    });
  }

  private shootLaser(): void {
    Audio.playLaser();
    
    const laser1 = this.physics.add.image(this.paddle.x - 20, this.paddle.y - 10, 'laser');
    const laser2 = this.physics.add.image(this.paddle.x + 20, this.paddle.y - 10, 'laser');
    
    [laser1, laser2].forEach(laser => {
      (laser.body as Phaser.Physics.Arcade.Body).setVelocity(0, -500);
      this.lasers.add(laser);
    });
  }

  private laserHitBrick(laser: any, brick: any): void {
    laser.destroy();
    
    const brickType = brick.getData('type') as number;
    if (brickType === 8) return; // Metal is immune
    
    let hitsLeft = this.brickHitCounts.get(brick) || 1;
    hitsLeft--;
    this.brickHitCounts.set(brick, hitsLeft);
    
    if (hitsLeft <= 0) {
      this.destroyBrick(brick, brickType);
    } else {
      Audio.playBrickHit();
      // Add crack visual
      const crack = this.add.image(brick.x, brick.y, 'crack');
      crack.setAlpha(0.7);
    }
  }

  private checkWinCondition(): void {
    const breakableBricks = this.bricks.getChildren().filter((brick: any) => {
      return brick.getData('type') !== 8; // Not metal
    });
    
    if (breakableBricks.length === 0) {
      // Level complete!
      this.time.delayedCall(500, () => {
        this.scene.start('LevelCompleteScene', {
          level: this.level,
          score: this.score,
          lives: this.lives
        });
      });
    }
  }

  update(): void {
    // Check for lost balls
    const balls = this.balls.getChildren() as Phaser.Physics.Arcade.Image[];
    balls.forEach(ball => {
      if (ball.y > this.scale.height + 20) {
        ball.destroy();
      }
    });
    
    // Check if all balls lost
    if (this.balls.getChildren().length === 0 && this.isLaunched) {
      this.loseLife();
    }
    
    // Remove off-screen power-ups
    this.powerUps.getChildren().forEach((powerUp: any) => {
      if (powerUp.y > this.scale.height + 30) {
        powerUp.destroy();
      }
    });
    
    // Remove off-screen lasers
    this.lasers.getChildren().forEach((laser: any) => {
      if (laser.y < -20) {
        laser.destroy();
      }
    });
  }

  private loseLife(): void {
    this.lives--;
    Audio.playLifeLost();
    
    if (this.lives <= 0) {
      this.scene.start('GameOverScene', { score: this.score });
      return;
    }
    
    this.updateLivesDisplay();
    
    // Reset for next try
    this.isLaunched = false;
    this.isCatching = false;
    this.hasLaser = false;
    this.ballSpeed = this.baseSpeed;
    
    // Create new ball
    const ball = this.physics.add.image(this.paddle.x, this.paddle.y - 25, 'ball');
    ball.setCollideWorldBounds(true);
    ball.setBounce(1, 1);
    (ball.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    (ball.body as Phaser.Physics.Arcade.Body).setCircle(8, 4, 4);
    this.balls.add(ball);
    
    // Re-setup collisions
    this.physics.add.collider(this.balls, this.paddle, this.ballHitPaddle, undefined, this);
    this.physics.add.collider(this.balls, this.bricks, this.ballHitBrick, undefined, this);
  }
}
