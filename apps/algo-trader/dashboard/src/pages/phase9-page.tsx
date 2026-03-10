/**
 * Phase 9: Singularity Engine — Dashboard metrics page.
 * Displays QSV, NS3, and OMSO module status/metrics.
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

export function Phase9Page() {
  // Placeholder metrics — will be connected via WebSocket
  const qsvMetrics: MetricCard[] = [
    { label: 'Keys Managed', value: 0, status: 'inactive' },
    { label: 'Messages Encrypted', value: 0, status: 'inactive' },
    { label: 'PQC Algorithm', value: 'Dilithium5', status: 'inactive' },
    { label: 'HSM Status', value: 'Disabled', status: 'inactive' },
  ];

  const ns3Metrics: MetricCard[] = [
    { label: 'Population Size', value: 0, status: 'inactive' },
    { label: 'Best Fitness', value: '—', status: 'inactive' },
    { label: 'Strategies Generated', value: 0, status: 'inactive' },
    { label: 'Evolution Cycle', value: 0, status: 'inactive' },
  ];

  const omsoMetrics: MetricCard[] = [
    { label: 'News Ingested', value: 0, status: 'inactive' },
    { label: 'Sentiment Score', value: '—', status: 'inactive' },
    { label: 'Macro Signals', value: 0, status: 'inactive' },
    { label: 'LLM Model', value: 'llama3-8b', status: 'inactive' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-mono text-white">Phase 9 — Singularity Engine</h2>
        <p className="text-xs text-muted font-mono mt-1">
          QSV + NS3 + OMSO modules. All disabled by default.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ModulePanel title="Quantum-Safe Vault (QSV)" metrics={qsvMetrics} />
        <ModulePanel title="Neural-Symbolic Synthesizer (NS3)" metrics={ns3Metrics} />
        <ModulePanel title="Omni-Macro Oracle (OMSO)" metrics={omsoMetrics} />
      </div>

      <div className="border border-bg-border rounded-lg p-4 bg-bg-secondary">
        <h3 className="text-sm font-mono text-accent mb-2">Configuration</h3>
        <pre className="text-xs text-muted font-mono overflow-auto max-h-48">
{`{
  "quantumSafeVault": { "enabled": false, "pqcAlgorithm": "Dilithium5" },
  "neuralSymbolicSynthesizer": { "enabled": false, "populationSize": 1000 },
  "omniMacroOracle": { "enabled": false, "llmModel": "llama3-8b-instruct" }
}`}
        </pre>
      </div>
    </div>
  );
}
