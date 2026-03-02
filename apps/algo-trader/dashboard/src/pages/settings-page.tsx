/**
 * Settings page: tenant info, API key management, exchange config, alert rules.
 * POST /tenants/:id/api-keys, DELETE /tenants/:id/api-keys/:keyId
 * GET /tenants/me, GET /tenants/:id/api-keys, GET /tenants/:id/alert-rules
 */
import { useState, useEffect, FormEvent } from 'react';
import { useApiClient } from '../hooks/use-api-client';

type Tier = 'FREE' | 'PRO' | 'ENTERPRISE';

interface TenantInfo {
  id: string;
  name: string;
  tier: Tier;
  createdAt: string;
  allowedExchanges: string[];
}

interface ApiKey {
  id: string;
  prefix: string;
  maskedKey: string;
  createdAt: string;
}

type AlertCondition = '>' | '<' | '==';
type AlertAction = 'webhook' | 'email';

interface AlertRule {
  id: string;
  metric: string;
  condition: AlertCondition;
  threshold: number;
  action: AlertAction;
  target: string;
}

const TIER_STYLES: Record<Tier, string> = {
  FREE: 'text-muted border-muted',
  PRO: 'text-accent border-accent',
  ENTERPRISE: 'text-profit border-profit',
};

const MOCK_TENANT: TenantInfo = {
  id: 'tenant-001',
  name: 'Demo Tenant',
  tier: 'PRO',
  createdAt: '2026-01-15T08:00:00Z',
  allowedExchanges: ['binance', 'kraken', 'coinbase', 'bybit'],
};

const MOCK_KEYS: ApiKey[] = [
  { id: 'k1', prefix: 'ak_live', maskedKey: 'ak_live_••••••••3f7a', createdAt: '2026-02-01T10:00:00Z' },
  { id: 'k2', prefix: 'ak_test', maskedKey: 'ak_test_••••••••9b2c', createdAt: '2026-02-20T14:00:00Z' },
];

const MOCK_ALERTS: AlertRule[] = [
  { id: 'a1', metric: 'spread_pct', condition: '>', threshold: 0.5, action: 'webhook', target: 'https://hooks.example.com/alert' },
  { id: 'a2', metric: 'pnl_usd', condition: '<', threshold: -100, action: 'email', target: 'admin@example.com' },
];

const EXCHANGE_LABELS: Record<string, string> = {
  binance: 'Binance',
  kraken: 'Kraken',
  coinbase: 'Coinbase',
  bybit: 'Bybit',
  okx: 'OKX',
  kucoin: 'KuCoin',
};

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-accent text-sm font-semibold uppercase tracking-wider mb-4">
      {title}
    </h2>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-bg-card border border-bg-border rounded-lg p-6 space-y-4">
      {children}
    </section>
  );
}

export function SettingsPage() {
  const { fetchApi } = useApiClient();

  const [tenant, setTenant] = useState<TenantInfo>(MOCK_TENANT);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(MOCK_KEYS);
  const [alerts, setAlerts] = useState<AlertRule[]>(MOCK_ALERTS);

  const [newKeyVisible, setNewKeyVisible] = useState<string | null>(null);
  const [creatingKey, setCreatingKey] = useState(false);

  // Alert form state
  const [alertMetric, setAlertMetric] = useState('spread_pct');
  const [alertCondition, setAlertCondition] = useState<AlertCondition>('>');
  const [alertThreshold, setAlertThreshold] = useState(0.5);
  const [alertAction, setAlertAction] = useState<AlertAction>('webhook');
  const [alertTarget, setAlertTarget] = useState('');
  const [addingAlert, setAddingAlert] = useState(false);
  const [showAlertForm, setShowAlertForm] = useState(false);

  useEffect(() => {
    fetchApi<TenantInfo>('/tenants/me').then((d) => { if (d) setTenant(d); });
    fetchApi<ApiKey[]>(`/tenants/${tenant.id}/api-keys`).then((d) => { if (d) setApiKeys(d); });
    fetchApi<AlertRule[]>(`/tenants/${tenant.id}/alert-rules`).then((d) => { if (d) setAlerts(d); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateKey() {
    setCreatingKey(true);
    const res = await fetchApi<{ key: string; id: string; prefix: string; maskedKey: string }>(
      `/tenants/${tenant.id}/api-keys`,
      { method: 'POST', body: JSON.stringify({}) },
    );
    setCreatingKey(false);
    if (res) {
      setNewKeyVisible(res.key ?? 'ak_live_mock_' + Math.random().toString(36).slice(2, 10));
      const newEntry: ApiKey = {
        id: res.id ?? `k${Date.now()}`,
        prefix: res.prefix ?? 'ak_live',
        maskedKey: res.maskedKey ?? `ak_live_••••••••${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      setApiKeys((prev) => [...prev, newEntry]);
    } else {
      // Mock fallback
      const mockKey = 'ak_live_mock_' + Math.random().toString(36).slice(2, 10);
      setNewKeyVisible(mockKey);
      setApiKeys((prev) => [
        ...prev,
        { id: `k${Date.now()}`, prefix: 'ak_live', maskedKey: mockKey.slice(0, 8) + '••••••••', createdAt: new Date().toISOString() },
      ]);
    }
  }

  async function handleDeleteKey(keyId: string) {
    await fetchApi(`/tenants/${tenant.id}/api-keys/${keyId}`, { method: 'DELETE' });
    setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
  }

  async function handleAddAlert(e: FormEvent) {
    e.preventDefault();
    setAddingAlert(true);
    const body = { metric: alertMetric, condition: alertCondition, threshold: alertThreshold, action: alertAction, target: alertTarget };
    const res = await fetchApi<AlertRule>(`/tenants/${tenant.id}/alert-rules`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    setAddingAlert(false);
    const newRule: AlertRule = res ?? { id: `a${Date.now()}`, ...body };
    setAlerts((prev) => [...prev, newRule]);
    setShowAlertForm(false);
    setAlertTarget('');
  }

  async function handleDeleteAlert(alertId: string) {
    await fetchApi(`/tenants/${tenant.id}/alert-rules/${alertId}`, { method: 'DELETE' });
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-white text-2xl font-bold">Settings</h1>

      {/* Tenant Info */}
      <Card>
        <SectionHeader title="Tenant Info" />
        <div className="grid grid-cols-2 gap-4 text-sm font-mono">
          <div>
            <p className="text-muted text-xs mb-1">Name</p>
            <p className="text-white">{tenant.name}</p>
          </div>
          <div>
            <p className="text-muted text-xs mb-1">Tier</p>
            <span className={`border rounded px-2 py-0.5 text-xs font-bold ${TIER_STYLES[tenant.tier]}`}>
              {tenant.tier}
            </span>
          </div>
          <div>
            <p className="text-muted text-xs mb-1">Tenant ID</p>
            <p className="text-muted text-xs">{tenant.id}</p>
          </div>
          <div>
            <p className="text-muted text-xs mb-1">Created</p>
            <p className="text-white">{new Date(tenant.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </Card>

      {/* API Keys */}
      <Card>
        <div className="flex items-center justify-between">
          <SectionHeader title="API Keys" />
          <button
            onClick={handleCreateKey}
            disabled={creatingKey}
            className="text-xs bg-accent text-bg font-bold px-3 py-1.5 rounded hover:opacity-90 disabled:opacity-50 transition-opacity mb-4"
          >
            {creatingKey ? 'Creating…' : '+ New Key'}
          </button>
        </div>

        {/* New key reveal */}
        {newKeyVisible && (
          <div className="bg-profit/10 border border-profit/30 rounded p-3 mb-2">
            <p className="text-profit text-xs font-semibold mb-1">
              Copy this key now — it will not be shown again.
            </p>
            <code className="text-white text-xs font-mono break-all">{newKeyVisible}</code>
            <button
              onClick={() => setNewKeyVisible(null)}
              className="ml-3 text-muted text-xs underline hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="space-y-2">
          {apiKeys.length === 0 && (
            <p className="text-muted text-sm">No API keys yet.</p>
          )}
          {apiKeys.map((k) => (
            <div
              key={k.id}
              className="flex items-center justify-between bg-bg border border-bg-border rounded px-3 py-2"
            >
              <div>
                <code className="text-white text-xs font-mono">{k.maskedKey}</code>
                <p className="text-muted text-xs mt-0.5">
                  Created {new Date(k.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDeleteKey(k.id)}
                className="text-loss text-xs hover:underline font-mono"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Exchange Config */}
      <Card>
        <SectionHeader title="Exchange Config" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(EXCHANGE_LABELS).map(([key, label]) => {
            const enabled = tenant.allowedExchanges.includes(key);
            return (
              <div
                key={key}
                className={`flex items-center gap-2 border rounded px-3 py-2 text-xs font-mono ${
                  enabled
                    ? 'border-profit/40 text-profit bg-profit/5'
                    : 'border-bg-border text-muted bg-bg'
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${enabled ? 'bg-profit' : 'bg-muted/40'}`} />
                {label}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Alert Rules */}
      <Card>
        <div className="flex items-center justify-between">
          <SectionHeader title="Alert Rules" />
          <button
            onClick={() => setShowAlertForm((v) => !v)}
            className="text-xs bg-accent text-bg font-bold px-3 py-1.5 rounded hover:opacity-90 transition-opacity mb-4"
          >
            {showAlertForm ? 'Cancel' : '+ Add Rule'}
          </button>
        </div>

        {showAlertForm && (
          <form onSubmit={handleAddAlert} className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 p-3 border border-bg-border rounded bg-bg">
            <div className="flex flex-col gap-1">
              <label className="text-muted text-xs">Metric</label>
              <input
                value={alertMetric}
                onChange={(e) => setAlertMetric(e.target.value)}
                className="bg-bg-card border border-bg-border rounded px-2 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-accent"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-muted text-xs">Condition</label>
              <select
                value={alertCondition}
                onChange={(e) => setAlertCondition(e.target.value as AlertCondition)}
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
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(Number(e.target.value))}
                className="bg-bg-card border border-bg-border rounded px-2 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-accent"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-muted text-xs">Action</label>
              <select
                value={alertAction}
                onChange={(e) => setAlertAction(e.target.value as AlertAction)}
                className="bg-bg-card border border-bg-border rounded px-2 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-accent"
              >
                <option value="webhook">webhook</option>
                <option value="email">email</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-muted text-xs">Target (URL or email)</label>
              <input
                value={alertTarget}
                onChange={(e) => setAlertTarget(e.target.value)}
                placeholder={alertAction === 'webhook' ? 'https://…' : 'you@example.com'}
                className="bg-bg-card border border-bg-border rounded px-2 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-accent"
                required
              />
            </div>
            <div className="flex items-end col-span-2 sm:col-span-3">
              <button
                type="submit"
                disabled={addingAlert}
                className="bg-accent text-bg text-xs font-bold px-4 py-1.5 rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {addingAlert ? 'Adding…' : 'Add Rule'}
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
                onClick={() => handleDeleteAlert(a.id)}
                className="text-loss text-xs hover:underline font-mono shrink-0"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default SettingsPage;
