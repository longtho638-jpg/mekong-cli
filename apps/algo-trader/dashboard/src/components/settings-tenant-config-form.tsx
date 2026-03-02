/**
 * Tenant general settings panel.
 * Displays tenant name, tier badge, ID, creation date, and allowed exchanges.
 */

type Tier = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface TenantInfo {
  id: string;
  name: string;
  tier: Tier;
  createdAt: string;
  allowedExchanges: string[];
}

interface Props {
  tenant: TenantInfo;
}

const TIER_STYLES: Record<Tier, string> = {
  FREE: 'text-muted border-muted',
  PRO: 'text-accent border-accent',
  ENTERPRISE: 'text-profit border-profit',
};

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

export function SettingsTenantConfigForm({ tenant }: Props) {
  return (
    <>
      {/* Tenant Info */}
      <section className="bg-bg-card border border-bg-border rounded-lg p-6 space-y-4">
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
      </section>

      {/* Exchange Config */}
      <section className="bg-bg-card border border-bg-border rounded-lg p-6 space-y-4">
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
      </section>
    </>
  );
}
