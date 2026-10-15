/**
 * AI 面试官平台 — Design Tokens（商业化浅色 SaaS）
 * Palette: 专业蓝 + 琥珀 on 浅灰白底 — clean, professional, enterprise SaaS.
 * Anti-default: no neon teal, no grain, no spotlight, no 3D tilt, no letter-by-letter reveal.
 */

export const tokens = {
  // ── Core palette（浅色商业 SaaS）──
  void:    '#F5F7FA',   // 页面底色 — 浅灰
  surface: '#FFFFFF',   // 卡片 / 输入 — 纯白
  ink:     '#1F2937',   // 主文字 — slate-800
  mist:    '#64748B',   // 次文字 — slate-500
  iron:    '#94A3B8',   // 辅助 / 占位 — slate-400

  pulse:   '#2563EB',   // 主色 — 专业蓝（blue-600）
  ember:   '#D97706',   // 次要 / 警示 — 琥珀（amber-600）

  // ── Semantic roles ──
  border:      '#26262C',   // hairline — 暗灰
  borderHover: '#D1D5DB',   // hover — slate-300

  // ── State colors ──
  success: '#16A34A',
  warning: '#D97706',
  error:   '#DC2626',

  // ── Typography（固定 scale）──
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
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  // ── Motion（克制：轻 fade/slide，不做逐字 reveal、无 3D）──
  easing: {
    out: [0.4, 0, 0.2, 1] as [number, number, number, number],
    inOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
  },
  duration: {
    fast: 0.15,
    normal: 0.25,
    slow: 0.35,
    reveal: 0.3,
  },
} as const;

// ── Font stack ──
export const fontStack = {
  ui:   "-apple-system, 'Segoe UI', 'Microsoft YaHei', 'PingFang SC', system-ui, sans-serif",
  mono: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', ui-monospace, monospace",
} as const;

// ── Component token shortcuts（浅色商业 SaaS）──
export const semantic = {
  // Chat bubbles
  bubbleAI:     '#FFFFFF',   // 面试官气泡（白底 + 描边）
  bubbleUser:   '#1B1E3A',   // 用户气泡 — 暗靛 tint

  // STAR scoring
  starComplete:   tokens.pulse,
  starIncomplete: tokens.ember,

  // Buttons
  btnPrimary:        tokens.pulse,
  btnPrimaryHover:   '#1D4ED8',
  btnPrimaryText:    '#FFFFFF',
  btnSecondary:      '#FFFFFF',
  btnSecondaryHover: '#F8FAFC',

  // Inputs
  inputBg:      '#FFFFFF',
  inputBorder:  tokens.border,
  inputFocus:   tokens.pulse,

  // Status
  statusActive:    tokens.pulse,
  statusRecording: '#DC2626',
} as const;
