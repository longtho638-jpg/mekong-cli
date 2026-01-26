import React from 'react';
import { UserPreferences } from '../types';

interface ThemeToggleProps {
  theme: UserPreferences['theme'];
  onThemeChange: (theme: UserPreferences['theme']) => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onThemeChange }) => {
  return (
    <div className="flex flex-col space-y-2">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Theme</h3>
      <div className="flex space-x-4">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="radio"
            name="theme"
            value="light"
            checked={theme === 'light'}
            onChange={() => onThemeChange('light')}
            className="form-radio text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-gray-700 dark:text-gray-300">Light</span>
        </label>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="radio"
            name="theme"
            value="dark"
            checked={theme === 'dark'}
            onChange={() => onThemeChange('dark')}
            className="form-radio text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-gray-700 dark:text-gray-300">Dark</span>
        </label>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="radio"
            name="theme"
            value="system"
            checked={theme === 'system'}
            onChange={() => onThemeChange('system')}
            className="form-radio text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-gray-700 dark:text-gray-300">System</span>
        </label>
      </div>
    </div>
  );
};
