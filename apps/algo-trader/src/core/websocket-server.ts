import { WebSocketServer, WebSocket } from 'ws';
import { z } from 'zod';

function getWsPort(): number { return parseInt(process.env.WS_PORT ?? '3001', 10); }
function getAuthToken(): string { return process.env.WS_AUTH_TOKEN ?? ''; }
function getMaxConns(): number { return parseInt(process.env.WS_MAX_CONNECTIONS ?? '50', 10); }
const HEARTBEAT_INTERVAL_MS = 30_000;

type Channel = 'tick' | 'signal' | 'health' | 'spread' | 'pnl';
const VALID_CHANNELS: Channel[] = ['tick', 'signal', 'health', 'spread', 'pnl'];

const ClientMsgSchema = z.object({
  action: z.enum(['subscribe', 'unsubscribe']),
  channel: z.enum(['tick', 'signal', 'health', 'spread', 'pnl']),
});

interface AliveSocket extends WebSocket {
  isAlive: boolean;
  subscriptions: Set<Channel>;
  authenticated: boolean;
}

let wss: WebSocketServer | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let activePort = 0;

function send(socket: WebSocket, data: unknown): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

function setupHeartbeat(socket: AliveSocket): void {
  socket.isAlive = true;
  socket.on('pong', () => { socket.isAlive = true; });
}

export function broadcastToChannel(channel: Channel, data: unknown): void {
  if (!wss) return;
  const payload = JSON.stringify({ channel, data, ts: Date.now() });
  for (const client of wss.clients) {
    const s = client as AliveSocket;
    if (s.readyState === WebSocket.OPEN && s.authenticated && s.subscriptions.has(channel)) {
      s.send(payload);
    }
  }
}

export function getActivePort(): number { return activePort; }

export async function startWsServer(portOverride?: number): Promise<number> {
  if (wss) await stopWsServer();
  const port = portOverride ?? getWsPort();
  return new Promise((resolve, reject) => {
    wss = new WebSocketServer({ port });

    wss.on('error', reject);

    wss.on('listening', () => {
      const addr = wss!.address();
      activePort = (addr && typeof addr === 'object') ? addr.port : port;
      process.stdout.write(`WS server listening on :${activePort}\n`);

      heartbeatTimer = setInterval(() => {
        if (!wss) return;
        for (const client of wss.clients) {
          const s = client as AliveSocket;
          if (!s.isAlive) { s.terminate(); continue; }
          s.isAlive = false;
          s.ping();
        }
      }, HEARTBEAT_INTERVAL_MS);

      resolve(activePort);
    });

    wss.on('connection', (rawSocket, req) => {
      const socket = rawSocket as AliveSocket;
      socket.isAlive = true;
      socket.subscriptions = new Set();
      socket.authenticated = false;

      if (wss!.clients.size > getMaxConns()) {
        send(socket, { error: 'max_connections_reached' });
        socket.terminate();
        return;
      }

      const url = new URL(req.url ?? '/', `http://localhost:${activePort}`);
      const token = url.searchParams.get('token') ?? '';
      const authToken = getAuthToken();
      if (authToken && token !== authToken) {
        send(socket, { error: 'unauthorized' });
        socket.terminate();
        return;
      }
      socket.authenticated = true;

      setupHeartbeat(socket);
      send(socket, { type: 'connected', channels: VALID_CHANNELS });

      socket.on('message', (raw) => {
        let parsed: unknown;
        try { parsed = JSON.parse(raw.toString()); } catch {
          send(socket, { error: 'invalid_json' });
          return;
        }

        const result = ClientMsgSchema.safeParse(parsed);
        if (!result.success) {
          send(socket, { error: 'invalid_message', details: result.error.issues });
          return;
        }

        const { action, channel } = result.data;
        if (action === 'subscribe') {
          socket.subscriptions.add(channel);
          send(socket, { type: 'subscribed', channel });
        } else {
          socket.subscriptions.delete(channel);
          send(socket, { type: 'unsubscribed', channel });
        }
      });
    });
  });
}

export interface SpreadBroadcastData {
  symbol: string;
  spreadPct: number;
  buyExchange: string;
  sellExchange: string;
  timestamp: number;
}

export function broadcastSpread(data: SpreadBroadcastData): void {
  broadcastToChannel('spread', data);
}

export interface PnlBroadcastData {
  tenantId: string;
  totalPnl: number;
  realizedPnl: number;
  unrealizedPnl: number;
  openPositions: number;
  equity: number;
  computedAt: string;
}

export function broadcastPnl(data: PnlBroadcastData): void {
  broadcastToChannel('pnl', data);
}

export function stopWsServer(): Promise<void> {
  return new Promise((resolve) => {
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
    if (!wss) { resolve(); return; }
    const server = wss;
    wss = null;
    activePort = 0;
    for (const client of server.clients) { client.terminate(); }
    server.close(() => resolve());
  });
}
