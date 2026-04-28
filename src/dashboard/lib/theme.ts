export const lightTheme = {
  colors: {
    bg: {
      base: '#F5F5F7',
      elevated: '#FFFFFF',
      overlay: 'rgba(0,0,0,0.4)',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#666666',
      tertiary: '#999999',
    },
    accent: {
      primary: '#CDFF00',
      hover: '#B8E600',
      pressed: '#A3CC00',
    },
    status: {
      success: '#34C759',
      warning: '#FFCC00',
      error: '#FF3B30',
      info: '#007AFF',
    },
    border: {
      light: '#E5E5E5',
      medium: '#D1D1D1',
      heavy: '#999999',
    },
  },
  spacing: {
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    6: '1.5rem',
    8: '2rem',
    12: '3rem',
  },
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },
  shadow: {
    sm: '0 1px 3px rgba(0,0,0,0.06)',
    md: '0 2px 8px rgba(0,0,0,0.08)',
    lg: '0 4px 16px rgba(0,0,0,0.12)',
  },
}

export const darkTheme = {
  colors: {
    bg: {
      base: '#040f1b',
      elevated: '#0b1b2a',
      overlay: 'rgba(0,0,0,0.6)',
    },
    text: {
      primary: '#dde9fb',
      secondary: '#a0acbd',
      tertiary: '#6a7686',
    },
    accent: {
      primary: '#ccff00',
      hover: '#b8e600',
      pressed: '#a3cc00',
    },
    status: {
      success: '#34C759',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#007AFF',
    },
    border: {
      light: 'rgba(255,255,255,0.05)',
      medium: 'rgba(255,255,255,0.08)',
      heavy: 'rgba(255,255,255,0.12)',
    },
  },
  spacing: lightTheme.spacing,
  radius: lightTheme.radius,
  shadow: {
    sm: '0 2px 8px rgba(0,0,0,0.2)',
    md: '0 4px 16px rgba(0,0,0,0.3)',
    lg: '0 8px 32px rgba(0,0,0,0.4)',
  },
}

export type Theme = typeof lightTheme
