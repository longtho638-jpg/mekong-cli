/**
 * Phase 11: Hyperdimensional Nexus — Dashboard metrics page.
 * Displays RWA Arbitrage, BCI Interface, and Quantum Comm metrics.
 */

interface MetricCard {
  label: string;
  value: string | number;
  status: 'active' | 'inactive' | 'warning';
}

function StatusBadge({ status }: { status: MetricCard['status'] }) {
  const colors = {
    active: 'bg-profit/20 text-profit',
    inactive: 'bg-muted/20 text-muted',
    warning: 'bg-yellow-500/20 text-yellow-400',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-mono ${colors[status]}`}>
      {status.toUpperCase()}
    </span>
  );
}

function ModulePanel({ title, metrics }: { title: string; metrics: MetricCard[] }) {
  return (
    <div className="border border-bg-border rounded-lg p-4 bg-bg-secondary">
      <h3 className="text-sm font-mono text-accent mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="flex flex-col gap-1">
            <span className="text-xs text-muted font-mono">{m.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-white">{m.value}</span>
              <StatusBadge status={m.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Phase11Page() {
  const rwaMetrics: MetricCard[] = [
    { label: 'Active Spreads', value: 0, status: 'inactive' },
    { label: 'Min Spread (bps)', value: 10, status: 'inactive' },
    { label: 'Arb Trades', value: 0, status: 'inactive' },
    { label: 'Oracle Status', value: 'Disconnected', status: 'inactive' },
  ];

  const bciMetrics: MetricCard[] = [
    { label: 'Current Intention', value: '—', status: 'inactive' },
    { label: 'Last Signal', value: 'Never', status: 'inactive' },
    { label: 'Dead-Man Timer', value: '60s', status: 'inactive' },
    { label: 'EEG Mode', value: 'Simulation', status: 'inactive' },
  ];

  const qcMetrics: MetricCard[] = [
    { label: 'Key Gen Rate', value: '0/s', status: 'inactive' },
    { label: 'Encrypted Msgs', value: 0, status: 'inactive' },
    { label: 'Key Length', value: '256-bit', status: 'inactive' },
    { label: 'QKD Status', value: 'Offline', status: 'inactive' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-mono text-white">Phase 11 — Hyperdimensional Nexus</h2>
        <p className="text-xs text-muted font-mono mt-1">
          RWA Arbitrage + BCI Interface + Quantum Comm. All disabled by default.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ModulePanel title="RWA Oracle & Arbitrage" metrics={rwaMetrics} />
        <ModulePanel title="Brain-Computer Interface" metrics={bciMetrics} />
        <ModulePanel title="Quantum Communication" metrics={qcMetrics} />
      </div>
    </div>
  );
}
