# Schema Guide

The Preference Schema is the single source of truth for your application's user preferences. It defines validation rules, default values, and UI rendering hints.

## Schema Interface

```typescript
export interface PreferenceSchema {
  key: string;          // Unique dot-notation key (e.g., 'notifications.email')
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'enum';
  defaultValue: any;    // Fallback value if user hasn't set it
  label: string;        // UI Label
  description?: string; // UI Helper text
  category: string;     // Grouping key
  options?: {           // For 'enum' type
      label: string;
      value: any;
  }[];
  validation?: {        // Basic validation rules
    min?: number;
    max?: number;
    pattern?: string;
  };
}
```

## Adding New Preferences

To add a new preference, simply append to the `DEFAULT_PREFERENCE_SCHEMA` array in `packages/types/src/index.ts`.

### Example: Dark Mode Toggle
```typescript
{
  key: 'appearance.mode',
  type: 'enum',
  defaultValue: 'system',
  label: 'Color Mode',
  description: 'Select your preferred color mode',
  category: 'appearance',
  options: [
    { label: 'System', value: 'system' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
  ]
}
```

### Example: Email Frequency
```typescript
{
  key: 'notifications.frequency',
  type: 'enum',
  defaultValue: 'daily',
  label: 'Email Frequency',
  category: 'notifications',
  options: [
    { label: 'Real-time', value: 'instant' },
    { label: 'Daily Digest', value: 'daily' },
    { label: 'Weekly Digest', value: 'weekly' },
  ]
}
```

## Categories

Categories are arbitrary strings used to group preferences in the UI. We recommend using constants:

```typescript
export const DEFAULT_CATEGORIES = {
  APPEARANCE: 'appearance',
  NOTIFICATIONS: 'notifications',
  PRIVACY: 'privacy',
  // Add yours here
} as const;
```
