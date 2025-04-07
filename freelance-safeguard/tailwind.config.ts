/**
 * Tailwind CSS Configuration
 * 
 * This configuration extends the default Tailwind setup with:
 * - FreelanceShield brand colors (shield-purple, shield-blue)
 * - Solana UI integration colors and variants
 * - Dark/light mode support
 * - Custom animations and shadows
 * 
 * Main brand colors are preserved while adding necessary variants
 * for Solana UI component integration.
 */

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
      // Font configuration - preserved from original
      fontFamily: {
        sans: ['Open Sans', 'sans-serif'],
        heading: ['NT Brick Sans', 'sans-serif'],
        display: ['NT Brick Sans', 'sans-serif'],
        mono: ['NT Brick Sans', 'monospace'],
        numeric: ['NT Brick Sans', 'sans-serif'],
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
        // Solana UI colors - adjusted for integration
        solana: {
          // Preserve existing solana color variables
          purple: 'var(--solana-purple)',
          green: 'var(--solana-green)',
          blue: 'var(--solana-blue)',
          dark: 'var(--solana-dark)',
          light: 'var(--solana-light)',
          // Add additional Solana UI colors
          black: '#000000',
          white: '#FFFFFF',
          gray: {
            100: '#F8F9FA',
            200: '#E9ECEF',
            300: '#DEE2E6',
            400: '#CED4DA',
            500: '#ADB5BD',
            600: '#6C757D',
            700: '#495057',
            800: '#343A40',
            900: '#212529',
          },
        },
        
        // PRESERVED: Main brand colors with added variants
        'shield-purple': {
          DEFAULT: '#5e35b1', // PRESERVED
          light: 'rgba(94, 53, 177, 0.1)', // PRESERVED
          // Added variants for Solana UI integration
          50: 'rgba(94, 53, 177, 0.05)',
          100: 'rgba(94, 53, 177, 0.1)',
          200: 'rgba(94, 53, 177, 0.2)',
          300: 'rgba(94, 53, 177, 0.3)',
          400: 'rgba(94, 53, 177, 0.4)',
          500: '#5e35b1', // Same as DEFAULT
          600: '#532fa0',
          700: '#48298f',
          800: '#3d237e',
          900: '#321d6d',
        },
        'shield-blue': {
          DEFAULT: '#2979ff', // PRESERVED
          light: 'rgba(41, 121, 255, 0.1)', // PRESERVED
          // Added variants for Solana UI integration
          50: 'rgba(41, 121, 255, 0.05)',
          100: 'rgba(41, 121, 255, 0.1)',
          200: 'rgba(41, 121, 255, 0.2)',
          300: 'rgba(41, 121, 255, 0.3)',
          400: 'rgba(41, 121, 255, 0.4)',
          500: '#2979ff', // Same as DEFAULT
          600: '#256de6',
          700: '#2161cc',
          800: '#1c55b3',
          900: '#174999',
        },
        'shield-silver': '#bdbdbd', // PRESERVED
        'deep-purple': '#5e35b1', // PRESERVED
        'electric-blue': '#2979ff', // PRESERVED
        'silver': '#bdbdbd', // PRESERVED
        
        // Theme-aware colors for Solana UI components
        border: {
          DEFAULT: 'hsl(var(--border))', // PRESERVED
          light: 'rgba(94, 53, 177, 0.2)', // For light mode
          dark: 'rgba(41, 121, 255, 0.2)', // For dark mode
        },
        input: {
          DEFAULT: 'hsl(var(--input))', // PRESERVED
          light: 'rgba(94, 53, 177, 0.1)', // For light mode
          dark: 'rgba(41, 121, 255, 0.1)', // For dark mode
        },
        ring: {
          DEFAULT: 'hsl(var(--ring))', // PRESERVED
          light: 'rgba(94, 53, 177, 0.3)', // For light mode
          dark: 'rgba(41, 121, 255, 0.3)', // For dark mode
        },
        background: {
          DEFAULT: 'hsl(var(--background))', // PRESERVED
          light: '#FFFFFF', // For light mode
          dark: '#0f172a', // For dark mode
        },
        foreground: {
          DEFAULT: 'hsl(var(--foreground))', // PRESERVED
          light: '#0f172a', // For light mode
          dark: '#f8fafc', // For dark mode
        },
        
        // PRESERVED: Primary and secondary colors with added variants
        primary: {
          DEFAULT: 'var(--color-primary)', // PRESERVED
          foreground: '#FFFFFF', // PRESERVED
          hover: '#2962ff', // PRESERVED
          // Added variants for Solana UI integration
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary)', // Same as DEFAULT
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)', // PRESERVED
          foreground: '#FFFFFF', // PRESERVED
          hover: '#4527a0', // PRESERVED
          // Added variants for Solana UI integration
          50: 'var(--color-secondary-50)',
          100: 'var(--color-secondary-100)',
          200: 'var(--color-secondary-200)',
          300: 'var(--color-secondary-300)',
          400: 'var(--color-secondary-400)',
          500: 'var(--color-secondary)', // Same as DEFAULT
          600: 'var(--color-secondary-600)',
          700: 'var(--color-secondary-700)',
          800: 'var(--color-secondary-800)',
          900: 'var(--color-secondary-900)',
        },
        
        // Updated status colors with variants for Solana UI integration
        accent: {
          DEFAULT: '#bdbdbd', // PRESERVED
          foreground: '#000000', // PRESERVED
          hover: '#9e9e9e', // PRESERVED
          // Added variants
          50: '#f5f5f5',
          100: '#eeeeee',
          200: '#e0e0e0',
          300: '#bdbdbd',
          400: '#9e9e9e',
          500: '#9e9e9e',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
        destructive: {
          DEFAULT: '#FF4444', // PRESERVED
          foreground: '#FFFFFF', // PRESERVED
          // Added variants
          50: '#ffebee',
          100: '#ffcdd2',
          200: '#ef9a9a',
          300: '#e57373',
          400: '#ef5350',
          500: '#FF4444', // Same as DEFAULT
          600: '#e53935',
          700: '#d32f2f',
          800: '#c62828',
          900: '#b71c1c',
        },
        success: {
          DEFAULT: '#00C851', // PRESERVED
          foreground: '#FFFFFF', // PRESERVED
          // Added variants
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#66bb6a',
          500: '#00C851', // Same as DEFAULT
          600: '#43a047',
          700: '#388e3c',
          800: '#2e7d32',
          900: '#1b5e20',
        },
        warning: {
          DEFAULT: '#FFBB33', // PRESERVED
          foreground: '#1A202C', // PRESERVED
          // Added variants
          50: '#fff8e1',
          100: '#ffecb3',
          200: '#ffe082',
          300: '#ffd54f',
          400: '#ffca28',
          500: '#FFBB33', // Same as DEFAULT
          600: '#ffb300',
          700: '#ffa000',
          800: '#ff8f00',
          900: '#ff6f00',
        },
        info: {
          DEFAULT: '#33B5E5', // PRESERVED
          foreground: '#FFFFFF', // PRESERVED
          // Added variants
          50: '#e1f5fe',
          100: '#b3e5fc',
          200: '#81d4fa',
          300: '#4fc3f7',
          400: '#29b6f6',
          500: '#33B5E5', // Same as DEFAULT
          600: '#039be5',
          700: '#0288d1',
          800: '#0277bd',
          900: '#01579b',
        },
        muted: {
          DEFAULT: '#E2E8F0', // PRESERVED
          foreground: '#4A5568', // PRESERVED
          // Added variants
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        dark: {
          DEFAULT: '#0f172a', // PRESERVED
          foreground: '#f8fafc', // PRESERVED
          // Added variants
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      // PRESERVED: Border radius configuration
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '4px',
      },
      // Extended box shadows for Solana UI components
      boxShadow: {
        DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // PRESERVED
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', // PRESERVED
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', // PRESERVED
        // Added Solana UI specific shadows
        'solana-sm': '0 2px 4px rgba(0, 0, 0, 0.05)',
        'solana-md': '0 4px 8px rgba(0, 0, 0, 0.1)',
        'solana-lg': '0 8px 16px rgba(0, 0, 0, 0.1)',
        'solana-xl': '0 12px 24px rgba(0, 0, 0, 0.15)',
      },
      // Extended animations for Solana UI components
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        // Added Solana UI specific animations
        'pulse-opacity': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out', // PRESERVED
        'slide-up': 'slide-up 0.4s ease-out', // PRESERVED
        // Added Solana UI specific animations
        'pulse-opacity': 'pulse-opacity 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
