import type { Config } from 'tailwindcss'
import { designTokens } from './src/styles/design-tokens'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/presentation/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        primary: designTokens.colors.primary,
        success: designTokens.colors.success,
        error: designTokens.colors.error,
        warning: designTokens.colors.warning,
        
        // Neutral colors
        gray: designTokens.colors.neutral,
        
        // Room type colors
        'room-bedroom': designTokens.colors.roomType.bedroom,
        'room-kitchen': designTokens.colors.roomType.kitchen,
        'room-bathroom': designTokens.colors.roomType.bathroom,
        'room-living-room': designTokens.colors.roomType.livingRoom,
        'room-exterior': designTokens.colors.roomType.exterior,
        'room-other': designTokens.colors.roomType.other,
        
        // Legacy support
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      spacing: designTokens.spacing,
      borderRadius: designTokens.borderRadius,
      boxShadow: designTokens.shadows,
      fontFamily: designTokens.typography.fontFamily,
      fontSize: designTokens.typography.fontSize,
      fontWeight: designTokens.typography.fontWeight,
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      transitionDuration: designTokens.animations.duration,
      transitionTimingFunction: designTokens.animations.easing,
      screens: designTokens.breakpoints,
      zIndex: designTokens.zIndex,
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
export default config
