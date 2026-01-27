import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePreferences } from '../hooks/usePreferences';

global.fetch = vi.fn();

describe('usePreferences', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch preferences on mount', async () => {
    const mockPreferences = {
      user_id: '123',
      theme: 'light',
      language: 'en',
      email_notifications: true,
      push_notifications: false,
      profile_visibility: 'public',
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPreferences,
    });

    const { result } = renderHook(() => usePreferences('123'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.preferences).toEqual(mockPreferences);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    const { result } = renderHook(() => usePreferences('123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch preferences');
  });

  it('should update preferences', async () => {
    const initialPreferences = {
      user_id: '123',
      theme: 'light',
    };
    const updatedPreferences = {
      user_id: '123',
      theme: 'dark',
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => initialPreferences,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => updatedPreferences,
      });

    const { result } = renderHook(() => usePreferences('123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updatePreferences({ theme: 'dark' });
    });

    expect(result.current.preferences?.theme).toBe('dark');
  });
});
