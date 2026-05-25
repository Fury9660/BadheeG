
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform, useColorScheme as useDeviceColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'black';

interface ThemeColors {
  background: string;
  card: string;
  text: string;
  subtext: string;
  primary: string;
  border: string;
  danger: string;
}

interface ThemeContextType {
  isDarkMode: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const lightColors: ThemeColors = {
  background: '#F2F2F7',
  card: '#FFFFFF',
  text: '#000000',
  subtext: '#8E8E93',
  primary: '#000000', // Changed from Blue to Black per user request
  border: '#E5E5EA',
  danger: '#FF3B30',
};

const blackColors: ThemeColors = {
  background: '#000000', // AMOLED Black
  card: '#121212',
  text: '#FFFFFF',
  subtext: '#A1A1A1',
  primary: '#FFFFFF',
  border: '#272729',
  danger: '#FF453A',
};

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  themeMode: 'light',
  setThemeMode: () => { },
  toggleTheme: () => { },
  colors: blackColors,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const deviceScheme = useDeviceColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('app_theme_mode');
      if (storedTheme === 'light' || storedTheme === 'black') {
        setThemeModeState(storedTheme);
        } else {
          // Fallback to dark mode default
          setThemeModeState('light');
        }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem('app_theme_mode', mode);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const toggleTheme = () => {
    setThemeMode(themeMode === 'light' ? 'black' : 'light');
  };

  const isDarkMode = themeMode === 'black';

  const getColors = (): ThemeColors => {
    switch (themeMode) {
      case 'black': return blackColors;
      default: return lightColors;
    }
  };

  return (
    <ThemeContext.Provider value={{
      isDarkMode,
      themeMode,
      setThemeMode,
      toggleTheme,
      colors: getColors()
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
