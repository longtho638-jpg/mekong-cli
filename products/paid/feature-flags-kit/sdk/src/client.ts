import axios from 'axios';

export class FeatureFlagsClient {
  private baseUrl: string;
  private environment: string;
  private cache: Record<string, boolean> = {};

  constructor(baseUrl: string, environment: string) {
    this.baseUrl = baseUrl;
    this.environment = environment;
  }

  async fetchFlags(context: Record<string, any> = {}): Promise<void> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/v1/client/flags`, {
        environment: this.environment,
        context
      });
      this.cache = response.data;
    } catch (error) {
      console.error('Failed to fetch feature flags', error);
    }
  }

  isEnabled(flagKey: string, defaultValue: boolean = false): boolean {
    return this.cache[flagKey] ?? defaultValue;
  }

  getFlags(): Record<string, boolean> {
    return { ...this.cache };
  }
}
