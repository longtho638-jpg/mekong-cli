import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { createLogger, createSilentLogger } from './logger.js';

describe('logger', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleLogSpy: MockInstance<any[], void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleWarnSpy: MockInstance<any[], void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleErrorSpy: MockInstance<any[], void>;
  
  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('createLogger', () => {
    it('should create a logger with default options', () => {
      const logger = createLogger();
      
      expect(logger).toHaveProperty('debug');
      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('error');
    });
    
    it('should log info messages', () => {
      const logger = createLogger();
      logger.info('test message');
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });
    
    it('should not log debug messages by default', () => {
      const logger = createLogger();
      logger.debug('debug message');
      
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
    
    it('should log debug messages when verbose is true', () => {
      const logger = createLogger({ verbose: true });
      logger.debug('debug message');
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });
    
    it('should log warn messages', () => {
      const logger = createLogger();
      logger.warn('warning message');
      
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
    
    it('should log error messages', () => {
      const logger = createLogger();
      logger.error('error message');
      
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
    
    it('should include metadata when provided', () => {
      const logger = createLogger();
      const meta = { key: 'value' };
      logger.info('test message', meta);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[mekong]'),
        expect.stringContaining('key')
      );
    });
    
    it('should use custom prefix', () => {
      const logger = createLogger({ prefix: '[custom]' });
      logger.info('test message');
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[custom]'),
        ''
      );
    });
  });
  
  describe('createSilentLogger', () => {
    it('should not log anything', () => {
      const logger = createSilentLogger();
      
      logger.info('test');
      logger.debug('test');
      logger.warn('test');
      logger.error('test');
      
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
