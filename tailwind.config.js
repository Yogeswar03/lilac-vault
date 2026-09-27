/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lavender: {
          50: '#FBF9FE',
          100: '#F5F0FD',
          200: '#ECE2FB',
          300: '#DECBF8',
          400: '#C7AAF3',
          500: '#AB7FED',
          600: '#9057E5',
          700: '#7738D4',
          800: '#622EAE',
          900: '#52288E',
          950: '#341561',
        },
        lilac: {
          light: '#F3E8FF',
          DEFAULT: '#D8B4FE',
          dark: '#9333EA',
          deep: '#581C87',
        },
        blush: {
          50: '#FFF5F7',
          100: '#FFE4E9',
          200: '#FECDD8',
          300: '#FDA4BA',
        }
      },
      fontFamily: {
        cute: ['"Quicksand"', '"Nunito"', 'sans-serif'],
      },
      boxShadow: {
        'cute': '0 8px 30px rgba(171, 127, 237, 0.15)',
        'cute-lg': '0 14px 40px rgba(144, 87, 229, 0.22)',
        'glow': '0 0 25px rgba(171, 127, 237, 0.35)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2.5s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
