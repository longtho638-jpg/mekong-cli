// DepartmentDashboard Types

export interface DepartmentMetric {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    trend?: {
        value: string;
        direction: 'up' | 'down' | 'neutral';
    };
}

export interface ChartDataPoint {
    name: string;
    value: number;
    color?: string;
    [key: string]: string | number | undefined;
}

export interface DepartmentChartConfig {
    type: 'bar' | 'line' | 'pie' | 'area';
    title: string;
    data: ChartDataPoint[];
    colors?: string[];
}

export interface QuickAction {
    icon: React.ReactNode;
    label: string;
    href?: string;
    onClick?: () => void;
}

export interface DepartmentDashboardProps {
    // Header
    title: string;
    subtitle?: string;
    icon?: string;
    color: 'blue' | 'pink' | 'green' | 'purple' | 'orange' | 'yellow' | 'red' | 'cyan';

    // Status
    statusLabel?: string;
    statusValue?: string;

    // Metrics
    metrics: DepartmentMetric[];

    // Charts
    charts?: DepartmentChartConfig[];

    // Quick Actions
    quickActions?: QuickAction[];

    // Locale
    locale: string;

    // Children for custom content
    children?: React.ReactNode;
}

// Color mappings
export const colorMap = {
    blue: {
        primary: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.1)',
        border: 'rgba(59, 130, 246, 0.3)',
        text: 'text-blue-400',
        bgClass: 'bg-blue-500/10',
        borderClass: 'border-blue-500/30',
    },
    pink: {
        primary: '#ec4899',
        bg: 'rgba(236, 72, 153, 0.1)',
        border: 'rgba(236, 72, 153, 0.3)',
        text: 'text-pink-400',
        bgClass: 'bg-pink-500/10',
        borderClass: 'border-pink-500/30',
    },
    green: {
        primary: '#22c55e',
        bg: 'rgba(34, 197, 94, 0.1)',
        border: 'rgba(34, 197, 94, 0.3)',
        text: 'text-green-400',
        bgClass: 'bg-green-500/10',
        borderClass: 'border-green-500/30',
    },
    purple: {
        primary: '#a855f7',
        bg: 'rgba(168, 85, 247, 0.1)',
        border: 'rgba(168, 85, 247, 0.3)',
        text: 'text-purple-400',
        bgClass: 'bg-purple-500/10',
        borderClass: 'border-purple-500/30',
    },
    orange: {
        primary: '#f97316',
        bg: 'rgba(249, 115, 22, 0.1)',
        border: 'rgba(249, 115, 22, 0.3)',
        text: 'text-orange-400',
        bgClass: 'bg-orange-500/10',
        borderClass: 'border-orange-500/30',
    },
    yellow: {
        primary: '#eab308',
        bg: 'rgba(234, 179, 8, 0.1)',
        border: 'rgba(234, 179, 8, 0.3)',
        text: 'text-yellow-400',
        bgClass: 'bg-yellow-500/10',
        borderClass: 'border-yellow-500/30',
    },
    red: {
        primary: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.1)',
        border: 'rgba(239, 68, 68, 0.3)',
        text: 'text-red-400',
        bgClass: 'bg-red-500/10',
        borderClass: 'border-red-500/30',
    },
    cyan: {
        primary: '#06b6d4',
        bg: 'rgba(6, 182, 212, 0.1)',
        border: 'rgba(6, 182, 212, 0.3)',
        text: 'text-cyan-400',
        bgClass: 'bg-cyan-500/10',
        borderClass: 'border-cyan-500/30',
    },
};
