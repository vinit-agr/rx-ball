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

const MAX_POWERUPS_PER_LEVEL = 4;

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
  private stuckFrames: Map<Phaser.Physics.Arcade.Image, number> = new Map();
  private ballHitFrame: Map<any, number> = new Map();
  private frameCount: number = 0;

  // Power-up spawn cap per level
  private powerUpsSpawned: number = 0;

  // Mobile button state
  private btnLeftDown: boolean = false;
  private btnRightDown: boolean = false;
  private btnLeft!: Phaser.GameObjects.Image;
  private btnRight!: Phaser.GameObjects.Image;

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
    this.stuckFrames.clear();
    this.ballHitFrame.clear();
    this.powerUpsSpawned = 0;
    this.btnLeftDown = false;
    this.btnRightDown = false;
  }

  create(): void {
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
    this.physics.world.setBoundsCollision(true, true, true, false);

    this.createBackground();
    this.createPaddle();
    this.createBall();
    this.createBricks();
    this.createHUD();

    this.powerUps = this.physics.add.group();
    this.lasers = this.physics.add.group();

    this.setupCollisions();
    this.setupInput();
    this.createMobileButtons();
  }

  private createBackground(): void {
    const { width, height } = this.scale as { width: number; height: number };
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

        if (brickType === 6) {
          this.brickHitCounts.set(brick, 2);
        } else if (brickType === 7) {
          this.brickHitCounts.set(brick, 3);
        } else if (brickType === 8) {
          this.brickHitCounts.set(brick, 999);
        } else {
          this.brickHitCounts.set(brick, 1);
        }

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

    this.scoreText = this.add.text(20, 20, `Score: ${this.score}`, {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff'
    });

    this.add.text(width / 2, 20, `Level ${this.level}`, {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffdd44'
    }).setOrigin(0.5, 0);

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

    // Ball vs Bricks - use overlap for manual bounce control
    this.physics.add.overlap(this.balls, this.bricks, this.ballHitBrick, undefined, this);

    // Power-ups vs Paddle
    this.physics.add.overlap(this.paddle, this.powerUps, this.collectPowerUp, undefined, this);

    // Lasers vs Bricks
    this.physics.add.overlap(this.lasers, this.bricks, this.laserHitBrick, undefined, this);
  }

  private setupInput(): void {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      // Ignore pointer events on the mobile button zones
      if (this.isPointerOnButton(pointer)) return;

      this.paddle.x = Phaser.Math.Clamp(pointer.x, this.paddleWidth / 2, this.scale.width - this.paddleWidth / 2);

      if (!this.isLaunched) {
        const ball = this.balls.getChildren()[0] as Phaser.Physics.Arcade.Image;
        if (ball) {
          ball.x = this.paddle.x;
        }
      }
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Ignore taps on mobile buttons
      if (this.isPointerOnButton(pointer)) return;

      if (!this.isLaunched) {
        this.launchBall();
      } else if (this.isCatching) {
        this.releaseCaughtBalls();
      }
    });
  }

  /** Check if a pointer is within the mobile button hit areas */
  private isPointerOnButton(pointer: Phaser.Input.Pointer): boolean {
    if (!this.btnLeft || !this.btnRight) return false;
    const r = 34; // slightly larger than visual radius for easier touch
    const lx = this.btnLeft.x, ly = this.btnLeft.y;
    const rx = this.btnRight.x, ry = this.btnRight.y;
    const dl = Phaser.Math.Distance.Between(pointer.x, pointer.y, lx, ly);
    const dr = Phaser.Math.Distance.Between(pointer.x, pointer.y, rx, ry);
    return dl < r || dr < r;
  }

  private createMobileButtons(): void {
    const { height } = this.scale;
    const btnY = height - 28;
    const PADDLE_SPEED = 8; // pixels per frame while held

    this.btnLeft = this.add.image(44, btnY, 'btn_left')
      .setInteractive()
      .setDepth(100)
      .setAlpha(0.6)
      .setScrollFactor(0);

    this.btnRight = this.add.image(this.scale.width - 44, btnY, 'btn_right')
      .setInteractive()
      .setDepth(100)
      .setAlpha(0.6)
      .setScrollFactor(0);

    // Left button events
    this.btnLeft.on('pointerdown', () => { this.btnLeftDown = true; this.btnLeft.setAlpha(1); });
    this.btnLeft.on('pointerup', () => { this.btnLeftDown = false; this.btnLeft.setAlpha(0.6); });
    this.btnLeft.on('pointerout', () => { this.btnLeftDown = false; this.btnLeft.setAlpha(0.6); });

    // Right button events
    this.btnRight.on('pointerdown', () => { this.btnRightDown = true; this.btnRight.setAlpha(1); });
    this.btnRight.on('pointerup', () => { this.btnRightDown = false; this.btnRight.setAlpha(0.6); });
    this.btnRight.on('pointerout', () => { this.btnRightDown = false; this.btnRight.setAlpha(0.6); });

    // Store speed for update loop
    this.data.set('btnPaddleSpeed', PADDLE_SPEED);
  }

  private launchBall(): void {
    this.isLaunched = true;
    const ball = this.balls.getChildren()[0] as Phaser.Physics.Arcade.Image;
    if (ball && ball.body) {
      const CONSTANT_VERTICAL_SPEED = 400;
      const angle = Phaser.Math.Between(-45, 45) * (Math.PI / 180);
      const vx = Math.sin(angle) * 200;
      const vy = -CONSTANT_VERTICAL_SPEED;
      (ball.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy);
    }
  }

  private ballHitPaddle(_paddle: any, ball: any): void {
    Audio.playPaddleHit();

    if (this.isCatching) {
      (ball.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      ball.y = this.paddle.y - 25;
      return;
    }

    const CONSTANT_VERTICAL_SPEED = 400;
    const hitPoint = (ball.x - this.paddle.x) / (this.paddleWidth / 2);
    const vx = hitPoint * 300;
    const vy = -CONSTANT_VERTICAL_SPEED;

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

  private ballHitBrick(ball: any, brick: any): void {
    // --- FIX #4: Strict one-brick-per-frame per ball ---
    const lastHitFrame = this.ballHitFrame.get(ball) || -1;
    if (lastHitFrame === this.frameCount) {
      return; // Already hit a brick this frame — skip entirely
    }
    this.ballHitFrame.set(ball, this.frameCount);

    const body = ball.body as Phaser.Physics.Arcade.Body;
    const brickType = brick.getData('type') as number;

    // Calculate bounce direction based on collision side
    const ballCenterX = ball.x;
    const ballCenterY = ball.y;
    const brickCenterX = brick.x;
    const brickCenterY = brick.y;
    const brickHalfWidth = 25;
    const brickHalfHeight = 12;
    const ballRadius = 8;

    const overlapX = (brickHalfWidth + ballRadius) - Math.abs(ballCenterX - brickCenterX);
    const overlapY = (brickHalfHeight + ballRadius) - Math.abs(ballCenterY - brickCenterY);

    if (overlapX > 0 && overlapY > 0) {
      if (overlapX < overlapY) {
        body.velocity.x = -body.velocity.x;
        if (ballCenterX < brickCenterX) {
          ball.x = brickCenterX - brickHalfWidth - ballRadius - 2;
        } else {
          ball.x = brickCenterX + brickHalfWidth + ballRadius + 2;
        }
      } else {
        body.velocity.y = -body.velocity.y;
        if (ballCenterY < brickCenterY) {
          ball.y = brickCenterY - brickHalfHeight - ballRadius - 2;
        } else {
          ball.y = brickCenterY + brickHalfHeight + ballRadius + 2;
        }
      }
    }

    // Ensure ball maintains minimum vertical speed after bounce
    const CONSTANT_VERTICAL_SPEED = 400;
    if (Math.abs(body.velocity.y) < 100) {
      const direction = body.velocity.y >= 0 ? 1 : -1;
      body.velocity.y = direction * CONSTANT_VERTICAL_SPEED;
    }

    // Handle brick damage
    let hitsLeft = this.brickHitCounts.get(brick) || 1;
    hitsLeft--;
    this.brickHitCounts.set(brick, hitsLeft);

    if (brickType === 8) {
      Audio.playBrickHit();
      return;
    }

    if (hitsLeft > 0) {
      Audio.playBrickHit();

      if (brickType === 6 || brickType === 7) {
        const crack = this.add.image(brick.x, brick.y, 'crack');
        crack.setAlpha(0.7);
      }

      this.tweens.add({
        targets: brick,
        alpha: 0.5,
        duration: 50,
        yoyo: true
      });

      return;
    }

    this.destroyBrick(brick, brickType);
  }

  private destroyBrick(brick: any, brickType: number): void {
    Audio.playBrickBreak();

    if (brickType === 9) {
      Audio.playExplosion();
      this.explodeAround(brick.x, brick.y);
    }

    const points: { [key: number]: number } = {
      1: 10, 2: 10, 3: 10, 4: 10, 5: 10,
      6: 25, 7: 50, 9: 15
    };
    this.score += points[brickType] || 10;
    this.scoreText.setText(`Score: ${this.score}`);

    this.createDestructionEffect(brick.x, brick.y, BRICK_COLORS[brickType]);

    // --- FIX #3: Cap power-up spawns per level ---
    if (this.powerUpsSpawned < MAX_POWERUPS_PER_LEVEL && Math.random() < 0.15 && brickType !== 8) {
      this.spawnPowerUp(brick.x, brick.y);
      this.powerUpsSpawned++;
    }

    brick.destroy();
    this.checkWinCondition();
  }

  private explodeAround(x: number, y: number): void {
    const radius = 60;

    const explosion = this.add.circle(x, y, 10, 0xff6600, 1);
    this.tweens.add({
      targets: explosion,
      radius: radius,
      alpha: 0,
      duration: 300,
      onComplete: () => explosion.destroy()
    });

    this.bricks.getChildren().forEach((brick: any) => {
      const dist = Phaser.Math.Distance.Between(x, y, brick.x, brick.y);
      if (dist < radius && dist > 0) {
        const brickType = brick.getData('type') as number;
        if (brickType !== 8) {
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

    const key = `powerup_${powerUpType.key}_${Date.now()}`;
    const graphics = this.make.graphics({ x: 0, y: 0 });

    graphics.fillStyle(powerUpType.color, 0.3);
    graphics.fillCircle(16, 16, 16);
    graphics.fillStyle(powerUpType.color, 1);
    graphics.fillCircle(16, 16, 14);
    graphics.fillStyle(0xffffff, 0.4);
    graphics.fillCircle(16, 12, 6);

    graphics.generateTexture(key, 32, 32);
    graphics.destroy();

    const powerUp = this.powerUps.create(x, y, key) as Phaser.Physics.Arcade.Sprite;
    powerUp.setData('type', powerUpType.key);

    const body = powerUp.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocityY(150);
    body.setSize(28, 28);

    const symbol = this.add.text(x, y, powerUpType.symbol, {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    powerUp.setData('symbol', symbol);

    this.tweens.add({
      targets: powerUp,
      scale: 1.15,
      duration: 400,
      yoyo: true,
      repeat: -1
    });
  }

  private collectPowerUp(_paddle: any, powerUp: any): void {
    const type = powerUp.getData('type');

    const powerUpDef = POWER_UPS.find(p => p.key === type);
    if (powerUpDef?.good) {
      Audio.playPowerUp();
    } else {
      Audio.playPowerDown();
    }

    this.applyPowerUp(type);

    const symbol = powerUp.getData('symbol') as Phaser.GameObjects.Text;
    if (symbol) symbol.destroy();

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

    // FIX #2: Use correct collision types — collider for paddle, overlap for bricks
    // Re-add collisions so the new balls are included in the physics group checks
    this.physics.add.collider(this.balls, this.paddle, this.ballHitPaddle, undefined, this);
    this.physics.add.overlap(this.balls, this.bricks, this.ballHitBrick, undefined, this);
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
    if (brickType === 8) return;

    let hitsLeft = this.brickHitCounts.get(brick) || 1;
    hitsLeft--;
    this.brickHitCounts.set(brick, hitsLeft);

    if (hitsLeft <= 0) {
      this.destroyBrick(brick, brickType);
    } else {
      Audio.playBrickHit();
      const crack = this.add.image(brick.x, brick.y, 'crack');
      crack.setAlpha(0.7);
    }
  }

  private checkWinCondition(): void {
    const breakableBricks = this.bricks.getChildren().filter((brick: any) => {
      return brick.getData('type') !== 8;
    });

    if (breakableBricks.length === 0) {
      this.time.delayedCall(500, () => {
        this.scene.start('LevelCompleteScene', {
          level: this.level,
          score: this.score,
          lives: this.lives
        });
      });
    }
  }

  preUpdate(): void {
    this.frameCount++;
  }

  update(): void {
    const gameWidth = 480;
    const gameHeight = 800;
    const ballRadius = 8;

    // --- FIX #1: Mobile button paddle movement ---
    const btnSpeed = (this.data.get('btnPaddleSpeed') as number) || 8;
    if (this.btnLeftDown) {
      this.paddle.x = Phaser.Math.Clamp(
        this.paddle.x - btnSpeed,
        this.paddleWidth / 2,
        this.scale.width - this.paddleWidth / 2
      );
      if (!this.isLaunched) {
        const ball = this.balls.getChildren()[0] as Phaser.Physics.Arcade.Image;
        if (ball) ball.x = this.paddle.x;
      }
    }
    if (this.btnRightDown) {
      this.paddle.x = Phaser.Math.Clamp(
        this.paddle.x + btnSpeed,
        this.paddleWidth / 2,
        this.scale.width - this.paddleWidth / 2
      );
      if (!this.isLaunched) {
        const ball = this.balls.getChildren()[0] as Phaser.Physics.Arcade.Image;
        if (ball) ball.x = this.paddle.x;
      }
    }

    // Check for lost balls AND manually enforce boundaries
    const balls = this.balls.getChildren() as Phaser.Physics.Arcade.Image[];
    balls.forEach(ball => {
      const body = ball.body as Phaser.Physics.Arcade.Body;

      if (ball.y > gameHeight + 20) {
        this.stuckFrames.delete(ball);
        ball.destroy();
        return;
      }

      if (ball.x - ballRadius < 0) {
        ball.x = ballRadius;
        body.velocity.x = Math.abs(body.velocity.x);
      }

      if (ball.x + ballRadius > gameWidth) {
        ball.x = gameWidth - ballRadius;
        body.velocity.x = -Math.abs(body.velocity.x);
      }

      if (ball.y - ballRadius < 0) {
        ball.y = ballRadius;
        body.velocity.y = Math.abs(body.velocity.y);
      }

      const CONSTANT_VERTICAL_SPEED = 400;
      const vx = body.velocity.x;
      const vy = body.velocity.y;
      const speed = Math.sqrt(vx * vx + vy * vy);

      if (speed > 50 && Math.abs(vy) < 100) {
        const currentStuck = this.stuckFrames.get(ball) || 0;
        this.stuckFrames.set(ball, currentStuck + 1);

        if (currentStuck > 10) {
          const goingDown = ball.y < gameHeight / 2;
          body.setVelocity(vx, goingDown ? CONSTANT_VERTICAL_SPEED : -CONSTANT_VERTICAL_SPEED);
          this.stuckFrames.set(ball, 0);
        }
      } else {
        this.stuckFrames.set(ball, 0);
      }
    });

    if (this.balls.getChildren().length === 0 && this.isLaunched) {
      this.loseLife();
    }

    this.powerUps.getChildren().forEach((powerUp: any) => {
      const symbol = powerUp.getData('symbol') as Phaser.GameObjects.Text;
      if (symbol) {
        symbol.setPosition(powerUp.x, powerUp.y);
      }

      if (powerUp.y > this.scale.height + 30) {
        if (symbol) symbol.destroy();
        powerUp.destroy();
      }
    });

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

    this.isLaunched = false;
    this.isCatching = false;
    this.hasLaser = false;
    this.ballSpeed = this.baseSpeed;

    const ball = this.physics.add.image(this.paddle.x, this.paddle.y - 25, 'ball');
    ball.setCollideWorldBounds(true);
    ball.setBounce(1, 1);
    (ball.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    (ball.body as Phaser.Physics.Arcade.Body).setCircle(8, 4, 4);
    this.balls.add(ball);

    // FIX #2: Use correct collision types — collider for paddle, overlap for bricks
    this.physics.add.collider(this.balls, this.paddle, this.ballHitPaddle, undefined, this);
    this.physics.add.overlap(this.balls, this.bricks, this.ballHitBrick, undefined, this);
  }
}
