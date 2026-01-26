import { io, Socket } from 'socket.io-client';

// Mock WebSocket implementation since we don't have a real server
class MockSocket {
  listeners: Record<string, Function[]> = {};
  connected = false;

  on(event: string, callback: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event: string, data: any) {
    // In a real app, this sends to server
    console.log(`[WS Emit] ${event}:`, data);
  }

  connect() {
    this.connected = true;
    console.log('[WS] Connected');

    // Simulate incoming data
    setInterval(() => {
      if (this.listeners['metrics']) {
        const metrics = {
          activeUsers: 120 + Math.floor(Math.random() * 20),
          revenue: 15430 + Math.floor(Math.random() * 100),
          serverLoad: 45 + Math.floor(Math.random() * 15)
        };
        this.listeners['metrics'].forEach(cb => cb(metrics));
      }
    }, 3000);
  }

  disconnect() {
    this.connected = false;
    console.log('[WS] Disconnected');
  }
}

let socket: MockSocket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = new MockSocket();
    socket.connect();
  }
  return socket;
};
