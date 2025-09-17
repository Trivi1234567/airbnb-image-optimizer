/**
 * Design tokens for consistent styling across the application
 * These tokens define colors, spacing, typography, and other design elements
 */

export const designTokens = {
  colors: {
    // Primary brand colors
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    
    // Success colors
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
    
    // Error colors
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
    
    // Warning colors
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },
    
    // Neutral colors
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a',
    },
    
    // Room type specific colors
    roomType: {
      bedroom: {
        bg: '#dbeafe',
        text: '#1e40af',
        border: '#93c5fd',
      },
      kitchen: {
        bg: '#dcfce7',
        text: '#166534',
        border: '#86efac',
      },
      bathroom: {
        bg: '#f3e8ff',
        text: '#7c3aed',
        border: '#c4b5fd',
      },
      livingRoom: {
        bg: '#fed7aa',
        text: '#c2410c',
        border: '#fdba74',
      },
      exterior: {
        bg: '#fef3c7',
        text: '#d97706',
        border: '#fcd34d',
      },
      other: {
        bg: '#f5f5f5',
        text: '#525252',
        border: '#d4d4d4',
      },
    },
  },
  
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '2rem',    // 32px
    '4xl': '2.5rem',  // 40px
    '5xl': '3rem',    // 48px
    '6xl': '4rem',    // 64px
  },
  
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },
  
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'] as string[],
      mono: ['JetBrains Mono', 'monospace'] as string[],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }] as [string, { lineHeight: string }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }] as [string, { lineHeight: string }],
      base: ['1rem', { lineHeight: '1.5rem' }] as [string, { lineHeight: string }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }] as [string, { lineHeight: string }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }] as [string, { lineHeight: string }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }] as [string, { lineHeight: string }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }] as [string, { lineHeight: string }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }] as [string, { lineHeight: string }],
      '5xl': ['3rem', { lineHeight: '1' }] as [string, { lineHeight: string }],
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    },
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  zIndex: {
    hide: '-1',
    auto: 'auto',
    base: '0',
    docked: '10',
    dropdown: '1000',
    sticky: '1100',
    banner: '1200',
    overlay: '1300',
    modal: '1400',
    popover: '1500',
    skipLink: '1600',
    toast: '1700',
    tooltip: '1800',
  },
} as const;

export type DesignTokens = typeof designTokens;
