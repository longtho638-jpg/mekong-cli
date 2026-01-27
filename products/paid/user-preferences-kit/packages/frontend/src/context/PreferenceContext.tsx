
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { PreferenceValue, PreferenceSchema } from '@antigravity/preferences-types';

interface PreferenceContextType {
  preferences: Record<string, PreferenceValue>;
  schema: PreferenceSchema[];
  loading: boolean;
  error: Error | null;
  updatePreference: (key: string, value: PreferenceValue) => Promise<void>;
  updateBulkPreferences: (prefs: Record<string, PreferenceValue>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  exportPreferences: () => Promise<void>;
  importPreferences: (file: File) => Promise<void>;
}

const PreferenceContext = createContext<PreferenceContextType | undefined>(undefined);

interface PreferenceProviderProps {
  children: React.ReactNode;
  userId?: string;
  apiEndpoint?: string;
}

export const PreferenceProvider: React.FC<PreferenceProviderProps> = ({
  children,
  userId = 'default-user',
  apiEndpoint = 'http://localhost:3001',
}) => {
  const [preferences, setPreferences] = useState<Record<string, PreferenceValue>>({});
  const [schema, setSchema] = useState<PreferenceSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Initialize Socket.io
  useEffect(() => {
    const newSocket = io(apiEndpoint);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to preference server');
      newSocket.emit('join', userId);
    });

    newSocket.on('preference:updated', ({ key, value }: { key: string; value: PreferenceValue }) => {
      setPreferences((prev) => ({ ...prev, [key]: value }));
    });

    newSocket.on('preferences:bulk_updated', (updatedPrefs: Record<string, PreferenceValue>) => {
      setPreferences((prev) => ({ ...prev, ...updatedPrefs }));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [apiEndpoint, userId]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prefsRes, schemaRes] = await Promise.all([
          fetch(`${apiEndpoint}/api/preferences?userId=${userId}`),
          fetch(`${apiEndpoint}/api/preferences/schema`),
        ]);

        if (!prefsRes.ok || !schemaRes.ok) {
          throw new Error('Failed to fetch preference data');
        }

        const prefsData = await prefsRes.json();
        const schemaData = await schemaRes.json();

        setPreferences(prefsData);
        setSchema(schemaData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiEndpoint, userId]);

  const updatePreference = useCallback(async (key: string, value: PreferenceValue) => {
    // Optimistic update
    setPreferences((prev) => ({ ...prev, [key]: value }));

    try {
      const response = await fetch(`${apiEndpoint}/api/preferences/${key}?userId=${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });

      if (!response.ok) {
        throw new Error('Failed to update preference');
      }
    } catch (err) {
      // Revert optimistic update on error (simplified)
      console.error(err);
      // In a real app, you might want to fetch the latest state or revert specifically
      setError(err instanceof Error ? err : new Error('Failed to update preference'));
    }
  }, [apiEndpoint, userId]);

  const updateBulkPreferences = useCallback(async (prefs: Record<string, PreferenceValue>) => {
    setPreferences((prev) => ({ ...prev, ...prefs }));

    try {
      const response = await fetch(`${apiEndpoint}/api/preferences?userId=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err : new Error('Failed to update preferences'));
    }
  }, [apiEndpoint, userId]);

  const resetToDefaults = useCallback(async () => {
     // Implementation would depend on backend support or locally resetting based on schema defaults
     // For now, we'll manually reset based on schema defaults
     const defaults: Record<string, PreferenceValue> = {};
     schema.forEach(s => defaults[s.key] = s.defaultValue);
     await updateBulkPreferences(defaults);
  }, [schema, updateBulkPreferences]);

  const exportPreferences = useCallback(async () => {
    try {
        const response = await fetch(`${apiEndpoint}/api/preferences/export?userId=${userId}`);
        if (!response.ok) throw new Error('Failed to export');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'preferences.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err : new Error('Failed to export'));
    }
  }, [apiEndpoint, userId]);

  const importPreferences = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target?.result as string;
        try {
            const response = await fetch(`${apiEndpoint}/api/preferences/import?userId=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: text }),
            });
            if (!response.ok) throw new Error('Failed to import');
        } catch (err) {
             console.error(err);
             setError(err instanceof Error ? err : new Error('Failed to import'));
        }
    };
    reader.readAsText(file);
  }, [apiEndpoint, userId]);

  return (
    <PreferenceContext.Provider
      value={{
        preferences,
        schema,
        loading,
        error,
        updatePreference,
        updateBulkPreferences,
        resetToDefaults,
        exportPreferences,
        importPreferences
      }}
    >
      {children}
    </PreferenceContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferenceContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferenceProvider');
  }
  return context;
};
