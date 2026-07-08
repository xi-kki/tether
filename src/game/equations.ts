/**
 * Tether — Equation Generator
 *
 * Generates geometry/trig clues for grapple angles.
 * Called from Web Worker — never blocks main thread.
 */

export interface EquationData {
  hint: string;
  correctAngle: number;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Level 1: Complementary angles */
function genComplement(): EquationData {
  const a = pick([20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70]);
  const b = 90 - a;
  const hint = `The complement of ${a}°`;
  return { hint, correctAngle: b };
}

/** Level 2: Supplementary angles */
function genSupplement(): EquationData {
  const a = pick([100, 110, 120, 130, 135, 140, 150]);
  const b = 180 - a;
  const hint = `The supplement of ${a}°`;
  return { hint, correctAngle: b };
}

/** Level 3: Basic trig ratios */
function genTrig(): EquationData {
  const probs: EquationData[] = [
    { hint: 'sin(θ) = 0.5. What is θ?', correctAngle: 30 },
    { hint: 'cos(θ) = 0.866. What is θ?', correctAngle: 30 },
    { hint: 'tan(θ) = 1. What is θ?', correctAngle: 45 },
    { hint: 'sin(θ) = 0.707. What is θ? (nearest deg)', correctAngle: 45 },
    { hint: 'cos(θ) = 0.5. What is θ?', correctAngle: 60 },
    { hint: 'tan(θ) = 1.732. What is θ?', correctAngle: 60 },
  ];
  return pick(probs);
}

/** Level 4: 3-4-5 triangle angles */
function genTriangle(): EquationData {
  const probs: EquationData[] = [
    { hint: 'A 3-4-5 triangle. Smallest angle (nearest deg)', correctAngle: 37 },
    { hint: 'A 3-4-5 triangle. Middle angle (nearest deg)', correctAngle: 53 },
    { hint: 'A 5-12-13 triangle. Smallest angle', correctAngle: 23 },
    { hint: 'A 5-12-13 triangle. Middle angle', correctAngle: 67 },
    { hint: 'A right triangle with legs 8 and 6. Angle opposite the 6', correctAngle: 37 },
  ];
  return pick(probs);
}

/** Level 5: Two-step angle equations */
function genTwoStep(): EquationData {
  const probs: EquationData[] = [
    { hint: 'θ + 2θ = 90. What is θ?', correctAngle: 30 },
    { hint: '3θ - 15 = 60. What is θ?', correctAngle: 25 },
    { hint: 'θ + 25 = 90 - θ. What is θ?', correctAngle: 32.5 },
    { hint: '2(θ + 10) = θ + 40. What is θ?', correctAngle: 20 },
    { hint: '4θ = θ + 75. What is θ?', correctAngle: 25 },
  ];
  return pick(probs);
}

/** Level 6: Inverse / applied trig */
function genApplied(): EquationData {
  const probs: EquationData[] = [
    { hint: 'sin⁻¹(0.8) = θ. Nearest degree', correctAngle: 53 },
    { hint: 'cos⁻¹(0.3) = θ. Nearest degree', correctAngle: 73 },
    { hint: 'A ramp rises 4m over 7m. Angle of incline?', correctAngle: 30 },
    { hint: 'A 10m ladder against a wall reaches 6m. Angle at ground?', correctAngle: 53 },
    { hint: 'tan⁻¹(2.5) = θ. Nearest degree', correctAngle: 68 },
  ];
  return pick(probs);
}

export function generateEquation(difficulty: number): EquationData {
  const clamped = Math.min(6, Math.max(1, difficulty));
  const generators = [
    genComplement, genSupplement, genTrig,
    genTriangle, genTwoStep, genApplied,
  ];
  return generators[clamped - 1]();
}
