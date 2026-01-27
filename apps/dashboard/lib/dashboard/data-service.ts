export type WebSocketMessage = {
  type: 'update' | 'error' | 'connected';
  payload: any;
};

export type DashboardSubscription = {
  metric: string;
  callback: (data: any) => void;
};

export class DashboardDataService {
  private ws: WebSocket | null = null;
  private url: string;
  private subscriptions: Map<string, ((data: any) => void)[]> = new Map();
  private reconnectInterval: number = 3000;
  private maxReconnectAttempts: number = 5;
  private reconnectAttempts: number = 0;
  private isConnected: boolean = false;

  constructor(url: string) {
    this.url = url;
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('Dashboard WebSocket Connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.resubscribeAll();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      this.ws.onclose = () => {
        console.log('Dashboard WebSocket Closed');
        this.isConnected = false;
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('Dashboard WebSocket Error:', error);
      };

    } catch (e) {
      console.error('Failed to connect to WebSocket:', e);
      this.attemptReconnect();
    }
  }

  public subscribe(metric: string, callback: (data: any) => void) {
    if (!this.subscriptions.has(metric)) {
      this.subscriptions.set(metric, []);
      // Send subscribe message if connected
      if (this.isConnected && this.ws) {
        this.ws.send(JSON.stringify({ action: 'subscribe', metric }));
      }
    }

    this.subscriptions.get(metric)?.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(metric);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
        }
        if (callbacks.length === 0) {
          this.subscriptions.delete(metric);
          if (this.isConnected && this.ws) {
            this.ws.send(JSON.stringify({ action: 'unsubscribe', metric }));
          }
        }
      }
    };
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private handleMessage(message: WebSocketMessage) {
    if (message.type === 'update') {
      const { metric, value } = message.payload;
      const callbacks = this.subscriptions.get(metric);
      if (callbacks) {
        callbacks.forEach(cb => cb(value));
      }
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);
      console.log(`Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms...`);
      setTimeout(() => this.connect(), delay);
    } else {
      console.error('Max reconnect attempts reached. Dashboard real-time updates disabled.');
    }
  }

  private resubscribeAll() {
    if (this.ws && this.isConnected) {
      const metrics = Array.from(this.subscriptions.keys());
      if (metrics.length > 0) {
        // Bulk subscribe or individual
        metrics.forEach(metric => {
            this.ws?.send(JSON.stringify({ action: 'subscribe', metric }));
        });
      }
    }
  }
}

// Singleton instance (can be used directly or via a Context/Hook)
export const dashboardDataService = new DashboardDataService(
  process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/dashboard'
);
