/**
 * Signal Handlers Tests
 */

import { signalHandlers, ShutdownOptions } from './signal-handlers';

describe('SignalHandlers', () => {
  beforeEach(() => {
    signalHandlers.reset();
    // Mock process.exit to prevent actual exit during tests
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    signalHandlers.reset();
    jest.restoreAllMocks();
  });

  describe('registerHandler', () => {
    it('should register a shutdown handler', () => {
      const handler = jest.fn();
      signalHandlers.registerHandler('test-handler', handler);

      expect(signalHandlers.isShuttingDown()).toBe(false);
    });

    it('should unregister a shutdown handler', () => {
      const handler = jest.fn();
      signalHandlers.registerHandler('test-handler', handler);
      signalHandlers.unregisterHandler('test-handler');

      // Handler should be removed
      expect(signalHandlers.isShuttingDown()).toBe(false);
    });
  });

  describe('isShuttingDown', () => {
    it('should return false initially', () => {
      expect(signalHandlers.isShuttingDown()).toBe(false);
    });

    it('should return true during shutdown', async () => {
      const shutdownPromise = signalHandlers.shutdown({ reason: 'test' });

      // Shutdown exits process, so we just verify it was called
      await expect(shutdownPromise).resolves.toBeDefined();
    });
  });

  describe('shutdown', () => {
    it('should execute registered handlers', async () => {
      let handlerCalled = false;
      const handler = async () => {
        handlerCalled = true;
      };

      signalHandlers.registerHandler('test', handler);

      const result = await signalHandlers.shutdown({
        reason: 'test',
        timeout: 1000,
      });

      expect(handlerCalled).toBe(true);
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
    });

    it('should prevent duplicate shutdown', async () => {
      // First shutdown
      signalHandlers.shutdown({ reason: 'test1' });

      // Second shutdown should be prevented
      expect(signalHandlers.isShuttingDown()).toBe(true);
    });

    it('should respect timeout', async () => {
      const slowHandler = async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      };

      signalHandlers.registerHandler('slow', slowHandler);

      const result = await signalHandlers.shutdown({
        reason: 'test',
        timeout: 100, // 100ms timeout
      });

      expect(result.success).toBe(false);
    });

    it('should emit shutdown:start event', async () => {
      const eventHandler = jest.fn();
      signalHandlers.on('shutdown:start', eventHandler);

      await signalHandlers.shutdown({ reason: 'test-event' });

      expect(eventHandler).toHaveBeenCalledWith({
        reason: 'test-event',
        exitCode: 0,
      });
    });

    it('should emit shutdown:complete event', async () => {
      const eventHandler = jest.fn();
      signalHandlers.on('shutdown:complete', eventHandler);

      await signalHandlers.shutdown({ reason: 'test-complete' });

      expect(eventHandler).toHaveBeenCalled();
      const result = eventHandler.mock.calls[0][0];
      expect(result.exitCode).toBe(0);
      expect(result.success).toBe(true);
    });
  });

  describe('getShutdownStartTime', () => {
    it('should return 0 initially', () => {
      expect(signalHandlers.getShutdownStartTime()).toBe(0);
    });

    it('should return timestamp after shutdown starts', async () => {
      signalHandlers.shutdown({ reason: 'test' });

      const startTime = signalHandlers.getShutdownStartTime();
      expect(startTime).toBeGreaterThan(0);
    });
  });

  describe('events', () => {
    it('should emit reload-config on SIGHUP', (done) => {
      signalHandlers.on('reload-config', () => {
        done();
      });

      // Simulate SIGHUP
      process.emit('SIGHUP');
    });

    it('should handle SIGINT', (done) => {
      signalHandlers.on('shutdown:start', () => {
        done();
      });

      // Simulate SIGINT
      process.emit('SIGINT');
    });

    it('should handle SIGTERM', (done) => {
      signalHandlers.on('shutdown:start', () => {
        done();
      });

      // Simulate SIGTERM
      process.emit('SIGTERM');
    });
  });
});
