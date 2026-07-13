import { useState, useEffect, useRef, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import { Game } from './game/game';
import { LEVELS } from './game/levels';
import { NEON } from './types';
import { toggleMute, isMuted, playKeyClick, playSubmit, playHoldStart, playRelease } from './game/audio';

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
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('tether-highscore');
    return saved ? parseInt(saved) : 0;
  });
  const [muted, setMuted] = useState(isMuted());
  const [showHint, setShowHint] = useState(false);
  const [hintTimer, setHintTimer] = useState(0);
  const holdIntervalRef = useRef<number>(0);
  const hintTimerRef = useRef<number>(0);

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
      setShowHint(false);
      setHintTimer(0);
    } else if (e.phase === 'crashed') {
      setMessage('CRASHED! Solve to recover');
    } else if (e.phase === 'complete') {
      setMessage('🏆 All Levels Complete!');
      // Save high score
      if (e.score > highScore) {
        setHighScore(e.score);
        localStorage.setItem('tether-highscore', e.score.toString());
      }
    } else if (e.phase === 'playing' && e.player.phase === 'idle') {
      // Start hint timer when level begins
      setShowHint(false);
      setHintTimer(0);
    } else {
      setMessage('');
    }
  }, [highScore]);

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
          playSubmit();
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
          playKeyClick();
          return;
        }
      }

      // Hold / release with Space
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        if (eng.player.phase === 'aiming') {
          eng.startHold();
          playHoldStart();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        const eng = engine();
        if (eng && eng.player.phase === 'holding') {
          eng.releaseHold();
          playRelease();
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

  // Hint timer - shows hint after 10 seconds of inactivity
  useEffect(() => {
    if (phase === 'playing' && playerPhase === 'idle' && !showHint) {
      hintTimerRef.current = window.setInterval(() => {
        setHintTimer(prev => {
          if (prev >= 10) {
            setShowHint(true);
            clearInterval(hintTimerRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(hintTimerRef.current);
  }, [phase, playerPhase, showHint, levelIndex]);

  const startGame = () => {
    const g = gameRef.current;
    if (g) {
      g.engine.start();
      setAngleInput('');
      setShowHint(false);
      setHintTimer(0);
    }
  };

  const currentLevelData = levelIndex < LEVELS.length ? LEVELS[levelIndex] : null;

  const handleMuteToggle = () => {
    const newMuted = toggleMute();
    setMuted(newMuted);
  };

  const handleMobileAngle = (digit: string) => {
    const eng = engine();
    if (!eng || eng.phase !== 'playing' || eng.player.phase !== 'idle') return;
    setAngleInput(prev => (prev + digit).slice(0, 3));
    eng.inputBuffer += digit;
    playKeyClick();
  };

  const handleMobileSubmit = () => {
    const eng = engine();
    if (!eng) return;
    eng.submitAngle();
    playSubmit();
  };

  const handleMobileClear = () => {
    const eng = engine();
    if (!eng) return;
    setAngleInput('');
    eng.inputBuffer = '';
  };

  const handleMobileHoldStart = () => {
    const eng = engine();
    if (!eng) return;
    if (eng.player.phase === 'aiming') {
      eng.startHold();
      playHoldStart();
    }
  };

  const handleMobileHoldRelease = () => {
    const eng = engine();
    if (!eng) return;
    if (eng.player.phase === 'holding') {
      eng.releaseHold();
      playRelease();
    }
  };

  const handleNextOrRetry = () => {
    const eng = engine();
    if (!eng) return;
    if (eng.phase === 'landed') {
      eng.nextLevel();
    } else if (eng.phase === 'crashed') {
      eng.retryLevel();
    } else if (eng.phase === 'complete') {
      eng.start();
      setAngleInput('');
    }
  };

  const handleShowHint = () => {
    setShowHint(true);
    clearInterval(hintTimerRef.current);
  };

  const currentLevel = levelIndex < LEVELS.length ? LEVELS[levelIndex] : null;

  return (
    <div className="relative w-full h-full bg-black">
      <GameCanvas gameRef={gameRef} onStateChange={onStateChange} />

      {/* MENU */}
      {phase === 'menu' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl p-6 sm:p-8 max-w-md w-full text-center">
            <div className="text-5xl mb-4">🕸️</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white neon-text mb-2" style={{ color: NEON.cyan }}>
              TETHER
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">The Math-Powered Grappling Hook</p>
            {highScore > 0 && (
              <div className="text-xs sm:text-sm mb-4" style={{ color: NEON.yellow }}>
                ✦ High Score: {highScore.toLocaleString()}
              </div>
            )}
            {/* Desktop controls */}
            <div className="space-y-2 text-left text-gray-400 text-xs mb-6 hidden md:block">
              <p>🔢 <span className="text-neon-cyan">Type</span> the angle from the math clue</p>
              <p>🔄 <span className="text-neon-cyan">Hold Space</span> to extend the tether</p>
              <p>🎯 <span className="text-neon-cyan">Release</span> to swing to the target</p>
            </div>
            {/* Mobile controls */}
            <div className="space-y-2 text-left text-gray-400 text-xs mb-6 md:hidden">
              <p>🔢 <span className="text-neon-cyan">Tap numbers</span> to type the angle</p>
              <p>🔄 <span className="text-neon-cyan">Hold button</span> to extend the tether</p>
              <p>🎯 <span className="text-neon-cyan">Release</span> to swing to the target</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={startGame}
                className="px-6 sm:px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all duration-200 hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${NEON.cyan}, ${NEON.blue})`, color: '#000' }}
              >
                START
              </button>
              <button
                onClick={handleMuteToggle}
                className="px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
              >
                {muted ? '🔇' : '🔊'}
              </button>
            </div>
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
                {/* Hint countdown */}
                {!showHint && hintTimer < 10 && (
                  <div className="text-[10px] text-gray-600 mt-1">
                    Hint in {10 - hintTimer}s
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Auto hint display */}
          {showHint && playerPhase === 'idle' && currentLevelData && (
            <div className="absolute top-28 left-1/2 -translate-x-1/2 pointer-events-none text-center animate-fade-in-up">
              <div className="glass-panel rounded-lg px-4 py-2 inline-block">
                <div className="text-[10px] text-gray-500 mb-1">💡 HINT</div>
                <div className="text-sm font-bold" style={{ color: NEON.green }}>
                  Answer: {currentLevelData.correctAngle}°
                </div>
                <div className="text-[10px] text-gray-600 mt-1">
                  Hold time: ~{currentLevelData.correctHoldTime.toFixed(1)}s
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
              {/* Manual hint button (desktop) */}
              {!showHint && (
                <button
                  onClick={handleShowHint}
                  className="mt-2 pointer-events-auto px-3 py-1 rounded-lg text-[10px] transition-all hover:scale-105 hidden md:inline-block"
                  style={{ background: 'rgba(255,215,0,0.15)', color: NEON.yellow }}
                >
                  💡 Need a hint?
                </button>
              )}
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
                <div className="text-gray-400 text-sm mb-2">Final Score</div>
                {score >= highScore && score > 0 && (
                  <div className="text-sm mb-2" style={{ color: NEON.yellow }}>
                    ✦ NEW HIGH SCORE! ✦
                  </div>
                )}
                {highScore > 0 && (
                  <div className="text-xs text-gray-500 mb-4">
                    High Score: {highScore.toLocaleString()}
                  </div>
                )}
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

          {/* Mobile Touch Controls */}
          {phase === 'playing' && (
            <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-auto md:hidden">
              {/* Aiming phase - number pad */}
              {playerPhase === 'idle' && (
                <div className="glass-panel rounded-xl p-3">
                  {/* Mobile hint button */}
                  {!showHint && (
                    <div className="flex justify-center mb-2">
                      <button onClick={handleShowHint}
                        className="px-3 py-1 rounded-lg text-[10px]"
                        style={{ background: 'rgba(255,215,0,0.15)', color: NEON.yellow }}>
                        💡 Hint {hintTimer < 10 ? `in ${10 - hintTimer}s` : ''}
                      </button>
                    </div>
                  )}
                  <div className="flex justify-center gap-1 mb-2">
                    {[1,2,3].map(d => (
                      <button key={d} onClick={() => handleMobileAngle(String(d))}
                        className="w-12 h-12 rounded-lg font-bold text-lg active:scale-95 transition-transform"
                        style={{ background: 'rgba(0,255,240,0.15)', color: NEON.cyan }}>
                        {d}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-center gap-1 mb-2">
                    {[4,5,6].map(d => (
                      <button key={d} onClick={() => handleMobileAngle(String(d))}
                        className="w-12 h-12 rounded-lg font-bold text-lg active:scale-95 transition-transform"
                        style={{ background: 'rgba(0,255,240,0.15)', color: NEON.cyan }}>
                        {d}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-center gap-1 mb-2">
                    {[7,8,9].map(d => (
                      <button key={d} onClick={() => handleMobileAngle(String(d))}
                        className="w-12 h-12 rounded-lg font-bold text-lg active:scale-95 transition-transform"
                        style={{ background: 'rgba(0,255,240,0.15)', color: NEON.cyan }}>
                        {d}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-center gap-1">
                    <button onClick={handleMobileClear}
                      className="w-12 h-12 rounded-lg font-bold text-sm active:scale-95 transition-transform"
                      style={{ background: 'rgba(255,0,64,0.2)', color: NEON.red }}>
                      ⌫
                    </button>
                    <button onClick={() => handleMobileAngle('0')}
                      className="w-12 h-12 rounded-lg font-bold text-lg active:scale-95 transition-transform"
                      style={{ background: 'rgba(0,255,240,0.15)', color: NEON.cyan }}>
                      0
                    </button>
                    <button onClick={handleMobileSubmit}
                      className="w-12 h-12 rounded-lg font-bold text-sm active:scale-95 transition-transform"
                      style={{ background: `linear-gradient(135deg, ${NEON.cyan}, ${NEON.blue})`, color: '#000' }}>
                      OK
                    </button>
                  </div>
                </div>
              )}

              {/* Aiming phase - hold button */}
              {playerPhase === 'aiming' && !isHolding && (
                <div className="flex justify-center">
                  <button
                    onTouchStart={handleMobileHoldStart}
                    onMouseDown={handleMobileHoldStart}
                    className="px-8 py-4 rounded-xl font-bold text-lg animate-pulse-slow"
                    style={{ background: `linear-gradient(135deg, ${NEON.cyan}, ${NEON.blue})`, color: '#000' }}
                  >
                    🔄 HOLD TO EXTEND
                  </button>
                </div>
              )}

              {/* Holding phase - release button */}
              {playerPhase === 'holding' && (
                <div className="flex justify-center">
                  <button
                    onTouchEnd={handleMobileHoldRelease}
                    onMouseUp={handleMobileHoldRelease}
                    className="px-8 py-4 rounded-xl font-bold text-lg animate-pulse"
                    style={{ background: `linear-gradient(135deg, ${NEON.yellow}, ${NEON.green})`, color: '#000' }}
                  >
                    🎯 RELEASE!
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile - Landed / Crashed / Complete buttons */}
          {(phase === 'landed' || phase === 'crashed' || phase === 'complete') && (
            <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-auto md:hidden">
              <div className="flex justify-center">
                <button
                  onClick={handleNextOrRetry}
                  className="px-8 py-4 rounded-xl font-bold text-lg"
                  style={{ background: `linear-gradient(135deg, ${NEON.cyan}, ${NEON.blue})`, color: '#000' }}
                >
                  {phase === 'landed' ? '→ NEXT' : phase === 'crashed' ? '↻ RETRY' : '↺ PLAY AGAIN'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
