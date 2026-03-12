/**
 * License Health Gauge Component
 *
 * Phase 5 - Analytics Dashboard
 * Circular gauge showing overall license health score.
 */

interface LicenseHealthGaugeProps {
  healthScore: number;
  healthy: number;
  atRisk: number;
  exceeded: number;
  size?: 'sm' | 'md' | 'lg';
}

export function LicenseHealthGauge({
  healthScore,
  healthy,
  atRisk,
  exceeded,
  size = 'md',
}: LicenseHealthGaugeProps) {
  const total = healthy + atRisk + exceeded;
  const healthyPercent = total > 0 ? (healthy / total) * 100 : 0;
  const atRiskPercent = total > 0 ? (atRisk / total) * 100 : 0;
  const exceededPercent = total > 0 ? (exceeded / total) * 100 : 0;

  const sizeClasses = {
    sm: { container: 'w-24 h-24', text: 'text-lg', strokeWidth: 8 },
    md: { container: 'w-32 h-32', text: 'text-xl', strokeWidth: 10 },
    lg: { container: 'w-40 h-40', text: 'text-2xl', strokeWidth: 12 },
  };

  const circumference = 2 * Math.PI * 44;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-profit';
    if (score >= 60) return 'text-warning';
    return 'text-loss';
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 80) return 'stroke-profit';
    if (score >= 60) return 'stroke-warning';
    return 'stroke-loss';
  };

  return (
    <div className="bg-bg-card border border-bg-border rounded-lg p-6">
      <h4 className="text-white font-semibold mb-4 text-center">
        License Health Overview
      </h4>

      <div className="flex flex-col items-center">
        {/* Circular Gauge */}
        <div className={`relative ${sizeClasses[size].container}`}>
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="currentColor"
              strokeWidth={sizeClasses[size].strokeWidth}
              className="text-bg-border"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="currentColor"
              strokeWidth={sizeClasses[size].strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`${getHealthBgColor(healthScore)} transition-all duration-500`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`${sizeClasses[size].text} font-bold font-mono ${getHealthColor(healthScore)}`}>
              {healthScore}
            </span>
            <span className="text-muted text-xs">/100</span>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 w-full space-y-2">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-profit" />
              <span className="text-muted">Healthy</span>
            </div>
            <span className="text-white font-mono">{healthy} ({healthyPercent.toFixed(0)}%)</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-warning" />
              <span className="text-muted">At Risk</span>
            </div>
            <span className="text-white font-mono">{atRisk} ({atRiskPercent.toFixed(0)}%)</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-loss" />
              <span className="text-muted">Exceeded</span>
            </div>
            <span className="text-white font-mono">{exceeded} ({exceededPercent.toFixed(0)}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
