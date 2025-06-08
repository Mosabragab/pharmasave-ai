/**
 * PharmaSave AI Design System
 * Centralized design tokens for consistent branding
 */

// Brand Colors
export const COLORS = {
  // Primary Brand Colors
  pharmacy: {
    green: '#1E8A6E',          // Primary brand color
    'green-50': '#E8F5F0',
    'green-100': '#C2E0D1',
    'green-500': '#1E8A6E',
    'green-600': '#198A5F',
    'green-700': '#146B4A',
    'green-900': '#0D4A32',
  },
  
  trust: {
    blue: '#2C4D7D',           // Secondary brand color
    'blue-50': '#E7ECF3',
    'blue-100': '#C4D1E0',
    'blue-500': '#2C4D7D',
    'blue-600': '#254366',
    'blue-700': '#1E3A4F',
    'blue-900': '#162B38',
  },
  
  alert: {
    orange: '#E67E22',         // Warning/alert color
    'orange-50': '#FDF2E9',
    'orange-100': '#FADEC3',
    'orange-500': '#E67E22',
    'orange-600': '#D96E1C',
    'orange-700': '#CC5E16',
    'orange-900': '#B23E0F',
  },
  
  // Secondary Colors
  light: {
    green: '#A2D9C3',
    blue: '#D4E6F1',
  },
  
  // Neutral Colors
  neutral: {
    'soft-white': '#F7F9FB',
    'charcoal': '#34495E',
    'light-gray': '#ECF0F3',
    'medium-gray': '#BDC3C7',
    'dark-gray': '#7F8C8D',
  },
  
  // Status Colors
  status: {
    success: '#2ECC71',
    warning: '#F39C12',
    error: '#E74C3C',
    info: '#3498DB',
  }
} as const;

// Typography Scale
export const TYPOGRAPHY = {
  // Font Families
  fonts: {
    primary: ['Inter', 'sans-serif'],
    display: ['Inter', 'sans-serif'],
    mono: ['Roboto Mono', 'monospace'],
  },
  
  // Font Sizes
  sizes: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
  },
  
  // Font Weights
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  
  // Line Heights
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  }
} as const;

// Spacing Scale
export const SPACING = {
  // Base spacing unit (4px)
  unit: 4,
  
  // Spacing values
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
} as const;

// Border Radius
export const RADIUS = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

// Shadows
export const SHADOWS = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
} as const;

// Breakpoints
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Z-Index Scale
export const Z_INDEX = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// Animation Durations
export const DURATIONS = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const;

// Animation Easings
export const EASINGS = {
  'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
  'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
  'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// Component Variants
export const VARIANTS = {
  button: {
    sizes: {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4 py-2',
      lg: 'h-11 px-8 text-lg',
      icon: 'h-10 w-10',
    },
    variants: {
      primary: 'bg-pharmacy-green text-white hover:bg-opacity-90',
      secondary: 'bg-trust-blue text-white hover:bg-opacity-90',
      outline: 'border border-trust-blue text-trust-blue hover:bg-trust-blue hover:bg-opacity-10',
      ghost: 'hover:bg-pharmacy-green hover:bg-opacity-10 hover:text-pharmacy-green',
      destructive: 'bg-red-500 text-white hover:bg-red-600',
    }
  },
  
  card: {
    variants: {
      default: 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm',
      elevated: 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-md',
      interactive: 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm hover:shadow-md transition-shadow',
    }
  }
} as const;

// Brand Guidelines
export const BRAND = {
  name: 'PharmaSave AI',
  tagline: 'Turn Near-Expired Medications Into Revenue',
  description: 'Connect with nearby pharmacies to sell or trade near-expired medications before they become deadstock.',
  
  // Voice & Tone
  voice: {
    professional: true,
    friendly: true,
    trustworthy: true,
    innovative: true,
  },
  
  // Visual Identity
  logo: {
    icon: 'Pill', // Lucide icon name
    primary: '#1E8A6E',
    contrast: '#FFFFFF',
  }
} as const;

// Common Patterns
export const PATTERNS = {
  // Container widths
  containers: {
    sm: 'max-w-sm mx-auto',
    md: 'max-w-md mx-auto',
    lg: 'max-w-lg mx-auto',
    xl: 'max-w-xl mx-auto',
    '2xl': 'max-w-2xl mx-auto',
    '3xl': 'max-w-3xl mx-auto',
    '4xl': 'max-w-4xl mx-auto',
    '5xl': 'max-w-5xl mx-auto',
    '6xl': 'max-w-6xl mx-auto',
    '7xl': 'max-w-7xl mx-auto',
    full: 'max-w-full mx-auto',
  },
  
  // Common padding/margin combinations
  section: {
    padding: 'py-16 px-4 sm:px-6 lg:px-8',
    container: 'max-w-7xl mx-auto',
  },
  
  // Form styles
  form: {
    input: 'w-full px-4 py-2 rounded-md border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-pharmacy-green dark:bg-slate-700 dark:text-white',
    label: 'block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1',
    error: 'text-sm text-red-600 dark:text-red-400',
    helper: 'text-sm text-gray-500 dark:text-slate-400',
  }
} as const;

// Export all design tokens as a single object
export const DESIGN_TOKENS = {
  colors: COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  radius: RADIUS,
  shadows: SHADOWS,
  breakpoints: BREAKPOINTS,
  zIndex: Z_INDEX,
  durations: DURATIONS,
  easings: EASINGS,
  variants: VARIANTS,
  brand: BRAND,
  patterns: PATTERNS,
} as const;
