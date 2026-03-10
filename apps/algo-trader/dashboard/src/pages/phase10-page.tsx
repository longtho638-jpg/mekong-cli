/**
 * Phase 10: Cosmic Horizon — Dashboard metrics page.
 * Displays Temporal Warp, DAO Governance, and State Shadowing metrics.
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

export function Phase10Page() {
  const twMetrics: MetricCard[] = [
    { label: 'Latency (ns)', value: '—', status: 'inactive' },
    { label: 'Packet Drop Rate', value: '0%', status: 'inactive' },
    { label: 'eBPF Program', value: 'Not loaded', status: 'inactive' },
    { label: 'FPGA Device', value: '/dev/fpga0', status: 'inactive' },
  ];

  const daoMetrics: MetricCard[] = [
    { label: 'Token Supply', value: 0, status: 'inactive' },
    { label: 'Treasury Balance', value: '$0', status: 'inactive' },
    { label: 'Active Proposals', value: 0, status: 'inactive' },
    { label: 'Dark Pool', value: 'Disabled', status: 'inactive' },
  ];

  const ssMetrics: MetricCard[] = [
    { label: 'Simulations/s', value: 0, status: 'inactive' },
    { label: 'Probability Dist', value: '—', status: 'inactive' },
    { label: 'Preemptive Trades', value: 0, status: 'inactive' },
    { label: 'Chains', value: 'ETH, SOL', status: 'inactive' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-mono text-white">Phase 10 — Cosmic Horizon</h2>
        <p className="text-xs text-muted font-mono mt-1">
          Temporal Warp + DAO Governance + State Shadowing. All disabled by default.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ModulePanel title="Temporal Warp Execution" metrics={twMetrics} />
        <ModulePanel title="DAO Governance" metrics={daoMetrics} />
        <ModulePanel title="State Shadowing" metrics={ssMetrics} />
      </div>
    </div>
  );
}
