// Brick types:
// 0 = empty
// 1-5 = standard bricks (red, blue, green, yellow, purple)
// 6 = silver (2 hits)
// 7 = gold (3 hits)
// 8 = indestructible metal
// 9 = explosive

export interface LevelData {
  bricks: number[][];
  name: string;
}

export const LEVELS: LevelData[] = [
  // Level 1: Simple rows
  {
    name: "First Steps",
    bricks: [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [2, 2, 2, 2, 2, 2, 2, 2],
      [3, 3, 3, 3, 3, 3, 3, 3],
      [4, 4, 4, 4, 4, 4, 4, 4],
      [5, 5, 5, 5, 5, 5, 5, 5],
    ]
  },
  // Level 2: Pyramid
  {
    name: "Pyramid",
    bricks: [
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 2, 2, 2, 2, 0, 0],
      [0, 3, 3, 3, 3, 3, 3, 0],
      [4, 4, 4, 4, 4, 4, 4, 4],
      [5, 5, 5, 5, 5, 5, 5, 5],
      [1, 1, 1, 1, 1, 1, 1, 1],
    ]
  },
  // Level 3: Checkerboard
  {
    name: "Checkerboard",
    bricks: [
      [1, 0, 2, 0, 1, 0, 2, 0],
      [0, 3, 0, 4, 0, 3, 0, 4],
      [5, 0, 1, 0, 5, 0, 1, 0],
      [0, 2, 0, 3, 0, 2, 0, 3],
      [4, 0, 5, 0, 4, 0, 5, 0],
      [0, 1, 0, 2, 0, 1, 0, 2],
    ]
  },
  // Level 4: Silver introduction
  {
    name: "Silver Lining",
    bricks: [
      [6, 6, 6, 6, 6, 6, 6, 6],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [2, 2, 2, 2, 2, 2, 2, 2],
      [6, 6, 6, 6, 6, 6, 6, 6],
      [3, 3, 3, 3, 3, 3, 3, 3],
      [4, 4, 4, 4, 4, 4, 4, 4],
    ]
  },
  // Level 5: Diamond with gold
  {
    name: "Golden Diamond",
    bricks: [
      [0, 0, 0, 7, 7, 0, 0, 0],
      [0, 0, 6, 1, 1, 6, 0, 0],
      [0, 6, 2, 2, 2, 2, 6, 0],
      [7, 3, 3, 3, 3, 3, 3, 7],
      [0, 6, 4, 4, 4, 4, 6, 0],
      [0, 0, 6, 5, 5, 6, 0, 0],
      [0, 0, 0, 7, 7, 0, 0, 0],
    ]
  },
  // Level 6: Explosive fun
  {
    name: "Explosive",
    bricks: [
      [1, 1, 9, 1, 1, 9, 1, 1],
      [2, 2, 2, 2, 2, 2, 2, 2],
      [3, 9, 3, 3, 3, 3, 9, 3],
      [4, 4, 4, 4, 4, 4, 4, 4],
      [5, 5, 9, 5, 5, 9, 5, 5],
      [6, 6, 6, 6, 6, 6, 6, 6],
    ]
  },
  // Level 7: Metal barriers
  {
    name: "Steel Walls",
    bricks: [
      [1, 1, 8, 0, 0, 8, 1, 1],
      [2, 2, 8, 0, 0, 8, 2, 2],
      [3, 3, 8, 7, 7, 8, 3, 3],
      [4, 4, 8, 6, 6, 8, 4, 4],
      [5, 5, 8, 0, 0, 8, 5, 5],
      [6, 6, 8, 0, 0, 8, 6, 6],
      [1, 1, 8, 9, 9, 8, 1, 1],
    ]
  },
  // Level 8: Hard mix
  {
    name: "The Gauntlet",
    bricks: [
      [7, 6, 7, 6, 7, 6, 7, 6],
      [8, 1, 8, 2, 8, 3, 8, 4],
      [9, 5, 9, 1, 9, 2, 9, 3],
      [8, 4, 8, 5, 8, 1, 8, 2],
      [7, 6, 7, 6, 7, 6, 7, 6],
      [3, 4, 5, 1, 2, 3, 4, 5],
      [6, 6, 6, 6, 6, 6, 6, 6],
    ]
  },
  // Level 9: Fortress
  {
    name: "Fortress",
    bricks: [
      [8, 8, 8, 8, 8, 8, 8, 8],
      [8, 7, 7, 9, 9, 7, 7, 8],
      [8, 7, 1, 1, 1, 1, 7, 8],
      [8, 6, 2, 2, 2, 2, 6, 8],
      [8, 6, 3, 3, 3, 3, 6, 8],
      [8, 7, 4, 4, 4, 4, 7, 8],
      [8, 7, 7, 9, 9, 7, 7, 8],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ]
  },
  // Level 10: Final Challenge
  {
    name: "Final Challenge",
    bricks: [
      [7, 7, 7, 7, 7, 7, 7, 7],
      [7, 8, 9, 8, 8, 9, 8, 7],
      [7, 9, 6, 6, 6, 6, 9, 7],
      [7, 8, 6, 1, 1, 6, 8, 7],
      [7, 8, 6, 2, 2, 6, 8, 7],
      [7, 9, 6, 6, 6, 6, 9, 7],
      [7, 8, 9, 8, 8, 9, 8, 7],
      [7, 7, 7, 7, 7, 7, 7, 7],
    ]
  }
];

export const BRICK_COLORS: { [key: number]: number } = {
  1: 0xff4444,  // red
  2: 0x4444ff,  // blue
  3: 0x44ff44,  // green
  4: 0xffff44,  // yellow
  5: 0xaa44ff,  // purple
  6: 0xcccccc,  // silver
  7: 0xffd700,  // gold
  8: 0x666688,  // metal
  9: 0xff6600   // explosive
};
