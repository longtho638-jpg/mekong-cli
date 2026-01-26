import axios from 'axios';

export interface IChangelogEntry {
  version: string;
  date: string;
  changes: string[];
  critical: boolean;
}

export class ChangelogFetcher {
  private readonly BASE_URL: string;

  constructor(baseUrl: string) {
    this.BASE_URL = baseUrl;
  }

  async getChangelog(version?: string): Promise<IChangelogEntry | IChangelogEntry[]> {
    try {
      const url = version
        ? `${this.BASE_URL}/changelog/${version}`
        : `${this.BASE_URL}/changelog`;

      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch changelog:', error);
      throw new Error('Changelog unavailable');
    }
  }

  parseMarkdown(markdown: string): IChangelogEntry {
    // Simple parser mock
    return {
      version: '1.0.0',
      date: new Date().toISOString(),
      changes: markdown.split('\n').filter(line => line.startsWith('- ')).map(line => line.substring(2)),
      critical: markdown.includes('CRITICAL'),
    };
  }
}
