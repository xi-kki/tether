/**
 * Tether — Level Definitions
 *
 * Each level: start ledge → grapple point → target platform
 * Player must compute angle and hold time to land perfectly.
 */

import type { Level } from '../types';

function lvl(
  id: number, sx: number, sy: number, tx: number, ty: number,
  gx: number, gy: number, hint: string, angle: number,
  dist: number, rate: number, hold: number, diff: number,
  distractors: number[]
): Level {
  return {
    id, hint, correctAngle: angle,
    startPos: { x: sx, y: sy },
    targetPos: { x: tx, y: ty },
    grapplePoint: { x: gx, y: gy },
    canyonWidth: Math.abs(tx - sx),
    distance: dist, extensionRate: rate, correctHoldTime: hold,
    difficulty: diff, distractors,
  };
}

export const LEVELS: Level[] = [
  // Level 1: Tutorial — direct angle, fixed hold
  lvl(1, 100, 450, 500, 450, 300, 200,
    'The complement of 30°', 60,
    80, 20, 4, 1,
    [30, 45, 60]),

  // Level 2: 45-degree shot
  lvl(2, 80, 420, 480, 420, 280, 180,
    'The supplement of 135°', 45,
    90, 20, 4.5, 1,
    [30, 45, 60]),

  // Level 3: Steeper angle
  lvl(3, 100, 450, 600, 400, 350, 150,
    'tan(θ) = 1 — what is θ?', 45,
    100, 15, 6.67, 2,
    [30, 45, 60, 90]),

  // Level 4: Longer tether
  lvl(4, 80, 440, 550, 440, 310, 160,
    'A 3-4-5 triangle has base 3, height 4. What is the acute angle?', 53,
    120, 15, 8, 2,
    [30, 45, 53, 60]),

  // Level 5: Distractors close
  lvl(5, 100, 460, 650, 420, 380, 130,
    'A right triangle has sides 5, 12, 13. The small angle is?', 23,
    140, 12, 11.67, 3,
    [20, 23, 30, 45]),

  // Level 6: Complements
  lvl(6, 80, 450, 700, 430, 390, 140,
    'Two angles are complementary. One is 35°. The other is?', 55,
    150, 12, 12.5, 3,
    [35, 45, 55, 65]),

  // Level 7: Speed increase
  lvl(7, 100, 440, 750, 410, 420, 120,
    'sin(θ) = 0.5. What is θ?', 30,
    160, 10, 16, 4,
    [15, 30, 45, 60]),

  // Level 8: Supplementary
  lvl(8, 80, 450, 800, 400, 440, 110,
    'cos(θ) = 0.866. What is θ? (round to nearest degree)', 30,
    180, 10, 18, 4,
    [15, 30, 45, 60]),

  // Level 9: Two-step
  lvl(9, 100, 460, 850, 440, 480, 100,
    'If sin(θ) = cos(θ), what is θ?', 45,
    200, 8, 25, 5,
    [30, 45, 60, 90]),

  // Level 10: Inverse
  lvl(10, 80, 440, 900, 420, 500, 90,
    'θ + 2θ = 90°. What is θ?', 30,
    220, 8, 27.5, 5,
    [15, 30, 45, 60]),

  // Level 11: Multiple step
  lvl(11, 100, 450, 950, 400, 530, 80,
    'A ramp rises 3m over 9m run. The angle of incline is?', 18,
    240, 6, 40, 6,
    [12, 18, 27, 33]),

  // Level 12: Final — everything
  lvl(12, 80, 460, 1000, 420, 550, 70,
    'The angle whose tangent is 2.5 (nearest degree)', 68,
    260, 5, 52, 6,
    [45, 58, 63, 68]),
];
