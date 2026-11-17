import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorPalette, ColorSchemeMode } from '../types/theme';
import { lightColors, darkColors } from './colors';

interface ThemeContextType {
  mode: ColorSchemeMode;
  isDark: boolean;
  colors: ColorPalette;
  setMode: (mode: ColorSchemeMode) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = '@business_contacts_theme_mode';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceColorScheme = useDeviceColorScheme();
  const [mode, setModeState] = useState<ColorSchemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setModeState(stored);
        }
      })
      .catch(() => {});
  }, []);

  const setMode = (newMode: ColorSchemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, newMode).catch(() => {});
  };

  const isDark =
    mode === 'dark' || (mode === 'system' && deviceColorScheme === 'dark');

  const colors = isDark ? darkColors : lightColors;

  const toggleTheme = () => {
    if (isDark) {
      setMode('light');
    } else {
      setMode('dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ mode, isDark, colors, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};
