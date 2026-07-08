/**
 * Tether — Math Web Worker
 *
 * Runs equation generation and answer verification off the main thread.
 * The game engine never evaluates a single math expression itself.
 *
 * Messages in:  { type: 'generate' | 'verify', ... }
 * Messages out: { type: 'generated' | 'verified', ... }
 */

import { generateEquation } from './equations';

export interface GenerateRequest {
  type: 'generate';
  difficulty: number;
  requestId: number;
}

export interface VerifyRequest {
  type: 'verify';
  userAngle: number;
  correctAngle: number;
  userHold: number;
  correctHold: number;
  toleranceAngle: number;
  toleranceHold: number;
  requestId: number;
}

export interface GenerateResponse {
  type: 'generated';
  equation: ReturnType<typeof generateEquation>;
  requestId: number;
}

export interface VerifyResponse {
  type: 'verified';
  angleCorrect: boolean;
  holdCorrect: boolean;
  perfect: boolean;
  partial: boolean;
  score: number;
  requestId: number;
}

type WorkerMessage = GenerateRequest | VerifyRequest;

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data;

  switch (msg.type) {
    case 'generate': {
      const equation = generateEquation(msg.difficulty);
      const response: GenerateResponse = {
        type: 'generated',
        equation,
        requestId: msg.requestId,
      };
      self.postMessage(response);
      break;
    }

    case 'verify': {
      const angleDiff = Math.abs(msg.userAngle - msg.correctAngle);
      const holdDiff = Math.abs(msg.userHold - msg.correctHold);
      const angleCorrect = angleDiff <= msg.toleranceAngle;
      const holdCorrect = holdDiff <= msg.toleranceHold;

      let score = 0;
      let perfect = false;
      let partial = false;

      if (angleCorrect && holdCorrect) {
        score = 500;
        perfect = true;
      } else if (angleCorrect || holdCorrect) {
        score = 200;
        partial = true;
      }

      const response: VerifyResponse = {
        type: 'verified',
        angleCorrect,
        holdCorrect,
        perfect,
        partial,
        score,
        requestId: msg.requestId,
      };
      self.postMessage(response);
      break;
    }
  }
};
