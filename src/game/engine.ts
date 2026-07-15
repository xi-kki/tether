/**
 * Tether — Game Engine
 *
 * State machine, level progression, input handling.
 * Engine owns the pendulum physics and feeds it to the renderer.
 * Zero React imports. Zero DOM. Pure logic.
 */

import type { PlayerState, Spark, Vec2 } from '../types';
import { COLORS } from '../types';
import { LEVELS } from './levels';
import { initPendulum, stepPendulum, checkLanding, checkFell, PendulumState } from './physics';
import { playPerfect, playOk, playCrash, playVictory, playSwing } from './audio';

export type GamePhase = 'menu' | 'tutorial' | 'playing' | 'paused' | 'swinging' | 'landed' | 'crashed' | 'complete' | 'levelSelect';

export class GameEngine {
  phase: GamePhase = 'menu';
  levelIndex = 0;
  score = 0;
  combo = 0;
  player: PlayerState;
  pendulum: PendulumState | null = null;
  sparks: Spark[] = [];
  shakeIntensity = 0;

  // Input
  inputBuffer = '';
  currentInput = '';
  holdStartTime = 0;
  isHolding = false;
  displayedAngle = 0;
  displayedHoldTime = 0;

  // Level results
  levelResults: ('perfect' | 'ok' | 'fail')[] = [];

  // Callbacks
  onUpdate?: () => void;

  // Canyon floor (rendered as bottom of screen)
  floorY = 550;
  width = 800;
  height = 600;

  // Statistics
  stats = {
    totalPlays: 0,
    totalPerfects: 0,
    totalCrashes: 0,
    bestCombo: 0,
    bestScore: 0,
    totalLevelsCompleted: 0,
    perfectStreak: 0,
    bestPerfectStreak: 0,
  };

  // Achievements
  achievements: string[] = [];

  // Pause
  private paused = false;

  constructor() {
    this.player = this.defaultPlayer();
  }

  private defaultPlayer(): PlayerState {
    return {
      x: 0, y: 0, swinging: false, angle: 0,
      tetherLength: 0, heldTime: 0, isHolding: false,
      attached: false, velocity: { x: 0, y: 0 },
      phase: 'idle', grappleX: 0, grappleY: 0,
    };
  }

  resize(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.floorY = h * 0.92;
  }

  /** Reset and load a level */
  loadLevel(index: number) {
    if (index >= LEVELS.length) {
      this.phase = 'complete';
      return;
    }
    this.levelIndex = index;
    const level = LEVELS[index];
    this.phase = 'playing';
    this.player = {
      x: level.startPos.x,
      y: level.startPos.y,
      swinging: false,
      angle: 0,
      tetherLength: 0,
      heldTime: 0,
      isHolding: false,
      attached: false,
      velocity: { x: 0, y: 0 },
      phase: 'idle',
      grappleX: 0,
      grappleY: 0,
    };
    this.pendulum = null;
    this.sparks = [];
    this.shakeIntensity = 0;
    this.inputBuffer = '';
    this.currentInput = '';
    this.isHolding = false;
    this.displayedAngle = 0;
    this.displayedHoldTime = 0;
  }

  /** Start game from level 0 */
  start() {
    this.score = 0;
    this.combo = 0;
    this.levelResults = [];
    this.stats.totalPlays++;
    this.loadLevel(0);
  }

  /** Start from specific level */
  startFromLevel(index: number) {
    this.score = 0;
    this.combo = 0;
    this.levelResults = [];
    this.loadLevel(index);
  }

  /** Toggle pause */
  togglePause() {
    if (this.phase === 'playing' || this.phase === 'paused') {
      if (this.phase === 'paused') {
        this.phase = 'playing';
      } else {
        this.phase = 'paused';
      }
      if (this.onUpdate) this.onUpdate();
    }
  }

  /** Show tutorial */
  showTutorial() {
    this.phase = 'tutorial';
    if (this.onUpdate) this.onUpdate();
  }

  /** Show level select */
  showLevelSelect() {
    this.phase = 'levelSelect';
    if (this.onUpdate) this.onUpdate();
  }

  /** Check and unlock achievements */
  private checkAchievements() {
    const newAchievements: string[] = [];

    if (this.stats.totalPlays === 1 && !this.achievements.includes('first-swing')) {
      newAchievements.push('first-swing');
    }
    if (this.stats.totalPerfects >= 1 && !this.achievements.includes('perfect-landing')) {
      newAchievements.push('perfect-landing');
    }
    if (this.stats.totalPerfects >= 5 && !this.achievements.includes('perfectionist')) {
      newAchievements.push('perfectionist');
    }
    if (this.stats.bestCombo >= 3 && !this.achievements.includes('combo-master')) {
      newAchievements.push('combo-master');
    }
    if (this.stats.bestCombo >= 6 && !this.achievements.includes('unstoppable')) {
      newAchievements.push('unstoppable');
    }
    if (this.stats.bestCombo >= 12 && !this.achievements.includes('legendary')) {
      newAchievements.push('legendary');
    }
    if (this.stats.totalCrashes === 0 && this.stats.totalPlays > 0 && !this.achievements.includes('no-crash')) {
      newAchievements.push('no-crash');
    }
    if (this.stats.bestScore >= 3000 && !this.achievements.includes('high-scorer')) {
      newAchievements.push('high-scorer');
    }
    if (this.stats.bestScore >= 6000 && !this.achievements.includes('score-legend')) {
      newAchievements.push('score-legend');
    }
    if (this.levelResults.length >= 12 && !this.achievements.includes('level-master')) {
      newAchievements.push('level-master');
    }
    if (this.stats.perfectStreak >= 3 && !this.achievements.includes('streak-3')) {
      newAchievements.push('streak-3');
    }
    if (this.stats.perfectStreak >= 6 && !this.achievements.includes('streak-6')) {
      newAchievements.push('streak-6');
    }

    for (const a of newAchievements) {
      if (!this.achievements.includes(a)) {
        this.achievements.push(a);
      }
    }
  }

  /** Handle angle input (typed by player) */
  submitAngle() {
    if (this.phase !== 'playing') return;
    if (this.player.phase !== 'idle') return;

    const input = this.inputBuffer.trim();
    if (!input) return;

    const angle = parseInt(input);
    if (isNaN(angle) || angle < 0 || angle > 180) {
      this.inputBuffer = '';
      return;
    }

    this.displayedAngle = angle;
    this.player.angle = angle;
    this.player.phase = 'aiming';
    this.inputBuffer = '';
  }

  /** Start holding for tether length */
  startHold() {
    if (this.player.phase !== 'aiming') return;
    this.player.phase = 'holding';
    this.player.isHolding = true;
    this.player.heldTime = 0;
    this.holdStartTime = performance.now();
    this.isHolding = true;
  }

  /** Stop holding — fire the grapple! */
  releaseHold() {
    if (this.player.phase !== 'holding') return;
    this.player.isHolding = false;
    this.isHolding = false;

    const level = LEVELS[this.levelIndex];
    const holdTime = this.player.heldTime;
    this.displayedHoldTime = holdTime;
    const tetherLength = holdTime * level.extensionRate;

    this.player.tetherLength = tetherLength;
    this.player.grappleX = level.grapplePoint.x;
    this.player.grappleY = level.grapplePoint.y;

    // Init pendulum
    this.pendulum = initPendulum(
      level.grapplePoint.x, level.grapplePoint.y,
      this.player.x, this.player.y,
      tetherLength,
      this.player.angle
    );

    this.player.phase = 'swinging';
    this.phase = 'swinging';
    this.player.swinging = true;
    playSwing();
  }

  /** Evaluate the swing result */
  private evaluateSwing() {
    const level = LEVELS[this.levelIndex];
    const correctAngle = level.correctAngle;
    const correctHold = level.correctHoldTime;
    const heldTime = this.displayedHoldTime;

    const angleDiff = Math.abs(this.displayedAngle - correctAngle);
    const holdDiff = Math.abs(heldTime - correctHold);

    const angleOk = angleDiff <= 5;
    const holdOk = holdDiff <= 1;

    if (angleOk && holdOk) {
      // Perfect!
      this.score += 500;
      this.combo++;
      this.levelResults.push('perfect');
      this.stats.totalPerfects++;
      this.stats.totalLevelsCompleted++;
      this.stats.bestCombo = Math.max(this.stats.bestCombo, this.combo);
      this.stats.perfectStreak++;
      this.stats.bestPerfectStreak = Math.max(this.stats.bestPerfectStreak, this.stats.perfectStreak);
      this.addShake(8, 0.3);
      this.spawnLandingSparks(level.targetPos.x, level.targetPos.y, '#00FF7F');
      this.phase = 'landed';
      playPerfect();
    } else if (angleOk || holdOk) {
      // Partial — close enough to land roughly
      this.score += 200;
      this.combo = 0;
      this.levelResults.push('ok');
      this.stats.totalLevelsCompleted++;
      this.stats.perfectStreak = 0;
      this.addShake(4, 0.2);
      this.phase = 'landed';
      playOk();
    } else {
      // Crash!
      this.combo = 0;
      this.levelResults.push('fail');
      this.stats.totalCrashes++;
      this.stats.perfectStreak = 0;
      this.addShake(20, 0.8);
      this.spawnCrashSparks(this.player.x, this.player.y);
      this.phase = 'crashed';
      playCrash();
    }
    this.stats.bestScore = Math.max(this.stats.bestScore, this.score);
    this.checkAchievements();
  }

  /** Advance to next level */
  nextLevel() {
    if (this.levelIndex + 1 >= LEVELS.length) {
      this.phase = 'complete';
      playVictory();
    } else {
      this.loadLevel(this.levelIndex + 1);
    }
  }

  /** Retry current level */
  retryLevel() {
    this.loadLevel(this.levelIndex);
  }

  // --- Effects ---

  addShake(intensity: number, _duration: number) {
    // Note: _duration reserved for future decay curve customization
    this.shakeIntensity = Math.min(25, this.shakeIntensity + intensity);
  }

  spawnLandingSparks(x: number, y: number, color: string) {
    for (let i = 0; i < 25; i++) {
      const angle = (Math.PI * 2 * i) / 25 + Math.random() * 0.3;
      const speed = 1 + Math.random() * 4;
      this.sparks.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1, maxLife: 0.4 + Math.random() * 0.6,
        radius: 1.5 + Math.random() * 3,
      });
    }
  }

  spawnCrashSparks(x: number, y: number) {
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 6;
      const c = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.sparks.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: c.main,
        life: 1, maxLife: 0.5 + Math.random() * 1.0,
        radius: 1 + Math.random() * 4,
      });
    }
  }

  /** Main update — called from game loop at fixed timestep */
  update(dt: number) {
    // Don't update if paused
    if (this.phase === 'paused') return;

    // Cap at 50ms to prevent spiral-of-death when tab is backgrounded
    // (browser throttles rAF to 0-4Hz, causing dt spikes up to 250ms+)
    const cappedDt = Math.min(dt, 0.05);

    // Update hold timer
    if (this.isHolding && this.player.phase === 'holding') {
      this.player.heldTime += cappedDt;
    }

    // Update pendulum
    if (this.pendulum && this.phase === 'swinging') {
      stepPendulum(this.pendulum, cappedDt);
      this.player.x = this.pendulum.massX;
      this.player.y = this.pendulum.massY;

      // Check landing
      const level = LEVELS[this.levelIndex];
      if (checkLanding(this.pendulum, level.targetPos.x, level.targetPos.y, 35)) {
        this.evaluateSwing();
      } else if (checkFell(this.pendulum, this.floorY)) {
        this.evaluateSwing();
      }
    }

    // Update sparks
    for (const s of this.sparks) {
      s.x += s.vx * 60 * cappedDt;
      s.y += s.vy * 60 * cappedDt;
      s.vx *= 0.95;
      s.vy *= 0.95;
      s.vy += 100 * cappedDt;
      s.life -= (1 / s.maxLife) * 60 * cappedDt;
    }
    this.sparks = this.sparks.filter(s => s.life > 0);

    // Decay shake
    this.shakeIntensity *= Math.pow(0.88, 60 * cappedDt);
    if (this.shakeIntensity < 0.2) this.shakeIntensity = 0;

    if (this.onUpdate) this.onUpdate();
  }
}
