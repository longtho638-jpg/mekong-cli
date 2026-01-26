import React from 'react';
import { usePreferences } from '../hooks/usePreferences';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSelector } from './LanguageSelector';
import { NotificationSettings } from './NotificationSettings';
import { PrivacySettings } from './PrivacySettings';

interface PreferencesPanelProps {
  userId: string;
}

export const PreferencesPanel: React.FC<PreferencesPanelProps> = ({ userId }) => {
  const { preferences, loading, error, updatePreferences } = usePreferences(userId);

  if (loading) return <div className="p-4 text-center">Loading settings...</div>;
  if (error) return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  if (!preferences) return null;

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 max-w-2xl mx-auto space-y-8">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="text-gray-600 dark:text-gray-400">Manage your account preferences</p>
      </div>

      <div className="space-y-6">
        <section>
          <ThemeToggle
            theme={preferences.theme}
            onThemeChange={(theme) => updatePreferences({ theme })}
          />
        </section>

        <section className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <LanguageSelector
            language={preferences.language}
            onLanguageChange={(language) => updatePreferences({ language })}
          />
        </section>

        <section className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <NotificationSettings
            emailNotifications={preferences.email_notifications}
            pushNotifications={preferences.push_notifications}
            onToggleEmail={(enabled) => updatePreferences({ email_notifications: enabled })}
            onTogglePush={(enabled) => updatePreferences({ push_notifications: enabled })}
          />
        </section>

        <section className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <PrivacySettings
            visibility={preferences.profile_visibility}
            onVisibilityChange={(visibility) => updatePreferences({ profile_visibility: visibility })}
          />
        </section>
      </div>
    </div>
  );
};
