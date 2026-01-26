export interface NotificationConfig {
  endpoint: string;
  userId: string;
  wsEndpoint?: string;
  onNotification?: (notification: any) => void;
}

export class NotificationClient {
  private config: NotificationConfig;
  private ws: WebSocket | null = null;
  private listeners: ((notification: any) => void)[] = [];

  constructor(config: NotificationConfig) {
    this.config = config;
    if (config.onNotification) {
      this.listeners.push(config.onNotification);
    }
  }

  /**
   * Connect to the real-time WebSocket feed
   */
  public connect() {
    if (!this.config.userId) {
      console.warn('NotificationSDK: No userId provided. Cannot connect.');
      return;
    }

    // Determine WS URL if not provided (replace http with ws)
    const wsUrl = this.config.wsEndpoint ||
      this.config.endpoint.replace(/^http/, 'ws') + `/notifications/ws/${this.config.userId}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.debug('NotificationSDK: Connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notifyListeners(data);
      } catch (e) {
        console.error('NotificationSDK: Failed to parse message', e);
      }
    };

    this.ws.onclose = () => {
      console.debug('NotificationSDK: Disconnected. Reconnecting in 3s...');
      setTimeout(() => this.connect(), 3000);
    };
  }

  /**
   * Subscribe to incoming notifications
   */
  public on(callback: (notification: any) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners(data: any) {
    this.listeners.forEach(cb => cb(data));
  }

  /**
   * Fetch unread notifications
   */
  public async getUnread(limit = 10): Promise<any[]> {
    try {
      const res = await fetch(`${this.config.endpoint}/notifications/?user_id=${this.config.userId}&unread_only=true&limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return await res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  /**
   * Mark a notification as read
   */
  public async markAsRead(id: number): Promise<boolean> {
    try {
      const res = await fetch(`${this.config.endpoint}/notifications/${id}/read`, {
        method: 'PATCH'
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}
