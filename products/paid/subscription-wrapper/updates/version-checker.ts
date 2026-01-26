import axios from 'axios';

export interface IUpdateInfo {
  version: string;
  url: string;
  signature: string;
  releaseDate: string;
  critical: boolean;
}

export class VersionChecker {
  private readonly UPDATE_SERVER_URL: string;

  constructor(serverUrl: string) {
    this.UPDATE_SERVER_URL = serverUrl;
  }

  /**
   * Checks for available updates.
   * Returns update info if a newer version is available, otherwise null.
   */
  async checkForUpdates(currentVersion: string): Promise<IUpdateInfo | null> {
    try {
      const response = await axios.get(`${this.UPDATE_SERVER_URL}/updates/latest`);
      const latest: IUpdateInfo = response.data;

      if (this.isNewer(latest.version, currentVersion)) {
        return latest;
      }
      return null;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return null;
    }
  }

  /**
   * Compares two semantic version strings.
   * Returns true if v1 > v2.
   */
  private isNewer(v1: string, v2: string): boolean {
    const p1 = v1.split('.').map(Number);
    const p2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
      const n1 = p1[i] || 0;
      const n2 = p2[i] || 0;
      if (n1 > n2) return true;
      if (n1 < n2) return false;
    }
    return false;
  }
}
