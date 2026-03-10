/**
 * Revenue by Tier Chart
 *
 * Horizontal bar chart showing revenue breakdown by subscription tier.
 * Uses lightweight-charts for consistent styling with other charts.
 */
import { useEffect, useRef, useMemo } from 'react';
import { createChart, IChartApi, ColorType } from 'lightweight-charts';

interface TierData {
  tier: string;
  revenue: number;
  percentage: number;
  subscriptionCount: number;
}

interface RevenueByTierChartProps {
  data: TierData[];
  height?: number;
  className?: string;
}

// Tier colors matching design system
const TIER_COLORS: Record<string, { bar: string; light: string }> = {
  FREE: { bar: '#484f58', light: 'rgba(72, 79, 88, 0.3)' },
  PRO: { bar: '#58a6ff', light: 'rgba(88, 166, 255, 0.3)' },
  ENTERPRISE: { bar: '#d29922', light: 'rgba(210, 153, 34, 0.3)' },
};

export function RevenueByTierChart({
  data,
  height = 280,
  className = '',
}: RevenueByTierChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Prepare data for horizontal bar chart
  const chartData = useMemo(() => {
    return data.map((item, index) => {
      const colorKey = item.tier.toUpperCase();
      const colors = TIER_COLORS[colorKey] || TIER_COLORS.PRO;

      return {
        value: item.revenue,
        color: colors.bar,
        label: item.tier,
        percentage: item.percentage,
        count: item.subscriptionCount,
        x: index + 1,
      };
    });
  }, [data]);

  // Chart configuration for horizontal bars
  const chartOptions = useMemo(() => ({
    layout: {
      background: { type: ColorType.Solid as const, color: '#161b22' },
      textColor: '#8b949e',
    },
    grid: {
      vertLines: { color: 'rgba(48, 54, 61, 0.3)' },
      horzLines: { color: 'rgba(48, 54, 61, 0.3)' },
    },
    crosshair: {
      mode: 1 as const,
    },
    rightPriceScale: {
      visible: false,
    },
    timeScale: {
      visible: false,
      borderColor: 'rgba(48, 54, 61, 0.5)',
    },
  }), []);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth,
      height,
    });

    chartRef.current = chart;

    // Create histogram series for bar chart effect
    const series = chart.addHistogramSeries({
      priceFormat: {
        type: 'volume' as const,
      },
      priceScaleId: '',
    });

    // Prepare histogram data
    const histogramData = chartData.map((item) => ({
      time: { year: 2026, month: item.x } as any,
      value: item.value,
      color: item.color,
    }));

    series.setData(histogramData);

    // Set custom formatter for Y-axis to show currency
    series.priceScale().applyOptions({
      autoScale: true,
    });

    // Fit content
    chart.timeScale().fitContent();

    // Cleanup
    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [chartOptions, height, chartData, data.length]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`bg-bg-secondary border border-bg-border rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold text-lg">Revenue by Tier</h3>
          <p className="text-muted text-xs mt-0.5">Breakdown by subscription tier</p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3">
          {Object.entries(TIER_COLORS).map(([tier, colors]) => (
            <div key={tier} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: colors.bar }}
              />
              <span className="text-xs text-muted font-mono">{tier}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart or fallback */}
      {data.length > 0 ? (
        <>
          <div
            ref={chartContainerRef}
            className="w-full"
            style={{ height: 200 }}
          />
          {/* Simple stats below chart */}
          <div className="mt-4 pt-4 border-t border-bg-border">
            <div className="grid grid-cols-3 gap-4">
              {data.map((item) => {
                const colorKey = item.tier.toUpperCase();
                const colors = TIER_COLORS[colorKey] || TIER_COLORS.PRO;

                return (
                  <div key={item.tier} className="text-center">
                    <div
                      className="text-lg font-bold font-mono"
                      style={{ color: colors.bar }}
                    >
                      ${item.revenue.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {item.subscriptionCount} subscriptions
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center py-12 text-muted text-sm">
          No tier data available
        </div>
      )}
    </div>
  );
}
