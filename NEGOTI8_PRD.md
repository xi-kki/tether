# Negoti8 AI Agent — Product Requirements Document

## 1. EXECUTIVE SUMMARY

| Field | Value |
|-------|-------|
| **Project Name** | Negoti8 AI Agent |
| **One-Liner** | A voice-first AI negotiation simulator where users practice real-world scenarios by speaking naturally, then get detailed coaching feedback to build muscle memory through repetition. |
| **Type** | AI Agent + Web App (Web2) |
| **Problem** | High-stakes negotiations (salary, fundraising, sales, contracts) are rare events — people don't get enough practice, and the first real attempt is often the one that counts. |
| **Solution** | Practice unlimited scenarios against AI in a voice conversation. Get scored on tactics, tone, filler words, and missed opportunities. Retry until smooth. |
| **Primary Users** | Job seekers ($20K/mo roles), startup founders ($100K+ pre-seed), sales professionals, freelancers/consultants |
| **Secondary Users** | Everyday consumers (cars, houses, bills), business school students |
| **Architecture Style** | Modular monolith (Next.js) with external AI/voice APIs |
| **Timeline** | 3-hour sprint → MVP launched |

## 2. USER FLOW

### Flow 1: First-Time User

```
1. User lands on negot8.ai
2. Sees tagline: "Practice any negotiation. Get coached by AI."
3. Clicks "Try Free" → Google OAuth sign-up (2 clicks)
4. Brief onboarding: "Here's how it works" (3-step carousel, 10 seconds)
5. Redirected to Dashboard → Scenario Library shown
6. User browses scenarios by category and difficulty
7. User clicks "Salary Negotiation (Easy)"
8. Context screen appears:
   - Your role: Junior developer
   - AI role: Friendly recruiter at a mid-size tech company
   - Stakes: $75K base salary offer
   - Goal: Practice your first counter-offer
9. User clicks "Start Negotiation"
10. 3D avatar appears — recruiter character, neutral expression
11. AI speaks first (via TTS): "Thanks for coming in! We're excited to offer you $75K."
12. User presses spacebar → holds → speaks: "I appreciate the offer. Based on my research, the market range for this role is $80-85K. Can we discuss $82K?"
13. User releases spacebar → audio sent to /api/stt → Groq Whisper transcribes
14. Transcript + scenario context sent to /api/ai → Groq LPU responds in character
15. AI response text + sentiment tag returned
16. Avatar switches to "thoughtful" expression (looks up, pauses)
17. Text sent to /api/tts → ElevenLabs returns audio + viseme data
18. Audio plays → avatar lip-syncs to viseme data → expression blends to "friendly"
19. User hears: "Hmm, $82K. That's above our band for this level. I can do $78K with an extra week of vacation. What do you think?"
20. Continue steps 12-19 for remaining turns
21. User clicks "End Negotiation" when ready
22. AI switches to Coach Mode → generates coaching report (1-2 seconds)
23. Coaching report displayed: score 7/10, tactics used, missed opportunities, phrases
24. User can:
    - 🔁 "Retry" → replay same scenario, try different approach
    - 📋 "View Transcript" → full conversation with highlighted moments
    - 📄 "Export PDF" → download full report + transcript
    - ➡️ "Next Scenario" → try something harder
```

### Flow 2: Returning User (Practice Session)

```
1. User opens negot8.app → auto-login via Google OAuth (session persisted)
2. Dashboard loads:
   - 👋 "Welcome back, Alex!"
   - 📊 Progress snapshot: Last session score, 3-day trend arrow
   - 🏆 Badge progress: "2 more salary wins to unlock Salary Master"
   - 🔥 Streak: "5-day streak!"
   - 📌 "Continue where you left off" — picks the last incomplete scenario
   - 💪 "Weaker areas" — surfaced scenarios where score was <6/10
3. Quick Practice Mode (visible at top):
   - "Have a real negotiation soon? Quick warm-up →"
   - 2-minute micro-session: random easy scenario, fast pace
4. User clicks a scenario from their history → sees previous results
   - "You scored 6/10 on 'Senior Counter-Offer' last Tuesday"
   - "Missed: Anchoring with data, handling silence"
   - "Try again with these tips →"
5. User hits "Practice Again"
6. Same voice loop as Flow 1 (steps 10-23)
7. After session → side-by-side comparison:
   - Previous score: 6/10 — Current score: 8/10
   - "📈 +2 points! You anchored with market data this time. Nice!"
   - "Still missed: Handling silence. Try the 'Silence Practice' drill?"
8. User can:
   - 🔁 Practice same scenario again (target: 10/10)
   - ➡️ Move to Hard difficulty of same scenario
   - 🏆 Check badge progress
   - 📅 Set a practice reminder ("Remind me tomorrow at 8am")
```

### Flow 3: Post-Coaching Review

```
1. User views coaching report after a session
2. Scans Overall Score (0-10) with breakdown
3. Reads "What You Did Well" — green highlighted tactics
4. Reads "Missed Opportunities" — red highlights with alternative phrases
5. Plays back specific moments in the transcript
6. Downloads PDF to review before real negotiation
7. Retries with suggested improvements fresh in mind
```

## 3. MVP FEATURES (Phase 1)

### 🎙️ Voice-First Interface
- Push-to-talk (hold spacebar/button → speak → release → AI responds)
- No typing required at any point
- Browser SpeechRecognition or fallback to Groq Whisper
- AI responses played via TTS (ElevenLabs / Cartesia)

### 📚 Scenario Library (10 Scenarios for MVP)

**Salary & Compensation (4 scenarios)**
  - 🟢 **Easy** — Entry-level offer (junior dev, first job out of bootcamp, $75K base). AI is a friendly recruiter. Learn basic anchoring and how to ask for more.
  - 🟡 **Medium** — Senior counter-offer (senior engineer, $180K base + competing offer). AI is a hiring manager with budget constraints. Practice leveraging BATNA.
  - 🔴 **Hard** — Equity vs cash tradeoff (early startup, high-risk, cap table negotiation). AI is a savvy founder/CTO. Navigate strike price, cliff, vesting, and board seat leverage.
  - 🔴 **Hard** — Salary counteroffer from current employer (you have an offer elsewhere, boss wants you to stay). AI is your current manager. Navigate loyalty pressure, retention bonus, and career growth promises vs real money.

**Fundraising & Equity (3 scenarios)**
  - 🟢 **Easy** — Co-founder equity split (50/50 vs 60/40, vesting schedule, cliff). AI is a potential co-founder. Practice role-based equity, vesting cliffs, and intellectual property assignment.
  - 🟡 **Medium** — Pre-seed valuation ($500K ask, friends & family round). AI is an angel investor. Defend your valuation, negotiate SAFE vs priced round.
  - 🔴 **Hard** — Series A valuation ($5M raise, lead VC term sheet). AI is a seasoned VC partner. Navigate valuation, board seat, liquidation preference, anti-dilution, and pro-rata rights.

**Sales & Freelance (3 scenarios)**
  - 🟢 **Easy** — Freelance rate negotiation ($150/hr → push to $185/hr). AI is a startup founder. Practice value-based pricing, scope anchoring, and pushback on discounts.
  - 🟡 **Medium** — Client contract scope creep ($30K fixed-price project, client keeps adding features). AI is a demanding client. Practice pushback, change orders, kill fees, and graceful exit.
  - 🔴 **Hard** — Vendor pricing negotiation (B2B SaaS, $120K annual contract, incumbent supplier). AI is a seasoned vendor sales director. Practice competitive bidding, contract leverage, multi-year discounts, and walking away.

**Consumer (4 scenarios)**
  - 🟢 **Easy** — Car buying at dealership (new EV, $48K MSRP). AI is a salesperson. Practice MSRP vs invoice, trade-in leverage, walking away, and add-on resistance.
  - 🟡 **Medium** — Rent negotiation with landlord ($3,200 asking luxury 1BR, tenant's market). AI is a stubborn landlord. Practice comparable listings, move-in date leverage, amenity concessions, and month-to-month terms.
  - 🟡 **Medium** — Buying a house (offer below asking, inspection contingencies, closing costs). AI is a seller's agent. Navigate offer price, earnest money, inspection repairs, and appraisal gap.
  - 🔴 **Hard** — Contractor quote dispute (kitchen remodel, $45K quote, 20% change order overage). AI is a general contractor. Navigate scope creep, lien rights, payment schedule.

Each scenario defines: role context, AI personality archetype, stakes/anchors, your BATNA list, tactics the AI will use against you

### 🧠 AI Negotiation Engine (Groq LPU)
- Llama 3.3 70B / Mixtral 8x7B plays the other party in character
- Sub-500ms response time — faster than human conversation
- Adaptive personality (friendly recruiter, tough VC, aggressive client)
- Multi-turn, branching conversation
- Session ends naturally or timed

### 👤 3D Reactive Avatar (Face-to-Face)
- Stylized 3D character serves as the visual counterpart you negotiate with
- **Lip-sync** — avatar's mouth shapes match every word spoken by the AI in real time, driven by viseme data from TTS provider
- **Emotional reactions** driven by AI sentiment in real time:
  - 😠 **Stern** — narrows eyes, firm mouth — pushing a hard offer or rejecting your lowball
  - 😊 **Friendly** — warm smile, relaxed posture — building rapport, making small concessions
  - 🤔 **Thoughtful** — looks up, pauses — considering your proposal
  - 😏 **Skeptical** — raised eyebrow, half-smirk — **user makes a weak argument** or unrealistic demand
  - 😤 **Frustrated** — frown, crossed arms, tight jaw, slight head shake — **user lowballs** or wastes time
  - 🧐 **Interested** — leans forward, raised brows, focused — **user presents a strong BATNA** or compelling data
  - 😐 **Neutral** — attentive, calm — listening mode
  - 😃 **Pleased** — big smile, nods — you made a good point or accepted
  - 😌 **Satisfied** — warm smile, slow nod, relaxed shoulders — **deal is closing**, terms are mutually agreeable

- **Reaction triggers** are embedded in the AI prompt — the model outputs sentiment tags alongside dialogue so the avatar knows which expression to use and when
  - **Eye contact** — avatar looks at you naturally, breaks gaze when "thinking" or looking at notes
- **Body language** driven by AI sentiment:
  - 💪 **Crosses arms** — defensive, hard position, user is pushing against their底线
  - 🫴 **Leans forward** — engaged, interested, user made a compelling point
  - 🫣 **Leans back** — skeptical, distancing from an unrealistic proposal
  - ✅ **Nods slowly** — agreement, conceding ground
  - 🤷 **Shrugs** — indifference, "take it or leave it"
  - 👏 **Open palms** — honest, transparent, building trust
  - ✋ **Raised hand** — "hold on, let me stop you there" — objection incoming
- Character design changes per scenario (suit for salary negotiation, hoodie for VC pitch, casual for car dealer)
- Built with Three.js + Ready Player Me or custom model with morph targets for expressions + visemes

### 📊 Post-Negotiation Coaching

After clicking **End Negotiation**, the AI instantly switches from roleplay mode to **Coach Mode** and generates:

- **📊 Overall Score (0-10)** with detailed breakdown:
  - 💰 **Outcome** (0-3) — Did you hit your target? Deal value vs goals
  - 🧠 **Tactics** (0-3) — Which tactics you used, how effectively
  - 🎭 **Delivery** (0-2) — Tone, confidence, filler words, pacing
  - 🔄 **Adaptability** (0-2) — How well you responded to curveballs
- **✅ What You Did Well** — Specific tactics detected (you anchored well, you used silence effectively, you asked for more)
- **❌ Missed Opportunities** — Tactics you didn't use that would've worked here ("You could have asked for a higher counter when they didn't reject your first number")
- **🗣️ Specific Phrases You Could Have Said** — Exact scripts you can use next time ("Try: 'I appreciate the offer, but based on my research, the market range for this role is actually $X-$Y...'")
- **📊 Tactics Breakdown** — Which tactics you used vs which the AI used against you (anchoring, mirroring, labeling, silence, BATNA, good cop/bad cop, nibbling, limited authority, etc.)
- **📉 Filler Word Analysis** — Count of "um", "uh", "like", "you know", "sort of" — with timestamps
- **🎭 Tone & Pacing** — Were you too aggressive? Too passive? Did you let silence work?
- **📋 Key Metrics Summary** — Deal value, concessions made, time to close, power shifts

### 📜 Conversation Transcript
- Full text transcript of the entire negotiation, turn by turn
- Each turn labeled with speaker (You / [AI Character Name])
- Timestamps for each exchange
- **🎯 Highlighted key moments** — automatically tagged in the transcript:
  - ⚓ **Anchors** — First numbers thrown by either side
  - 🔄 **Counteroffers** — Every time a new number or term is proposed
  - 📉 **Concessions** — When either side gives ground
  - 🤫 **Silences** — Pauses longer than 3 seconds where someone should've spoken
  - 🚩 **Missed opportunities** — Bold red highlight where you could have pushed
  - 🟢 **Good tactics** — Green highlight when you used a tactic effectively
- **Exportable as PDF** — full transcript with highlights, coaching report, and score breakdown in one document

### 🔁 Retry & Compare
- Replay same scenario with fresh AI
- See previous session score vs current score
- Track improvement per scenario

### 📊 Difficulty Levels

Every scenario available in 3 difficulty tiers. The AI's personality, tactics, and intensity scale with difficulty.

#### 🟢 Easy — Reasonable Counterpart
- AI is cooperative, transparent about constraints
- Uses basic tactics: anchoring, asking for discount
- Reveals their BATNA if you ask the right way
- Gives clear signals when you're on the right track
- **Goal:** Learn the fundamentals without intimidation

#### 🟡 Medium — Tough But Fair
- AI uses anchoring, silence, limited authority ("I need to check with my manager")
- Pushes back on weak arguments, rewards strong data
- Hides their BATNA — you have to discover it
- Introduces time pressure ("offer expires in 48 hours")
- **Goal:** Practice real-world resistance and recovery

#### 🔴 Hard — Seasoned Negotiator
- AI uses emotional manipulation ("I'm disappointed you'd ask that"), false deadlines ("other candidate accepts tomorrow"), nibbling ("can you also include X, Y, Z?")
- Gaslighting, guilt trips, good cop/bad cop
- Personal attacks on your credentials or offer
- Multiple simultaneous leverage points
- **Goal:** Build immunity to high-pressure tactics

### 🔐 Auth
- Google OAuth via Supabase Auth
- Email/password fallback
- Session history saved per user

---

## 🧊 Phase 2 (Nice-to-Have — Post-Launch)

### 📈 Progress Tracking
- **Track negotiation scores over time** across all sessions and scenarios
- **Improvement curve** — line chart showing score trend (Overall, Tactics, Delivery) across practice sessions
- **Strengths & weaknesses radar** — visual breakdown of which tactic categories you excel at vs need work
- **Session history** — scrollable list of past negotiations with scores, dates, and quick rewatch

### 🏆 Badge System
- Earn badges for achievements:
  - 🥇 **Salary Master** — Complete all salary scenarios on Hard
  - 🦄 **VC Whisperer** — Close 3 successful fundraising negotiations
  - 🛡️ **Scope Guardian** — Defeat scope creep 5 times
  - 🔥 **10-Day Streak** — Practice 10 days in a row
  - 🧠 **Tactician** — Use every tactic in the book at least once
  - 🤫 **Silent But Deadly** — Win a negotiation by letting silence work
- Badges displayed on profile/dashboard
- Shareable badge cards for LinkedIn

### 🎛️ Custom Scenarios
- **User creates their own scenario** by pasting a job offer letter, contract, term sheet, or describing the situation
- **AI generates the counterpart persona automatically** — reads the document and creates:
  - The other party's personality, role, and constraints
  - Their opening position and walk-away point
  - Tactics they'll use against you (based on their leverage)
  - Their emotional triggers and pressure points
- AI also generates:
  - Your leverage points and BATNA
  - Suggested negotiation strategy
  - Potential counteroffers to prepare
- Save custom scenarios to your personal library
- Share custom scenarios with others (optional)

### 👥 Multiplayer Mode
- **Two users negotiate with each other** in real-time via voice
- Both see 3D avatars of each other — avatar reacts to what the other person says in real time
- **AI coaches both parties after** — each player gets their own coaching report analyzing their tactics, missed opportunities, and how they performed against a real human
- Scenario library works for multiplayer (both sides get role briefs before starting)
- Optional: AI referee mode — AI jumps in if negotiation goes off track
- Matchmaking — find a practice partner at your skill level

### 📱 Mobile App (React Native for iOS/Android)
- **Practice on the go** — right before your actual negotiation, warm up with a quick session in the lobby, Uber, or parking lot
- Full voice + 3D avatar experience on mobile (optimized for one-handed use)
- **Quick Practice mode** — 2-minute micro-sessions for last-minute prep
- Push notifications for practice reminders, streak alerts, new scenarios
- Offline mode — download scenarios, practice with lightweight AI, sync results later
- Mobile-optimized 3D avatars (lighter models, same expression/emotion system)
- Same account, progress syncs seamlessly across web + mobile

### 🎤 Voice Analytics
- Tone analysis (confident vs hesitant)
- Pace tracking (words per minute)
- Filler word reduction over time
- Volume/energy level consistency

## 7. TECH STACK

| Layer | Choice | Justification |
|-------|--------|---------------|
| **Language** | TypeScript (strict) | Type-safe, AI-friendly, end-to-end types |
| **Frontend** | **Next.js 14 (App Router)** → shadcn/ui + Tailwind CSS | Full-stack framework, SSR for landing, App Router for routes |
| **UI Library** | **shadcn/ui** + **Tailwind CSS** | Pre-built accessible components, utility-first styling, fast iteration |
| **3D Rendering** | **React Three Fiber** (R3F) + **Three.js** | Declarative Three.js via React components, scene management, animation blending |
| **Avatar** | **Ready Player Me** (GLB models with morph targets) | Pre-rigged avatars with ARKit blendshapes, exportable as GLB, free tier |
| **Lip-sync** | **OVR Lip Sync** (WASM) + **Rive** (2D fallback) | OVR Lip Sync analyzes audio waveform directly — no TTS viseme dependency, works with any voice. Rive as lightweight 2D fallback for low-end mobile |
| **Animations** | **Mixamo** (body) + **custom ARKit blendshapes** (face) | Mixamo: 2000+ free animations for body language (cross arms, lean, nod). Custom blendshapes: 7 facial expressions via morph targets mapped to AI sentiment |
| **Backend Runtime** | **Node.js 20+** + **Express** via Next.js API routes | Serverless-ready. Express gives us middleware (auth, rate-limit, logging) and route flexibility. Or use Next.js Route Handlers for tighter Vercel integration — choose based on streaming needs. |
| **API Architecture** | **Next.js Route Handlers** (App Router) or **Express Router** | `/api/stt`, `/api/ai`, `/api/tts`, `/api/coach` — each is a standalone endpoint. Express if we need WebSocket support for real-time audio streaming later. |
| **Streaming** | **Web Streams API** (Response.stream) | Stream AI responses token-by-token for real-time avatar expression updates |
| **Queue** | **Inngest** or simple PostgreSQL queue | Prevent concurrent API request spikes. Queue → process → respond |
| **Secrets** | **Vercel Environment Variables** + Supabase Vault | API keys for Groq, ElevenLabs stored securely, never in code |
| **AI Engine** | **Llama 3.3 70B Versatile** via Groq SDK (`groq-sdk` npm) | Sub-500ms inference on LPU hardware. Handles roleplay (negotiation counterpart), sentiment extraction for avatar expressions, and coaching report generation — all via a single model with structured prompts. |
| **Transcription** | **Whisper large-v3** via Groq API | State-of-the-art accuracy. Handles filler words, pauses, overlapping speech. `groq-sdk` → `audio.transcriptions.create()` with model: `"whisper-large-v3"`. |
| **Voice Recording** | **MediaRecorder API** (browser native) | No extra library needed. Captures WebM audio blobs, streams to STT. Works on desktop + mobile. |
| **Voice Playback** | **Web Audio API** (browser native) | Zero-dependency audio playback. Controls timing, volume, queue management for AI response audio. |
| **Text-to-Speech** | **ElevenLabs** or **PlayHT** | Fast, natural voices. ElevenLabs: viseme data for lip-sync. PlayHT: ultra-low latency streaming, good for real-time conversation. Voice variety per scenario character. |
| **Database** | **PostgreSQL** via **Supabase** | User profiles, scenario library (50+ pre-written), session history, coaching reports, progress tracking, badge achievements. Row Level Security for multi-tenant data isolation. |
| **Auth** | **Supabase Auth** | Google OAuth + email/password, Row Level Security, session management |
| **State (Frontend)** | **Zustand** | Lightweight, TypeScript-first state management. Stores session state, avatar expression, audio pipeline state. No boilerplate. |
| **State (Backend)** | **Redis** (Upstash) | Serverless Redis for real-time session state, rate limiting, queue management. Low-latency, pay-per-use. |
| **Audio Storage** | Supabase Storage or Vercel Blob | Store session recordings for review and playback |
| **Frontend Hosting** | **Vercel** | Auto-deploy from GitHub, edge functions for low-latency API routes, free tier for MVP |
| **Backend Hosting** | **Railway** or **Render** | Persistent server for WebSocket support (real-time audio streaming), Express server, background job processing. Railway: simpler deploy from GitHub. Render: better free tier. |
| **File Storage** | **Cloudflare R2** | S3-compatible, zero egress fees. Store avatar GLB models, session audio recordings, user-uploaded documents for custom scenarios. Much cheaper than S3 at scale. |
| **CDN** | **Vercel Edge Network** | Global CDN for static assets (avatar GLBs, audio files, JS bundles) |
| **Monitoring** | **Sentry** (error tracking) + **Axiom** (logs) | Catch production errors, monitor API latency, track Groq/ElevenLabs API failures |
| **Queue** | Inngest or simple DB-backed queue | Prevent AI request pile-up during peak usage |

## 5. TECHNICAL ARCHITECTURE

### 5.1 Frontend (React / Next.js)

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| **UI Framework** | React 18 + Next.js App Router | Page routing, SSR for landing, client components for practice |
| **3D Rendering** | Three.js + @react-three/fiber | 3D avatar rendering, morph targets, lip-sync, lighting |
| **Voice Capture** | MediaRecorder API + WebAudio | Record user speech, stream to STT API, audio visualization |
| **Audio Playback** | Web Audio API + Howler.js | Play TTS responses with queue management |
| **Styling** | Tailwind CSS + shadcn/ui | UI components, glassmorphism panels, coaching cards |
| **State** | React Context + Zustand | Session state, avatar state, audio pipeline state |
| **Auth Client** | Supabase Auth Helpers (Next.js) | Google OAuth, session management |

**Key Frontend Components:**
- `RecordButton.tsx` — Push-to-talk with hold animation, audio level indicator
- `AvatarCanvas.tsx` — Three.js canvas wrapping the 3D character with expression blending
- `NegotiationPlayer.tsx` — Orchestrates the STT → AI → TTS → Avatar loop
- `CoachingReport.tsx` — Score breakdown, tactics radar, transcript with highlights
- `ScenarioSelector.tsx` — Browse/filter scenarios by category and difficulty

**Data Flow (Per Turn):**
```
User speaks → MediaRecorder captures audio blob
  → /api/stt (Groq Whisper) → transcript
  → /api/ai (Groq LPU) → AI response text + sentiment + tactic tags
  → /api/tts (ElevenLabs) → audio + viseme data
  → Play audio through Web Audio → Drive avatar expressions/visemes
  → Repeat until user clicks "End Negotiation"
```

### 5.2 API Routes (Next.js)

| Route | Method | Input | Output | Latency Target |
|-------|--------|-------|--------|----------------|
| `/api/stt` | POST | Audio blob (WebM) | `{ transcript, duration_ms }` | <500ms |
| `/api/ai` | POST | `{ transcript, scenario_context, history }` | `{ response_text, sentiment, tactics_used, expression_tags }` | <500ms |
| `/api/tts` | POST | `{ text, voice_id }` | `{ audio_url, viseme_data[] }` | <300ms |
| `/api/coach` | POST | `{ full_transcript, scenario_id }` | `{ score, breakdown, missed_opps, phrases, filler_words }` | <2s |

### 5.3 3D Avatar System

The avatar is the visual face of the AI counterpart. Built with Three.js and driven by AI sentiment + viseme data.

**Tech Stack:**
| Component | Library | Role |
|-----------|---------|------|
| 3D Engine | Three.js + @react-three/fiber | Render, lighting, camera |
| Avatar Model | Ready Player Me (GLB) or custom | Character mesh with morph targets |
| Animation | three-mesh-bvh + custom blend tree | Expression transitions, idle breathing |
| Lip-sync | Viseme data from ElevenLabs | Mouth shapes mapped to morph targets |
| Emotion System | Custom EmotionController | Blends between 7 expression states |

**Avatar Pipeline (per AI response):**
```
AI responds → Groq LPU returns text + sentiment tag  
  → Text sent to /api/tts → returns audio + viseme frames  
  → Viseme data mapped to morph targets (jaw open, lips, tongue)  
  → Sentiment tag mapped to expression (smile, frown, eyebrow raise)  
  → EmotionController blends idle → expression over 200ms  
  → Audio plays → viseme driver updates mouth in sync  
  → When audio ends → blend back to idle expression
```

**Expression Morph Targets:**
| Expression | Morphs | Trigger |
|-----------|--------|--------|
| Neutral | Default | Listening, waiting |
| Happy | Smile, cheek raise, eye squint | Deal closing, user makes good point |
| Stern | Brow furrow, tight lips | Pushing hard offer, rejecting lowball |
| Skeptical | One brow raise, half-smirk | User makes weak argument |
| Frustrated | Frown, brow lower, head shake | User lowballs or wastes time |
| Thoughtful | Look up, slight head tilt | Considering proposal |
| Surprised | Brows up, eyes wide, mouth drop | Unexpected counteroffer |

### 🎨 3D Avatar Implementation Options

#### ✅ Option 1: Ready Player Me (Recommended for MVP)

| Aspect | Detail |
|--------|--------|
| **Why** | Pre-built, cross-platform avatar system. Web SDK + Three.js integration exists. Free tier generous. Users can customize their avatar via browser. |
| **Setup** | `npm install @readyplayerme/react-avatar` or load via Web SDK → export GLB → render in Three.js |
| **Model Format** | GLB with standard morph targets for ARKit blendshapes (52 visemes built-in) |
| **Morph Targets** | Uses ARKit blendshapes — jawOpen, mouthClose, browRaise, browLower, etc. Maps directly to our 7 expressions |
| **TTS Integration** | ElevenLabs returns viseme IDs → map to ARKit blendshapes by index |
| **Character Variants** | Can swap outfits via Ready Player Me asset store or custom textures |
| **Load Time** | ~1-2s for GLB download + parse, cacheable via IndexedDB |
| **Cost** | Free tier: unlimited renders, 5,000 avatar creations/mo |
| **Limitations** | Less control over hyper-specific expressions. Must work within ARKit blendshape set. |

### 🛠️ How: Ready Player Me Implementation (MVP)

#### Step 1: User Picks or Creates an Avatar
- **User opens the Ready Player Me creator** (embedded via iframe or Web SDK) inside the app
- Options:
  - Pick from **RPM library** of pre-made avatars (100+ styles, diverse ethnicities, outfits)
  - **Create custom avatar** — customize face shape, skin tone, hair, eyes, outfit via the RPM web widget
  - **Upload a selfie** → RPM generates a stylized likeness (optional, Phase 2)
- Once selected, **export as GLB file** — RPM provides a downloadable GLB with full morph target rigging
- GLB URL is saved to the user's profile in Supabase
- **Fallback for MVP:** Use a single default avatar GLB (no customization screen needed at launch)

```tsx
// RPM Web SDK returns a GLB URL after avatar creation
const avatarsdk = new AvatarSDK({
  subdomain: 'negoti8',
  language: 'en',
});

// After user finishes customization:
avatarsdk.createAvatar({}, (avatarUrl: string) => {
  // avatarUrl = 'https://models.readyplayer.me/abc123.glb'
  saveAvatarUrlToProfile(avatarUrl);
});

// For users who skip: use a default
const AVATAR_URL = user.avatar_url || 'https://models.readyplayer.me/default-negoti8.glb';
```

#### Step 2: Load GLB into Three.js Scene
```tsx
// AvatarCanvas.tsx — the core 3D component
import { Canvas, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useEffect, useRef } from 'react';

function AvatarModel({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url);
  const mesh = gltf.scene.children[0] as THREE.SkinnedMesh;
  
  // Ready Player Me GLBs have morph targets on the mesh
  // Accessible via: mesh.morphTargetInfluences
  
  return <primitive object={gltf.scene} />;
}
```

#### Step 3: Map ElevenLabs Visemes → Morph Targets
```tsx
// ElevenLabs returns visemes as an array of { id, offset } per frame
// ARKit blendshapes map directly to Ready Player Me morph targets

const VISEME_MAP: Record<number, string> = {
  0: 'jawOpen',           // silence
  1: 'jawOpen',           // AE, AH
  2: 'mouthClose',        // B, M, P
  3: 'mouthShrugUpper',   // CH, JH, SH
  4: 'jawOpen',           // DH, TH
  5: 'mouthFunnel',       // EH, UH
  6: 'mouthLeft',         // F, V
  7: 'jawOpen',           // IH
  8: 'jawOpen',           // IY
  9: 'mouthClose',        // N, T, D
  10: 'jawOpen',          // OW
  11: 'jawOpen',          // UH
  12: 'mouthFunnel',      // UW
  13: 'jawOpen',          // AA
  14: 'mouthFunnel',      // AO
  15: 'jawOpen',          // AW
  16: 'jawOpen',          // AY
  17: 'mouthFunnel',      // ER
  18: 'jawOpen',          // EY
  19: 'jawOpen',          // IH
  20: 'jawOpen',          // OY
  21: 'jawOpen',          // W
};

function applyViseme(mesh: THREE.SkinnedMesh, visemeId: number, intensity: number) {
  const targetName = VISEME_MAP[visemeId];
  const idx = mesh.morphTargetDictionary?.[targetName];
  if (idx !== undefined && mesh.morphTargetInfluences) {
    mesh.morphTargetInfluences[idx] = intensity;
  }
}
```

#### Step 4: Emotion Controller
```tsx
// Each expression is a set of morph target blends
const EXPRESSIONS: Record<string, Record<string, number>> = {
  neutral: {},
  happy: { smile: 0.8, cheekSquint: 0.5, eyeBlinkLeft: 0.1 },
  stern: { browDownLeft: 0.7, browDownRight: 0.7, mouthPressLeft: 0.4 },
  skeptical: { browRaiseLeft: 0.6, mouthSmileLeft: 0.3 },
  frustrated: { browDownLeft: 0.9, browDownRight: 0.9, mouthFrownLeft: 0.7, headNod: 0.2 },
  thoughtful: { browRaiseRight: 0.4, gazeUp: 0.6 },
  surprised: { browRaiseLeft: 0.8, browRaiseRight: 0.8, jawOpen: 0.5 },
};

class EmotionController {
  private current: Record<string, number> = {};
  private target: Record<string, number> = {};
  private speed = 0.05; // blend per frame (~200ms to full expression)

  setExpression(name: string) {
    this.target = EXPRESSIONS[name] || EXPRESSIONS.neutral;
  }

  update(mesh: THREE.SkinnedMesh) {
    // Lerp each morph target toward target
    for (const [key, val] of Object.entries(this.target)) {
      const idx = mesh.morphTargetDictionary?.[key];
      if (idx !== undefined && mesh.morphTargetInfluences) {
        this.current[key] ??= 0;
        this.current[key] += (val - this.current[key]) * this.speed;
        mesh.morphTargetInfluences[idx] = this.current[key];
      }
    }
  }
}
```

#### Step 5: Orchestrate the Full Pipeline
```tsx
// In NegotiationPlayer.tsx — ties voice → AI → avatar together

async function handleUserSpeech(audioBlob: Blob) {
  // 1. Transcribe
  const { transcript } = await fetch('/api/stt', { method: 'POST', body: audioBlob }).then(r => r.json());
  
  // 2. Get AI response
  const { response_text, sentiment } = await fetch('/api/ai', { method: 'POST', body: JSON.stringify({ transcript }) }).then(r => r.json());
  
  // 3. Set avatar expression immediately (before audio plays)
  emotionController.setExpression(sentiment);  // 'happy' | 'stern' | 'skeptical' | etc.
  
  // 4. Get TTS + visemes
  const { audio_url, visemes } = await fetch('/api/tts', { method: 'POST', body: JSON.stringify({ text: response_text }) }).then(r => r.json());
  
  // 5. Play audio + drive lip-sync
  const audio = new Audio(audio_url);
  const visemeQueue = [...visemes];  // Each viseme has { id, offset_ms }
  
  audio.play();
  const startTime = performance.now();
  
  function driveVisemes() {
    const elapsed = performance.now() - startTime;
    while (visemeQueue.length && visemeQueue[0].offset_ms <= elapsed) {
      const viseme = visemeQueue.shift()!;
      applyViseme(mesh, viseme.id, 0.8);
    }
    requestAnimationFrame(driveVisemes);
  }
  driveVisemes();
}
```

#### Step 6: Idle Animation (Alive Breathing)
```tsx
function IdleAnimation({ mesh }: { mesh: THREE.SkinnedMesh }) {
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Gentle breathing: subtle chest rise
    const breathe = Math.sin(t * 1.5) * 0.02;
    mesh.position.y = breathe;
    // Micro-sway
    mesh.rotation.z = Math.sin(t * 0.8) * 0.01;
    // Blink every 3-5 seconds
    if (Math.sin(t * 0.3) > 0.95 && mesh.morphTargetInfluences) {
      const blinkIdx = mesh.morphTargetDictionary?.['eyeBlinkLeft'];
      if (blinkIdx !== undefined) mesh.morphTargetInfluences[blinkIdx] = 0.8;
    }
  });
  return null;
}
```

#### Directory Structure (Avatar System)
```
src/components/avatar/
├── AvatarCanvas.tsx       # Three.js canvas wrapper
├── AvatarModel.tsx        # GLB loader + render
├── EmotionController.ts   # Expression blend engine
├── visemeMap.ts           # ElevenLabs → ARKit mapping
├── expressions.ts         # Expression presets (morph target blends)
├── IdleAnimation.tsx      # Breathing, blinking, micro-movements
└── CharacterVariant.tsx   # Material/outfit swapping per scenario
```

### 🧩 Lip-Sync Options

#### Option A: ElevenLabs Viseme Data (Recommended)
- ElevenLabs TTS returns viseme frames with every audio response
- Each viseme has `{ id: number, offset_ms: number }` — maps directly to mouth shapes
- Lowest latency, single API call, built into our TTS pipeline
- Already covered in Step 3 above

#### Option B: OVR Lip Sync (Unity-style, WebAssembly)
- [OVR Lipsync for Web](https://github.com/willeastcott/ovr-lipsync) — JS port of Oculus' lip-sync engine
- Analyzes audio waveform directly to generate mouth shapes
- No viseme data needed — works with any audio source
- **Best if:** We switch TTS providers and lose viseme support
- **Trade-off:** ~2MB WASM bundle, slightly less accurate than viseme-driven

```tsx
// OVR Lip Sync approach — analyze audio buffer instead of viseme data
import OVRLipSync from 'ovr-lipsync';

const lipSync = new OVRLipSync();
const visemes = lipSync.processAudio(audioBuffer);
// Returns { sil, PP, FF, AA, etc. } — similar to viseme IDs
```

#### Option C: Rive (2D Animation for Low-End Devices)
- [Rive](https://rive.app/) — 2D vector character animation with real-time state machine
- **Best if:** We need a fallback for low-end phones that can't run WebGL avatars
- Lottie-like but with state machine (idle → talking → expressing)
- No 3D, lighter weight (~500KB vs 5MB+ for 3D avatar)
- Could be the **mobile MVP path** — 2D animated character instead of 3D to ship faster

**Decision (MVP):** Use **ElevenLabs visemes** (already in pipeline, zero extra cost). Fallback to **Rive 2D character** on low-end mobile devices. OVR Lip Sync as backup if we change TTS providers.

---

### 📁 Code Structure: Avatar System

```
src/
├── components/avatar/          # 3D avatar components
│   ├── AvatarCanvas.tsx        # Three.js canvas wrapper
│   ├── AvatarModel.tsx         # GLB loader + renderer
│   ├── EmotionController.ts    # Expression blend engine (7 states)
│   ├── visemeMap.ts            # ElevenLabs → ARKit blendshape mapping
│   ├── expressions.ts          # Morph target presets per emotion
│   ├── IdleAnimation.tsx       # Breathing, blinking, micro-movements
│   ├── LipSyncDriver.tsx       # Viseme → morph target animation loop
│   ├── CharacterVariant.tsx    # Material/outfit swapping per scenario
│   └── AvatarSelector.tsx      # RPM widget integration for picking/creating avatar
│
├── lib/avatar/
│   ├── useAvatar.ts            # Hook: load avatar GLB, manage state
│   ├── useEmotion.ts           # Hook: control expression from AI sentiment
│   ├── useLipSync.ts           # Hook: drive mouth from viseme data
│   └── avatarStore.ts          # Zustand store: current avatar URL, expression state
│
├── types/
│   └── avatar.ts              # AvatarExpression, VisemeFrame, EmotionState types
```

**Key Interfaces:**
```tsx
// types/avatar.ts
export interface VisemeFrame {
  id: number;          // ElevenLabs viseme ID (0-21)
  offset_ms: number;   // When this viseme starts
}

export type EmotionType =
  | 'neutral'
  | 'happy'
  | 'stern'
  | 'skeptical'
  | 'frustrated'
  | 'thoughtful'
  | 'surprised';

export interface EmotionState {
  current: EmotionType;
  intensity: number;      // 0-1 (some expressions can be subtle or strong)
  target: EmotionType;     // What we're blending toward
  blendProgress: number;   // 0-1 (lerp progress)
}

export interface AvatarConfig {
  url: string;              // GLB URL from RPM
  variant: 'corporate' | 'vc' | 'trades' | 'property';
  skinTone?: string;
  outfitColor?: string;
}
```

---

#### ✅ Option 2: Three.js + Custom Rig (Advanced — Post-MVP)

**Why:** Full control over every vertex and expression. Better performance (optimized mesh, no RPM overhead). Custom animations for unique brand identity. No dependency on third-party avatar service.

### 🛠️ How: Three.js + Custom Rig Implementation (Post-MVP)

#### Step 1: Get a Pre-Rigged Character Model

**Source a base mesh** from one of these free libraries:
- [**Mixamo**](https://www.mixamo.com) — 100+ ready-to-rig characters, auto-rigging tool for custom models, full skeleton included
- [**Sketchfab**](https://sketchfab.com) — thousands of CC-licensed models, filter by "rigged" + "downloadable"
- [**Poly Pizza**](https://poly.pizza) — free low-poly characters, simpler but great for stylized look
- [**Quixel Megascans**](https://quixel.com) — high-quality 3D assets (free with Epic account)

**Pick a character** that matches Negoti8's aesthetic — professional, slightly stylized, diverse options.

#### Step 1b: Import into Blender and Add Facial Blendshapes
```
// Blender workflow:
// 1. Download pre-rigged FBX/GLB from Mixamo or Sketchfab
// 2. Import into Blender (File → Import → FBX/GLB)
// 3. Select the mesh, go to Shape Keys panel
// 4. Create blendshapes (shape keys) for ARKit-compatible facial expressions:
//    Jaw:     jawOpen, jawLeft, jawRight
//    Mouth:   mouthSmile, mouthFrown, mouthPress, mouthStretch,
//             mouthPucker, mouthShrug
//    Eyes:    eyeBlinkLeft, eyeBlinkRight, eyeWide, eyeSquint
//    Brows:   browRaiseLeft, browRaiseRight, browDownLeft, browDownRight
//    Cheeks:  cheekSquint, cheekPuff
//    Head:    headNod, headShake, headTilt
// 5. Sculpt each shape key by pulling vertices in Edit Mode
//    - Smile: pull mouth corners up and outward
//    - Frown: pull mouth corners down
//    - Jaw Open: rotate jaw bone or pull lower teeth down
//    - Eyebrow Raise: pull brow vertices up
// 6. Keep it subtle — small vertex movements = more natural look
// 7. Export as GLB: File → Export → glTF 2.0 (.glb)
//    ✅ Include: Selected Objects, Shape Keys, Animations, Ski
//    ❌ Exclude: Cameras, Lights
```

**Pro tip:** You only need ~15 well-made shape keys to cover all 7 expressions. Each expression is a blend of multiple shape keys at different intensities.

#### Step 2: Load into Three.js with Skeleton + Morph Targets
```tsx
import { useGLTF, useAnimations } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

function CustomAvatar({ url }: { url: string }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations, materials } = useGLTF(url);
  const { actions, mixer } = useAnimations(animations, group);

  useEffect(() => {
    // The mesh with morph targets is usually the skinned mesh
    const mesh = scene.children.find(c => c instanceof THREE.SkinnedMesh) as THREE.SkinnedMesh;
    if (mesh) {
      console.log('Morph targets:', mesh.morphTargetDictionary);
      // morphTargetDictionary = { jawOpen: 0, smile: 1, browRaise: 2, ... }
    }
    
    // Play idle animation on loop
    actions['idle']?.play();
  }, []);

  return <primitive ref={group} object={scene} scale={1} />;
}
```

#### Step 3: Custom Emotion System (More Expressive Than RPM)
```tsx
// Custom rig gives us more morph targets than Ready Player Me
// We can define micro-expressions that RPM doesn't support

const CUSTOM_EXPRESSIONS: Record<string, Record<string, number>> = {
  neutral: {},
  happy: {
    mouthSmile: 0.9,
    cheekSquint: 0.6,
    eyeBlinkLeft: 0.1,
    eyeBlinkRight: 0.1,
    browRaiseLeft: 0.2,
    browRaiseRight: 0.2,
  },
  stern: {
    browDownLeft: 0.8,
    browDownRight: 0.8,
    mouthPress: 0.6,
    jawOpen: 0.05,  // subtle clench
  },
  skeptical: {
    browRaiseLeft: 0.7,   // one eyebrow up — signature skepticism
    mouthSmileLeft: 0.3,   // half-smirk
    headTilt: 0.15,        // tilt head slightly
  },
  frustrated: {
    browDownLeft: 0.9,
    browDownRight: 0.9,
    mouthFrown: 0.8,
    eyeSquint: 0.4,
    headShake: 0.1,        // micro-shake
  },
  thoughtful: {
    browRaiseRight: 0.5,   // one brow up
    gazeUp: 0.7,            // look up and to the side
    mouthSmileLeft: 0.1,    // subtle thinking expression
  },
  surprised: {
    browRaiseLeft: 1.0,
    browRaiseRight: 1.0,
    jawOpen: 0.7,
    eyeWide: 0.9,
  },
  // Custom micro-expressions unique to our rig:
  suspicious: {
    browDownLeft: 0.3,
    browRaiseRight: 0.4,
    eyeSquint: 0.5,
    headTilt: 0.1,
  },
  confident: {
    browRaiseLeft: 0.1,
    browRaiseRight: 0.1,
    mouthSmile: 0.3,
    jawOpen: 0.0,
    headNod: 0.05,
  },
};
```

#### Step 4: Mixamo Animations (Free, 2000+ Animations)
```tsx
// Download animations from https://www.mixamo.com
// Mixamo animations are FBX — convert to GLB via Blender or CLI
// 
// Recommended Mixamo animations for Negoti8:
//  - 'Idle (standing)' — base loop when listening
//  - 'Talking (gesturing)' — hand gestures while speaking
//  - 'Arms Crossed' — defensive/skeptical stance
//  - 'Lean Forward' — engaged/interested
//  - 'Lean Back' — relaxed/skeptical
//  - 'Nodding' — agreement
//  - 'Head Shake' — disagreement
//  - 'Pointing' — making a point
//  - 'Hand Wave' — dismissive
//  - 'Shrug' — indifference

// Import into Three.js:
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
// Or use pre-converted GLB files with drei's useAnimations

// Mixamo animations are additive — they blend on top of the idle loop
// Use AnimationMixer with crossfade between clips

function blendAnimation(from: string, to: string, duration = 0.3) {
  const fromAction = actions[from];
  const toAction = actions[to];
  if (fromAction && toAction) {
    fromAction.fadeOut(duration);
    toAction.reset().fadeIn(duration).play();
  }
}

// Trigger animations from AI sentiment:
// sentiment: 'skeptical' → blendAnimation('idle', 'armsCrossed', 0.3)
// sentiment: 'interested' → blendAnimation('armsCrossed', 'leanForward', 0.3)
```

#### Step 5: Performance Optimization
```tsx
// Custom rig optimization techniques:

// 1. Level-of-Detail (LOD): swap to lower-poly mesh when distant
// Three.js LOD class — 3 levels: high (15K tris) / mid (8K) / low (3K)

// 2. Texture atlas: single 2K texture instead of multiple materials
const atlas = new THREE.CanvasTexture(generateAtlas());

// 3. Skeletal instancing for multiple characters (multiplayer)
// Three.js InstancedMesh with SkinnedMesh extension

// 4. WASM physics for hair/cloth if needed
// three-mesh-bvh for collision detection

// 5. GPU morph target evaluation
// Use ShaderMaterial instead of updating CPU morph targets
// ~10x faster for complex expressions
```

#### Comparison: RPM (Option 1) vs Custom Rig (Option 2)

| Aspect | Ready Player Me | Custom Rig |
|--------|----------------|------------|
| **Time to MVP** | Hours | Days-weeks |
| **Morph Targets** | ARKit only (52) | Unlimited |
| **Custom Expressions** | Limited to ARKit set | Any micro-expression |
| **Animation Blending** | Limited | Full control |
| **Performance** | ~8K-15K tris, 2-5MB GLB | Optimized mesh, ~5-10K tris |
| **Unique Brand** | Looks like everyone else | Proprietary look |
| **Multiplayer Ready** | Same mesh, different skins | Single optimized mesh |
| **Maintenance** | RPM handles updates | You own everything |

**Recommendation:** MVP = **Option 1 (RPM)** to ship fast. Post-MVP = **Option 2 (Custom Rig)** for brand identity and performance. The EmotionController and lip-sync code is the same either way — just swap the mesh.

---

#### Option 3: Sketchfab / Poly Pizza Pre-made
- Fastest to prototype (drag and drop a model)
- Limited expression control — most pre-made models don't have morph targets
- Best for very early prototyping only

## 📊 Success Metrics

### Engagement Metrics

| Metric | Target (MVP) | Why |
|--------|-------------|-----|
| **Sessions per user / week** | ≥3 | Core habit — practice must be weekly, not once |
| **Session completion rate** | ≥80% | Users should finish what they start |
| **Retry rate** | ≥40% of sessions | Muscle memory requires repetition — retry = learning |
| **Session length** | 5-10 min | Average negotiation duration. Long enough for meaningful practice, short enough to fit before a real meeting |
| **Scenarios completed per user** | ≥5 (first 30 days) | Users should practice across categories, not just one. 5+ = broad skill building |
| **Voice input rate** | ≥90% of sessions | If they're typing instead of speaking, we failed the UX |
| **Coaching report read rate** | ≥85% | If they skip the coaching, we're just a chatbot |
| **PDF export rate** | ≥15% of sessions | Leading indicator of professional use case |

### Retention Metrics

| Metric | Target (30-day) | Why |
|--------|----------------|-----|
| **D1 retention** | ≥50% | Next-day return = initial hook worked |
| **D7 retention** | ≥40% | Weekly practice habit forming — users return to practice before real negotiations |
| **D30 retention** | ≥15% | Users with real negotiations coming up stay longer |
| **Streak rate (7+ days)** | ≥10% of active users | Streak = sticky product |

### Business Metrics

| Metric | Target | Why |
|--------|--------|-----|
| **Free → Paid conversion** | ≥5% | Standard SaaS benchmark |
| **Monthly churn (paid)** | <8% | Healthy SaaS retention |
| **ARPU (monthly)** | $15-25 | Blend of free + paid tiers |
| **LTV:CAC ratio** | ≥3:1 | Standard healthy SaaS metric |
| **Referral rate** | ≥0.5 per user | Word of mouth = trust in a coaching product |

#### Pricing Tiers

| Tier | Price | What You Get | Target User |
|------|-------|-------------|-------------|
| **Free** | $0 | 5 sessions/mo, 5 scenarios, basic coaching | Try-before-buy, students |
| **Pro** | $19/mo ($190/yr) | Unlimited sessions, all 50+ scenarios, detailed coaching, PDF export, custom scenarios | Individual practitioners, job seekers |
| **Enterprise** | Custom | Team dashboards, custom scenarios for your company, multiplayer, API access | Companies training sales/negotiation teams |

#### Unit Economics (Per Session)

| Cost Item | Cost |
|-----------|------|
| Groq Whisper STT (1-3 min audio) | ~$0.00-0.01 |
| Groq LPU (Llama 3.3 70B, ~3-5k tokens) | ~$0.00-0.01 |
| ElevenLabs TTS (~200 chars per response) | ~$0.002-0.005 |
| **Total per session** | **~$0.005-0.025** |
| **Pro tier: 50 sessions/user/mo** | **~$0.25-1.25 cost** |
| **Gross margin (at $19/mo)** | **93-98%** |

Unit economics are exceptional — Groq LPU + Whisper are nearly free at scale.

#### Growth Channels

| Channel | Strategy | Timeline |
|---------|----------|----------|
| **LinkedIn** | Share coaching insights, tactic breakdowns, user success stories | Always-on |
| **Product Hunt** | Launch MVP for initial traction | Launch week |
| **Substack / Newsletters** | Partnership with career/founder newsletters | Launch month |
| **University career centers** | B2B pilot for business schools | Month 2-3 |
| **Referral program** | Free sessions for inviting a friend | Month 2 |
| **SEO** | "How to negotiate salary" — evergreen content | Month 3+

### Learning Metrics

| Metric | Target | Why |
|--------|--------|-----|
| **Score improvement** | +2 pts avg over 5 sessions | Are users actually getting better? First session baseline → 5th session should show clear growth |
| **Advanced tactic adoption** | ≥40% of users use anchoring/BATNA by session 3 | Users should move beyond basic tactics quickly. If they're not anchoring by session 3, coaching isn't sticking |
| **Filler word reduction** | -30% after 10 sessions | Concrete vocal improvement |
| **Difficulty progression** | ≥40% of users move from Easy → Medium → Hard | Users feel confident enough to level up |
| **Weak scenario retry rate** | ≥50% of low-scoring scenarios get retried within 7 days | Users actively work on weaknesses |
| **Tactic recall rate** | User names 3+ tactics learned after 1 week | Knowledge is sticking |
| **Self-reported confidence gain** | +2 pts on 1-5 scale after 5 sessions | Users feel more ready for real negotiations |

### Quality Metrics

| Metric | Target | Why |
|--------|--------|-----|
| **NPS (Net Promoter Score)** | ≥50 | "Would you recommend Negoti8 to a friend?" — strong NPS = product-market fit for a coaching tool |
| **Score accuracy** (user rating 1-5) | ≥4.0 | Coaching feedback must feel accurate, not generic |
| **Avatar realism** (user rating 1-5) | ≥3.5 | Good enough for MVP, improve post-launch |
| **STT accuracy** (WER) | <8% | Groq Whisper should deliver this |
| **End-to-end latency** | <2s per turn | Voice conversation must feel natural |
| **Uptime** | 99.5% | Serverless on Vercel handles this |

---

**Performance Targets:**
- Initial avatar load: <3s (GLB cached after first load)
- Expression transition: <200ms (smooth blend, not instant snap)
- Lip-sync latency: <50ms behind audio (imperceptible)
- Memory: <50MB for avatar model + textures

**Character Variants (per scenario category):**
- 💼 **Corporate** — suit, tie, neutral expression baseline (salary, contracts)
- 🦄 **VC** — hoodie, startup casual, intense eye contact (fundraising)
- 👷 **Trades** — flannel, relaxed posture (contractor, car dealer)
- 🏠 **Property** — blazer, warm smile (landlord, real estate)

Each variant uses the same base mesh with different texture/skin/material swaps. No reloading — just hot-swap materials.

### 5.4 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER (React)                          │
│  ┌─────────┐  ┌──────────────┐  ┌────────────────────┐  ┌───────────────────────┐ │
│  │ Voice UI │  │   3D Avatar   │  │ Scenario           │  │ Coaching Report       │ │
│  │ (record) │  │ (Three.js)    │  │ Player             │  │ (score + feedback)    │ │
│  └────┬─────┘  └──────┬────────┘  └──────┬─────────────┘  └───────────────────────┘ │
│       │               │                   │                                         │
│  ┌────▼───────────────▼───────────────────▼──────────────────────────────────────┐  │
│  │                     Audio Stream (WebRTC / Blob)                               │  │
│  └────────────────────────────────────┬──────────────────────────────────────────┘  │
└───────────────────────┼─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                  NEXT.JS API LAYER                           │
│                                                              │
│  ┌──────────────┐  ┌────────────┐  ┌─────────────────────┐ │
│  │ /api/stt     │  │ /api/ai    │  │ /api/tts            │ │
│  │ Groq Whisper │  │ Groq LPU   │  │ ElevenLabs/Cartesia │ │
│  │ transcribe   │  │ negotiate  │  │ TTS + viseme data   │ │
│  └──────────────┘  └─────┬──────┘  └─────────────────────┘ │
│                          │                                    │
│  ┌───────────────────────▼────────────────────────────────┐  │
│  │              Coaching Engine (same API call)            │  │
│  │  Groq LPU analyzes transcript → score + tactics +      │  │
│  │  sentiment → drives avatar expression                  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │           Supabase (PostgreSQL + Auth + Storage)       │   │
│  │  users │ sessions │ scenarios │ recordings │ feedback │   │
│  └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 6. DATA MODEL

```
User
  id, email, name, avatar_url, created_at

Scenario
  id, title, category, difficulty (easy/med/hard),
  user_role, ai_role, context_blurb, stakes,
  ai_personality_prompt, tactics_to_practice (jsonb)

Session
  id, user_id, scenario_id, started_at, ended_at,
  status (in_progress | completed | interrupted)

Message (one per exchange)
  id, session_id, role (user | ai), transcript,
  audio_url, created_at, turn_number

CoachingReport
  id, session_id, scenario_id, user_id,
  overall_score, tactics_used (jsonb), missed_opportunities (jsonb),
  filler_words (jsonb), better_phrasing (jsonb),
  strengths (text), weaknesses (text),
  created_at
```

## 7. DIRECTORY STRUCTURE

```
negoti8/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Landing
│   │   ├── auth/               # Auth pages
│   │   ├── dashboard/          # User dashboard
│   │   ├── scenario/           # Scenario library
│   │   ├── practice/           # Voice practice session
│   │   └── results/            # Coaching report
│   ├── components/
│   │   ├── voice/
│   │   │   ├── RecordButton.tsx   # Push-to-talk
│   │   │   ├── AudioPlayer.tsx    # Play AI voice
│   │   │   └── AudioVisualizer.tsx
│   │   ├── coaching/
│   │   │   ├── ScoreCard.tsx
│   │   │   ├── TacticBadge.tsx
│   │   │   └── MissedOpportunities.tsx
│   │   ├── scenario/
│   │   │   ├── ScenarioCard.tsx
│   │   │   └── ScenarioList.tsx
│   │   └── ui/                 # shadcn/ui components
│   ├── lib/
│   │   ├── deepgram.ts         # STT client
│   │   ├── claude.ts           # AI negotiation + coaching
│   │   ├── elevenlabs.ts       # TTS client
│   │   ├── supabase.ts         # DB + Auth client
│   │   └── prompts/
│   │       ├── roleplay.ts     # Scenario-specific AI prompts
│   │       └── coaching.ts     # Post-session analysis prompts
│   ├── types/
│   │   └── index.ts
│   └── middleware.ts           # Auth middleware
├── scenarios/                  # Scenario definitions (JSON)
│   ├── salary.json
│   ├── fundraising.json
│   ├── sales.json
│   ├── freelance.json
│   └── car-buying.json
├── prisma/                     # DB schema (if using Prisma)
├── .env.example
├── .gitignore
├── CLAUDE.md
└── README.md
```

## 8. BUILD ORDER (3-Hour Sprint)

## 10. DEVELOPMENT TIMELINE

### Week 1: Scenarios + Core Pipeline

| Day | Focus | Deliverables |
|-----|-------|-------------|
| **Day 1-3** | 10 Scenarios + System Prompts | Write all 10 MVP scenarios with detailed system prompts: role context, AI personality archetype, stakes/anchors, BATNA list, tactics the AI will use. Cover all difficulty tiers (Easy/Medium/Hard). |
| **Day 4-5** | Coaching + Voice Pipeline | **Implement post-negotiation coaching feedback** — after user clicks "End Negotiation", Groq Llama 3.3 generates score (0-10), tactics breakdown, missed opportunities, specific phrases. Results page UI. Build voice pipeline (STT + AI + TTS). |
| **Day 6-7** | UI Polish + Error Handling | Scenario selector page. Context screen. Transcript display. Google OAuth. **Edge cases**: mic permission denied, API errors, network offline, empty states, long audio handling. Loading skeletons. Error toasts. Graceful degradation. |

**Week 1 Goal:** User picks a scenario, speaks into mic, hears AI respond, sees transcript. No 3D avatar yet — pure voice + text. 🎙️

### Week 2: 3D Avatar + Coaching

| Day | Focus | Deliverables |
|-----|-------|-------------|
| **Day 8-9** | Avatar Integration | Load Ready Player Me GLB into React Three Fiber. Idle animation (breathing, blinking). Character variant system (outfit swaps per scenario). |
| **Day 10-11** | Lip-Sync + Expressions | OVR Lip Sync WASM integration. Map audio waveform → mouth shapes. Emotion Controller: 7 expressions driven by AI sentiment tags. |
| **Day 12-13** | Mixamo Animations | Import body animations (cross arms, lean, nod). Blend between idle → talking → gesturing based on AI state. Animation state machine. |
| **Day 14** | Coaching Engine | Post-session coaching prompt piped through Groq Llama 3.3. Score (0-10), tactics breakdown, missed opportunities, specific phrases. Results page UI. |

**Week 2 Goal:** Full 3D avatar negotiates with user. Coaching report after each session. 🎭

### Week 3: Polish + Scenarios

| Day | Focus | Deliverables |
|-----|-------|-------------|
| **Day 15-16** | All 10 MVP Scenarios | Write detailed prompts for each scenario. Tune AI personality per character. Test difficulty curves (Easy → Medium → Hard). |
| **Day 17-18** | Transcript + Export | Full transcript with highlighted key moments (anchors, concessions, silences). PDF export with coaching report. |
| **Day 19-20** | UX Polish | Loading states, error states (mic permission, API failures), empty states (no history). Mobile responsive. Performance optimization. |
| **Day 21** | Beta Launch | Deploy to Vercel + Railway. Invite 50 beta testers. Monitor Sentry + Axiom. Collect NPS + feedback. |

**Week 3 Goal:** Shippable MVP with 10 scenarios, full avatar, coaching, PDF export. 🚀

### Week 4: Deploy & Launch

| Day | Focus | Deliverables |
|-----|-------|-------------|
| **Day 1-2** | Deploy to Vercel + Railway | Configure Vercel for frontend + serverless API routes. Deploy Railway service for WebSocket/Express backend. Set up Cloudflare R2 for file storage. Environment variables. Custom domain (negoti8.app). SSL. |
| **Day 3-4** | Demo Video + README | **Record demo video** — 2-min walkthrough: pick scenario → negotiate with avatar → coaching report. Screen + face cam optional. **Write README** — project overview, tech stack, how to run locally, architecture, API docs. Polish landing page copy. |
| **Day 5-7** | Launch | **Product Hunt** — launch listing with demo video, screenshots, first comment engaging. **Twitter/X** — thread: "I built an AI that negotiates against you so you don't freeze in real life." **LinkedIn** — post targeting founders, job seekers, sales pros. Monitor signups, engagement, NPS. Fix critical bugs within hours. |

**Week 4 Goal:** Public launch + first iteration cycle. 📈

---

## 11. MVP SCOPE — Build These 5 Things for Launch

### 1. 🎙️ Voice Loop (STT → AI → TTS)
The core technical foundation. User speaks, Groq transcribes, Llama responds, ElevenLabs speaks back.
- MediaRecorder API → Whisper large-v3 → Llama 3.3 70B → PlayHT/ElevenLabs → Web Audio
- Push-to-talk hold + release
- <2s round-trip latency

### 2. 👤 3D Avatar (Ready Player Me + 3 Emotions)
The face of Negoti8. Makes it feel like a real person, not a chatbot.
- RPM avatar loaded in React Three Fiber
- **3 emotional expressions** driven by AI sentiment tags:
  - 😏 **Skeptical** — raised eyebrow, half-smirk (user makes weak argument)
  - 😤 **Frustrated** — frown, crossed arms (user lowballs)
  - 😊 **Happy** — warm smile, nods (deal closing, user makes good point)
- OVR Lip Sync for mouth movement
- Mixamo idle animations (breathing, blinking)

### 3. 📚 3 Scenarios (Salary + Startup Valuation + Car Buying)
Focused depth over breadth. Ship 3 excellent scenarios instead of 10 mediocre ones.
- **Salary negotiation** (medium) — job seeker vs friendly recruiter, $75K base
- **Startup valuation** (hard) — founder vs VC, $5M Series A term sheet
- **Car buying** (easy) — consumer vs car dealer, $48K EV, MSRP vs invoice
- Full system prompts per scenario: role context, AI personality, stakes, tactics, BATNA
- Context screen before each session

### 4. 📊 Coaching Report (Post-Session)
The learning loop. Without this, it's just a chatbot.
- Overall score (0-10) with breakdown (Outcome, Tactics, Delivery, Adaptability)
- What you did well + missed opportunities
- Specific phrases you could have said
- Filler word analysis

### 5. 🚀 Launch Readiness (Deploy + Auth + Polish)
Ship quality. Beta users need a polished experience.
- Google OAuth (Supabase)
- Scenario selector + transcript display
- Error handling (mic denied, API failure, network offline)
- Mobile responsive
- Deployed to Vercel + Railway

### 🗓️ Deferred to Phase 2

| Feature | Why Deferred |
|---------|-------------|
| ❌ Remaining 7+ scenarios (add after launch based on usage data) | Need data on which scenarios users actually practice |
| ❌ Progress tracking / dashboard | No time to build charts — launch first, measure later |
| ❌ Badge system | Gamification is polish, not core |
| ❌ Custom scenarios (paste job offer) | Complex document parsing — Phase 2 |
| ❌ Multiplayer mode | Real-time networking is heavy — validate single-player first |
| ❌ Mobile app (React Native) | Web MVP validates the concept — native app later |
| ❌ Voice analytics (tone, pace) | Cool but not essential for coaching value |
| ❌ More avatar expressions (7→3 for MVP) | 3 emotions enough for launch — add nuance later |
| ❌ Custom avatar creation | Default RPM avatar works — user customization later |
| ❌ PDF export | Transcript on screen is enough for MVP |
| ❌ Enterprise pricing / team accounts | B2B features after product-market fit |

---

## 🚀 How to Start Building TODAY

### Step 1: Set Up the Project (30 min)

```bash
# 1. Create Next.js project with TypeScript + Tailwind + shadcn/ui
npx create-next-app@latest negoti8 --typescript --tailwind --eslint
cd negoti8

# 2. Initialize shadcn/ui
npx shadcn@latest init

# 3. Install core dependencies
npm install @react-three/fiber @react-three/drei three
npm install groq-sdk
npm install @supabase/supabase-js @supabase/ssr
npm install zustand
npm install howler

# 4. Install dev dependencies
npm install -D @types/three

# 5. Set up environment variables
touch .env.local
# Add:
# GROQ_API_KEY=your_groq_key
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# ELEVENLABS_API_KEY=your_elevenlabs_key

# 6. Create directory structure
mkdir -p src/components/avatar src/lib/prompts src/types src/app/api/stt src/app/api/ai src/app/api/tts
```

### Step 2: Build the Voice Loop (2 hours)

```bash
# 1. Create Groq client
touch src/lib/groq.ts
```

```typescript
// src/lib/groq.ts
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function transcribe(audioBlob: Blob): Promise<string> {
  const file = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
  const transcription = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3',
  });
  return transcription.text;
}

export async function generateResponse(
  transcript: string,
  scenarioContext: string,
  history: { role: string; content: string }[]
) {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: scenarioContext },
      ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: transcript },
    ],
  });
  return {
    text: completion.choices[0]?.message?.content || '',
    sentiment: extractSentiment(completion),
  };
}
```

```bash
# 2. Create API routes
touch src/app/api/stt/route.ts
```

```typescript
// src/app/api/stt/route.ts
import { transcribe } from '@/lib/groq';

export async function POST(req: Request) {
  const blob = await req.blob();
  const transcript = await transcribe(blob);
  return Response.json({ transcript });
}
```

```bash
# 3. Create push-to-talk RecordButton
touch src/components/RecordButton.tsx
```

```typescript
// src/components/RecordButton.tsx
'use client';
import { useRef, useState } from 'react';

export function RecordButton({ onTranscript }: { onTranscript: (text: string) => void }) {
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mediaRecorder.current = recorder;
    chunks.current = [];
    recorder.ondataavailable = (e) => chunks.current.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunks.current, { type: 'audio/webm' });
      const res = await fetch('/api/stt', { method: 'POST', body: blob });
      const { transcript } = await res.json();
      onTranscript(transcript);
      stream.getTracks().forEach(t => t.stop());
    };
    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setRecording(false);
  };

  return (
    <button
      onMouseDown={startRecording}
      onMouseUp={stopRecording}
      onTouchStart={startRecording}
      onTouchEnd={stopRecording}
      className={`w-20 h-20 rounded-full ${recording ? 'bg-red-500' : 'bg-cyan-500'} transition-all`}
    >
      {recording ? '🔴' : '🎙️'}
    </button>
  );
}
```

### Step 3: Add 3D Avatar (3 hours)

```bash
# 1. Download a base RPM avatar GLB
# Go to https://readyplayer.me → create avatar → export as GLB
# Save to public/avatars/default.glb

# 2. Create AvatarCanvas component
touch src/components/avatar/AvatarCanvas.tsx
```

```typescript
// src/components/avatar/AvatarCanvas.tsx
'use client';
import { Canvas } from '@react-three/fiber';
import { AvatarModel } from './AvatarModel';

export function AvatarCanvas({ expression }: { expression: string }) {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 1.5, 3], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 3, 4]} />
        <AvatarModel url="/avatars/default.glb" expression={expression} />
      </Canvas>
    </div>
  );
}
```

```bash
# 3. Create AvatarModel with emotion blendshapes
touch src/components/avatar/AvatarModel.tsx
# (use the EmotionController code from Section 5.3)

# 4. Set up OVR Lip Sync
touch src/components/avatar/LipSyncDriver.ts
# (use the viseme mapping code from Section 5.3)
```

### Step 4: Write 3 Scenario Prompts (1 hour)

```bash
mkdir -p src/lib/prompts/scenarios
touch src/lib/prompts/scenarios/salary.ts
touch src/lib/prompts/scenarios/startup.ts
touch src/lib/prompts/scenarios/car-buying.ts
```

```typescript
// src/lib/prompts/scenarios/salary.ts
// Example structure:
export const salaryScenario = {
  systemPrompt: `You are a friendly but budget-conscious recruiter at a mid-size tech company.
You're hiring for a senior frontend engineer role with a budget of $75K-85K.
Your strategy:
- Start at $75K
- If they counter, ask about their current compensation
- You have flexibility up to $82K + 1 week extra vacation
- If they push beyond $85K, you need "manager approval" (limited authority tactic)
- Use silence after they name their number
- Be warm but firm on budget constraints`,
  userRole: 'Senior frontend engineer with 4 years experience',
  aiRole: 'Friendly recruiter',
  stakes: 'First job offer, $75K base, want to land at $82K+',
  difficulty: 'medium',
};
```

### Step 5: Stitch It Together (1.5 hours)

```bash
# 1. Create the main NegotiationPlayer that orchestrates the full loop
touch src/components/NegotiationPlayer.tsx
# Integrates: RecordButton → STT → AI → TTS → Avatar

# 2. Create CoachingReport component
touch src/components/CoachingReport.tsx

# 3. Create main page that ties everything together
touch src/app/page.tsx
```

### Step 6: Deploy (30 min)

```bash
# 1. Push to GitHub
git init && git add . && git commit -m "init: negoti8 mvp"
git remote add origin https://github.com/YOUR_USER/negoti8.git
git push -u origin main

# 2. Deploy to Vercel
npx vercel --prod
# Connect GitHub repo, add env vars in Vercel dashboard

# 3. Set up Railway for backend
# Go to railway.app → New Project → Deploy from GitHub
# Add same env vars

# 4. Set up Supabase
# Go to supabase.com → New Project → Copy URL + anon key → Add to .env.local
```

---

## 13. BUILD ORDER (3-Hour Sprint)

### PHASE 1: Foundation (30 min)
- [ ] Scaffold Next.js + shadcn/ui
- [ ] Install deps (R3F, Groq, Supabase, Zustand)
- [ ] Set up .env.local
- [ ] Create directory structure

### PHASE 2: Core Build (60 min)
- [ ] RecordButton (push-to-talk)
- [ ] `/api/stt` (Groq Whisper)
- [ ] `/api/ai` (Groq Llama roleplay)
- [ ] `/api/tts` (ElevenLabs)
- [ ] Multi-turn voice loop working

### PHASE 3: Avatar + Coaching (60 min)
- [ ] RPM avatar in R3F
- [ ] OVR Lip Sync
- [ ] 3 emotional expressions
- [ ] Coaching report (Groq analysis)
- [ ] Results page

### PHASE 4: Ship (30 min)
- [ ] Deploy to Vercel
- [ ] Test full loop end-to-end
- [ ] Push to GitHub

## 9. SKILLS MAP FOR BUILD

| Phase | Skills |
|-------|--------|
| Foundation | `senior-engineer` |
| Core Build | `senior-engineer` → `ui-ux-fixer` |
| Quality | `security_scan`, `eslint` |
| Ship | `fast-deploy` |

## 10. VOICE UX DESIGN PRINCIPLES

1. **Push-to-talk** — Press spacebar/hold mic button, speak, release. Natural.
2. **Visual feedback** — Audio waveform + recording indicator. No doubt you're being recorded.
3. **AI thinks indicator** — Brief "thinking" animation while Claude processes + TTS generates.
4. **Interruptible** — User can cut in while AI is speaking (like real conversation).
5. **Natural pauses** — AI doesn't rush. Breathes. Lets user respond.
6. **Filler word detection** — Counted and shown in coaching report. User sees their crutch words.
7. **Playback** — User can replay their own responses to hear how they sounded.

## 11. COST ESTIMATES (Per Session)

| Service | Cost |
|---------|------|
| Groq Whisper (1-3 min audio) | ~$0.00 (generous free tier) → ~$0.01-0.02 paid |
| Claude API (~3-5k tokens) | ~$0.02-0.04 |
| ElevenLabs TTS (~200 chars) | ~$0.002-0.005 |
| **Total per session** | **~$0.03-0.08** |
| **50 sessions / user / month** | **~$1.50-4.00** |

Completely viable at scale.

---

## 12. QUESTIONS OPEN FOR DECISION

- [x] Groq Whisper for STT (fastest + cheapest)
- [ ] ElevenLabs vs Cartesia for TTS?
- [ ] Prisma vs raw SQL for DB queries?
- [ ] Free tier model? (X free sessions/month then paid?)
- [ ] Scenario priority — which 5-10 ship first?
