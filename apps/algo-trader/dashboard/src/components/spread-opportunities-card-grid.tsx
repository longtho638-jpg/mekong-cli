/**
 * Card grid displaying arbitrage spread opportunities sorted by net profit.
 * Color intensity scales with spread percentage size.
 */
import { SpreadOpportunity } from '../stores/trading-store';

interface SpreadOpportunitiesCardGridProps {
  spreads: SpreadOpportunity[];
}

function formatSpreadPct(pct: number): string {
  return pct.toFixed(3) + '%';
}

function formatUsd(n: number): string {
  if (n >= 1000) return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return '$' + n.toFixed(2);
}

/** Returns tailwind color classes based on spread magnitude */
function spreadIntensityClass(spreadPct: number): { border: string; badge: string; glow: string } {
  if (spreadPct >= 1.0) {
    return {
      border: 'border-profit/60',
      badge: 'bg-profit/20 text-profit',
      glow: 'shadow-[0_0_12px_rgba(0,255,65,0.15)]',
    };
  }
  if (spreadPct >= 0.5) {
    return {
      border: 'border-accent/50',
      badge: 'bg-accent/15 text-accent',
      glow: 'shadow-[0_0_8px_rgba(0,217,255,0.1)]',
    };
  }
  return {
    border: 'border-bg-border',
    badge: 'bg-muted/10 text-muted',
    glow: '',
  };
}

export function SpreadOpportunitiesCardGrid({ spreads }: SpreadOpportunitiesCardGridProps) {
  if (spreads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted font-mono">
        <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24" className="mb-3 opacity-30">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12h8M12 8v8" />
        </svg>
        <p className="text-sm">No spread opportunities detected</p>
      </div>
    );
  }

  const sorted = [...spreads].sort((a, b) => b.netProfitUsd - a.netProfitUsd);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {sorted.map((opp, idx) => {
        const { border, badge, glow } = spreadIntensityClass(opp.spreadPct);
        const key = `${opp.symbol}-${opp.buyExchange}-${opp.sellExchange}-${idx}`;

        return (
          <div
            key={key}
            className={`
              bg-bg-card border rounded-lg p-3 transition-all duration-200
              hover:scale-[1.02] ${border} ${glow}
            `}
          >
            {/* Symbol + spread badge */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-white font-mono font-bold text-sm">{opp.symbol}</span>
              <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded ${badge}`}>
                {formatSpreadPct(opp.spreadPct)}
              </span>
            </div>

            {/* Exchange route */}
            <div className="flex items-center gap-1.5 mb-3 font-mono text-xs">
              <span className="text-accent truncate max-w-[72px]">{opp.buyExchange}</span>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-muted flex-shrink-0">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
              <span className="text-profit truncate max-w-[72px]">{opp.sellExchange}</span>
            </div>

            {/* Net profit */}
            <div className="flex items-center justify-between font-mono">
              <span className="text-muted text-[10px] uppercase tracking-wide">Net Profit</span>
              <span className={`text-sm font-semibold ${opp.netProfitUsd >= 0 ? 'text-profit' : 'text-loss'}`}>
                {formatUsd(opp.netProfitUsd)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
