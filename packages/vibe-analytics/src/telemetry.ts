/**
 * 📊 VIBE Analytics - Telemetry Engine
 */
import { VibeEvent, VibeEventPayload } from './types';
import { getSessionId } from './session';

export class VibeTelemetry {
  private queue: VibeEventPayload[] = [];
  private userId?: string;
  private flushInterval: number = 5000;
  private endpoint?: string;

  constructor() {
    if (typeof window !== "undefined") {
      setInterval(() => this.flush(), this.flushInterval);
    }
  }

  setUser(userId: string): void { this.userId = userId; }
  setEndpoint(url: string): void { this.endpoint = url; }

  track(event: VibeEvent, metadata?: Record<string, unknown>): void {
    const payload: VibeEventPayload = { event, sessionId: getSessionId(), userId: this.userId, timestamp: Date.now(), metadata };
    this.queue.push(payload);
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0 || !this.endpoint) return;
    const batch = [...this.queue];
    this.queue = [];
    try {
      await fetch(this.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ events: batch }) });
    } catch { this.queue.push(...batch); }
  }
}

export const vibeTelemetry = new VibeTelemetry();
