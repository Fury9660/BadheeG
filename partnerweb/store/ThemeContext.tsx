import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';

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
  colors: ThemeColors;
}

const lightColors: ThemeColors = {
  background: '#f0f2f5',
  card: '#ffffff',
  text: '#171717',
  subtext: '#666666',
  primary: '#000000', // Changed from Blue to Black per user request
  border: '#E5E5EA',
  danger: '#FF3B30',
};

const blackColors: ThemeColors = {
  background: '#000000',
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
  colors: lightColors,
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
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme === 'light' || savedTheme === 'black') {
        setThemeModeState(savedTheme);
      } else {
        setThemeModeState(deviceScheme === 'dark' ? 'black' : 'light');
      }
    } catch (e) {
      console.error("Failed to load theme", e);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem('themeMode', mode);
    } catch (e) {
      console.error("Failed to save theme", e);
    }
  };

  const isDarkMode = themeMode === 'black';

  let colors = lightColors;
  if (themeMode === 'black') colors = blackColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, themeMode, setThemeMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};
