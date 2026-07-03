/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Philippine-inspired palette
        pw: {
          navy:    '#060D1F',
          dark:    '#0C1628',
          mid:     '#111E38',
          surface: '#16284A',
          border:  'rgba(255,255,255,0.08)',
          blue:    '#1B4FD8',
          'blue-light': '#3B82F6',
          'blue-glow':  'rgba(59,130,246,0.3)',
          gold:    '#F7C13A',
          'gold-light': '#FDE68A',
          'gold-dim':   'rgba(247,193,58,0.15)',
          crimson: '#CE1126',
          emerald: '#10B981',
          'emerald-dim': 'rgba(16,185,129,0.15)',
          rose:    '#F43F5E',
          'rose-dim':   'rgba(244,63,94,0.15)',
          amber:   '#F59E0B',
          'amber-dim':  'rgba(245,158,11,0.15)',
          muted:   'rgba(255,255,255,0.45)',
          subtle:  'rgba(255,255,255,0.08)',
        },
      },
      fontFamily: {
        display: ['Syne', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"Space Mono"', 'monospace'],
      },
      fontSize: {
        'hero': ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '800' }],
      },
      backdropBlur: {
        glass: '24px',
      },
      boxShadow: {
        'glass':   '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        'gold':    '0 0 24px rgba(247,193,58,0.35)',
        'blue':    '0 0 24px rgba(59,130,246,0.35)',
        'card':    '0 20px 60px rgba(0,0,0,0.5)',
        'nav':     '0 -1px 0 rgba(255,255,255,0.05), 0 -20px 40px rgba(0,0,0,0.4)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.1)',
      },
      animation: {
        'sun-spin':    'sun-spin 30s linear infinite',
        'pulse-gold':  'pulse-gold 3s ease-in-out infinite',
        'float':       'float 6s ease-in-out infinite',
        'shimmer':     'shimmer 2s linear infinite',
        'fade-up':     'fade-up 0.4s ease forwards',
        'slide-left':  'slide-left 0.3s ease forwards',
      },
      keyframes: {
        'sun-spin': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'pulse-gold': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%':      { opacity: '0.7', transform: 'scale(1.05)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        'shimmer': {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-left': {
          '0%':   { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gold-gradient':   'linear-gradient(135deg, #F7C13A 0%, #F59E0B 100%)',
        'blue-gradient':   'linear-gradient(135deg, #1B4FD8 0%, #3B82F6 100%)',
        'dark-gradient':   'linear-gradient(180deg, #060D1F 0%, #0C1628 100%)',
        'glass-gradient':  'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
      },
    },
  },
  plugins: [],
};
