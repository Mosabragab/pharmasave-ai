// ===============================================
// PHARMASAVE AI DESIGN SYSTEM
// Consistent, modern, organized design patterns
// ===============================================

// 🎨 BRAND COLORS
export const colors = {
  // Primary Brand Colors
  pharmacyGreen: '#1E8A6E',
  pharmacyGreenLight: '#22C55E',
  pharmacyGreenDark: '#166534',
  trustBlue: '#2C4D7D',
  alertOrange: '#E67E22',
  
  // Semantic Colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Neutral Palette
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Dark Mode
  slate800: '#1E293B',
  slate900: '#0F172A'
}

// 📏 SPACING SYSTEM
export const spacing = {
  xs: '0.5rem',    // 8px
  sm: '0.75rem',   // 12px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
}

// 🔤 TYPOGRAPHY SYSTEM
export const typography = {
  // Font Family
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  
  // Font Sizes
  text: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },
  
  // Font Weights
  weight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },
  
  // Line Heights
  leading: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75'
  }
}

// 🔘 BORDER RADIUS
export const borderRadius = {
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  full: '9999px'
}

// 🌟 SHADOWS
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
}

// ===============================================
// COMPONENT PATTERNS
// ===============================================

// 📄 PAGE LAYOUT PATTERN
export const pageLayout = {
  // Standard page container
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
  
  // Page header section
  pageHeader: {
    container: 'flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8',
    title: 'text-3xl font-bold text-gray-900 dark:text-white mb-2',
    subtitle: 'text-gray-600 dark:text-gray-400',
    actions: 'mt-4 sm:mt-0 flex space-x-2'
  },
  
  // Content sections
  section: {
    container: 'mb-8',
    title: 'text-xl font-semibold text-gray-900 dark:text-white mb-4',
    subtitle: 'text-gray-600 dark:text-gray-400 mb-6'
  }
}

// 🃏 CARD PATTERNS
export const cardPatterns = {
  // Standard card
  base: 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm',
  
  // Interactive card (hover effects)
  interactive: 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer',
  
  // Feature card with accent
  feature: 'bg-white dark:bg-slate-800 border-l-4 border-l-pharmacy-green rounded-lg shadow-sm',
  
  // Stats card
  stats: 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6',
  
  // Content padding
  padding: {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }
}

// 🔘 BUTTON PATTERNS
export const buttonPatterns = {
  // Primary button (pharmacy green)
  primary: 'bg-pharmacy-green hover:bg-pharmacy-green/90 text-white font-medium px-4 py-2 rounded-lg transition-colors',
  
  // Secondary button
  secondary: 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-900 dark:text-white font-medium px-4 py-2 rounded-lg transition-colors',
  
  // Outline button
  outline: 'border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium px-4 py-2 rounded-lg transition-colors',
  
  // Danger button
  danger: 'bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg transition-colors',
  
  // Icon button
  icon: 'w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors'
}

// 📝 FORM PATTERNS
export const formPatterns = {
  // Form container
  container: 'space-y-6',
  
  // Form group
  group: 'space-y-2',
  
  // Label
  label: 'block text-sm font-medium text-gray-700 dark:text-gray-300',
  
  // Input field
  input: 'w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:text-white transition-colors',
  
  // Textarea
  textarea: 'w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:text-white resize-none transition-colors',
  
  // Select
  select: 'w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:text-white transition-colors',
  
  // Help text
  help: 'text-sm text-gray-500 dark:text-gray-400',
  
  // Error text
  error: 'text-sm text-red-600 dark:text-red-400'
}

// 🏷️ BADGE PATTERNS
export const badgePatterns = {
  // Status badges
  success: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  warning: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  error: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  info: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  
  // Size variants
  sm: 'px-2 py-1 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm'
}

// 📊 STATS CARD PATTERNS
export const statsPatterns = {
  // Container
  container: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
  
  // Individual stat card
  card: 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6',
  
  // Stat with icon
  withIcon: 'flex items-center justify-between',
  
  // Icon container
  iconContainer: 'w-12 h-12 rounded-full flex items-center justify-center',
  
  // Value
  value: 'text-2xl font-bold text-gray-900 dark:text-white',
  
  // Label
  label: 'text-sm font-medium text-gray-600 dark:text-gray-400'
}

// 📋 TABLE PATTERNS
export const tablePatterns = {
  // Table container
  container: 'overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700',
  
  // Table
  table: 'min-w-full divide-y divide-gray-200 dark:divide-slate-700',
  
  // Header
  header: 'bg-gray-50 dark:bg-slate-800',
  headerCell: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
  
  // Body
  body: 'bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700',
  bodyRow: 'hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors',
  bodyCell: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'
}

// 🔔 NOTIFICATION PATTERNS
export const notificationPatterns = {
  // Toast notification
  toast: {
    success: 'bg-green-50 border border-green-200 text-green-800',
    error: 'bg-red-50 border border-red-200 text-red-800',
    warning: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border border-blue-200 text-blue-800'
  },
  
  // Alert banner
  alert: {
    container: 'rounded-lg p-4 mb-6',
    success: 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400',
    error: 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400',
    warning: 'bg-yellow-50 border border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400',
    info: 'bg-blue-50 border border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
  }
}

// 📱 RESPONSIVE PATTERNS
export const responsivePatterns = {
  // Grid systems
  grid: {
    cols1: 'grid grid-cols-1 gap-6',
    cols2: 'grid grid-cols-1 md:grid-cols-2 gap-6',
    cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    cols4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
  },
  
  // Flex patterns
  flex: {
    stack: 'flex flex-col space-y-4',
    stackSm: 'flex flex-col sm:flex-row sm:space-y-0 sm:space-x-4',
    between: 'flex flex-col sm:flex-row sm:items-center sm:justify-between',
    center: 'flex items-center justify-center'
  }
}

// ===============================================
// ANIMATION PATTERNS
// ===============================================
export const animationPatterns = {
  // Transitions
  transition: 'transition-all duration-200 ease-in-out',
  transitionSlow: 'transition-all duration-300 ease-in-out',
  transitionFast: 'transition-all duration-150 ease-in-out',
  
  // Hover effects
  hoverScale: 'hover:scale-105 transition-transform duration-200',
  hoverShadow: 'hover:shadow-lg transition-shadow duration-200',
  hoverOpacity: 'hover:opacity-80 transition-opacity duration-200',
  
  // Loading states
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce'
}

// ===============================================
// ACCESSIBILITY PATTERNS
// ===============================================
export const a11yPatterns = {
  // Focus styles
  focus: 'focus:outline-none focus:ring-2 focus:ring-pharmacy-green focus:ring-offset-2 dark:focus:ring-offset-slate-900',
  
  // Screen reader only
  srOnly: 'sr-only',
  
  // Skip links
  skipLink: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-pharmacy-green text-white px-4 py-2 rounded-lg z-50'
}

// ===============================================
// USAGE EXAMPLES
// ===============================================

/* 
📄 PAGE STRUCTURE EXAMPLE:

<div className={pageLayout.container}>
  <div className={pageLayout.pageHeader.container}>
    <div>
      <h1 className={pageLayout.pageHeader.title}>Page Title</h1>
      <p className={pageLayout.pageHeader.subtitle}>Page description</p>
    </div>
    <div className={pageLayout.pageHeader.actions}>
      <button className={buttonPatterns.outline}>Action 1</button>
      <button className={buttonPatterns.primary}>Action 2</button>
    </div>
  </div>
  
  <div className={statsPatterns.container}>
    <div className={statsPatterns.card}>
      <div className={statsPatterns.withIcon}>
        <div>
          <p className={statsPatterns.label}>Label</p>
          <p className={statsPatterns.value}>123</p>
        </div>
        <div className={`${statsPatterns.iconContainer} bg-pharmacy-green/10`}>
          <Icon className="w-6 h-6 text-pharmacy-green" />
        </div>
      </div>
    </div>
  </div>
</div>

🃏 CARD EXAMPLE:
<div className={cardPatterns.base}>
  <div className={cardPatterns.padding.md}>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      Card Title
    </h3>
    <p className="text-gray-600 dark:text-gray-400">
      Card content goes here...
    </p>
  </div>
</div>

📝 FORM EXAMPLE:
<div className={formPatterns.container}>
  <div className={formPatterns.group}>
    <label className={formPatterns.label}>Field Label</label>
    <input className={formPatterns.input} type="text" />
    <p className={formPatterns.help}>Helper text</p>
  </div>
</div>
*/
