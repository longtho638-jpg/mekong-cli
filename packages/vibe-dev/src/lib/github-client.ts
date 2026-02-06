import { execSync } from 'child_process';
import { GitHubViewerResponse } from '../types/github.types';

export class GitHubClient {
  private token: string | null = null;
  private readonly apiUrl = 'https://api.github.com/graphql';

  constructor(token?: string) {
    if (token) {
      this.token = token;
    }
  }

  /**
   * authenticates the client using environment variable or gh CLI
   */
  public async authenticate(): Promise<void> {
    if (this.token) return;

    // 1. Try environment variable
    if (process.env.GITHUB_TOKEN) {
      this.token = process.env.GITHUB_TOKEN;
      return;
    }

    // 2. Try gh CLI
    try {
      const output = execSync('gh auth token', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
      this.token = output.trim();
    } catch (error) {
      console.warn('Failed to retrieve token from gh CLI. Make sure gh is installed and authenticated.');
      throw new Error('Authentication failed: No GITHUB_TOKEN provided and gh CLI lookup failed.');
    }
  }

  /**
   * Executes a GraphQL query against the GitHub API
   */
  public async graphql<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
    if (!this.token) {
      await this.authenticate();
    }

    if (!this.token) {
       throw new Error('Client is not authenticated.');
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'mekong-cli-vibe-dev'
        },
        body: JSON.stringify({ query, variables })
      });

      if (!response.ok) {
        throw new Error(`Network error: ${response.status} ${response.statusText}`);
      }

      const body = await response.json() as { data: T; errors?: any[] };

      if (body.errors && body.errors.length > 0) {
        const errorMessages = body.errors.map((e: any) => e.message).join(', ');
        throw new Error(`GraphQL Error: ${errorMessages}`);
      }

      return body.data;

    } catch (error) {
       if (error instanceof Error) {
         throw error;
       }
       throw new Error('Unknown error occurred during GraphQL request');
    }
  }

  /**
   * Verifies connection by fetching the authenticated viewer
   */
  public async getViewer(): Promise<GitHubViewerResponse['data']['viewer']> {
    const query = `
      query {
        viewer {
          login
          name
          id
        }
      }
    `;

    const data = await this.graphql<{ viewer: GitHubViewerResponse['data']['viewer'] }>(query);
    return data.viewer;
  }
}
