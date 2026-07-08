/**
 * Tether — Pendulum Physics Engine
 *
 * Fixed-timestep pendulum simulation.
 * A mass (player) swings from a fixed point (grapple) on a rope of length L.
 * Gravity pulls the mass down; the tether constrains it to a circular arc.
 *
 * Only ~20 lines of actual math — but it's the heart of the game.
 */

import type { Vec2 } from '../types';

export interface PendulumState {
  angle: number;         // radians from vertical (0 = straight down)
  angularVel: number;    // radians/sec
  tetherLength: number;
  pivotX: number;
  pivotY: number;
  massX: number;
  massY: number;
}

const GRAVITY = 980;  // pixels/sec² — feels right at 60fps

/**
 * Initialize pendulum state from angle and tether length
 * angleDeg: degrees measured from horizontal (0° = right, 90° = up)
 */
export function initPendulum(
  pivotX: number, pivotY: number,
  startX: number, startY: number,
  tetherLength: number,
  angleDeg: number
): PendulumState {
  const angleRad = (90 - angleDeg) * Math.PI / 180; // Convert from horizontal to vertical ref

  return {
    angle: angleRad,
    angularVel: 0,
    tetherLength,
    pivotX,
    pivotY,
    massX: startX,
    massY: startY,
  };
}

/**
 * Step the pendulum forward by dt seconds using Verlet integration
 * (more stable than Euler for pendulum systems)
 */
export function stepPendulum(state: PendulumState, dt: number): void {
  if (dt <= 0) return;

  // Angular acceleration: α = -(g/L) * sin(θ)
  // This is the small-angle approximation naturally — but we use full sin()
  const alpha = -(GRAVITY / state.tetherLength) * Math.sin(state.angle);

  // Symplectic Euler (semi-implicit): update velocity first, then position
  state.angularVel += alpha * dt;
  state.angle += state.angularVel * dt;

  // Convert polar coords (angle, tetherLength) to cartesian (x, y)
  // angle=0 is straight down from pivot
  state.massX = state.pivotX + state.tetherLength * Math.sin(state.angle);
  state.massY = state.pivotY + state.tetherLength * Math.cos(state.angle);
}

/**
 * Check if the mass has reached the target platform
 * target: center of target platform
 * radius: how close the mass needs to be to "land"
 */
export function checkLanding(
  state: PendulumState,
  targetX: number, targetY: number,
  radius: number = 30
): boolean {
  const dx = state.massX - targetX;
  const dy = state.massY - targetY;
  return Math.sqrt(dx * dx + dy * dy) < radius;
}

/**
 * Check if the mass has fallen below the canyon floor
 */
export function checkFell(state: PendulumState, floorY: number): boolean {
  return state.massY > floorY;
}

/**
 * Get the instantaneous velocity vector of the pendulum mass
 */
export function getVelocity(state: PendulumState): Vec2 {
  // Tangential velocity: v = L * ω, direction is perpendicular to the tether
  const perpX = Math.cos(state.angle);
  const perpY = -Math.sin(state.angle);
  const speed = state.tetherLength * state.angularVel;
  return {
    x: perpX * speed,
    y: perpY * speed,
  };
}
