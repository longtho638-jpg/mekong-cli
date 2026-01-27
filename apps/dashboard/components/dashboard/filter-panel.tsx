import React from 'react';
import { Calendar, Filter, RefreshCw, Download } from 'lucide-react';

export type DateRangeType = 'today' | '7d' | '30d' | '90d' | 'ytd' | 'custom';

export interface DashboardFilters {
  dateRange: DateRangeType;
  customStartDate?: Date;
  customEndDate?: Date;
  segment?: string;
  autoRefresh?: number; // seconds, 0 = off
}

interface FilterPanelProps {
  filters: DashboardFilters;
  onFilterChange: (filters: DashboardFilters) => void;
  onRefresh: () => void;
  onExport: (format: 'pdf' | 'png') => void;
  lastUpdated?: Date;
}

export function FilterPanel({
  filters,
  onFilterChange,
  onRefresh,
  onExport,
  lastUpdated
}: FilterPanelProps) {

  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, dateRange: e.target.value as DateRangeType });
  };

  const handleRefreshIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, autoRefresh: parseInt(e.target.value) });
  };

  return (
    <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-[var(--md-sys-color-surface)] border-b border-[var(--md-sys-color-outline-variant)] sticky top-0 z-30 shadow-sm">

      {/* Left: Filters */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Date Range */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--md-sys-color-surface-container)] rounded-md border border-[var(--md-sys-color-outline)]">
          <Calendar className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
          <select
            value={filters.dateRange}
            onChange={handleRangeChange}
            className="bg-transparent border-none text-sm font-medium text-[var(--md-sys-color-on-surface)] focus:ring-0 cursor-pointer"
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="ytd">Year to Date</option>
          </select>
        </div>

        {/* User Segment */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--md-sys-color-surface-container)] rounded-md border border-[var(--md-sys-color-outline)]">
          <Filter className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
          <select
            value={filters.segment || 'all'}
            onChange={(e) => onFilterChange({ ...filters, segment: e.target.value })}
            className="bg-transparent border-none text-sm font-medium text-[var(--md-sys-color-on-surface)] focus:ring-0 cursor-pointer"
          >
            <option value="all">All Users</option>
            <option value="enterprise">Enterprise</option>
            <option value="pro">Pro Plan</option>
            <option value="free">Free Tier</option>
          </select>
        </div>

      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">

        {/* Last Updated & Refresh */}
        <div className="flex items-center gap-3 text-sm text-[var(--md-sys-color-on-surface-variant)]">
          {lastUpdated && (
            <span className="hidden md:inline">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}

          <div className="flex items-center gap-1">
            <select
              value={filters.autoRefresh || 0}
              onChange={handleRefreshIntervalChange}
              className="bg-transparent border-none text-sm text-[var(--md-sys-color-on-surface-variant)] focus:ring-0 cursor-pointer text-right"
            >
              <option value={0}>Manual</option>
              <option value={5}>5s</option>
              <option value={15}>15s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
            </select>

            <button
              onClick={onRefresh}
              className="p-2 hover:bg-[var(--md-sys-color-surface-variant)] rounded-full transition-colors"
              title="Refresh Now"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-[var(--md-sys-color-outline-variant)]"></div>

        {/* Export */}
        <div className="flex items-center gap-2">
           <button
             onClick={() => onExport('pdf')}
             className="flex items-center gap-2 px-4 py-2 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-full text-sm font-medium hover:shadow-md transition-shadow"
           >
             <Download className="w-4 h-4" />
             <span className="hidden sm:inline">Export PDF</span>
           </button>
        </div>

      </div>
    </div>
  );
}
