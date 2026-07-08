export interface Vec2 {
  x: number;
  y: number;
}

export interface Level {
  id: number;
  startPos: Vec2;
  targetPos: Vec2;
  grapplePoint: Vec2;
  canyonWidth: number;
  hint: string;              // "Complement of 60°"
  correctAngle: number;      // degrees from horizontal
  distance: number;          // units from start to target
  extensionRate: number;     // units per second
  correctHoldTime: number;   // seconds to hold for correct length
  difficulty: number;        // 1-6
  distractors: number[];     // wrong angle options shown
}

export interface PlayerState {
  x: number;
  y: number;
  swinging: boolean;
  angle: number;
  tetherLength: number;
  heldTime: number;
  isHolding: boolean;
  attached: boolean;
  velocity: Vec2;
  phase: 'idle' | 'aiming' | 'holding' | 'swinging' | 'landed' | 'crashed';
  grappleX: number;
  grappleY: number;
}

export interface Spark {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  color: string; radius: number;
}

export const NEON = {
  cyan: '#00FFF0',
  pink: '#FF007F',
  purple: '#8A2BE2',
  blue: '#00BFFF',
  yellow: '#FFD700',
  green: '#00FF7F',
  red: '#FF0040',
};

export const COLORS = [
  { main: '#00FFF0', glow: '#00FFFF' },
  { main: '#FF007F', glow: '#FF69B4' },
  { main: '#8A2BE2', glow: '#9400D3' },
  { main: '#00BFFF', glow: '#00AAFF' },
  { main: '#FFD700', glow: '#FFA500' },
  { main: '#00FF7F', glow: '#00CC66' },
];
