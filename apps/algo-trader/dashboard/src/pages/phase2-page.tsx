/**
 * Phase 2 AGI Modules dashboard — live status panels for
 * Zero-Shot Synthesizer, Cross-Chain Flash Loans, and Adversarial MM.
 * Receives data via WebSocket 'phase2:*' message types.
 */
import { useState, useEffect, useCallback, useRef } from 'react';

interface Phase2Status {
  zeroShot: { enabled: boolean; activeRules: number; messagesProcessed: number; rulesGenerated: number };
  flashLoans: { enabled: boolean; dexCount: number; bridgeCount: number; routesFound: number };
  adversarialMM: { enabled: boolean; modelLoaded: boolean; signalCount: number };
}

interface SpoofAlert {
  exchange: string;
  symbol: string;
  confidence: number;
  signalType: string;
  timestamp: number;
}

const DEFAULT_STATUS: Phase2Status = {
  zeroShot: { enabled: false, activeRules: 0, messagesProcessed: 0, rulesGenerated: 0 },
  flashLoans: { enabled: false, dexCount: 0, bridgeCount: 0, routesFound: 0 },
  adversarialMM: { enabled: false, modelLoaded: false, signalCount: 0 },
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

export function Phase2Page() {
  const [status, setStatus] = useState<Phase2Status>(DEFAULT_STATUS);
  const [alerts, setAlerts] = useState<SpoofAlert[]>([]);
  const [routesBestProfit, setRoutesBestProfit] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'phase2:status':
          setStatus(data.payload);
          break;
        case 'phase2:spoof_signal':
          setAlerts(prev => [{ ...data.payload, timestamp: Date.now() }, ...prev].slice(0, 50));
          break;
        case 'phase2:routes_found':
          setRoutesBestProfit(data.payload.bestProfitUsd);
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

  return (
    <div className="space-y-6 font-mono">
      <div>
        <h2 className="text-white text-lg font-bold tracking-tight">Phase 2 — AGI Modules</h2>
        <p className="text-muted text-xs mt-0.5">Zero-Shot Synthesizer / Flash Loans / Adversarial MM</p>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Zero-Shot Synthesizer */}
        <div className="bg-bg-card border border-bg-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white text-sm font-bold">Zero-Shot Synthesizer</h3>
            <StatusBadge enabled={status.zeroShot.enabled} />
          </div>
          <div className="space-y-0">
            <StatRow label="Active Rules" value={status.zeroShot.activeRules} />
            <StatRow label="Messages Processed" value={status.zeroShot.messagesProcessed} />
            <StatRow label="Rules Generated" value={status.zeroShot.rulesGenerated} />
          </div>
        </div>

        {/* Cross-Chain Flash Loans */}
        <div className="bg-bg-card border border-bg-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white text-sm font-bold">Flash Loans</h3>
            <StatusBadge enabled={status.flashLoans.enabled} />
          </div>
          <div className="space-y-0">
            <StatRow label="DEX Nodes" value={status.flashLoans.dexCount} />
            <StatRow label="Bridge Count" value={status.flashLoans.bridgeCount} />
            <StatRow label="Routes Found" value={status.flashLoans.routesFound} />
            <StatRow label="Best Profit" value={`$${routesBestProfit.toFixed(2)}`} />
          </div>
        </div>

        {/* Adversarial MM */}
        <div className="bg-bg-card border border-bg-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white text-sm font-bold">Adversarial MM</h3>
            <StatusBadge enabled={status.adversarialMM.enabled} />
          </div>
          <div className="space-y-0">
            <StatRow label="Model" value={status.adversarialMM.modelLoaded ? 'ONNX' : 'Heuristic'} />
            <StatRow label="Signals Detected" value={status.adversarialMM.signalCount} />
          </div>
        </div>
      </div>

      {/* Spoof Alerts */}
      <div className="bg-bg-card border border-bg-border rounded-lg p-4">
        <h3 className="text-white text-sm font-bold mb-3">Spoof Detection Alerts</h3>
        {alerts.length === 0 ? (
          <p className="text-muted text-xs">No manipulation signals detected</p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-1">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-center gap-3 text-xs py-1.5 border-b border-bg-border/50">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  a.confidence > 0.9 ? 'bg-loss/20 text-loss' : 'bg-warning/20 text-warning'
                }`}>
                  {(a.confidence * 100).toFixed(0)}%
                </span>
                <span className="text-white">{a.exchange}</span>
                <span className="text-muted">{a.symbol}</span>
                <span className="text-accent">{a.signalType}</span>
                <span className="text-muted ml-auto">{new Date(a.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
