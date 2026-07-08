/**
 * Tether — Canvas Renderer
 *
 * Renders: neon canyon, grapple pendulum, player character, particle FX.
 * Reads engine state, draws pixels. Zero logic.
 */

import type { Level, Spark } from '../types';
import { NEON } from '../types';
import type { GameEngine } from './engine';
import type { PendulumState } from './physics';
import { LEVELS } from './levels';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private bgGradient: CanvasGradient | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable');
    this.ctx = ctx;
  }

  render(engine: GameEngine) {
    const ctx = this.ctx;
    const w = engine.width;
    const h = engine.height;
    const level = engine.levelIndex < LEVELS.length ? LEVELS[engine.levelIndex] : null;
    if (!level) return;

    ctx.save();

    // Screen shake
    if (engine.shakeIntensity > 0.2) {
      const sx = (Math.random() - 0.5) * engine.shakeIntensity;
      const sy = (Math.random() - 0.5) * engine.shakeIntensity;
      ctx.translate(sx, sy);
    }

    // Background
    this.drawBackground(w, h);

    // Canyon walls
    this.drawCanyon(w, h, level);

    // Grapple point
    this.drawGrapplePoint(level.grapplePoint.x, level.grapplePoint.y);

    // Tether line
    if (engine.pendulum) {
      this.drawTether(engine.pendulum);
    }

    // Target platform
    this.drawPlatform(level.targetPos.x, level.targetPos.y, NEON.green);

    // Start platform
    this.drawPlatform(level.startPos.x, level.startPos.y, NEON.cyan);

    // Player
    this.drawPlayer(engine.player.x, engine.player.y, engine.player.phase);

    // Sparks
    this.drawSparks(engine.sparks);

    // Hint text
    this.drawHint(level, engine);

    // Tether length indicator (during hold)
    if (engine.player.phase === 'holding') {
      this.drawTetherGauge(engine);
    }

    ctx.restore();
  }

  private drawBackground(w: number, h: number) {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#000008');
    grad.addColorStop(0.4, '#0a0a1a');
    grad.addColorStop(1, '#050510');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    const seed = 42;
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 137 + seed) % w);
      const sy = ((i * 89 + seed) % (h * 0.5));
      const sr = 0.5 + ((i * 31) % 3) * 0.5;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawCanyon(w: number, h: number, level: Level) {
    const ctx = this.ctx;
    const floorY = h * 0.92;
    const wallColor = 'rgba(0, 255, 240, 0.05)';

    // Left wall
    ctx.fillStyle = wallColor;
    ctx.fillRect(0, 0, 30, floorY);

    // Right wall
    ctx.fillStyle = wallColor;
    ctx.fillRect(w - 30, 0, 30, floorY);

    // Floor
    ctx.fillStyle = 'rgba(0, 255, 240, 0.08)';
    ctx.fillRect(0, floorY, w, h - floorY);

    // Floor glow line
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = NEON.cyan;
    ctx.strokeStyle = 'rgba(0, 255, 240, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(w, floorY);
    ctx.stroke();
    ctx.restore();

    // Wall neon accents
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = NEON.cyan;
    ctx.strokeStyle = 'rgba(0, 255, 240, 0.15)';
    ctx.lineWidth = 1;
    for (let y = 50; y < floorY; y += 80) {
      ctx.beginPath();
      ctx.moveTo(25, y);
      ctx.lineTo(30, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w - 25, y);
      ctx.lineTo(w - 30, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawPlatform(x: number, y: number, color: string) {
    const ctx = this.ctx;
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;

    // Platform body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x - 40, y - 8, 80, 16, 4);
    ctx.fill();

    // Glow beneath
    ctx.shadowBlur = 40;
    ctx.shadowColor = color;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(x - 40, y - 2, 80, 4);
    ctx.restore();

    // Edge markers
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.5;
    ctx.fillRect(x - 35, y - 4, 4, 8);
    ctx.fillRect(x + 31, y - 4, 4, 8);
    ctx.globalAlpha = 1;
  }

  private drawGrapplePoint(x: number, y: number) {
    const ctx = this.ctx;
    ctx.save();

    // Outer glow
    ctx.shadowBlur = 30;
    ctx.shadowColor = NEON.yellow;
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
    ctx.fill();

    // Ring
    ctx.shadowBlur = 15;
    ctx.shadowColor = NEON.yellow;
    ctx.strokeStyle = NEON.yellow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.stroke();

    // Center dot
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#fff';
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawTether(p: PendulumState) {
    const ctx = this.ctx;
    ctx.save();

    // Glow line
    ctx.shadowBlur = 12;
    ctx.shadowColor = NEON.cyan;
    ctx.strokeStyle = NEON.cyan;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(p.pivotX, p.pivotY);
    ctx.lineTo(p.massX, p.massY);
    ctx.stroke();

    // Inner bright line
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(p.pivotX, p.pivotY);
    ctx.lineTo(p.massX, p.massY);
    ctx.stroke();

    ctx.restore();
  }

  private drawPlayer(x: number, y: number, phase: string) {
    const ctx = this.ctx;
    const color = phase === 'crashed' ? NEON.red : NEON.cyan;
    ctx.save();
    ctx.shadowBlur = 25;
    ctx.shadowColor = color;

    // Body (diamond shape)
    ctx.beginPath();
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x + 8, y);
    ctx.lineTo(x, y + 12);
    ctx.lineTo(x - 8, y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Inner glow
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y - 5);
    ctx.lineTo(x + 3, y);
    ctx.lineTo(x, y + 5);
    ctx.lineTo(x - 3, y);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private drawSparks(sparks: Spark[]) {
    const ctx = this.ctx;
    for (const s of sparks) {
      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = s.color;
      ctx.globalAlpha = Math.max(0, s.life);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius * s.life, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
      ctx.restore();
    }
  }

  private drawHint(level: Level, engine: GameEngine) {
    const ctx = this.ctx;
    const w = engine.width;

    ctx.save();
    ctx.font = '18px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowBlur = 12;
    ctx.shadowColor = NEON.yellow;
    ctx.fillStyle = NEON.yellow;
    ctx.fillText(level.hint, w / 2, 30);
    ctx.restore();
  }

  private drawTetherGauge(engine: GameEngine) {
    const ctx = this.ctx;
    const w = engine.width;

    ctx.save();
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = NEON.cyan;
    ctx.shadowBlur = 8;
    ctx.shadowColor = NEON.cyan;

    const heldDisplay = engine.player.heldTime.toFixed(1);
    ctx.fillText(`Holding... ${heldDisplay}s  |  Length: ${(engine.player.heldTime * 20).toFixed(0)}m`, w / 2, engine.height - 60);

    ctx.restore();
  }

  resize(w: number, h: number) {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    const ctx = this.ctx;
    ctx.scale(dpr, dpr);
  }
}
