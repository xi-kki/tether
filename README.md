# 🕸️ Tether — The Math-Powered Grappling Hook

**A physics puzzler where trigonometry controls your swing.** Solve angle clues, extend your tether, and swing across a neon canyon using real pendulum physics.

![License](https://img.shields.io/badge/license-MIT-green)
![Stack](https://img.shields.io/badge/stack-React%20%7C%20TypeScript%20%7C%20Canvas%202D%20%7C%20Vite-blue)
![Architecture](https://img.shields.io/badge/arch-Web%20Worker%20%7C%20Fixed%20Timestep%20%7C%20Verlet-orange)

---

## 🎮 How to Play

**You are a cyberpunk courier standing on a ledge across a neon canyon. You need to swing to the other side — but your grapple is controlled by math.**

### Core Mechanic — Angle + Tether Length

Every level presents a **geometry or trigonometry clue**:

```
Clue: "The complement of 60°"
→ You type: 30
→ Your hook fires at exactly 30°
→ Hold Space to extend the tether
→ Release: pendulum swings at 30° with your chosen length
→ Land on the target platform
```

### Controls

| Input | Action |
|-------|--------|
| `0-9` | Type the angle from the clue |
| `Enter` | Lock in your angle |
| `Space (hold)` | Extend the tether |
| `Space (release)` | Fire the grapple and swing |
| `Enter / Space` | Advance to next level (after landing) |

### Scoring

| Outcome | Points | Effect |
|---------|--------|--------|
| ✦ **Perfect** (angle +-5°, length +-1s) | 500 | Combo increases |
| ✓ **Partial** (one of two correct) | 200 | Combo resets |
| ✗ **Crash** (both wrong) | 0 | Retry the level |

---

## 🧠 Difficulty Progression (12 Levels)

| Level | Topic | Example Clue | Angle |
|-------|-------|-------------|-------|
| 1 | Complementary angles | "The complement of 30°" | 60° |
| 2 | Supplementary angles | "The supplement of 135°" | 45° |
| 3 | Basic trig ratios | "tan(θ) = 1. What is θ?" | 45° |
| 4 | Right triangles | "3-4-5 triangle smallest angle" | 37° |
| 5 | Two-step equations | "θ + 2θ = 90. What is θ?" | 30° |
| 6 | Advanced complements | "Two angles are complementary. One is 35°." | 55° |
| 7 | Inverse trig | "sin⁻¹(0.5) = θ" | 30° |
| 8 | Cosine | "cos(θ) = 0.866" | 30° |
| 9 | Equal ratios | "sin(θ) = cos(θ)" | 45° |
| 10 | Angle equations | "θ + 2θ = 90°" | 30° |
| 11 | Applied trig | "A ramp rises 3m over 9m. Angle?" | 18° |
| 12 | Inverse tangent | "tan⁻¹(2.5)" | 68° |

---

## ✨ Visual Features

- **Neon canyon** — glowing platforms, pulsing grapple points, dark atmospheric gradient
- **Screen shake** — proportional to impact force, decays naturally
- **Particle sparks** — burst effects on landing, crashing, and perfect catches
- **Motion trails** — player leaves a fading neon trail during swing
- **Glow rendering** — multi-pass shadow blur for authentic neon look
- **Dark glassmorphism** — HUD overlays with backdrop blur

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    REACT LAYER (UI)                          │
│  App.tsx · GameCanvas.tsx · HUD · Score · Menus             │
│  Renders: only when score/phase changes                      │
├─────────────────────────────────────────────────────────────┤
│                   GAME LAYER (Coordinator)                   │
│  game.ts — Game loop (fixed timestep), input routing        │
├─────────────────────────────────────────────────────────────┤
│                  ENGINE LAYER (Pure Logic)                   │
│  engine.ts   — State machine, level loading, scoring        │
│  physics.ts  — Verlet pendulum integration                  │
│  levels.ts   — 12 level definitions                         │
│  math.worker — Equation generation (offloaded to Web Worker)│
│  equations.ts — Trig/geometry generators                    │
├─────────────────────────────────────────────────────────────┤
│                  RENDERER LAYER (Canvas 2D)                 │
│  renderer.ts — Neon canyon, grapple, player, sparks         │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Why |
|----------|-----|
| **Fixed timestep physics** | Physics runs at exactly 60 updates/sec regardless of frame rate. No physics drift on slow frames. |
| **Web Worker for math** | Equation generation and answer verification offloaded from main thread. Game never stutters. |
| **Canvas 2D (not DOM)** | GPU-accelerated rendering. No DOM reflows. Predictable 60fps. |
| **Three-layer separation** | React knows nothing about canvas. Engine knows nothing about React. Renderer reads state and draws. |
| **Sui-ready architecture** | Run stats accumulated locally. One signed transaction per run. No blockchain calls during gameplay. |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Language** | TypeScript (strict) |
| **Frontend** | React 18 |
| **Rendering** | HTML5 Canvas 2D |
| **Physics** | Custom Verlet pendulum integration |
| **Math** | Web Worker (dedicated thread) |
| **Build** | Vite 6 |
| **Styling** | Tailwind CSS 3 |
| **Font** | JetBrains Mono |
| **Deploy** | Vercel |
| **Blockchain** | Sui Move (ready for contract) |

---

## 🚀 Local Development

```bash
# Clone
git clone https://github.com/xi-kki/tether
cd tether

# Install
npm install

# Dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Or via CLI:
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 📁 Project Structure

```
tether/
├── src/
│   ├── game/
│   │   ├── engine.ts       # State machine, level loading, scoring
│   │   ├── physics.ts      # Verlet pendulum integration
│   │   ├── renderer.ts     # Canvas 2D neon rendering
│   │   ├── levels.ts       # 12 level definitions
│   │   ├── equations.ts    # Trig/geometry generators
│   │   ├── math.worker.ts  # Web Worker (offloaded math)
│   │   └── game.ts         # Game loop, input routing
│   ├── components/
│   │   └── GameCanvas.tsx  # React canvas wrapper
│   ├── types.ts            # Shared interfaces + neon palette
│   ├── App.tsx             # Main app with HUD + controls
│   ├── main.tsx            # Entry point
│   └── index.css           # Tailwind + neon animations
├── index.html
├── tether-demo.html        # Standalone interactive demo
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── vercel.json
├── .gitignore
└── README.md
```

---

## 🔮 Web3 Roadmap (Sui)

The game is architected for Sui blockchain integration:

| Feature | Smart Contract | Status |
|---------|---------------|--------|
| **Grappling Hook NFT** | Dynamic NFT with XP, max length, swing speed | 📝 Ready to build |
| **Gravity Boots NFT** | Landing stability, wall grip | 📝 Ready to build |
| **Gear Fusion** | Combine two objects → hybrid with blended stats | 📝 Ready to build |
| **Flash Tournaments** | 60-sec rounds, entry fee, instant payout | 📝 Ready to build |
| **Daily Canyons** | Provably fair seeds from on-chain randomness | 📝 Ready to build |

**Design principle:** Game runs at 60fps locally. Blockchain only touches:
- Submitting final score (one tx per run)
- Minting/upgrading gear NFTs
- Fusing gear objects
- Tournament entry + payout

---

## 📸 Interactive Demo

Open `tether-demo.html` in your browser for a standalone interactive demo showing:

- Pendulum physics at 30°, 45°, and 60°
- Neon canyon with glowing platforms and grapple point
- Screen shake effects
- Particle sparks on collisions
- Player motion trails

No build step required — just open the file.

---

## 📄 License

MIT — build on it, ship it, swing across canyons.
