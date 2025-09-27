// Theme Toggle Component
// Interactive toggle for switching between light and dark modes

import { useState, useEffect } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { isDarkMode, toggleTheme, isLoading } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    toggleTheme();
    
    // Reset animation state
    setTimeout(() => setIsAnimating(false), 300);
  };

  if (isLoading) {
    return (
      <div className={`w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse ${className}`} />
    );
  }

  return (
    <button
      onClick={handleToggle}
      className={`
        relative inline-flex items-center w-12 h-6 rounded-full transition-all duration-300 ease-in-out
        ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}
        hover:shadow-lg hover:scale-105 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        dark:focus:ring-offset-gray-800
        ${className}
      `}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      {/* Toggle Circle */}
      <span
        className={`
          inline-block w-5 h-5 transform transition-all duration-300 ease-in-out
          bg-white rounded-full shadow-lg
          ${isDarkMode ? 'translate-x-6' : 'translate-x-0.5'}
          ${isAnimating ? 'scale-110' : 'scale-100'}
        `}
      >
        {/* Icon inside the circle */}
        <span className="absolute inset-0 flex items-center justify-center">
          {isDarkMode ? (
            <MoonIcon className="w-3 h-3 text-blue-600 transition-all duration-200" />
          ) : (
            <SunIcon className="w-3 h-3 text-yellow-500 transition-all duration-200" />
          )}
        </span>
      </span>

      {/* Background Icons */}
      <span className="absolute inset-0 flex items-center justify-between px-1">
        <SunIcon 
          className={`w-3 h-3 transition-all duration-300 ${
            isDarkMode ? 'text-blue-300 opacity-50' : 'text-yellow-500 opacity-100'
          }`} 
        />
        <MoonIcon 
          className={`w-3 h-3 transition-all duration-300 ${
            isDarkMode ? 'text-white opacity-100' : 'text-gray-400 opacity-50'
          }`} 
        />
      </span>
    </button>
  );
};

export default ThemeToggle;
