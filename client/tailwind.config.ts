import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      /* 浅色商业 SaaS 基色 — 类名保持 void/surface/ink/mist/iron/pulse/ember 不变，只翻值 */
      colors: {
        void:    '#F5F7FA',  /* 页面底色（浅灰） */
        surface: '#FFFFFF',  /* 卡片 / 输入（纯白） */
        ink:     '#1F2937',  /* 主文字（slate-800） */
        mist:    '#64748B',  /* 次文字（slate-500） */
        iron:    '#94A3B8',  /* 辅助 / 占位（slate-400） */
        pulse:   '#2563EB',  /* 主色（专业蓝 blue-600） */
        ember:   '#D97706',  /* 警示 / 强调（amber-600） */
        success: '#16A34A',
        warning: '#D97706',
        error:   '#DC2626',
      },
      fontFamily: {
        ui:   ["-apple-system", "'Segoe UI'", "'Microsoft YaHei'", "'PingFang SC'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Cascadia Code'", "'Fira Code'", "ui-monospace", "monospace"],
      },
      fontSize: {
        'product-xs':  ['11px', { lineHeight: '16px' }],
        'product-sm':  ['13px', { lineHeight: '20px' }],
        'product-base':['15px', { lineHeight: '24px' }],
        'product-lg':  ['18px', { lineHeight: '28px' }],
        'product-xl':  ['22px', { lineHeight: '32px' }],
        'product-2xl': ['28px', { lineHeight: '36px' }],
        'product-3xl': ['36px', { lineHeight: '44px' }],
      },
      spacing: {
        '4px': '4px',  '8px': '8px',  '12px': '12px',
        '16px':'16px', '20px':'20px', '24px':'24px',
        '32px':'32px', '40px':'40px', '48px':'48px',
      },
      borderRadius: {
        'sm': '6px',  'md': '10px', 'lg': '12px',
        'xl': '16px', 'full': '9999px',
      },
      borderColor: {
        DEFAULT: '#E5E7EB',  /* 卡片描边（slate-200） */
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 4px 12px rgba(15, 23, 42, 0.06)',
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'breath': {
          '0%, 100%': { opacity: '0.5' },
          '50%':      { opacity: '1' },
        },
        'slide-left': {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-up':   'fade-up 0.3s ease-out both',
        'fade-in':   'fade-in 0.2s ease-out both',
        'breath':    'breath 1.5s ease-in-out infinite',
        'slide-left':'slide-left 0.3s ease-out both',
      },
    },
  },
  plugins: [],
} satisfies Config;
