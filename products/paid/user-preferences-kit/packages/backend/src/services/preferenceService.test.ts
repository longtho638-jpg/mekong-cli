
import { PreferenceService } from './preferenceService';
import { DEFAULT_PREFERENCE_SCHEMA } from '@antigravity/preferences-types';

// Mock the DB module
jest.mock('../db', () => ({
  query: jest.fn(),
  getClient: jest.fn(() => ({
    query: jest.fn(),
    release: jest.fn(),
  })),
}));

import { query } from '../db';

describe('PreferenceService', () => {
  let service: PreferenceService;
  const mockQuery = query as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PreferenceService();
  });

  it('should initialize with default schema', () => {
    expect(service.getSchema()).toEqual(DEFAULT_PREFERENCE_SCHEMA);
  });

  it('should return default preferences when no user preferences exist', async () => {
    // Mock DB returning empty rows
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const prefs = await service.getUserPreferences('user-123');

    // Should contain defaults
    expect(prefs['theme']).toBe('system');
    expect(prefs['notifications.email']).toBe(true);
  });

  it('should merge user preferences with defaults', async () => {
    // Mock DB returning one custom preference
    mockQuery.mockResolvedValueOnce({
      rows: [{ key: 'theme', value: 'dark' }],
    });

    const prefs = await service.getUserPreferences('user-123');

    expect(prefs['theme']).toBe('dark'); // User override
    expect(prefs['notifications.email']).toBe(true); // Default
  });

  it('should validate enum values during update', async () => {
    await expect(service.updateUserPreference('user-123', 'theme', 'invalid-theme'))
      .rejects
      .toThrow('Invalid value for theme');
  });

  it('should update valid preference', async () => {
    mockQuery.mockResolvedValueOnce({}); // Success insert

    await service.updateUserPreference('user-123', 'theme', 'light');

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO user_preferences'),
      ['user-123', 'theme', 'light']
    );
  });
});
