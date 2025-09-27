// Floating Action Button Component
// Interactive FAB with animations and theme support

import { useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';

const FloatingActionButton = ({ actions = [], className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isDarkMode } = useTheme();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {/* Action Items */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 space-y-3 animate-fade-in-up">
          {actions.map((action, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 animate-slide-in-right"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <span className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap border border-gray-200 dark:border-gray-700">
                {action.label}
              </span>
              <button
                onClick={action.onClick}
                className={`w-12 h-12 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center ${action.bgColor || 'bg-blue-600 hover:bg-blue-700'}`}
                title={action.label}
              >
                <action.icon className="w-6 h-6 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={toggleMenu}
        className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center ${
          isOpen ? 'rotate-45' : 'rotate-0'
        } ${
          isDarkMode 
            ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25' 
            : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'
        } animate-bounce-gentle`}
      >
        {isOpen ? (
          <XMarkIcon className="w-7 h-7 text-white transition-transform duration-300" />
        ) : (
          <PlusIcon className="w-7 h-7 text-white transition-transform duration-300" />
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 dark:bg-opacity-40 -z-10 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default FloatingActionButton;
