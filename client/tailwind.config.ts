import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      /* Arco Design（飞书同族）色板 — 类名保持 void/surface/ink/mist/iron/pulse/ember，值翻为 Arco */
      colors: {
        void:    '#F0F1F5',  /* 页面底色（Arco gray-1） */
        surface: '#FFFFFF',  /* 卡片 / 输入（白） */
        ink:     '#1D2129',  /* 主文字（Arco gray-8） */
        mist:    '#4E5969',  /* 次文字（Arco gray-6） */
        iron:    '#86909C',  /* 辅助 / 占位（Arco gray-5） */
        pulse:   '#165DFF',  /* 主色（Arco blue-6） */
        ember:   '#FF7D00',  /* 警示（Arco orange-6） */
        success: '#00B42A',
        warning: '#FF7D00',
        error:   '#F53F3F',
      },
      fontFamily: {
        ui:   ["-apple-system", "'Segoe UI'", "'Microsoft YaHei'", "'PingFang SC'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Cascadia Code'", "'Fira Code'", "ui-monospace", "monospace"],
      },
      fontSize: {
        'product-xs':  ['12px', { lineHeight: '20px' }],
        'product-sm':  ['13px', { lineHeight: '20px' }],
        'product-base':['14px', { lineHeight: '22px' }],
        'product-lg':  ['16px', { lineHeight: '24px' }],
        'product-xl':  ['20px', { lineHeight: '28px' }],
        'product-2xl': ['24px', { lineHeight: '32px' }],
        'product-3xl': ['30px', { lineHeight: '38px' }],
      },
      borderRadius: {
        'sm': '4px',  'md': '6px', 'lg': '8px',
        'xl': '12px', 'full': '9999px',
      },
      borderColor: {
        DEFAULT: '#E5E6EB',  /* Arco gray-3 卡片描边 */
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 10px 0 rgba(0, 0, 0, 0.08)',
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
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
      },
      animation: {
        'fade-up':   'fade-up 0.25s ease-out both',
        'fade-in':   'fade-in 0.2s ease-out both',
        'breath':    'breath 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
