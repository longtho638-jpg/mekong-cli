'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FileText,
    Code,
    Briefcase,
    Building,
    Shield,
    Clock,
    TrendingUp,
    Eye,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface DocCategory {
    id: string;
    name: string;
    nameVi: string;
    icon: React.ElementType;
    color: string;
    count: number;
    freshness: number; // days since last update
}

interface DocMetrics {
    totalDocs: number;
    categories: DocCategory[];
    recentlyUpdated: string[];
    coverageScore: number;
    healthScore: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 MOCK DATA (Replace with API call)
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_METRICS: DocMetrics = {
    totalDocs: 42,
    coverageScore: 78,
    healthScore: 85,
    categories: [
        { id: 'user', name: 'User Docs', nameVi: 'Tài liệu người dùng', icon: FileText, color: '#4CAF50', count: 12, freshness: 2 },
        { id: 'developer', name: 'Developer Docs', nameVi: 'Tài liệu kỹ thuật', icon: Code, color: '#2196F3', count: 8, freshness: 5 },
        { id: 'sales', name: 'Sales Docs', nameVi: 'Tài liệu bán hàng', icon: Briefcase, color: '#FF9800', count: 6, freshness: 3 },
        { id: 'internal', name: 'Internal Docs', nameVi: 'Tài liệu nội bộ', icon: Building, color: '#9C27B0', count: 10, freshness: 1 },
        { id: 'compliance', name: 'Compliance Docs', nameVi: 'Tài liệu pháp lý', icon: Shield, color: '#F44336', count: 6, freshness: 30 },
    ],
    recentlyUpdated: [
        'HUONG_DAN_BAT_DAU_VN.md',
        'ARCHITECTURE_DIAGRAM.md',
        'ENV_CHECKLIST.md',
        '15_PROJECTS_DETAIL_REPORT.md',
        'PITCH_DECK.md',
    ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function MetricCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    color: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-container rounded-xl p-6 border border-outline-variant"
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-on-surface-variant text-sm">{title}</p>
                    <p className="text-3xl font-bold mt-2" style={{ color }}>{value}</p>
                    {subtitle && <p className="text-on-surface-variant text-xs mt-1">{subtitle}</p>}
                </div>
                <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
                    <Icon size={24} style={{ color }} />
                </div>
            </div>
        </motion.div>
    );
}

function CategoryCard({ category, index }: { category: DocCategory; index: number }) {
    const Icon = category.icon;
    const freshnessStatus = category.freshness <= 7 ? 'fresh' : category.freshness <= 30 ? 'stale' : 'outdated';

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-surface-container rounded-xl p-4 border border-outline-variant hover:border-primary transition-all cursor-pointer"
        >
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-full" style={{ backgroundColor: `${category.color}20` }}>
                    <Icon size={24} style={{ color: category.color }} />
                </div>
                <div className="flex-1">
                    <p className="font-medium text-on-surface">{category.name}</p>
                    <p className="text-sm text-on-surface-variant">{category.nameVi}</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold" style={{ color: category.color }}>{category.count}</p>
                    <div className="flex items-center gap-1 text-xs">
                        {freshnessStatus === 'fresh' && <CheckCircle size={12} className="text-green-500" />}
                        {freshnessStatus === 'stale' && <Clock size={12} className="text-yellow-500" />}
                        {freshnessStatus === 'outdated' && <AlertCircle size={12} className="text-red-500" />}
                        <span className="text-on-surface-variant">{category.freshness}d ago</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function ProgressRing({ value, size = 120, strokeWidth = 12, color }: { value: number; size?: number; strokeWidth?: number; color: string }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-surface-variant"
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold" style={{ color }}>{value}%</span>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

export default function DocsOpsDashboard() {
    const [metrics, setMetrics] = useState<DocMetrics>(MOCK_METRICS);
    const [loading, setLoading] = useState(false);

    return (
        <div className="min-h-screen bg-surface p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold text-on-surface">📚 DocsOps Dashboard</h1>
                    <p className="text-on-surface-variant mt-2">Documentation Operations Center</p>
                </motion.div>

                {/* Top Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <MetricCard
                        title="Total Documents"
                        value={metrics.totalDocs}
                        subtitle="Across all categories"
                        icon={FileText}
                        color="#2196F3"
                    />
                    <MetricCard
                        title="Coverage Score"
                        value={`${metrics.coverageScore}%`}
                        subtitle="Features documented"
                        icon={TrendingUp}
                        color="#4CAF50"
                    />
                    <MetricCard
                        title="Health Score"
                        value={`${metrics.healthScore}%`}
                        subtitle="Freshness + quality"
                        icon={CheckCircle}
                        color="#FF9800"
                    />
                    <MetricCard
                        title="Templates"
                        value={15}
                        subtitle="Ready to use"
                        icon={Code}
                        color="#9C27B0"
                    />
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Categories */}
                    <div className="lg:col-span-2">
                        <h2 className="text-xl font-semibold text-on-surface mb-4">📂 Categories</h2>
                        <div className="space-y-3">
                            {metrics.categories.map((cat, i) => (
                                <CategoryCard key={cat.id} category={cat} index={i} />
                            ))}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Health Ring */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-surface-container rounded-xl p-6 border border-outline-variant text-center"
                        >
                            <h3 className="text-lg font-semibold text-on-surface mb-4">Overall Health</h3>
                            <div className="flex justify-center">
                                <ProgressRing value={metrics.healthScore} color="#4CAF50" />
                            </div>
                            <p className="text-on-surface-variant text-sm mt-4">
                                {metrics.healthScore >= 80 ? '✅ Excellent' :
                                    metrics.healthScore >= 60 ? '⚠️ Good' :
                                        '❌ Needs attention'}
                            </p>
                        </motion.div>

                        {/* Recently Updated */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-surface-container rounded-xl p-6 border border-outline-variant"
                        >
                            <h3 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
                                <Clock size={20} />
                                Recently Updated
                            </h3>
                            <ul className="space-y-2">
                                {metrics.recentlyUpdated.map((doc, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm">
                                        <FileText size={14} className="text-on-surface-variant" />
                                        <span className="text-on-surface truncate">{doc}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* Quick Actions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-surface-container rounded-xl p-6 border border-outline-variant"
                        >
                            <h3 className="text-lg font-semibold text-on-surface mb-4">⚡ Quick Actions</h3>
                            <div className="space-y-2">
                                <button className="w-full py-2 px-4 bg-primary text-on-primary rounded-lg hover:opacity-90 transition">
                                    + New Document
                                </button>
                                <button className="w-full py-2 px-4 bg-secondary-container text-on-secondary-container rounded-lg hover:opacity-90 transition">
                                    📋 Use Template
                                </button>
                                <button className="w-full py-2 px-4 bg-tertiary-container text-on-tertiary-container rounded-lg hover:opacity-90 transition">
                                    🔄 Run CI/CD
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
