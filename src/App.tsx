import { useState, useEffect, useRef, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import { Game } from './game/game';
import { LEVELS } from './game/levels';
import { NEON } from './types';

type AppPhase = 'menu' | 'playing' | 'landed' | 'crashed' | 'complete';

const RESULT_LABELS: Record<string, { label: string; color: string }> = {
  perfect: { label: '✦ PERFECT!', color: '#00FF7F' },
  ok: { label: '✓ Landed', color: '#FFD700' },
  fail: { label: '✗ Crashed', color: '#FF0040' },
};

export default function App() {
  const gameRef = useRef<Game | null>(null);
  const [phase, setPhase] = useState<AppPhase>('menu');
  const [levelIndex, setLevelIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [angleInput, setAngleInput] = useState('');
  const [isHolding, setIsHolding] = useState(false);
  const [holdTime, setHoldTime] = useState(0);
  const [playerPhase, setPlayerPhase] = useState('idle');
  const [levelResults, setLevelResults] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const holdIntervalRef = useRef<number>(0);

  const engine = () => gameRef.current?.engine;

  const onStateChange = useCallback(() => {
    const e = engine();
    if (!e) return;
    setPhase(e.phase as AppPhase);
    setLevelIndex(e.levelIndex);
    setScore(e.score);
    setCombo(e.combo);
    setPlayerPhase(e.player.phase);
    setLevelResults([...e.levelResults]);
    setIsHolding(e.isHolding);
    setHoldTime(e.player.heldTime);

    if (e.phase === 'landed') {
      const r = e.levelResults[e.levelResults.length - 1];
      setMessage(RESULT_LABELS[r]?.label || 'Landed');
    } else if (e.phase === 'crashed') {
      setMessage('CRASHED! Solve to recover');
    } else if (e.phase === 'complete') {
      setMessage('🏆 All Levels Complete!');
    } else {
      setMessage('');
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const eng = engine();
      if (!eng) return;

      if (eng.phase === 'landed' || eng.phase === 'crashed') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (eng.phase === 'landed') {
            eng.nextLevel();
          } else {
            eng.retryLevel();
          }
          return;
        }
      }

      if (eng.phase === 'complete') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          eng.start();
          return;
        }
      }

      if (eng.phase === 'playing' && eng.player.phase === 'idle') {
        if (e.key === 'Enter') {
          e.preventDefault();
          eng.submitAngle();
          return;
        }
        if (e.key === 'Backspace') {
          setAngleInput(prev => prev.slice(0, -1));
          eng.inputBuffer = eng.inputBuffer.slice(0, -1);
          return;
        }
        if (e.key.length === 1 && /[0-9]/.test(e.key)) {
          setAngleInput(prev => (prev + e.key).slice(0, 3));
          eng.inputBuffer += e.key;
          return;
        }
      }

      // Hold / release with Space
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        if (eng.player.phase === 'aiming') {
          eng.startHold();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        const eng = engine();
        if (eng && eng.player.phase === 'holding') {
          eng.releaseHold();
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const startGame = () => {
    const g = gameRef.current;
    if (g) {
      g.engine.start();
      setAngleInput('');
    }
  };

  const currentLevel = levelIndex < LEVELS.length ? LEVELS[levelIndex] : null;

  return (
    <div className="relative w-full h-full bg-black">
      <GameCanvas gameRef={gameRef} onStateChange={onStateChange} />

      {/* MENU */}
      {phase === 'menu' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="glass-panel rounded-2xl p-8 max-w-md text-center">
            <div className="text-5xl mb-4">🕸️</div>
            <h1 className="text-3xl font-bold text-white neon-text mb-2" style={{ color: NEON.cyan }}>
              TETHER
            </h1>
            <p className="text-gray-400 text-sm mb-6">The Math-Powered Grappling Hook</p>
            <div className="space-y-2 text-left text-gray-400 text-xs mb-6">
              <p>🔢 <span className="text-neon-cyan">Type</span> the angle from the math clue</p>
              <p>🔄 <span className="text-neon-cyan">Hold Space</span> to extend the tether</p>
              <p>🎯 <span className="text-neon-cyan">Release</span> to swing to the target</p>
            </div>
            <button
              onClick={startGame}
              className="px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all duration-200 hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${NEON.cyan}, ${NEON.blue})`, color: '#000' }}
            >
              START
            </button>
          </div>
        </div>
      )}

      {/* HUD */}
      {phase !== 'menu' && (
        <>
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 p-3 flex items-start justify-between pointer-events-none">
            <div className="glass-panel rounded-lg px-3 py-2">
              <div className="text-gray-500 text-[10px] uppercase tracking-widest">Level</div>
              <div className="text-white font-bold text-lg">{levelIndex + 1}/{LEVELS.length}</div>
            </div>
            <div className="glass-panel rounded-lg px-3 py-2 text-center">
              <div className="text-gray-500 text-[10px] uppercase tracking-widest">Score</div>
              <div className="text-white font-bold text-lg" style={{ color: NEON.cyan }}>{score.toLocaleString()}</div>
              {combo > 1 && <div className="text-[10px] text-neon-yellow">✦ {combo}x</div>}
            </div>
            <div className="glass-panel rounded-lg px-3 py-2">
              <div className="text-gray-500 text-[10px] uppercase tracking-widest">Results</div>
              <div className="flex gap-1 mt-1">
                {levelResults.map((r, i) => (
                  <span key={i} className="text-xs" style={{ color: RESULT_LABELS[r]?.color }}>
                    {r === 'perfect' ? '✦' : r === 'ok' ? '✓' : '✗'}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Equation hint */}
          {playerPhase === 'idle' && currentLevel && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none text-center">
              <div className="animate-fade-in-up">
                <div className="text-xs text-gray-500 mb-1">CLUE</div>
                <div className="text-lg font-bold neon-text" style={{ color: NEON.yellow }}>
                  {currentLevel.hint}
                </div>
              </div>
            </div>
          )}

          {/* Angle input display */}
          {playerPhase === 'idle' && (
            <div className="absolute top-32 left-1/2 -translate-x-1/2 pointer-events-none text-center">
              <div className="text-xs text-gray-500 mb-1">ANGLE</div>
              <div className="text-4xl font-bold neon-text" style={{ color: NEON.cyan }}>
                {angleInput || '___'}°
              </div>
              <div className="text-[10px] text-gray-600 mt-1">Type a number, then press Enter</div>
            </div>
          )}

          {/* Holding indicator */}
          {isHolding && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center animate-pulse-slow">
              <div className="text-5xl mb-2">🔄</div>
              <div className="text-lg font-bold neon-text" style={{ color: NEON.cyan }}>
                HOLDING... {holdTime.toFixed(1)}s
              </div>
              <div className="text-sm text-gray-500">
                Tether: {(holdTime * 20).toFixed(0)}m
              </div>
            </div>
          )}

          {/* Aiming indicator */}
          {playerPhase === 'aiming' && !isHolding && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-none text-center animate-pulse-slow">
              <div className="text-sm font-bold text-white neon-text" style={{ color: NEON.cyan }}>
                PRESS SPACE TO EXTEND TETHER
              </div>
            </div>
          )}

          {/* Result overlay */}
          {(phase === 'landed' || phase === 'crashed') && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
              <div className="animate-fade-in-up text-center">
                <div className="text-3xl font-bold mb-2 neon-text" style={{
                  color: phase === 'landed' ? NEON.green : NEON.red
                }}>
                  {message}
                </div>
                <div className="text-gray-400 text-sm mt-2">
                  {phase === 'landed'
                    ? 'Press Space or Enter for next level'
                    : 'Press Space or Enter to retry'}
                </div>
              </div>
            </div>
          )}

          {/* Complete screen */}
          {phase === 'complete' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
              <div className="glass-panel rounded-2xl p-8 text-center animate-fade-in-up">
                <div className="text-5xl mb-4">🏆</div>
                <h2 className="text-2xl font-bold text-white mb-2 neon-text" style={{ color: NEON.yellow }}>
                  ALL CLEAR!
                </h2>
                <div className="text-4xl font-bold mb-2" style={{ color: NEON.cyan }}>
                  {score.toLocaleString()}
                </div>
                <div className="text-gray-400 text-sm mb-4">Final Score</div>
                <div className="flex justify-center gap-2 mb-6">
                  {levelResults.map((r, i) => (
                    <span key={i} className="text-lg" style={{ color: RESULT_LABELS[r]?.color }}>
                      {r === 'perfect' ? '✦' : r === 'ok' ? '✓' : '✗'}
                    </span>
                  ))}
                </div>
                <button
                  onClick={startGame}
                  className="px-6 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105"
                  style={{ background: `linear-gradient(135deg, ${NEON.cyan}, ${NEON.blue})`, color: '#000' }}
                >
                  PLAY AGAIN
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
