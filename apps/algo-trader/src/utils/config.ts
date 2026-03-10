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
  private static validated = false;

  static load(configPath: string = 'config/default.yaml', skipValidation = false): IConfig {
    if (this.config) return this.config;

    try {
      const file = fs.readFileSync(path.resolve(process.cwd(), configPath), 'utf8');
      this.config = yaml.parse(file) as IConfig;

      // Override with env vars if needed
      const apiKey = process.env.EXCHANGE_API_KEY || process.env.API_KEY;
      const apiSecret = process.env.EXCHANGE_SECRET || process.env.API_SECRET;
      if (apiKey) this.config.exchange.apiKey = apiKey;
      if (apiSecret) this.config.exchange.secret = apiSecret;

      // Validate API keys only for live trading (not for backtest)
      if (!skipValidation && !this.validated) {
        const isLiveTrading = process.env.ENABLE_LIVE_TRADING === 'true';
        if (isLiveTrading) {
          if (!this.config.exchange.apiKey || this.config.exchange.apiKey === 'YOUR_API_KEY' || this.config.exchange.apiKey === '') {
            throw new Error('LIVE TRADING VALIDATION FAILED: Exchange API Key is missing or default. Set EXCHANGE_API_KEY in .env');
          }
          if (!this.config.exchange.secret || this.config.exchange.secret === 'YOUR_API_SECRET' || this.config.exchange.secret === '') {
            throw new Error('LIVE TRADING VALIDATION FAILED: Exchange API Secret is missing or default. Set EXCHANGE_SECRET in .env');
          }
          this.validated = true;
        }
      }

      return this.config;
    } catch (e) {
      logger.error(`Failed to load config from ${configPath}: ${e instanceof Error ? e.message : String(e)}`);
      throw e;
    }
  }

  static get(skipValidation = false): IConfig {
    if (!this.config) {
      return this.load(undefined, skipValidation);
    }
    return this.config;
  }

  static hasValidApiKeys(): boolean {
    if (!this.config) return false;
    return !!(
      this.config.exchange.apiKey &&
      this.config.exchange.secret &&
      this.config.exchange.apiKey !== 'YOUR_API_KEY' &&
      this.config.exchange.secret !== 'YOUR_API_SECRET'
    );
  }
}
