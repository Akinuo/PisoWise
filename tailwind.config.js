/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        pw: {
          // Backgrounds — deeper, richer
          navy:    '#080E1F',
          dark:    '#0D1526',
          mid:     '#121E35',
          surface: '#172240',
          elevated:'#1C2847',

          // Borders
          border:  'rgba(255,255,255,0.07)',
          'border-strong': 'rgba(255,255,255,0.13)',

          // Brand blues
          blue:    '#1D4ED8',
          'blue-light': '#3B82F6',
          'blue-glow':  'rgba(59,130,246,0.25)',
          'blue-dim':   'rgba(29,78,216,0.15)',

          // Gold — Philippine sun, warmer & richer
          gold:       '#F5B731',
          'gold-bright': '#FBBF24',
          'gold-light': '#FDE68A',
          'gold-dim':   'rgba(245,183,49,0.12)',
          'gold-muted': 'rgba(245,183,49,0.35)',

          // Semantic
          crimson:  '#DC2626',
          emerald:  '#10B981',
          'emerald-bright': '#34D399',
          'emerald-dim':    'rgba(16,185,129,0.12)',
          rose:     '#F43F5E',
          'rose-dim':       'rgba(244,63,94,0.12)',
          amber:    '#F59E0B',
          'amber-dim':      'rgba(245,158,11,0.12)',
          purple:   '#8B5CF6',
          'purple-dim':     'rgba(139,92,246,0.12)',

          // Text
          muted:    'rgba(255,255,255,0.42)',
          subtle:   'rgba(255,255,255,0.07)',
          'muted-strong': 'rgba(255,255,255,0.60)',
        },
      },
      fontFamily: {
        display: ['Calistoga', 'Georgia', 'serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', '"Space Mono"', 'monospace'],
      },
      fontSize: {
        'hero': ['3rem', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '400' }],
      },
      backdropBlur: {
        glass: '28px',
      },
      boxShadow: {
        'glass':    '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
        'glass-lg': '0 12px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)',
        'gold':     '0 0 28px rgba(245,183,49,0.30)',
        'gold-lg':  '0 4px 32px rgba(245,183,49,0.40)',
        'blue':     '0 0 24px rgba(59,130,246,0.30)',
        'card':     '0 16px 48px rgba(0,0,0,0.50)',
        'nav':      '0 -1px 0 rgba(255,255,255,0.05), 0 -16px 32px rgba(0,0,0,0.4)',
        'inner-top':'inset 0 1px 0 rgba(255,255,255,0.08)',
        'btn':      '0 4px 16px rgba(0,0,0,0.3)',
      },
      animation: {
        'pulse-gold':  'pulse-gold 5s ease-in-out infinite',
        'float':       'float 7s ease-in-out infinite',
        'shimmer':     'shimmer 2s linear infinite',
        'fade-up':     'fade-up 0.35s ease forwards',
        'slide-left':  'slide-left 0.3s ease forwards',
        'scale-in':    'scale-in 0.2s ease forwards',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%':      { opacity: '0.6', transform: 'scale(1.06)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        'shimmer': {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-left': {
          '0%':   { opacity: '0', transform: 'translateX(18px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gold-gradient':   'linear-gradient(135deg, #F5B731 0%, #F59E0B 100%)',
        'blue-gradient':   'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',
        'dark-gradient':   'linear-gradient(180deg, #080E1F 0%, #0D1526 100%)',
        'card-gradient':   'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        'hero-gradient':   'linear-gradient(160deg, #1D4ED8 0%, #080E1F 55%, #1e3a8a 100%)',
      },
    },
  },
  plugins: [],
};
