/**
 * DashboardIntegration — Exposes WebSocket feed for antibot status
 * Provides exchange health, event timeline, active defenses, manual overrides
 */

import { EventEmitter } from 'events';
import {
  ActionRecord,
  DetectionResult,
  ExchangeHealth,
} from './antibot-config-types';
import { Coordinator } from './coordinator';

/** Dashboard message types sent over WebSocket */
export type DashboardMessageType =
  | 'health_update'
  | 'detection'
  | 'action'
  | 'status'
  | 'manual_override';

/** Dashboard WebSocket message */
export interface DashboardMessage {
  type: DashboardMessageType;
  timestamp: number;
  data: unknown;
}

/** Manual override commands */
export type OverrideCommand =
  | 'rotateProxy'
  | 'pauseSymbol'
  | 'pauseGlobal'
  | 'resumeSymbol'
  | 'resumeGlobal'
  | 'forceStatus';

/** Manual override request */
export interface OverrideRequest {
  command: OverrideCommand;
  exchange: string;
  symbol?: string;
  apiKey?: string;
}

/**
 * DashboardIntegration — Bridges coordinator with dashboard WebSocket
 */
export class DashboardIntegration extends EventEmitter {
  private readonly coordinator: Coordinator;
  private readonly apiKey: string;
  private readonly messageHistory: DashboardMessage[] = [];
  private readonly maxHistory = 200;
  private healthUpdateInterval: ReturnType<typeof setInterval> | null = null;

  constructor(coordinator: Coordinator, apiKey: string = 'default-api-key') {
    super();
    this.coordinator = coordinator;
    this.apiKey = apiKey;

    // Subscribe to coordinator events
    this.coordinator.on('detection', (detection: DetectionResult) => {
      this.broadcast({
        type: 'detection',
        timestamp: Date.now(),
        data: detection,
      });
    });

    this.coordinator.on('action', (action: ActionRecord) => {
      this.broadcast({
        type: 'action',
        timestamp: Date.now(),
        data: action,
      });
    });
  }

  /** Start periodic health broadcasts */
  startHealthBroadcast(intervalMs: number = 5000): void {
    if (this.healthUpdateInterval) return;

    this.healthUpdateInterval = setInterval(() => {
      const health = this.coordinator.getAllExchangeHealth();
      this.broadcast({
        type: 'health_update',
        timestamp: Date.now(),
        data: health,
      });
    }, intervalMs);
  }

  /** Stop health broadcasts */
  stopHealthBroadcast(): void {
    if (this.healthUpdateInterval) {
      clearInterval(this.healthUpdateInterval);
      this.healthUpdateInterval = null;
    }
  }

  /** Handle manual override from dashboard */
  handleOverride(request: OverrideRequest): {
    success: boolean;
    message: string;
  } {
    // API key validation
    if (request.apiKey !== this.apiKey) {
      return { success: false, message: 'Invalid API key' };
    }

    const result = this.executeOverride(request);

    this.broadcast({
      type: 'manual_override',
      timestamp: Date.now(),
      data: { request: { ...request, apiKey: undefined }, result },
    });

    return result;
  }

  /** Get current full status snapshot for new WebSocket connections */
  getSnapshot(): {
    health: Record<string, ExchangeHealth>;
    status: ReturnType<Coordinator['getStatus']>;
    recentMessages: DashboardMessage[];
  } {
    return {
      health: this.coordinator.getAllExchangeHealth(),
      status: this.coordinator.getStatus(),
      recentMessages: this.messageHistory.slice(-50),
    };
  }

  /** Get message history */
  getMessageHistory(limit: number = 50): DashboardMessage[] {
    return this.messageHistory.slice(-limit);
  }

  /** Cleanup resources */
  destroy(): void {
    this.stopHealthBroadcast();
    this.removeAllListeners();
  }

  /** Broadcast a message to all connected clients */
  private broadcast(message: DashboardMessage): void {
    this.messageHistory.push(message);
    if (this.messageHistory.length > this.maxHistory) {
      this.messageHistory.splice(0, this.messageHistory.length - this.maxHistory);
    }
    this.emit('message', message);
  }

  /** Execute override command */
  private executeOverride(request: OverrideRequest): {
    success: boolean;
    message: string;
  } {
    switch (request.command) {
      case 'rotateProxy':
        this.emit('override:rotateProxy', { exchange: request.exchange });
        return { success: true, message: `Proxy rotated for ${request.exchange}` };

      case 'pauseSymbol':
        if (!request.symbol) {
          return { success: false, message: 'Symbol required for pauseSymbol' };
        }
        this.emit('override:pauseSymbol', {
          exchange: request.exchange,
          symbol: request.symbol,
        });
        return {
          success: true,
          message: `Paused ${request.symbol} on ${request.exchange}`,
        };

      case 'pauseGlobal':
        this.emit('override:pauseGlobal', { exchange: request.exchange });
        return {
          success: true,
          message: `Global pause on ${request.exchange}`,
        };

      case 'resumeSymbol':
        if (!request.symbol) {
          return { success: false, message: 'Symbol required for resumeSymbol' };
        }
        this.emit('override:resumeSymbol', {
          exchange: request.exchange,
          symbol: request.symbol,
        });
        return {
          success: true,
          message: `Resumed ${request.symbol} on ${request.exchange}`,
        };

      case 'resumeGlobal':
        this.emit('override:resumeGlobal', { exchange: request.exchange });
        return {
          success: true,
          message: `Global resume on ${request.exchange}`,
        };

      case 'forceStatus':
        this.broadcast({
          type: 'status',
          timestamp: Date.now(),
          data: this.coordinator.getStatus(),
        });
        return { success: true, message: 'Status broadcast sent' };

      default:
        return { success: false, message: `Unknown command: ${request.command}` };
    }
  }
}
