import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface Theme {
  mode: 'light' | 'dark';
  colors: {
    // Primary Brand Colors
    primary: string;
    primaryDark: string;
    primaryLight: string;
    
    // Secondary Colors
    secondary: string;
    secondaryLight: string;
    
    // Accent Colors
    accent: string;
    
    // Status Colors
    success: string;
    warning: string;
    warningLight: string;
    error: string;
    info: string;
    
    // Neutral Colors
    white: string;
    black: string;
    gray50: string;
    gray100: string;
    gray200: string;
    gray300: string;
    gray400: string;
    gray500: string;
    gray600: string;
    gray700: string;
    gray800: string;
    gray900: string;
    
    // Background Colors
    background: string;
    surface: string;
    surfaceSecondary: string;
    
    // Text Colors
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    textOnPrimary: string;
    
    // Border Colors
    border: string;
    borderLight: string;
    borderDark: string;
    
    // Shadow Colors
    shadow: string;
    
    // Component-specific
    cardBackground: string;
    cardBorder: string;
    inputBackground: string;
    inputBorder: string;
    tabBar: string;
    headerBackground: string;
  };
}

const lightTheme: Theme = {
  mode: 'light',
  colors: {
    primary: '#4682B4',
    primaryDark: '#3a6d94',
    primaryLight: '#6b9cc9',
    secondary: '#78909C',
    secondaryLight: '#a7b8c1',
    accent: '#5a9fd4',
    success: '#10b981',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    error: '#ef4444',
    info: '#4682B4',
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
    background: '#f9fafb',
    surface: '#ffffff',
    surfaceSecondary: '#f3f4f6',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',
    textOnPrimary: '#ffffff',
    border: '#e5e7eb',
    borderLight: '#f3f4f6',
    borderDark: '#d1d5db',
    shadow: '#000000',
    cardBackground: '#ffffff',
    cardBorder: '#e5e7eb',
    inputBackground: '#ffffff',
    inputBorder: '#d1d5db',
    tabBar: '#ffffff',
    headerBackground: '#ffffff',
  },
};

const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    primary: '#6b9cc9',
    primaryDark: '#4682B4',
    primaryLight: '#8ab5d5',
    secondary: '#a7b8c1',
    secondaryLight: '#c5d0d8',
    accent: '#5a9fd4',
    success: '#34d399',
    warning: '#fbbf24',
    warningLight: '#3f3922',
    error: '#f87171',
    info: '#6b9cc9',
    white: '#ffffff',
    black: '#000000',
    gray50: '#1f2937',
    gray100: '#374151',
    gray200: '#4b5563',
    gray300: '#6b7280',
    gray400: '#9ca3af',
    gray500: '#d1d5db',
    gray600: '#e5e7eb',
    gray700: '#f3f4f6',
    gray800: '#f9fafb',
    gray900: '#ffffff',
    background: '#111827',
    surface: '#1f2937',
    surfaceSecondary: '#374151',
    textPrimary: '#f9fafb',
    textSecondary: '#d1d5db',
    textTertiary: '#9ca3af',
    textOnPrimary: '#111827',
    border: '#374151',
    borderLight: '#4b5563',
    borderDark: '#6b7280',
    shadow: '#000000',
    cardBackground: '#1f2937',
    cardBorder: '#374151',
    inputBackground: '#1f2937',
    inputBorder: '#4b5563',
    tabBar: '#1f2937',
    headerBackground: '#1f2937',
  },
};

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [isReady, setIsReady] = useState(false);

  // Determine actual theme based on mode
  const getActualTheme = (mode: ThemeMode): Theme => {
    if (mode === 'auto') {
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return mode === 'dark' ? darkTheme : lightTheme;
  };

  const [theme, setTheme] = useState<Theme>(getActualTheme(themeMode));
  const isDark = theme.mode === 'dark';

  // Load saved theme mode on mount
  useEffect(() => {
    loadThemeMode();
  }, []);

  // Update theme when mode or system preference changes
  useEffect(() => {
    if (isReady) {
      const newTheme = getActualTheme(themeMode);
      setTheme(newTheme);
    }
  }, [themeMode, systemColorScheme, isReady]);

  const loadThemeMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode && (savedMode === 'light' || savedMode === 'dark' || savedMode === 'auto')) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme mode:', error);
    } finally {
      setIsReady(true);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  if (!isReady) {
    return null; // or a loading screen
  }

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
