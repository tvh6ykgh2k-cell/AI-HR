import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void:    '#08090D',
        surface: '#111318',
        ink:     '#ECEEF5',
        mist:    '#84889A',
        iron:    '#3E4050',
        pulse:   '#3DD6C8',
        ember:   '#F0A050',
        success: '#22C55E',
        warning: '#F0A050',
        error:   '#EF4444',
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
        'sm': '6px',  'md': '10px', 'lg': '16px',
        'xl': '24px', 'full': '9999px',
      },
      borderColor: {
        DEFAULT: 'rgba(255,255,255,.08)',
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
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
        'slide-left': {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-up':   'fade-up 0.5s ease-out both',
        'fade-in':   'fade-in 0.3s ease-out both',
        'breath':    'breath 1.5s ease-in-out infinite',
        'slide-left':'slide-left 0.4s cubic-bezier(0.16,1,0.3,1) both',
      },
    },
  },
  plugins: [],
} satisfies Config;
