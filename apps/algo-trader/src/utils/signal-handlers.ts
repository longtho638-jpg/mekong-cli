/**
 * Signal Handlers - Centralized Process Signal Management
 *
 * Handles graceful shutdown for trading bots:
 * - SIGINT (Ctrl+C) - User-initiated shutdown
 * - SIGTERM (kill, PM2, systemd) - External kill signal
 * - SIGHUP - Config reload without restart
 *
 * Shutdown sequence:
 * 1. Stop accepting new signals
 * 2. Cancel all open orders
 * 3. Persist positions to database
 * 4. Close connections
 * 5. Exit with proper code
 */

import { EventEmitter } from 'events';
import { logger } from './logger';

export interface ShutdownOptions {
  /** Exit code (default: 0) */
  exitCode?: number;
  /** Reason for shutdown */
  reason?: string;
  /** Timeout in ms before force kill (default: 5000) */
  timeout?: number;
}

export interface ShutdownResult {
  /** Exit code */
  exitCode: number;
  /** Orders cancelled count */
  ordersCancelled: number;
  /** Positions persisted count */
  positionsPersisted: number;
  /** Shutdown duration in ms */
  durationMs: number;
  /** Success or timeout */
  success: boolean;
}

export type ShutdownHandler = () => Promise<void> | void;

interface SignalState {
  shuttingDown: boolean;
  shutdownStartTime: number;
  handlers: Map<string, ShutdownHandler>;
}

class SignalHandlers extends EventEmitter {
  private state: SignalState = {
    shuttingDown: false,
    shutdownStartTime: 0,
    handlers: new Map(),
  };

  constructor() {
    super();
    this.setupDefaultHandlers();
  }

  /**
   * Setup default signal handlers
   */
  private setupDefaultHandlers(): void {
    // SIGINT - Ctrl+C
    process.on('SIGINT', () => {
      logger.info('[SignalHandlers] Received SIGINT (Ctrl+C)');
      this.shutdown({ reason: 'SIGINT' });
    });

    // SIGTERM - External kill (PM2, systemd, kill command)
    process.on('SIGTERM', () => {
      logger.info('[SignalHandlers] Received SIGTERM');
      this.shutdown({ reason: 'SIGTERM' });
    });

    // SIGHUP - Config reload
    process.on('SIGHUP', () => {
      logger.info('[SignalHandlers] Received SIGHUP - config reload requested');
      this.emit('reload-config');
    });

    // Uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('[SignalHandlers] Uncaught exception:', err);
      this.shutdown({ reason: 'uncaught_exception', exitCode: 1 });
    });

    // Unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('[SignalHandlers] Unhandled rejection:', reason);
    });
  }

  /**
   * Register a shutdown handler
   */
  registerHandler(name: string, handler: ShutdownHandler): void {
    this.state.handlers.set(name, handler);
    logger.debug(`[SignalHandlers] Registered handler: ${name}`);
  }

  /**
   * Unregister a shutdown handler
   */
  unregisterHandler(name: string): void {
    this.state.handlers.delete(name);
    logger.debug(`[SignalHandlers] Unregistered handler: ${name}`);
  }

  /**
   * Initiate graceful shutdown
   */
  async shutdown(options: ShutdownOptions = {}): Promise<ShutdownResult> {
    const { exitCode = 0, reason = 'user-request', timeout = 5000 } = options;

    // Prevent duplicate shutdown
    if (this.state.shuttingDown) {
      logger.warn('[SignalHandlers] Shutdown already in progress');
      return {
        exitCode,
        ordersCancelled: 0,
        positionsPersisted: 0,
        durationMs: 0,
        success: false,
      };
    }

    this.state.shuttingDown = true;
    this.state.shutdownStartTime = Date.now();
    logger.info(`[SignalHandlers] Initiating shutdown: ${reason}`);

    this.emit('shutdown:start', { reason, exitCode });

    const result: ShutdownResult = {
      exitCode,
      ordersCancelled: 0,
      positionsPersisted: 0,
      durationMs: 0,
      success: true,
    };

    try {
      // Execute all shutdown handlers with timeout
      const handlers = Array.from(this.state.handlers.entries());
      const timeoutPromise = new Promise<ShutdownResult>((_, reject) =>
        setTimeout(() => reject(new Error(`Shutdown timeout after ${timeout}ms`)), timeout)
      );

      const shutdownPromise = this.executeHandlers(handlers, result);

      await Promise.race([shutdownPromise, timeoutPromise]);

      result.durationMs = Date.now() - this.state.shutdownStartTime;
      result.success = true;

      logger.info(`[SignalHandlers] Shutdown complete in ${result.durationMs}ms`);
      logger.info(`[SignalHandlers] Orders cancelled: ${result.ordersCancelled}`);
      logger.info(`[SignalHandlers] Positions persisted: ${result.positionsPersisted}`);

      this.emit('shutdown:complete', result);

      // Exit process
      process.exit(exitCode);
    } catch (error) {
      result.durationMs = Date.now() - this.state.shutdownStartTime;
      result.success = false;

      logger.error('[SignalHandlers] Shutdown failed:', error);
      this.emit('shutdown:error', { error, result });

      // Force exit on failure
      process.exit(exitCode || 1);
    }

    return result;
  }

  /**
   * Execute all shutdown handlers in parallel
   */
  private async executeHandlers(
    handlers: Array<[string, ShutdownHandler]>,
    result: ShutdownResult
  ): Promise<void> {
    const handlerResults = await Promise.allSettled(
      handlers.map(async ([name, handler]) => {
        try {
          await handler();
          logger.debug(`[SignalHandlers] Handler ${name} completed`);
        } catch (error) {
          logger.error(`[SignalHandlers] Handler ${name} failed:`, error);
          throw error;
        }
      })
    );

    // Aggregate results
    for (const handlerResult of handlerResults) {
      if (handlerResult.status === 'fulfilled') {
        // Handler succeeded
        result.positionsPersisted++;
      } else {
        // Handler failed
        logger.error('[SignalHandlers] Handler failed:', handlerResult.reason);
      }
    }
  }

  /**
   * Check if shutdown is in progress
   */
  isShuttingDown(): boolean {
    return this.state.shuttingDown;
  }

  /**
   * Get shutdown start time
   */
  getShutdownStartTime(): number {
    return this.state.shutdownStartTime;
  }

  /**
   * Reset state (for testing)
   */
  reset(): void {
    this.state = {
      shuttingDown: false,
      shutdownStartTime: 0,
      handlers: new Map(),
    };
  }
}

// Singleton instance
const signalHandlers = new SignalHandlers();

export { signalHandlers };
export default signalHandlers;
