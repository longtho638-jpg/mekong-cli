import React from 'react';
import { UserPreferences } from '../types';

interface PrivacySettingsProps {
  visibility: UserPreferences['profile_visibility'];
  onVisibilityChange: (visibility: UserPreferences['profile_visibility']) => void;
}

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({ visibility, onVisibilityChange }) => {
  return (
    <div className="flex flex-col space-y-2">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Privacy</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">Control who can see your profile.</p>

      <div className="mt-2 space-y-2">
        <label className="flex items-center space-x-3">
          <input
            type="radio"
            name="visibility"
            value="public"
            checked={visibility === 'public'}
            onChange={() => onVisibilityChange('public')}
            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
          />
          <span className="text-gray-700 dark:text-gray-300">Public (Everyone can see)</span>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="radio"
            name="visibility"
            value="friends"
            checked={visibility === 'friends'}
            onChange={() => onVisibilityChange('friends')}
            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
          />
          <span className="text-gray-700 dark:text-gray-300">Friends Only</span>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="radio"
            name="visibility"
            value="private"
            checked={visibility === 'private'}
            onChange={() => onVisibilityChange('private')}
            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
          />
          <span className="text-gray-700 dark:text-gray-300">Private (Only me)</span>
        </label>
      </div>
    </div>
  );
};
