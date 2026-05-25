
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';

const ThemeContext = createContext({
  isDarkMode: false,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to Light Mode

  const toggleTheme = () => {
    setIsDarkMode(previousState => !previousState);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
