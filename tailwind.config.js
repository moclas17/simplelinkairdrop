/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#7dd3fc',
          foreground: '#0b1220',
        },
        secondary: {
          DEFAULT: '#121a2a',
          foreground: '#e6eefc',
        },
        muted: {
          DEFAULT: '#7e8aa0',
          foreground: '#e6eefc',
        },
        accent: {
          DEFAULT: '#7dd3fc',
          foreground: '#0b1220',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        success: {
          DEFAULT: '#22c55e',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: '#f59e0b',
          foreground: '#ffffff',
        },
        border: 'rgba(255, 255, 255, 0.08)',
        card: {
          DEFAULT: '#121a2a',
          foreground: '#e6eefc',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(1000px 600px at 10% -10%, #1a2440, transparent)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};