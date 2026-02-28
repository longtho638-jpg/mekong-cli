import * as yaml from 'yaml';
import * as fs from 'fs';
import * as path from 'path';
import { IConfig } from '../interfaces/IConfig';
import * as dotenv from 'dotenv';

import { logger } from './logger';

// Load environment variables securely
dotenv.config();

export class ConfigLoader {
  private static config: IConfig;

  static load(configPath: string = 'config/default.yaml'): IConfig {
    if (this.config) return this.config;

    try {
      const file = fs.readFileSync(path.resolve(process.cwd(), configPath), 'utf8');
      this.config = yaml.parse(file) as IConfig;

      // Override with env vars if needed
      const apiKey = process.env.EXCHANGE_API_KEY || process.env.API_KEY;
      const apiSecret = process.env.EXCHANGE_SECRET || process.env.API_SECRET;
      if (apiKey) this.config.exchange.apiKey = apiKey;
      if (apiSecret) this.config.exchange.secret = apiSecret;

      // Strict validation
      if (!this.config.exchange.apiKey || this.config.exchange.apiKey === 'YOUR_API_KEY' || this.config.exchange.apiKey === '') {
        throw new Error('STRICT VALIDATION FAILED: Exchange API Key is missing or default');
      }
      if (!this.config.exchange.secret || this.config.exchange.secret === 'YOUR_API_SECRET' || this.config.exchange.secret === '') {
        throw new Error('STRICT VALIDATION FAILED: Exchange API Secret is missing or default');
      }

      return this.config;
    } catch (e) {
      logger.error(`Failed to load config from ${configPath}: ${e instanceof Error ? e.message : String(e)}`);
      throw e;
    }
  }

  static get(): IConfig {
    if (!this.config) {
      return this.load();
    }
    return this.config;
  }
}
