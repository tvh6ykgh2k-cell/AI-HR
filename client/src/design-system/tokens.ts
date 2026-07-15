/**
 * AI 面试官平台 — Design Tokens
 * finesse · product register · SOUL=6 SPECTACLE=3 DENSITY=7
 *
 * Palette: Teal+Amber on deep blue-gray — precision intelligence, human warmth.
 * Anti-default: no AI-purple (#6366f1), no Inter-only, no glassmorphism.
 */

export const tokens = {
  // ── Core palette (OKLCH-aware, emitted as hex) ──
  void:    '#08090D',   // Page bg — near-black with 2° blue-gray tint. Not pure #000.
  surface: '#111318',   // Card / input / elevated surfaces
  ink:     '#ECEEF5',   // Primary text — slightly cool. Not pure #fff. Contrast ≥7:1 vs Void.
  mist:    '#84889A',   // Muted / secondary text. Contrast ≥3.5:1 vs Void.
  iron:    '#3E4050',   // Hairlines / tertiary text / disabled

  pulse:   '#3DD6C8',   // PRIMARY ACCENT — teal. Precision, intelligence, technology.
  ember:   '#F0A050',   // SECONDARY ACCENT — warm amber. STAR scores, CTAs, human warmth.

  // ── Semantic roles ──
  border:      'rgba(255,255,255,.08)',   // Translucent border — never hard #333
  borderHover: 'rgba(255,255,255,.14)',

  // ── State colors (Financial dark heritage) ──
  success: '#22C55E',
  warning: '#F0A050',
  error:   '#EF4444',

  // ── Opacity scale ──
  grainOpacity: 0.028,

  // ── Typography (product register: fixed scale, not clamp) ──
  type: {
    xs:  '11px',
    sm:  '13px',
    base:'15px',
    lg:  '18px',
    xl:  '22px',
    '2xl':'28px',
    '3xl':'36px',
  },

  // ── Spacing (4px grid) ──
  space: {
    0:  '0',
    1:  '4px',
    2:  '8px',
    3:  '12px',
    4:  '16px',
    5:  '20px',
    6:  '24px',
    8:  '32px',
    10: '40px',
    12: '48px',
  },

  // ── Radius ──
  radius: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },

  // ── Motion (Framer Motion) ──
  easing: {
    out: [0.16, 1, 0.3, 1] as [number, number, number, number],   // scale/opacity transitions
    inOut: [0.76, 0, 0.24, 1] as [number, number, number, number], // page transitions
  },
  duration: {
    fast: 0.15,
    normal: 0.25,
    slow: 0.45,
    reveal: 0.6,
  },

  // ── Grain SVG (inline, ~2KB) ──
  grainSvg: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E`,
} as const;

// ── Font stack ──
export const fontStack = {
  ui:   "-apple-system, 'Segoe UI', 'Microsoft YaHei', 'PingFang SC', system-ui, sans-serif",
  mono: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', ui-monospace, monospace",
} as const;

// ── Component token shortcuts (derived from core palette) ──
export const semantic = {
  // Chat bubbles
  bubbleAI:     tokens.surface,
  bubbleUser:   '#1B3D52',  // teal-tinted dark blue for user messages
  bubbleUserHover: '#1F455E',

  // STAR scoring
  starComplete:   tokens.pulse,
  starIncomplete: tokens.ember,

  // Buttons
  btnPrimary:        tokens.pulse,
  btnPrimaryHover:   '#2EC4B7',
  btnPrimaryText:    '#08090D',
  btnSecondary:      'rgba(255,255,255,.08)',
  btnSecondaryHover: 'rgba(255,255,255,.14)',

  // Inputs
  inputBg:      tokens.surface,
  inputBorder:  tokens.border,
  inputFocus:   tokens.pulse,

  // Status
  statusActive:    tokens.pulse,
  statusRecording: '#EF4444',
} as const;
