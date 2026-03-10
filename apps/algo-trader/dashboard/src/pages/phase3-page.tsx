/**
 * Phase 3 AGI Modules dashboard — live status panels for
 * MEV Sandwich, Portfolio Rebalancer, and Predatory Liquidity.
 * Receives data via WebSocket 'phase3:*' message types.
 */
import { useState, useEffect, useCallback, useRef } from 'react';

interface MevStatus {
  enabled: boolean;
  opportunities: number;
  bundlesSubmitted: number;
  successRate: number;
}

interface RebalancerStatus {
  enabled: boolean;
  totalValueUsd: number;
  lastRebalanceTime: number;
  tradesExecuted: number;
}

interface PredatoryStatus {
  enabled: boolean;
  activePumps: number;
  makerOrders: number;
  dumpsExecuted: number;
}

interface Phase3Status {
  mevSandwich: MevStatus;
  portfolioRebalancer: RebalancerStatus;
  predatoryLiquidity: PredatoryStatus;
}

interface MevAlert {
  bundleHash?: string;
  chain?: string;
  timestamp: number;
  [key: string]: unknown;
}

const DEFAULT_STATUS: Phase3Status = {
  mevSandwich: { enabled: false, opportunities: 0, bundlesSubmitted: 0, successRate: 0 },
  portfolioRebalancer: { enabled: false, totalValueUsd: 0, lastRebalanceTime: 0, tradesExecuted: 0 },
  predatoryLiquidity: { enabled: false, activePumps: 0, makerOrders: 0, dumpsExecuted: 0 },
};

function StatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
      enabled ? 'bg-profit/15 text-profit border border-profit/30' : 'bg-muted/15 text-muted border border-muted/30'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-profit' : 'bg-muted'}`} />
      {enabled ? 'Active' : 'Disabled'}
    </span>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-bg-border/50 last:border-0">
      <span className="text-muted text-xs">{label}</span>
      <span className="text-white text-sm font-semibold">{value}</span>
    </div>
  );
}

export function Phase3Page() {
  const [status, setStatus] = useState<Phase3Status>(DEFAULT_STATUS);
  const [mevAlerts, setMevAlerts] = useState<MevAlert[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data as string);
      switch (data.type) {
        case 'phase3:status':
          setStatus(data.payload as Phase3Status);
          break;
        case 'phase3:mev_opportunity':
          setMevAlerts(prev => [{ ...data.payload, timestamp: Date.now() }, ...prev].slice(0, 50));
          break;
        case 'phase3:rebalance_action':
        case 'phase3:pump_signal':
          // absorbed for future panels
          break;
      }
    } catch { /* ignore malformed */ }
  }, []);

  useEffect(() => {
    const url = import.meta.env.VITE_WS_URL ?? `ws://${window.location.host}/ws`;
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onmessage = handleMessage;
      ws.onerror = () => ws.close();
      return () => ws.close();
    } catch { /* ignore */ }
  }, [handleMessage]);

  const { mevSandwich, portfolioRebalancer, predatoryLiquidity } = status;

  return (
    <div className="space-y-6 font-mono">
      <div>
        <h2 className="text-white text-lg font-bold tracking-tight">Phase 3 — AGI Modules</h2>
        <p className="text-muted text-xs mt-0.5">MEV Sandwich / Portfolio Rebalancer / Predatory Liquidity</p>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* MEV Sandwich */}
        <div className="bg-bg-card border border-bg-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white text-sm font-bold">MEV Sandwich</h3>
            <StatusBadge enabled={mevSandwich.enabled} />
          </div>
          <div className="space-y-0">
            <StatRow label="Opportunities" value={mevSandwich.opportunities} />
            <StatRow label="Bundles Submitted" value={mevSandwich.bundlesSubmitted} />
            <StatRow label="Success Rate" value={`${(mevSandwich.successRate * 100).toFixed(1)}%`} />
          </div>
        </div>

        {/* Portfolio Rebalancer */}
        <div className="bg-bg-card border border-bg-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white text-sm font-bold">Portfolio Rebalancer</h3>
            <StatusBadge enabled={portfolioRebalancer.enabled} />
          </div>
          <div className="space-y-0">
            <StatRow label="Portfolio Value" value={`$${portfolioRebalancer.totalValueUsd.toFixed(2)}`} />
            <StatRow label="Trades Executed" value={portfolioRebalancer.tradesExecuted} />
            <StatRow
              label="Last Rebalance"
              value={portfolioRebalancer.lastRebalanceTime
                ? new Date(portfolioRebalancer.lastRebalanceTime).toLocaleTimeString()
                : '—'}
            />
          </div>
        </div>

        {/* Predatory Liquidity */}
        <div className="bg-bg-card border border-bg-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white text-sm font-bold">Predatory Liquidity</h3>
            <StatusBadge enabled={predatoryLiquidity.enabled} />
          </div>
          <div className="space-y-0">
            <StatRow label="Active Pumps" value={predatoryLiquidity.activePumps} />
            <StatRow label="Maker Orders" value={predatoryLiquidity.makerOrders} />
            <StatRow label="Dumps Executed" value={predatoryLiquidity.dumpsExecuted} />
          </div>
        </div>
      </div>

      {/* MEV Bundle Alerts */}
      <div className="bg-bg-card border border-bg-border rounded-lg p-4">
        <h3 className="text-white text-sm font-bold mb-3">MEV Bundle Activity</h3>
        {mevAlerts.length === 0 ? (
          <p className="text-muted text-xs">No MEV bundles submitted yet</p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-1">
            {mevAlerts.map((a, i) => (
              <div key={i} className="flex items-center gap-3 text-xs py-1.5 border-b border-bg-border/50">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent/20 text-accent">
                  {String(a.chain ?? 'eth').toUpperCase()}
                </span>
                <span className="text-white font-mono truncate max-w-[180px]">
                  {String(a.bundleHash ?? 'pending')}
                </span>
                <span className="text-muted ml-auto">{new Date(a.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
