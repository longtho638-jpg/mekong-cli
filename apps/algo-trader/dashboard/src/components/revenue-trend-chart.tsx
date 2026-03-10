/**
 * Revenue Trend Chart
 *
 * Line chart showing MRR trend over time using lightweight-charts.
 * Displays revenue growth/decline with color-coded line.
 */
import { useEffect, useRef, useMemo } from 'react';
import { createChart, IChartApi, ColorType } from 'lightweight-charts';

interface TrendDataPoint {
  month: string;
  totalMRR: number;
  growthRate?: number;
}

interface RevenueTrendChartProps {
  data: TrendDataPoint[];
  height?: number;
  className?: string;
}

export function RevenueTrendChart({
  data,
  height = 280,
  className = '',
}: RevenueTrendChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Format dates for lightweight-charts
  const chartData = useMemo(() => {
    return data.map((point) => {
      // Convert YYYY-MM to BusinessDay format
      const [year, month] = point.month.split('-').map(Number);
      return {
        time: { year, month } as any,
        value: point.totalMRR,
      };
    });
  }, [data]);

  // Chart configuration
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
      borderColor: 'rgba(48, 54, 61, 0.5)',
    },
    timeScale: {
      borderColor: 'rgba(48, 54, 61, 0.5)',
      timeVisible: true,
    },
  }), []);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth,
      height,
    });

    chartRef.current = chart;

    // Create area series for MRR trend
    const series = chart.addAreaSeries({
      lineColor: '#58a6ff',
      topColor: 'rgba(88, 166, 255, 0.3)',
      bottomColor: 'rgba(88, 166, 255, 0)',
      lineWidth: 2,
      pointMarkersVisible: true,
      pointMarkersRadius: 4,
    });

    series.setData(chartData);

    // Fit content
    chart.timeScale().fitContent();

    // Cleanup
    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [chartOptions, height, chartData]);

  // Update data when it changes
  useEffect(() => {
    if (chartRef.current && chartData.length > 0) {
      const series = (chartRef.current as any).series();
      if (series && series.setData) {
        series.setData(chartData);
      }
    }
  }, [chartData]);

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
          <h3 className="text-white font-semibold text-lg">MRR Trend</h3>
          <p className="text-muted text-xs mt-0.5">Monthly Recurring Revenue over time</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-accent/40"></span>
          <span className="text-xs text-muted font-mono">MRR (USD)</span>
        </div>
      </div>

      {/* Chart */}
      <div ref={chartContainerRef} className="w-full" style={{ height }} />

      {/* Empty state */}
      {data.length === 0 && (
        <div className="flex items-center justify-center py-12 text-muted text-sm">
          No trend data available
        </div>
      )}
    </div>
  );
}
