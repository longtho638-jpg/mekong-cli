/**
 * Settings page: composition of tenant config, exchange keys, and alert rules panels.
 * Data is fetched here and passed down to each sub-component.
 * POST /tenants/:id/api-keys, DELETE /tenants/:id/api-keys/:keyId
 * GET /tenants/me, GET /tenants/:id/api-keys, GET /tenants/:id/alert-rules
 */
import { useState, useEffect } from 'react';
import { useApiClient } from '../hooks/use-api-client';
import { SettingsTenantConfigForm, type TenantInfo } from '../components/settings-tenant-config-form';
import { SettingsExchangeKeysForm, type ApiKey } from '../components/settings-exchange-keys-form';
import { SettingsAlertRulesForm, type AlertRule } from '../components/settings-alert-rules-form';

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
      setApiKeys((prev) => [...prev, {
        id: res.id ?? `k${Date.now()}`,
        prefix: res.prefix ?? 'ak_live',
        maskedKey: res.maskedKey ?? `ak_live_••••••••${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
      }]);
    } else {
      const mockKey = 'ak_live_mock_' + Math.random().toString(36).slice(2, 10);
      setNewKeyVisible(mockKey);
      setApiKeys((prev) => [...prev, { id: `k${Date.now()}`, prefix: 'ak_live', maskedKey: mockKey.slice(0, 8) + '••••••••', createdAt: new Date().toISOString() }]);
    }
  }

  async function handleDeleteKey(keyId: string) {
    await fetchApi(`/tenants/${tenant.id}/api-keys/${keyId}`, { method: 'DELETE' });
    setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
  }

  async function handleAddAlert(payload: Omit<AlertRule, 'id'>) {
    const res = await fetchApi<AlertRule>(`/tenants/${tenant.id}/alert-rules`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAlerts((prev) => [...prev, res ?? { id: `a${Date.now()}`, ...payload }]);
  }

  async function handleDeleteAlert(alertId: string) {
    await fetchApi(`/tenants/${tenant.id}/alert-rules/${alertId}`, { method: 'DELETE' });
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-white text-2xl font-bold">Settings</h1>
      <SettingsTenantConfigForm tenant={tenant} />
      <Card>
        <SettingsExchangeKeysForm
          tenantId={tenant.id}
          apiKeys={apiKeys}
          newKeyVisible={newKeyVisible}
          creatingKey={creatingKey}
          onCreateKey={handleCreateKey}
          onDeleteKey={handleDeleteKey}
          onDismissNewKey={() => setNewKeyVisible(null)}
        />
      </Card>
      <Card>
        <SettingsAlertRulesForm
          alerts={alerts}
          onAddAlert={handleAddAlert}
          onDeleteAlert={handleDeleteAlert}
        />
      </Card>
    </div>
  );
}

export default SettingsPage;
