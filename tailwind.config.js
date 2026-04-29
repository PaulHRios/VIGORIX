/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#050707',
          900: '#0a0d0c',
          800: '#10130f',
          700: '#171a16',
          600: '#22251f',
        },
        neon: {
          50: '#eafff3',
          100: '#c5ffdf',
          200: '#8bffbf',
          300: '#4cf99a',
          400: '#1fe87a',
          500: '#00d066',
          600: '#00a352',
          700: '#017a40',
          800: '#015d33',
          900: '#024a2a',
        },
        warn: {
          amber: '#f5a524',
          red: '#ff5c5c',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(31, 232, 122, 0.25)',
        'glow-lg': '0 0 48px rgba(31, 232, 122, 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(31, 232, 122, 0.3)' },
          '50%': { boxShadow: '0 0 32px rgba(31, 232, 122, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};
