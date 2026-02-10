// Game dimensions - base design resolution
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 800;

// Paddle
export const PADDLE_WIDTH = 80;
export const PADDLE_HEIGHT = 16;
export const PADDLE_Y_OFFSET = 60; // distance from bottom
export const PADDLE_MIN_WIDTH = 50;
export const PADDLE_MAX_WIDTH = 140;

// Ball
export const BALL_RADIUS = 7;
export const BALL_SPEED = 300;
export const BALL_SPEED_INCREMENT = 5; // per brick broken
export const BALL_MAX_SPEED = 500;
export const BALL_MIN_ANGLE = 15; // degrees from horizontal, prevents too-flat bounces

// Bricks
export const BRICK_WIDTH = 42;
export const BRICK_HEIGHT = 18;
export const BRICK_PADDING = 2;
export const BRICK_COLS = 10;
export const BRICK_TOP_OFFSET = 80;

// Power-ups
export const POWERUP_SIZE = 20;
export const POWERUP_SPEED = 120;
export const POWERUP_CHANCE = 0.20;
export const POWERUP_DURATION = 10000; // ms for timed power-ups

// Lives
export const STARTING_LIVES = 3;

// Colors
export const COLORS = {
  bg_top: 0x0a0a2e,
  bg_bottom: 0x1a0a3e,
  paddle: 0x4488ff,
  ball: 0xffffff,
  ball_glow: 0x88ccff,
  brick_red: 0xff4444,
  brick_blue: 0x4488ff,
  brick_green: 0x44cc44,
  brick_yellow: 0xffcc00,
  brick_purple: 0xcc44cc,
  brick_silver: 0xcccccc,
  brick_gold: 0xffaa00,
  brick_metal: 0x888899,
  brick_explosive: 0xff6600,
  hud_text: 0xffffff,
};

// Brick types
export enum BrickType {
  RED = 'red',
  BLUE = 'blue',
  GREEN = 'green',
  YELLOW = 'yellow',
  PURPLE = 'purple',
  SILVER = 'silver',
  GOLD = 'gold',
  METAL = 'metal',
  EXPLOSIVE = 'explosive',
}

export const BRICK_HP: Record<BrickType, number> = {
  [BrickType.RED]: 1,
  [BrickType.BLUE]: 1,
  [BrickType.GREEN]: 1,
  [BrickType.YELLOW]: 1,
  [BrickType.PURPLE]: 1,
  [BrickType.SILVER]: 2,
  [BrickType.GOLD]: 3,
  [BrickType.METAL]: -1, // indestructible
  [BrickType.EXPLOSIVE]: 1,
};

export const BRICK_COLORS: Record<BrickType, number> = {
  [BrickType.RED]: COLORS.brick_red,
  [BrickType.BLUE]: COLORS.brick_blue,
  [BrickType.GREEN]: COLORS.brick_green,
  [BrickType.YELLOW]: COLORS.brick_yellow,
  [BrickType.PURPLE]: COLORS.brick_purple,
  [BrickType.SILVER]: COLORS.brick_silver,
  [BrickType.GOLD]: COLORS.brick_gold,
  [BrickType.METAL]: COLORS.brick_metal,
  [BrickType.EXPLOSIVE]: COLORS.brick_explosive,
};

export const BRICK_POINTS: Record<BrickType, number> = {
  [BrickType.RED]: 10,
  [BrickType.BLUE]: 10,
  [BrickType.GREEN]: 10,
  [BrickType.YELLOW]: 10,
  [BrickType.PURPLE]: 10,
  [BrickType.SILVER]: 25,
  [BrickType.GOLD]: 50,
  [BrickType.METAL]: 0,
  [BrickType.EXPLOSIVE]: 15,
};

// Power-up types
export enum PowerUpType {
  EXPAND = 'expand',
  SHRINK = 'shrink',
  MULTI = 'multi',
  CATCH = 'catch',
  LASER = 'laser',
  SLOW = 'slow',
  FAST = 'fast',
  EXTRA_LIFE = 'extra_life',
}

export const POWERUP_COLORS: Record<PowerUpType, number> = {
  [PowerUpType.EXPAND]: 0x44cc44,
  [PowerUpType.SHRINK]: 0xff4444,
  [PowerUpType.MULTI]: 0x4488ff,
  [PowerUpType.CATCH]: 0xffcc00,
  [PowerUpType.LASER]: 0xcc44cc,
  [PowerUpType.SLOW]: 0x00cccc,
  [PowerUpType.FAST]: 0xff8800,
  [PowerUpType.EXTRA_LIFE]: 0xff66aa,
};

export const POWERUP_LABELS: Record<PowerUpType, string> = {
  [PowerUpType.EXPAND]: 'E',
  [PowerUpType.SHRINK]: 'S',
  [PowerUpType.MULTI]: 'M',
  [PowerUpType.CATCH]: 'C',
  [PowerUpType.LASER]: 'L',
  [PowerUpType.SLOW]: 'SL',
  [PowerUpType.FAST]: 'F',
  [PowerUpType.EXTRA_LIFE]: '\u2665',
};
