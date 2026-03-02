/**
 * Alert rules management panel.
 * Renders existing rules list + inline add-rule form.
 * All API calls are delegated to parent via callbacks.
 */
import { useState, FormEvent } from 'react';

export type AlertCondition = '>' | '<' | '==';
export type AlertAction = 'webhook' | 'email';

export interface AlertRule {
  id: string;
  metric: string;
  condition: AlertCondition;
  threshold: number;
  action: AlertAction;
  target: string;
}

interface NewAlertPayload {
  metric: string;
  condition: AlertCondition;
  threshold: number;
  action: AlertAction;
  target: string;
}

interface Props {
  alerts: AlertRule[];
  onAddAlert: (payload: NewAlertPayload) => Promise<void>;
  onDeleteAlert: (alertId: string) => void;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-accent text-sm font-semibold uppercase tracking-wider mb-4">
      {title}
    </h2>
  );
}

export function SettingsAlertRulesForm({ alerts, onAddAlert, onDeleteAlert }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [metric, setMetric] = useState('spread_pct');
  const [condition, setCondition] = useState<AlertCondition>('>');
  const [threshold, setThreshold] = useState(0.5);
  const [action, setAction] = useState<AlertAction>('webhook');
  const [target, setTarget] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setAdding(true);
    await onAddAlert({ metric, condition, threshold, action, target });
    setAdding(false);
    setShowForm(false);
    setTarget('');
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <SectionHeader title="Alert Rules" />
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs bg-accent text-bg font-bold px-3 py-1.5 rounded hover:opacity-90 transition-opacity mb-4"
        >
          {showForm ? 'Cancel' : '+ Add Rule'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 p-3 border border-bg-border rounded bg-bg"
        >
          <div className="flex flex-col gap-1">
            <label className="text-muted text-xs">Metric</label>
            <input
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="bg-bg-card border border-bg-border rounded px-2 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-accent"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-muted text-xs">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as AlertCondition)}
              className="bg-bg-card border border-bg-border rounded px-2 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-accent"
            >
              <option value=">">{'>'}</option>
              <option value="<">{'<'}</option>
              <option value="==">{'=='}</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-muted text-xs">Threshold</label>
            <input
              type="number"
              step="any"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="bg-bg-card border border-bg-border rounded px-2 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-accent"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-muted text-xs">Action</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as AlertAction)}
              className="bg-bg-card border border-bg-border rounded px-2 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-accent"
            >
              <option value="webhook">webhook</option>
              <option value="email">email</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-muted text-xs">Target (URL or email)</label>
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={action === 'webhook' ? 'https://…' : 'you@example.com'}
              className="bg-bg-card border border-bg-border rounded px-2 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-accent"
              required
            />
          </div>
          <div className="flex items-end col-span-2 sm:col-span-3">
            <button
              type="submit"
              disabled={adding}
              className="bg-accent text-bg text-xs font-bold px-4 py-1.5 rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {adding ? 'Adding…' : 'Add Rule'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {alerts.length === 0 && (
          <p className="text-muted text-sm">No alert rules configured.</p>
        )}
        {alerts.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between bg-bg border border-bg-border rounded px-3 py-2 gap-2"
          >
            <code className="text-white text-xs font-mono">
              {a.metric} {a.condition} {a.threshold}
            </code>
            <span className="text-muted text-xs font-mono shrink-0">
              {a.action}: {a.target.length > 30 ? a.target.slice(0, 28) + '…' : a.target}
            </span>
            <button
              onClick={() => onDeleteAlert(a.id)}
              className="text-loss text-xs hover:underline font-mono shrink-0"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
