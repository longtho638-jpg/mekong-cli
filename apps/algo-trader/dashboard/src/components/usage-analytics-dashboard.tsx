/**
 * Usage Analytics Dashboard
 *
 * Comprehensive dashboard showing:
 * - Summary cards (Total Licenses, Active, Revenue, etc.)
 * - License distribution chart (by tier)
 * - Usage breakdown (API calls, ML features, Premium data)
 * - Recent activity feed
 * - Time range selector (7d/30d/90d)
 */
import { useLicenseAnalytics, TIME_RANGES } from '../hooks/use-license-analytics';
import { QuotaGauge, CircularGauge } from './quota-gauge';

export function UsageAnalyticsDashboard() {
  const { analytics, quota, loading, error, timeRange, setTimeRange, selectedLicense, setSelectedLicense, reload } = useLicenseAnalytics();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted font-mono">
        <svg className="animate-spin h-8 w-8 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-loss/10 border border-loss/40 rounded text-loss text-sm">
        <p className="font-semibold">Error loading analytics</p>
        <p className="mt-1">{error}</p>
        <button
          onClick={reload}
          className="mt-2 px-3 py-1 bg-loss/20 hover:bg-loss/30 rounded text-xs"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector & License Filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-white text-lg font-bold">License Analytics</h3>
        <div className="flex items-center gap-3">
          {/* License Filter */}
          <select
            value={selectedLicense}
            onChange={(e) => setSelectedLicense(e.target.value)}
            className="px-3 py-1.5 text-xs font-mono rounded border border-bg-border bg-bg-card text-muted hover:text-white focus:border-accent focus:outline-none"
          >
            <option value="">All Licenses</option>
            {/* In production, populate from active licenses API */}
            <option value="license-pro-001">License PRO 001</option>
            <option value="license-pro-002">License PRO 002</option>
            <option value="license-enterprise-001">License ENT 001</option>
          </select>

          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            {TIME_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`
                  px-3 py-1.5 text-xs font-mono rounded border transition-colors
                  ${timeRange === range.value
                    ? 'border-accent text-accent bg-accent/10'
                    : 'border-bg-border text-muted hover:text-white hover:border-white/30'
                  }
                `}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Licenses"
          value={analytics?.total || 0}
          icon={
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
              <line x1="9" y1="9" x2="9" y2="21" />
            </svg>
          }
        />
        <SummaryCard
          label="Active Licenses"
          value={analytics?.byStatus.active || 0}
          accent="profit"
          icon={
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <SummaryCard
          label="Monthly Revenue"
          value={`$${(analytics?.revenue?.monthly || 0).toLocaleString()}`}
          accent="accent"
          icon={
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <SummaryCard
          label="API Calls"
          value={(analytics?.usage.apiCalls || 0).toLocaleString()}
          accent="warning"
          icon={
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tier Distribution & Usage Gauges */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tier Distribution Chart */}
          <div className="bg-bg-card border border-bg-border rounded-lg p-6">
            <h4 className="text-white font-semibold mb-4">License Distribution by Tier</h4>
            <div className="grid grid-cols-3 gap-4">
              <TierDistributionCard
                tier="FREE"
                count={analytics?.byTier.free || 0}
                total={analytics?.total || 1}
                color="text-muted"
                barColor="bg-muted"
              />
              <TierDistributionCard
                tier="PRO"
                count={analytics?.byTier.pro || 0}
                total={analytics?.total || 1}
                color="text-accent"
                barColor="bg-accent"
              />
              <TierDistributionCard
                tier="ENTERPRISE"
                count={analytics?.byTier.enterprise || 0}
                total={analytics?.total || 1}
                color="text-amber-500"
                barColor="bg-amber-500"
              />
            </div>
          </div>

          {/* Usage Breakdown Gauges */}
          <div className="bg-bg-card border border-bg-border rounded-lg p-6">
            <h4 className="text-white font-semibold mb-4">Usage Breakdown</h4>
            <div className="space-y-5">
              <QuotaGauge
                label="API Calls"
                used={analytics?.usage.apiCalls || 0}
                limit={10000}
                unit="calls"
                size="md"
              />
              <QuotaGauge
                label="ML Features"
                used={analytics?.usage.mlFeatures || 0}
                limit={1000}
                unit="predictions"
                size="md"
              />
              <QuotaGauge
                label="Premium Data"
                used={analytics?.usage.premiumData || 0}
                limit={5000}
                unit="points"
                size="md"
              />
            </div>
          </div>

          {/* Tenant Quota (if available) */}
          {quota && (
            <div className="bg-bg-card border border-bg-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-semibold">Your Quota</h4>
                <span className="text-xs text-muted font-mono">
                  Resets: {new Date(quota.resetDate).toLocaleDateString()}
                </span>
              </div>
              <div className="space-y-4">
                <QuotaGauge
                  label="API Calls"
                  used={quota.apiCalls}
                  limit={quota.apiCallsLimit}
                  unit="calls"
                  size="lg"
                />
                <QuotaGauge
                  label="ML Predictions"
                  used={quota.mlPredictions}
                  limit={quota.mlPredictionsLimit}
                  unit="predictions"
                  size="lg"
                />
                <QuotaGauge
                  label="Data Points"
                  used={quota.dataPoints}
                  limit={quota.dataPointsLimit}
                  unit="points"
                  size="lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Activity Feed & Status Gauges */}
        <div className="space-y-6">
          {/* Overall Usage Circular Gauge */}
          <div className="bg-bg-card border border-bg-border rounded-lg p-6">
            <h4 className="text-white font-semibold mb-4 text-center">Overall Usage</h4>
            <CircularGauge
              value={(analytics?.usage.apiCalls || 0) + (analytics?.usage.mlFeatures || 0)}
              max={11000}
              label="Total Actions"
              subLabel={`${((analytics?.usage.apiCalls || 0) + (analytics?.usage.mlFeatures || 0)).toLocaleString()} / 11,000`}
              size={140}
              strokeWidth={10}
            />
          </div>

          {/* Status Distribution */}
          <div className="bg-bg-card border border-bg-border rounded-lg p-6">
            <h4 className="text-white font-semibold mb-4">License Status</h4>
            <div className="space-y-3">
              <StatusRow
                label="Active"
                count={analytics?.byStatus.active || 0}
                color="bg-profit"
                textColor="text-profit"
              />
              <StatusRow
                label="Revoked"
                count={analytics?.byStatus.revoked || 0}
                color="bg-muted"
                textColor="text-muted"
              />
              <StatusRow
                label="Expired"
                count={analytics?.byStatus.expired || 0}
                color="bg-loss"
                textColor="text-loss"
              />
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-bg-card border border-bg-border rounded-lg p-6">
            <h4 className="text-white font-semibold mb-4">Recent Activity</h4>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
                analytics.recentActivity.slice(0, 10).map((activity, index) => (
                  <ActivityItem key={index} activity={activity} />
                ))
              ) : (
                <div className="text-muted text-sm text-center py-4">
                  No recent activity
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components

interface SummaryCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accent?: 'default' | 'profit' | 'accent' | 'warning';
}

function SummaryCard({ label, value, icon, accent = 'default' }: SummaryCardProps) {
  const accentClasses = {
    default: 'text-white',
    profit: 'text-profit',
    accent: 'text-accent',
    warning: 'text-warning',
  };

  return (
    <div className="bg-bg-card border border-bg-border rounded-lg p-4 hover:border-bg-border/60 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <span className="text-muted text-[10px] uppercase tracking-widest">{label}</span>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <div className={`${accentClasses[accent]} text-2xl font-bold font-mono`}>
        {value}
      </div>
    </div>
  );
}

interface TierDistributionCardProps {
  tier: string;
  count: number;
  total: number;
  color: string;
  barColor: string;
}

function TierDistributionCard({ tier, count, total, color, barColor }: TierDistributionCardProps) {
  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';

  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${color} font-mono mb-1`}>{count}</div>
      <div className="text-muted text-[10px] uppercase tracking-wider mb-2">{tier}</div>
      <div className="h-1.5 bg-bg-border rounded-full overflow-hidden">
        <div className={`h-full ${barColor}`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="text-muted text-[10px] mt-1 font-mono">{percentage}%</div>
    </div>
  );
}

interface StatusRowProps {
  label: string;
  count: number;
  color: string;
  textColor: string;
}

function StatusRow({ label, count, color, textColor }: StatusRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-muted text-sm">{label}</span>
      </div>
      <span className={`${textColor} font-mono font-semibold`}>{count}</span>
    </div>
  );
}

interface ActivityItemProps {
  activity: {
    event: string;
    timestamp: string;
    licenseId: string;
    details?: string;
  };
}

function ActivityItem({ activity }: ActivityItemProps) {
  const eventIcon = {
    license_created: (
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
    license_revoked: (
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    api_usage: (
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  };

  const eventColors = {
    license_created: 'text-profit',
    license_revoked: 'text-loss',
    api_usage: 'text-accent',
  };

  const icon = eventIcon[activity.event as keyof typeof eventIcon] || (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );

  return (
    <div className="flex items-start gap-3">
      <div className={`${eventColors[activity.event as keyof typeof eventColors] || 'text-muted'} mt-0.5`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm capitalize">
          {activity.event.replace(/_/g, ' ')}
        </div>
        <div className="text-muted text-[10px] font-mono truncate">
          {activity.licenseId}
        </div>
        <div className="text-muted text-[10px] mt-0.5">
          {new Date(activity.timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}
