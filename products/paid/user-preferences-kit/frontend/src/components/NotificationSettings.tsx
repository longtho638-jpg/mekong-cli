import React from 'react';

interface NotificationSettingsProps {
  emailNotifications: boolean;
  pushNotifications: boolean;
  onToggleEmail: (enabled: boolean) => void;
  onTogglePush: (enabled: boolean) => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  emailNotifications,
  pushNotifications,
  onToggleEmail,
  onTogglePush,
}) => {
  return (
    <div className="flex flex-col space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Notifications</h3>

      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-200">Email Notifications</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Receive updates and newsletters via email.</span>
        </div>
        <button
          type="button"
          onClick={() => onToggleEmail(!emailNotifications)}
          className={`${
            emailNotifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
          } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          <span
            className={`${
              emailNotifications ? 'translate-x-5' : 'translate-x-0'
            } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-200">Push Notifications</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Receive real-time alerts on your device.</span>
        </div>
        <button
          type="button"
          onClick={() => onTogglePush(!pushNotifications)}
          className={`${
            pushNotifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
          } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          <span
            className={`${
              pushNotifications ? 'translate-x-5' : 'translate-x-0'
            } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
          />
        </button>
      </div>
    </div>
  );
};
