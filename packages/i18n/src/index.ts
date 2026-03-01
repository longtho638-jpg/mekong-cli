export * from './types.js';
export * from './locales/index.js';
// Hooks and other exports will be added as they are implemented

/** Minimal logger for i18n scripts */
export const logger = {
  info: (msg: string, meta?: Record<string, unknown>): void => {
    console.log(`[INFO] ${msg}`, meta ?? '');
  },
  debug: (msg: string, meta?: Record<string, unknown>): void => {
    console.debug(`[DEBUG] ${msg}`, meta ?? '');
  },
  warn: (msg: string, meta?: Record<string, unknown>): void => {
    console.warn(`[WARN] ${msg}`, meta ?? '');
  },
  error: (msg: string, meta?: Record<string, unknown>): void => {
    console.error(`[ERROR] ${msg}`, meta ?? '');
  },
};
