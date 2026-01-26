export interface UserPreferences {
  id?: number;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  email_notifications: boolean;
  push_notifications: boolean;
  profile_visibility: 'public' | 'private' | 'friends';
}

export type UserPreferencesUpdate = Partial<Omit<UserPreferences, 'id' | 'user_id'>>;

export interface PreferencesContextType {
  preferences: UserPreferences | null;
  loading: boolean;
  error: string | null;
  updatePreferences: (updates: UserPreferencesUpdate) => Promise<void>;
  refreshPreferences: () => Promise<void>;
}
