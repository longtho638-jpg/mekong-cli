import { VersionChecker, IUpdateInfo } from '../updates/version-checker';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('VersionChecker', () => {
  let checker: VersionChecker;
  const UPDATE_URL = 'https://updates.example.com';

  beforeEach(() => {
    checker = new VersionChecker(UPDATE_URL);
  });

  it('should return update info when newer version is available', async () => {
    const mockUpdate: IUpdateInfo = {
      version: '2.0.0',
      url: 'http://download/v2',
      signature: 'sig',
      releaseDate: '2026-01-01',
      critical: false
    };

    mockedAxios.get.mockResolvedValue({ data: mockUpdate });

    const result = await checker.checkForUpdates('1.0.0');
    expect(result).toEqual(mockUpdate);
  });

  it('should return null when current version is newer', async () => {
    const mockUpdate: IUpdateInfo = {
      version: '1.0.0',
      url: 'http://download/v1',
      signature: 'sig',
      releaseDate: '2025-01-01',
      critical: false
    };

    mockedAxios.get.mockResolvedValue({ data: mockUpdate });

    const result = await checker.checkForUpdates('2.0.0');
    expect(result).toBeNull();
  });

  it('should return null when versions are equal', async () => {
    const mockUpdate: IUpdateInfo = {
      version: '1.5.0',
      url: 'http://download/v1.5',
      signature: 'sig',
      releaseDate: '2025-06-01',
      critical: false
    };

    mockedAxios.get.mockResolvedValue({ data: mockUpdate });

    const result = await checker.checkForUpdates('1.5.0');
    expect(result).toBeNull();
  });

  it('should handle network errors gracefully', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network error'));

    const result = await checker.checkForUpdates('1.0.0');
    expect(result).toBeNull();
  });
});
