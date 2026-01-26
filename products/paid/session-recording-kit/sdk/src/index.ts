import * as rrweb from 'rrweb';

interface Config {
  dsn: string;
  endpoint?: string;
  bufferSize?: number; // Number of events before sending
  flushInterval?: number; // MS before forcing send
}

class SessionRecorder {
  private config: Config;
  private events: any[] = [];
  private sessionId: string | null = null;
  private sequence: number = 0;
  private intervalId: any;
  private isRecording: boolean = false;

  constructor(config: Config) {
    this.config = {
      bufferSize: 50,
      flushInterval: 10000, // 10 seconds
      endpoint: 'http://localhost:8000',
      ...config
    };
  }

  public async start() {
    if (this.isRecording) return;

    try {
      // 1. Create Session
      await this.createSession();

      // 2. Start rrweb
      rrweb.record({
        emit: (event) => {
          this.events.push(event);
          if (this.events.length >= (this.config.bufferSize || 50)) {
            this.flush();
          }
        },
      });

      // 3. Start flush timer
      this.intervalId = setInterval(() => this.flush(), this.config.flushInterval);

      this.isRecording = true;
      console.log('Session recording started:', this.sessionId);
    } catch (err) {
      console.error('Failed to start session recording:', err);
    }
  }

  private async createSession() {
    const url = `${this.config.endpoint}/api/v1/sessions?dsn=${this.config.dsn}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_agent: navigator.userAgent,
        // user_id can be added later via identify() method if we add one
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    const data = await response.json();
    this.sessionId = data.id;
  }

  private async flush() {
    if (this.events.length === 0 || !this.sessionId) return;

    const chunk = this.events;
    this.events = []; // Clear buffer immediately
    const currentSequence = this.sequence++;

    try {
      const url = `${this.config.endpoint}/api/v1/sessions/${this.sessionId}/events?dsn=${this.config.dsn}`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: JSON.stringify(chunk),
          sequence: currentSequence
        })
      });
    } catch (err) {
      console.error('Failed to send session events:', err);
      // Ideally retrying or storing in localStorage for later
    }
  }
}

// Global instance
let recorder: SessionRecorder | null = null;

export function init(config: Config) {
  recorder = new SessionRecorder(config);
  recorder.start();
  return recorder;
}
