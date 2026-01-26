import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { FeatureFlagsClient } from './client';

interface FeatureContextType {
  client: FeatureFlagsClient;
  flags: Record<string, boolean>;
  isLoading: boolean;
  error: Error | null;
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

interface FeatureProviderProps {
  client: FeatureFlagsClient;
  userContext?: Record<string, any>;
  children: ReactNode;
}

export const FeatureProvider: React.FC<FeatureProviderProps> = ({ client, userContext = {}, children }) => {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await client.fetchFlags(userContext);
        setFlags(client.getFlags());
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [client, JSON.stringify(userContext)]);

  return (
    <FeatureContext.Provider value={{ client, flags, isLoading, error }}>
      {children}
    </FeatureContext.Provider>
  );
};

export const useFlags = () => {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFlags must be used within a FeatureProvider');
  }
  return context;
};

export const useFeature = (key: string, defaultValue: boolean = false): boolean => {
  const { flags } = useFlags();
  return flags[key] ?? defaultValue;
};
