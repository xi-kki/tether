import { useState, useEffect, useRef, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import { Game } from './game/game';
import { LEVELS } from './game/levels';
import { NEON } from './types';
import { toggleMute, isMuted, playKeyClick, playSubmit, playHoldStart, playRelease, startBgMusic, stopBgMusic, playAchievement, playLevelComplete } from './game/audio';

type AppPhase = 'menu' | 'tutorial' | 'playing' | 'paused' | 'landed' | 'crashed' | 'complete' | 'levelSelect' | 'achievements';

const RESULT_LABELS: Record<string, { label: string; color: string }> = {
  perfect: { label: '✦ PERFECT!', color: '#00FF7F' },
  ok: { label: '✓ Landed', color: '#FFD700' },
  fail: { label: '✗ Crashed', color: '#FF0040' },
};

const ACHIEVEMENTS = [
  { id: 'first-swing', name: 'First Swing', desc: 'Complete your first level', icon: '🎯' },
  { id: 'perfect-landing', name: 'Perfect Landing', desc: 'Get a perfect score', icon: '✦' },
  { id: 'perfectionist', name: 'Perfectionist', desc: 'Get 5 perfect landings', icon: '💎' },
  { id: 'combo-master', name: 'Combo Master', desc: 'Achieve a 3x combo', icon: '🔥' },
  { id: 'unstoppable', name: 'Unstoppable', desc: 'Achieve a 6x combo', icon: '⚡' },
  { id: 'legendary', name: 'Legendary', desc: 'Achieve a 12x combo', icon: '👑' },
  { id: 'no-crash', name: 'No Crash', desc: 'Complete without crashing', icon: '🛡️' },
  { id: 'high-scorer', name: 'High Scorer', desc: 'Score 3000+ points', icon: '📈' },
  { id: 'score-legend', name: 'Score Legend', desc: 'Score 6000+ points', icon: '🏆' },
  { id: 'level-master', name: 'Level Master', desc: 'Complete all 12 levels', icon: '🎮' },
  { id: 'streak-3', name: 'Hot Streak', desc: '3 perfects in a row', icon: '🌡️' },
  { id: 'streak-6', name: 'On Fire', desc: '6 perfects in a row', icon: '🔥' },
];

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
  const [newAchievement, setNewAchievement] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<string[]>(() => {
    const saved = localStorage.getItem('tether-achievements');
    return saved ? JSON.parse(saved) : [];
  });
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('tether-stats');
    return saved ? JSON.parse(saved) : {
      totalPlays: 0,
      totalPerfects: 0,
      totalCrashes: 0,
      bestCombo: 0,
      bestScore: 0,
      totalLevelsCompleted: 0,
    };
  });
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
    setStats({ ...e.stats });

    // Check for new achievements
    const oldAchievements = achievements;
    const newAchievements = e.achievements.filter((a: string) => !oldAchievements.includes(a));
    if (newAchievements.length > 0) {
      setAchievements([...oldAchievements, ...newAchievements]);
      localStorage.setItem('tether-achievements', JSON.stringify([...oldAchievements, ...newAchievements]));
      setNewAchievement(newAchievements[0]);
      playAchievement();
      setTimeout(() => setNewAchievement(null), 3000);
    }

    if (e.phase === 'landed') {
      const r = e.levelResults[e.levelResults.length - 1];
      setMessage(RESULT_LABELS[r]?.label || 'Landed');
      setShowHint(false);
      setHintTimer(0);
      playLevelComplete();
    } else if (e.phase === 'crashed') {
      setMessage('CRASHED! Solve to recover');
    } else if (e.phase === 'complete') {
      setMessage('🏆 All Levels Complete!');
      // Save high score
      if (e.score > highScore) {
        setHighScore(e.score);
        localStorage.setItem('tether-highscore', e.score.toString());
      }
      localStorage.setItem('tether-stats', JSON.stringify(e.stats));
      stopBgMusic();
    } else if (e.phase === 'playing' && e.player.phase === 'idle') {
      // Start hint timer when level begins
      setShowHint(false);
      setHintTimer(0);
    } else {
      setMessage('');
    }
  }, [highScore, achievements]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const eng = engine();
      if (!eng) return;

      // Pause with Escape
      if (e.key === 'Escape') {
        if (eng.phase === 'playing' || eng.phase === 'paused') {
          eng.togglePause();
          return;
        }
      }

      // Don't handle other keys if paused
      if (eng.phase === 'paused') return;

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
      startBgMusic();
    }
  };

  const startFromLevel = (index: number) => {
    const g = gameRef.current;
    if (g) {
      g.engine.startFromLevel(index);
      setAngleInput('');
      setShowHint(false);
      setHintTimer(0);
      setPhase('playing');
      startBgMusic();
    }
  };

  const showTutorial = () => {
    const g = gameRef.current;
    if (g) {
      g.engine.showTutorial();
      setPhase('tutorial');
    }
  };

  const showLevelSelect = () => {
    const g = gameRef.current;
    if (g) {
      g.engine.showLevelSelect();
      setPhase('levelSelect');
    }
  };

  const showAchievements = () => {
    setPhase('achievements');
  };

  const currentLevelData = levelIndex < LEVELS.length ? LEVELS[levelIndex] : null;

  const handleMuteToggle = () => {
    const newMuted = toggleMute();
    setMuted(newMuted);
    if (newMuted) {
      stopBgMusic();
    } else if (phase === 'playing') {
      startBgMusic();
    }
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

  const handleShareScore = async () => {
    const text = `🕸️ TETHER — The Math-Powered Grappling Hook\n\nScore: ${score.toLocaleString()}\nLevels: ${levelResults.length}/${LEVELS.length}\nPerfects: ${levelResults.filter(r => r === 'perfect').length}\n\nCan you beat my score?`;
    
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (e) {}
    } else {
      await navigator.clipboard.writeText(text);
      alert('Score copied to clipboard!');
    }
  };

  const handlePause = () => {
    const eng = engine();
    if (eng) {
      eng.togglePause();
    }
  };

  const currentLevel = levelIndex < LEVELS.length ? LEVELS[levelIndex] : null;

  return (
    <div className="relative w-full h-full bg-black">
      <GameCanvas gameRef={gameRef} onStateChange={onStateChange} />

      {/* ACHIEVEMENT NOTIFICATION */}
      {newAchievement && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="glass-panel rounded-xl px-6 py-3 flex items-center gap-3">
            <span className="text-2xl">{ACHIEVEMENTS.find(a => a.id === newAchievement)?.icon}</span>
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">Achievement Unlocked</div>
              <div className="text-sm font-bold" style={{ color: NEON.yellow }}>
                {ACHIEVEMENTS.find(a => a.id === newAchievement)?.name}
              </div>
            </div>
          </div>
        </div>
      )}

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
              <p>⏸️ <span className="text-neon-cyan">ESC</span> to pause</p>
            </div>
            {/* Mobile controls */}
            <div className="space-y-2 text-left text-gray-400 text-xs mb-6 md:hidden">
              <p>🔢 <span className="text-neon-cyan">Tap numbers</span> to type the angle</p>
              <p>🔄 <span className="text-neon-cyan">Hold button</span> to extend the tether</p>
              <p>🎯 <span className="text-neon-cyan">Release</span> to swing to the target</p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={startGame}
                className="px-6 sm:px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all duration-200 hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${NEON.cyan}, ${NEON.blue})`, color: '#000' }}
              >
                START
              </button>
              <button
                onClick={showTutorial}
                className="px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-105"
                style={{ background: 'rgba(255,215,0,0.15)', color: NEON.yellow }}
              >
                📖 How to Play
              </button>
              <button
                onClick={showLevelSelect}
                className="px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-105"
                style={{ background: 'rgba(0,255,127,0.15)', color: NEON.green }}
              >
                🎯 Levels
              </button>
              <button
                onClick={showAchievements}
                className="px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-105"
                style={{ background: 'rgba(138,43,226,0.15)', color: NEON.purple }}
              >
                🏆 {achievements.length}/{ACHIEVEMENTS.length}
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

      {/* TUTORIAL */}
      {phase === 'tutorial' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl p-6 sm:p-8 max-w-lg w-full">
            <h2 className="text-xl font-bold text-white mb-4" style={{ color: NEON.cyan }}>📖 How to Play</h2>
            
            <div className="space-y-4 text-sm text-gray-300">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔢</span>
                <div>
                  <div className="font-bold text-white">Step 1: Solve the Math Clue</div>
                  <div className="text-gray-400">A trigonometry or geometry problem appears. Type the angle answer using your keyboard or the number pad.</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <div className="font-bold text-white">Step 2: Lock Your Angle</div>
                  <div className="text-gray-400">Press <span className="text-neon-cyan">Enter</span> to submit your angle. You'll see it displayed on screen.</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔄</span>
                <div>
                  <div className="font-bold text-white">Step 3: Extend the Tether</div>
                  <div className="text-gray-400">Hold <span className="text-neon-cyan">Space</span> (or the mobile button) to extend your grappling tether. Watch the length meter!</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <div className="font-bold text-white">Step 4: Swing!</div>
                  <div className="text-gray-400">Release <span className="text-neon-cyan">Space</span> to fire the grapple and swing across the canyon!</div>
                </div>
              </div>
              
              <div className="border-t border-gray-700 pt-4 mt-4">
                <div className="font-bold text-white mb-2">Scoring</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span style={{ color: NEON.green }}>✦ Perfect</span> — Both correct (±5°, ±1s) = 500 pts</div>
                  <div><span style={{ color: NEON.yellow }}>✓ Landed</span> — One correct = 200 pts</div>
                  <div><span style={{ color: NEON.red }}>✗ Crashed</span> — Both wrong = 0 pts</div>
                  <div><span style={{ color: NEON.cyan }}>🔥 Combo</span> — Chain perfects for bonus!</div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 justify-center mt-6">
              <button
                onClick={() => setPhase('menu')}
                className="px-6 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
              >
                ← Back
              </button>
              <button
                onClick={startGame}
                className="px-6 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${NEON.cyan}, ${NEON.blue})`, color: '#000' }}
              >
                START GAME
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEVEL SELECT */}
      {phase === 'levelSelect' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl p-6 sm:p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4" style={{ color: NEON.cyan }}>🎯 Select Level</h2>
            
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-6">
              {LEVELS.map((level, i) => (
                <button
                  key={i}
                  onClick={() => startFromLevel(i)}
                  className="aspect-square rounded-xl font-bold text-sm transition-all hover:scale-105 flex flex-col items-center justify-center"
                  style={{ 
                    background: i < levelResults.length 
                      ? levelResults[i] === 'perfect' 
                        ? 'rgba(0,255,127,0.2)' 
                        : levelResults[i] === 'ok'
                          ? 'rgba(255,215,0,0.2)'
                          : 'rgba(255,0,64,0.2)'
                      : 'rgba(255,255,255,0.05)',
                    color: '#fff'
                  }}
                >
                  <div>{i + 1}</div>
                  {i < levelResults.length && (
                    <div className="text-[10px]">
                      {levelResults[i] === 'perfect' ? '✦' : levelResults[i] === 'ok' ? '✓' : '✗'}
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            <div className="text-center text-xs text-gray-500 mb-4">
              {levelResults.filter(r => r === 'perfect').length} Perfects · {levelResults.filter(r => r === 'ok').length} Landed · {levelResults.filter(r => r === 'fail').length} Crashed
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setPhase('menu')}
                className="px-6 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
              >
                ← Back
              </button>
              <button
                onClick={startGame}
                className="px-6 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${NEON.cyan}, ${NEON.blue})`, color: '#000' }}
              >
                START FROM LEVEL 1
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACHIEVEMENTS */}
      {phase === 'achievements' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl p-6 sm:p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4" style={{ color: NEON.yellow }}>🏆 Achievements</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {ACHIEVEMENTS.map((ach) => {
                const unlocked = achievements.includes(ach.id);
                return (
                  <div
                    key={ach.id}
                    className={`rounded-xl p-3 text-center ${unlocked ? '' : 'opacity-40'}`}
                    style={{ 
                      background: unlocked ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)',
                      border: unlocked ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.05)'
                    }}
                  >
                    <div className="text-2xl mb-1">{ach.icon}</div>
                    <div className="text-xs font-bold text-white">{ach.name}</div>
                    <div className="text-[10px] text-gray-500">{ach.desc}</div>
                  </div>
                );
              })}
            </div>
            
            <div className="border-t border-gray-700 pt-4 mb-4">
              <div className="text-xs text-gray-500 text-center">
                {achievements.length}/{ACHIEVEMENTS.length} Unlocked
              </div>
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setPhase('menu')}
                className="px-6 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HUD */}
      {phase !== 'menu' && phase !== 'tutorial' && phase !== 'levelSelect' && phase !== 'achievements' && (
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

          {/* Pause button */}
          {phase === 'playing' && (
            <button
              onClick={handlePause}
              className="absolute top-3 right-20 z-30 glass-panel rounded-lg px-3 py-2 pointer-events-auto hover:scale-105 transition-transform"
            >
              ⏸️
            </button>
          )}

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
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={startGame}
                    className="px-6 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${NEON.cyan}, ${NEON.blue})`, color: '#000' }}
                  >
                    PLAY AGAIN
                  </button>
                  <button
                    onClick={handleShareScore}
                    className="px-6 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105"
                    style={{ background: 'rgba(138,43,226,0.2)', color: NEON.purple }}
                  >
                    📤 SHARE
                  </button>
                  <button
                    onClick={() => setPhase('menu')}
                    className="px-6 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                  >
                    MENU
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PAUSE OVERLAY */}
          {phase === 'paused' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80">
              <div className="glass-panel rounded-2xl p-8 text-center animate-fade-in-up">
                <div className="text-5xl mb-4">⏸️</div>
                <h2 className="text-2xl font-bold text-white mb-6" style={{ color: NEON.cyan }}>
                  PAUSED
                </h2>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handlePause}
                    className="px-8 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${NEON.cyan}, ${NEON.blue})`, color: '#000' }}
                  >
                    ▶️ RESUME
                  </button>
                  <button
                    onClick={() => { handlePause(); setPhase('menu'); stopBgMusic(); }}
                    className="px-8 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                  >
                    🏠 MAIN MENU
                  </button>
                </div>
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
