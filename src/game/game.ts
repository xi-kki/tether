/**
 * Tether — Game Coordinator
 *
 * Owns the game loop (fixed timestep), routes input,
 * bridges Engine ↔ Renderer ↔ React.
 */

import { GameEngine } from './engine';
import { Renderer } from './renderer';
import type { GenerateResponse, VerifyResponse } from './math.worker';

let worker: Worker | null = null;
let requestIdCounter = 0;
const pendingRequests = new Map<number, (data: any) => void>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./math.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      const data = e.data;
      const resolve = pendingRequests.get(data.requestId);
      if (resolve) {
        resolve(data);
        pendingRequests.delete(data.requestId);
      }
    };
  }
  return worker;
}

export class Game {
  engine: GameEngine;
  private renderer: Renderer;
  private running = false;
  private rafId = 0;
  private lastTime = 0;
  private accumulator = 0;
  private readonly FIXED_DT = 1 / 60;

  onStateChange?: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new GameEngine();
    this.renderer = new Renderer(canvas);
    this.engine.onUpdate = () => {
      if (this.onStateChange) this.onStateChange();
    };
  }

  start() {
    if (this.running) return;
    this.running = true;
    const parent = this.renderer['canvas'].parentElement;
    if (parent) {
      this.resize(parent.clientWidth, parent.clientHeight);
    }
    this.engine.start();
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.loop(this.lastTime);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private loop = (time: number) => {
    if (!this.running) return;
    const frameTime = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;
    this.accumulator += frameTime;

    // Fixed timestep physics
    while (this.accumulator >= this.FIXED_DT) {
      this.engine.update(this.FIXED_DT);
      this.accumulator -= this.FIXED_DT;
    }

    // Render with interpolation factor
    this.renderer.render(this.engine);
    this.rafId = requestAnimationFrame(this.loop);
  };

  resize(w: number, h: number) {
    this.engine.resize(w, h);
    this.renderer.resize(w, h);
  }

  // --- Math Worker Offload ---

  generateEquation(difficulty: number): Promise<GenerateResponse> {
    return new Promise((resolve) => {
      const requestId = ++requestIdCounter;
      pendingRequests.set(requestId, resolve);
      getWorker().postMessage({ type: 'generate', difficulty, requestId });
    });
  }

  verifyAnswer(
    userAngle: number, correctAngle: number,
    userHold: number, correctHold: number,
    toleranceAngle = 5, toleranceHold = 1
  ): Promise<VerifyResponse> {
    return new Promise((resolve) => {
      const requestId = ++requestIdCounter;
      pendingRequests.set(requestId, resolve);
      getWorker().postMessage({
        type: 'verify', userAngle, correctAngle,
        userHold, correctHold,
        toleranceAngle, toleranceHold, requestId,
      });
    });
  }
}
