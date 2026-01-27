
export type PreferenceValue = string | number | boolean | null | { [key: string]: PreferenceValue } | PreferenceValue[];

export interface PreferenceSchema {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'enum';
  defaultValue: PreferenceValue;
  label: string;
  description?: string;
  category: string;
  options?: { label: string; value: PreferenceValue }[]; // For enum type
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface PreferenceGroup {
  id: string;
  label: string;
  description?: string;
  order: number;
}

export interface UserPreference {
  userId: string;
  key: string;
  value: PreferenceValue;
  updatedAt: Date;
}

export interface PreferenceContextState {
  preferences: Record<string, PreferenceValue>;
  updatePreference: (key: string, value: PreferenceValue) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

// Default Categories
export const DEFAULT_CATEGORIES = {
  APPEARANCE: 'appearance',
  NOTIFICATIONS: 'notifications',
  PRIVACY: 'privacy',
  ACCESSIBILITY: 'accessibility',
} as const;

// Example Schema Definition
export const DEFAULT_PREFERENCE_SCHEMA: PreferenceSchema[] = [
  {
    key: 'theme',
    type: 'enum',
    defaultValue: 'system',
    label: 'Theme',
    description: 'Application color theme',
    category: DEFAULT_CATEGORIES.APPEARANCE,
    options: [
      { label: 'System', value: 'system' },
      { label: 'Light', value: 'light' },
      { label: 'Dark', value: 'dark' },
    ],
  },
  {
    key: 'language',
    type: 'string',
    defaultValue: 'en',
    label: 'Language',
    description: 'Preferred language',
    category: DEFAULT_CATEGORIES.APPEARANCE,
  },
  {
    key: 'notifications.email',
    type: 'boolean',
    defaultValue: true,
    label: 'Email Notifications',
    category: DEFAULT_CATEGORIES.NOTIFICATIONS,
  },
  {
    key: 'notifications.push',
    type: 'boolean',
    defaultValue: true,
    label: 'Push Notifications',
    category: DEFAULT_CATEGORIES.NOTIFICATIONS,
  },
];
