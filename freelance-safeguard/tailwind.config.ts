import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      fontFamily: {
<<<<<<< HEAD
        sans: ['Open Sans', 'sans-serif'],
        heading: ['NT Brick Sans', 'sans-serif'],
        display: ['NT Brick Sans', 'sans-serif'],
        mono: ['NT Brick Sans', 'monospace'],
        numeric: ['NT Brick Sans', 'sans-serif'],
=======
        sans: ['Inter', 'sans-serif'],
        display: ['NTBrickSans', 'Space Grotesk', 'sans-serif'],
        mono: ['Space Grotesk', 'monospace'],
        numeric: ['Space Grotesk', 'sans-serif'],
        brick: ['NTBrickSans', 'sans-serif'],
>>>>>>> 93ae1d7 (Resolved dependency conflicts: updated syn to 2.0.46 and thiserror to 1.0.66, removed problematic patch)
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0',
        wide: '0.01em',
        wider: '0.025em',
        widest: '0.05em',
      },
      lineHeight: {
        relaxed: '1.5',
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // FreelanceShield Brand Colors
        'deep-purple': '#5e35b1',
        'electric-blue': '#2979ff',
        'silver': '#bdbdbd',
        primary: {
<<<<<<< HEAD
          DEFAULT: '#2979ff', // Electric Blue
=======
          DEFAULT: '#5e35b1', // Deep Purple as primary
>>>>>>> 93ae1d7 (Resolved dependency conflicts: updated syn to 2.0.46 and thiserror to 1.0.66, removed problematic patch)
          foreground: '#FFFFFF',
          hover: '#4527a0',
        },
        secondary: {
<<<<<<< HEAD
          DEFAULT: '#5e35b1', // Deep Purple
=======
          DEFAULT: '#2979ff', // Electric Blue as secondary
>>>>>>> 93ae1d7 (Resolved dependency conflicts: updated syn to 2.0.46 and thiserror to 1.0.66, removed problematic patch)
          foreground: '#FFFFFF',
          hover: '#2962ff',
        },
        accent: {
<<<<<<< HEAD
          DEFAULT: '#bdbdbd', // Silver
          foreground: '#000000',
=======
          DEFAULT: '#bdbdbd', // Silver as accent
          foreground: '#000000',
          hover: '#9e9e9e',
>>>>>>> 93ae1d7 (Resolved dependency conflicts: updated syn to 2.0.46 and thiserror to 1.0.66, removed problematic patch)
        },
        destructive: {
          DEFAULT: '#FF4444',
          foreground: '#FFFFFF',
        },
        success: {
          DEFAULT: '#00C851',
          foreground: '#FFFFFF',
        },
        warning: {
          DEFAULT: '#FFBB33',
          foreground: '#1A202C',
        },
        info: {
          DEFAULT: '#33B5E5',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#E2E8F0',
          foreground: '#4A5568',
        },
<<<<<<< HEAD
        // Updated shield colors
        'shield-purple': '#5e35b1',
        'shield-blue': '#2979ff',
        'shield-silver': '#bdbdbd',
=======
        // Legacy colors maintained for compatibility
        'shield-navy': '#0F172A',
        'shield-blue': '#2979ff',
        'shield-blue-light': '#4D94FF',
        'shield-purple': '#5e35b1',
>>>>>>> 93ae1d7 (Resolved dependency conflicts: updated syn to 2.0.46 and thiserror to 1.0.66, removed problematic patch)
      },
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '4px',
      },
      boxShadow: {
        DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
