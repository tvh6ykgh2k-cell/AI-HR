import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      /* 方案 B · Linear/Vercel 暗色极简 — 纯黑灰 monochrome + 单一靛蓝 accent + 零阴影 */
      colors: {
        void:    '#0A0A0A',  /* 页面底（纯黑） */
        surface: '#121214',  /* 卡片 / 面板（近黑灰） */
        ink:     '#EDEDF2',  /* 主文字 */
        mist:    '#9EA0AA',  /* 次文字 */
        iron:    '#6E6E76',  /* 辅助 / 占位 */
        pulse:   '#5E6AD2',  /* 唯一 accent — Linear 靛蓝 */
        ember:   '#FFB224',  /* 警示 / 强调 */
        success: '#4AC26B',
        warning: '#FFB224',
        error:   '#E5484D',
      },
      fontFamily: {
        ui:   ["-apple-system", "'Segoe UI'", "'Microsoft YaHei'", "'PingFang SC'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Cascadia Code'", "'Fira Code'", "ui-monospace", "monospace"],
      },
      fontSize: {
        'product-xs':  ['11px', { lineHeight: '16px' }],
        'product-sm':  ['12px', { lineHeight: '18px' }],
        'product-base':['13px', { lineHeight: '20px' }],
        'product-lg':  ['15px', { lineHeight: '22px' }],
        'product-xl':  ['18px', { lineHeight: '26px' }],
        'product-2xl': ['24px', { lineHeight: '32px' }],
        'product-3xl': ['32px', { lineHeight: '40px' }],
      },
      borderRadius: {
        'sm': '4px',  'md': '6px', 'lg': '8px',
        'xl': '12px', 'full': '9999px',
      },
      borderColor: {
        DEFAULT: '#26262C',  /* hairline 分隔（暗灰） */
      },
      boxShadow: {
        card: 'none',
        'card-hover': 'none',
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'breath': {
          '0%, 100%': { opacity: '0.4' },
          '50%':      { opacity: '1' },
        },
      },
      animation: {
        'fade-up':   'fade-up 0.2s ease-out both',
        'fade-in':   'fade-in 0.15s ease-out both',
        'breath':    'breath 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
