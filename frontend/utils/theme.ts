// Brand Colors - F Property Services
export const Colors = {
  // Primary Brand Colors
  primary: '#4682B4',        // Steel Blue (from logo)
  primaryDark: '#3a6d94',    // Darker shade for hover/pressed states
  primaryLight: '#6b9cc9',   // Lighter shade for backgrounds
  
  // Secondary Colors
  secondary: '#78909C',      // Muted Blue-Gray (from logo text)
  secondaryLight: '#a7b8c1', // Lighter secondary
  
  // Accent Colors
  accent: '#5a9fd4',         // Bright accent blue
  
  // Status Colors
  success: '#10b981',        // Green for completed/success
  warning: '#f59e0b',        // Orange for in-progress/warning
  warningLight: '#fef3c7',   // Light warning background
  error: '#ef4444',          // Red for errors/cancelled
  info: '#4682B4',           // Using primary for info
  
  // Neutral Colors
  white: '#ffffff',
  black: '#000000',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  
  // Background Colors
  background: '#f9fafb',
  surface: '#ffffff',
  
  // Text Colors
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  textOnPrimary: '#ffffff',
  
  // Border Colors
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  borderDark: '#d1d5db',
  
  // Shadow Colors
  shadow: '#000000',
};

// Component-specific color mappings
export const ComponentColors = {
  // Buttons
  buttonPrimary: Colors.primary,
  buttonPrimaryPressed: Colors.primaryDark,
  buttonPrimaryText: Colors.white,
  
  // Status Badges
  statusScheduled: Colors.primary,
  statusInProgress: Colors.warning,
  statusCompleted: Colors.success,
  statusCancelled: Colors.error,
  
  // Tab Bar
  tabActive: Colors.primary,
  tabInactive: Colors.gray500,
  tabBackground: Colors.white,
  tabBorder: Colors.border,
  
  // Cards
  cardBackground: Colors.white,
  cardBorder: Colors.border,
  
  // Chips
  chipBackground: Colors.white,
  chipBorder: Colors.borderDark,
  chipSelected: Colors.primary,
  chipSelectedText: Colors.white,
  chipText: Colors.textSecondary,
  
  // Avatars
  avatarPrimary: Colors.primary,
  avatarSecondary: Colors.warning,
  
  // Icons
  iconPrimary: Colors.primary,
  iconSecondary: Colors.secondary,
  iconTertiary: Colors.gray400,
};

// Spacing system (8pt grid)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border Radius
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Typography
export const Typography = {
  // Font Sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  
  // Font Weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Shadows
export const Shadows = {
  sm: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};
