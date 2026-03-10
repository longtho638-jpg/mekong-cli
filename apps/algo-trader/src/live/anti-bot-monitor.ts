/**
 * Anti-Bot Monitor — detects exchange anti-bot signals using statistical process control.
 * Triggers escalation actions: proxy rotation, jitter increase, account switch, pause.
 */

export interface AntiBotConfig {
  rateLimitThreshold: number;    // max 429s before escalation
  slippageSpikeThresholdBps: number; // basis points
  cooldownMinutes: number;
  windowSizeMs: number;          // sliding window for stats
}

export interface ExchangeResponse {
  exchange: string;
  statusCode: number;
  errorMessage?: string;
  latencyMs: number;
  slippageBps?: number;
  timestamp: number;
}

export type EscalationAction = 'rotateProxy' | 'increaseJitter' | 'switchAccount' | 'pauseExchange' | 'alert';

export interface AntiBotAlert {
  exchange: string;
  reason: string;
  severity: 'warning' | 'critical';
  actions: EscalationAction[];
  timestamp: number;
}

export interface MonitorState {
  responses: ExchangeResponse[];
  alerts: AntiBotAlert[];
  rateLimitCounts: Record<string, number>;
  pausedExchanges: Record<string, number>; // exchange -> pause until timestamp
  escalationLevel: Record<string, number>; // exchange -> 0-3
}

const DEFAULT_CONFIG: AntiBotConfig = {
  rateLimitThreshold: 5,
  slippageSpikeThresholdBps: 20,
  cooldownMinutes: 10,
  windowSizeMs: 60000,
};

/** Creates initial monitor state */
export function createMonitorState(): MonitorState {
  return {
    responses: [],
    alerts: [],
    rateLimitCounts: {},
    pausedExchanges: {},
    escalationLevel: {},
  };
}

/** Records an exchange response and checks for anti-bot signals */
export function recordResponse(
  state: MonitorState,
  response: ExchangeResponse,
  config: Partial<AntiBotConfig> = {}
): AntiBotAlert | null {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  state.responses.push(response);

  // Prune old responses outside window
  const cutoff = Date.now() - cfg.windowSizeMs;
  state.responses = state.responses.filter((r) => r.timestamp > cutoff);

  // Check if exchange is paused
  const pauseUntil = state.pausedExchanges[response.exchange];
  if (pauseUntil && Date.now() < pauseUntil) return null;

  // Detect signals
  const alert = detectSignals(state, response, cfg);
  if (alert) {
    state.alerts.push(alert);
  }
  return alert;
}

function detectSignals(
  state: MonitorState,
  response: ExchangeResponse,
  config: AntiBotConfig
): AntiBotAlert | null {
  const exchange = response.exchange;
  const level = state.escalationLevel[exchange] ?? 0;

  // 1. Rate limit detection (429 / 403)
  if (response.statusCode === 429 || response.statusCode === 403) {
    state.rateLimitCounts[exchange] = (state.rateLimitCounts[exchange] ?? 0) + 1;
    if (state.rateLimitCounts[exchange] >= config.rateLimitThreshold) {
      state.escalationLevel[exchange] = Math.min(level + 1, 3);
      return createAlert(exchange, state.escalationLevel[exchange],
        `Rate limit threshold reached: ${state.rateLimitCounts[exchange]} events`,
        config
      );
    }
    return createAlert(exchange, 0, `Rate limit response: HTTP ${response.statusCode}`, config);
  }

  // 2. Anti-bot error messages
  if (response.errorMessage) {
    const suspicious = ['rejected', 'too many requests', 'banned', 'blocked', 'captcha', 'rate limit'];
    const found = suspicious.find((s) => response.errorMessage!.toLowerCase().includes(s));
    if (found) {
      state.escalationLevel[exchange] = Math.min(level + 1, 3);
      return createAlert(exchange, state.escalationLevel[exchange],
        `Suspicious error message detected: "${found}"`, config
      );
    }
  }

  // 3. Slippage spike
  if (response.slippageBps !== undefined && response.slippageBps > config.slippageSpikeThresholdBps) {
    return createAlert(exchange, 1,
      `Slippage spike: ${response.slippageBps}bps (threshold: ${config.slippageSpikeThresholdBps}bps)`,
      config
    );
  }

  // 4. Latency anomaly (moving average comparison)
  const recentLatencies = state.responses
    .filter((r) => r.exchange === exchange)
    .map((r) => r.latencyMs);
  if (recentLatencies.length >= 5) {
    const avg = recentLatencies.reduce((a, b) => a + b, 0) / recentLatencies.length;
    if (response.latencyMs > avg * 3 && response.latencyMs > 1000) {
      return createAlert(exchange, 0,
        `Latency anomaly: ${response.latencyMs}ms vs avg ${avg.toFixed(0)}ms`, config
      );
    }
  }

  return null;
}

function createAlert(
  exchange: string,
  escalation: number,
  reason: string,
  config: AntiBotConfig
): AntiBotAlert {
  const actions: EscalationAction[] = [];

  if (escalation >= 0) actions.push('rotateProxy');
  if (escalation >= 1) actions.push('increaseJitter');
  if (escalation >= 2) actions.push('switchAccount');
  if (escalation >= 3) actions.push('pauseExchange', 'alert');

  return {
    exchange,
    reason,
    severity: escalation >= 2 ? 'critical' : 'warning',
    actions,
    timestamp: Date.now(),
  };
}

/** Pauses an exchange for cooldown period */
export function pauseExchange(state: MonitorState, exchange: string, cooldownMinutes: number): void {
  state.pausedExchanges[exchange] = Date.now() + cooldownMinutes * 60000;
  state.rateLimitCounts[exchange] = 0;
}

/** Checks if exchange is currently paused */
export function isExchangePaused(state: MonitorState, exchange: string): boolean {
  const until = state.pausedExchanges[exchange];
  if (!until) return false;
  if (Date.now() >= until) {
    delete state.pausedExchanges[exchange];
    return false;
  }
  return true;
}

/** Resets escalation level for an exchange */
export function resetEscalation(state: MonitorState, exchange: string): void {
  state.escalationLevel[exchange] = 0;
  state.rateLimitCounts[exchange] = 0;
}
