const colors = {
  primary: {
    main: '#000000', // Pure Black
    light: '#333333', // Light Black
  },
  accent: {
    white: '#FFFFFF', // Pure White
    gray: '#F5F5F5', // Light Gray
  },
  feedback: {
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#DC2626',
  },
};

const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '48px',
  '2xl': '64px',
};

const borderRadius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  full: '9999px',
};

const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
};

const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
};

const typography = {
  fonts: {
    display: 'Poppins, sans-serif',
    body: 'Inter, sans-serif',
  },
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },
  lineHeights: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

const transitions = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  timing: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  typography,
  transitions,
};
