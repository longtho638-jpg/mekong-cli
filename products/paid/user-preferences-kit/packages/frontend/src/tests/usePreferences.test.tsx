
import { renderHook, act, waitFor } from '@testing-library/react';
import { PreferenceProvider, usePreferences } from '../context/PreferenceContext';
import React from 'react';

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

// Mock fetch
global.fetch = jest.fn();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <PreferenceProvider userId="test-user" apiEndpoint="http://localhost:3000">
    {children}
  </PreferenceProvider>
);

describe('usePreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  it('should return initial loading state', async () => {
    // We mock fetch to never resolve immediately or checking the initial state before wait
    const { result } = renderHook(() => usePreferences(), { wrapper });
    expect(result.current.loading).toBe(true);

    // Wait for the effect to finish to avoid "act" warnings
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('should fetch preferences and schema on mount', async () => {
    const mockPreferences = { 'theme': 'dark' };
    const mockSchema = [{ key: 'theme', type: 'string', defaultValue: 'light' }];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreferences,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSchema,
      });

    const { result } = renderHook(() => usePreferences(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.preferences).toEqual(mockPreferences);
    expect(result.current.schema).toEqual(mockSchema);
  });

  it('should update preference optimisticly', async () => {
    const { result } = renderHook(() => usePreferences(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    await act(async () => {
      await result.current.updatePreference('theme', 'light');
    });

    expect(result.current.preferences['theme']).toBe('light');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/preferences/theme'),
      expect.objectContaining({ method: 'PATCH' })
    );
  });
});
