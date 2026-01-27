import { useState } from 'react';
import { StorageProvider } from '../types';

interface UsePresignedUrlOptions {
  provider?: StorageProvider;
}

export const usePresignedUrl = (options: UsePresignedUrlOptions = { provider: 's3' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPresignedUrl = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          provider: options.provider,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get presigned URL');
      }

      const data = await response.json();
      return data as { url: string; key: string; provider: StorageProvider };
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { getPresignedUrl, isLoading, error };
};
