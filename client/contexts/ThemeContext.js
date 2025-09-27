// Theme context for GigCampus
// Provides light/dark mode functionality with smooth transitions

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('gigcampus_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      setIsDarkMode(systemPrefersDark);
    }
    
    setIsLoading(false);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (isLoading) return;

    const root = document.documentElement;
    const body = document.body;
    
    if (isDarkMode) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      root.style.backgroundColor = '#111827'; // gray-900
      body.style.backgroundColor = '#111827'; // gray-900
      body.style.color = '#ffffff';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
      root.style.backgroundColor = '#f9fafb'; // gray-50
      body.style.backgroundColor = '#f9fafb'; // gray-50
      body.style.color = '#111827';
    }

    // Save to localStorage
    localStorage.setItem('gigcampus_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode, isLoading]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const setTheme = (theme) => {
    setIsDarkMode(theme === 'dark');
  };

  const value = {
    isDarkMode,
    isLoading,
    toggleTheme,
    setTheme,
    theme: isDarkMode ? 'dark' : 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
