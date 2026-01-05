'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import {
    Search, Grid3X3, DollarSign, Megaphone, Users, Briefcase,
    Building2, Shield, Scale, Rocket, BarChart3, Settings,
    ChevronRight
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// 🗺️ NAVIGATOR - Page Index for Agency OS
// DNA: MD3AppShell + MD3SupportingPaneLayout (matches /revenue gold standard)
// ═══════════════════════════════════════════════════════════════════════════════

const PAGE_REGISTRY = {
    sales: {
        label: 'Sales & Revenue',
        icon: DollarSign,
        pages: [
            { route: 'sales', name: 'Sales Dashboard', emoji: '💰' },
            { route: 'sdr', name: 'SDR Hub', emoji: '📞' },
            { route: 'isr', name: 'Inside Sales', emoji: '🎯' },
            { route: 'osr', name: 'Outside Sales', emoji: '🚗' },
            { route: 'ae', name: 'Account Executive', emoji: '🤝' },
            { route: 'sa', name: 'Sales Admin', emoji: '📋' },
            { route: 'se', name: 'Sales Engineer', emoji: '⚙️' },
            { route: 'bdm', name: 'Business Dev', emoji: '🌱' },
            { route: 'leadgen', name: 'Lead Generation', emoji: '🧲' },
            { route: 'revenue', name: 'Revenue Ops', emoji: '📈' },
        ]
    },
    marketing: {
        label: 'Marketing',
        icon: Megaphone,
        pages: [
            { route: 'marketing', name: 'Marketing Hub', emoji: '📢' },
            { route: 'brand', name: 'Brand', emoji: '🎨' },
            { route: 'content', name: 'Content', emoji: '✍️' },
            { route: 'seo', name: 'SEO', emoji: '🔍' },
            { route: 'ppc', name: 'PPC', emoji: '💸' },
            { route: 'email', name: 'Email', emoji: '📧' },
            { route: 'social', name: 'Social', emoji: '📱' },
            { route: 'pr', name: 'PR', emoji: '📰' },
            { route: 'media', name: 'Media', emoji: '🎬' },
            { route: 'influencer', name: 'Influencer', emoji: '⭐' },
            { route: 'campaigns', name: 'Campaigns', emoji: '🎪' },
            { route: 'paidsocial', name: 'Paid Social', emoji: '💎' },
            { route: 'digitalmarketing', name: 'Digital Marketing', emoji: '🌐' },
            { route: 'contentmarketing', name: 'Content Marketing', emoji: '📝' },
            { route: 'b2bcontent', name: 'B2B Content', emoji: '🏢' },
            { route: 'b2bmarketing', name: 'B2B Marketing', emoji: '🤝' },
            { route: 'marketingmanager', name: 'Marketing Manager', emoji: '👔' },
            { route: 'productmarketing', name: 'Product Marketing', emoji: '📦' },
            { route: 'creative', name: 'Creative', emoji: '🎭' },
            { route: 'copy', name: 'Copywriting', emoji: '✒️' },
        ]
    },
    hr: {
        label: 'HR & People',
        icon: Users,
        pages: [
            { route: 'hr', name: 'HR Dashboard', emoji: '👥' },
            { route: 'hris', name: 'HRIS', emoji: '💾' },
            { route: 'hranalytics', name: 'HR Analytics', emoji: '📊' },
            { route: 'recruiter', name: 'Recruiter', emoji: '🎯' },
            { route: 'compben', name: 'Comp & Benefits', emoji: '💵' },
            { route: 'ld', name: 'L&D', emoji: '📚' },
            { route: 'er', name: 'Employee Relations', emoji: '🤝' },
            { route: 'learning', name: 'Learning', emoji: '🎓' },
        ]
    },
    operations: {
        label: 'Operations',
        icon: Briefcase,
        pages: [
            { route: 'operations', name: 'Operations', emoji: '⚙️' },
            { route: 'admin', name: 'Admin Dashboard', emoji: '🎛️' },
            { route: 'agentops', name: 'Agent Ops', emoji: '🤖' },
            { route: 'projects', name: 'Projects', emoji: '📋' },
            { route: 'calendar', name: 'Calendar', emoji: '📅' },
            { route: 'documents', name: 'Documents', emoji: '📄' },
            { route: 'it', name: 'IT', emoji: '💻' },
            { route: 'support', name: 'Support', emoji: '🆘' },
            { route: 'inventory', name: 'Inventory', emoji: '📦' },
            { route: 'costs', name: 'Costs', emoji: '💰' },
            { route: 'finops', name: 'FinOps', emoji: '📈' },
        ]
    },
    vc: {
        label: 'VC & Startup',
        icon: Building2,
        pages: [
            { route: 'vc/portfolio', name: 'VC Portfolio', emoji: '💼' },
            { route: 'vc/dealflow', name: 'Deal Flow', emoji: '🔄' },
            { route: 'vc/cap-table', name: 'Cap Table', emoji: '📊' },
            { route: 'vc/valuation', name: 'Valuation', emoji: '💎' },
            { route: 'startup', name: 'Startup', emoji: '🚀' },
            { route: 'entrepreneur', name: 'Entrepreneur', emoji: '💡' },
            { route: 'portfolio', name: 'Portfolio', emoji: '📁' },
            { route: 'realestate', name: 'Real Estate', emoji: '🏠' },
        ]
    },
    strategy: {
        label: 'Strategy',
        icon: Shield,
        pages: [
            { route: 'guild', name: 'Guild HQ', emoji: '🏯' },
            { route: 'binhphap', name: 'Binh Pháp', emoji: '⚔️' },
            { route: 'warroom', name: 'War Room', emoji: '🎖️' },
            { route: 'defense', name: 'Defense', emoji: '🛡️' },
            { route: 'shield', name: 'Shield', emoji: '🔰' },
            { route: 'executive', name: 'Executive', emoji: '👔' },
        ]
    },
    legal: {
        label: 'Legal & Finance',
        icon: Scale,
        pages: [
            { route: 'legal', name: 'Legal', emoji: '⚖️' },
            { route: 'tax', name: 'Tax', emoji: '🧾' },
            { route: 'ip', name: 'IP', emoji: '©️' },
            { route: 'security', name: 'Security', emoji: '🔒' },
            { route: 'pricing', name: 'Pricing', emoji: '💲' },
        ]
    },
    products: {
        label: 'Products',
        icon: Rocket,
        pages: [
            { route: 'product', name: 'Product', emoji: '📦' },
            { route: 'ecommerce', name: 'E-Commerce', emoji: '🛒' },
            { route: 'amazonfba', name: 'Amazon FBA', emoji: '📦' },
            { route: 'retail', name: 'Retail', emoji: '🏪' },
            { route: 'crm', name: 'CRM', emoji: '👤' },
            { route: 'abm', name: 'ABM', emoji: '🎯' },
        ]
    },
    data: {
        label: 'Data & Analytics',
        icon: BarChart3,
        pages: [
            { route: 'data', name: 'Data', emoji: '📊' },
            { route: 'analytics', name: 'Analytics', emoji: '📈' },
            { route: 'research', name: 'Research', emoji: '🔬' },
        ]
    },
    system: {
        label: 'System',
        icon: Settings,
        pages: [
            { route: 'settings', name: 'Settings', emoji: '⚙️' },
            { route: 'landing', name: 'Landing', emoji: '🏠' },
            { route: 'showcase', name: 'Showcase', emoji: '✨' },
            { route: 'assistant', name: 'Assistant', emoji: '🤖' },
            { route: 'events', name: 'Events', emoji: '🎉' },
            { route: 'success', name: 'Success', emoji: '🏆' },
            { route: 'client-portal', name: 'Client Portal', emoji: '🚪' },
            { route: 'agency-portal', name: 'Agency Portal', emoji: '🏢' },
            { route: 'hubs', name: 'Hubs', emoji: '🔗' },
            { route: 'sm', name: 'SM', emoji: '📱' },
        ]
    },
};

const CATEGORIES = [
    { id: 'all', label: 'All Pages', icon: Grid3X3 },
    ...Object.entries(PAGE_REGISTRY).map(([id, cat]) => ({
        id,
        label: cat.label,
        icon: cat.icon,
    })),
];

export default function NavigatorPage({ params: { locale } }: { params: { locale: string } }) {
    const { analytics, loading, projects, clients } = useAnalytics();
    // Derive KPIs from real Supabase data
    const kpi1 = analytics.totalRevenue;
    const kpi2 = analytics.activeClients;
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    // Flatten all pages
    const allPages = useMemo(() => {
        const pages: Array<{ route: string; name: string; emoji: string; category: string }> = [];
        Object.entries(PAGE_REGISTRY).forEach(([catId, cat]) => {
            cat.pages.forEach(page => {
                pages.push({ ...page, category: catId });
            });
        });
        return pages;
    }, []);

    // Filter pages
    const filteredPages = useMemo(() => {
        let pages = activeCategory === 'all'
            ? allPages
            : PAGE_REGISTRY[activeCategory as keyof typeof PAGE_REGISTRY]?.pages.map(p => ({
                ...p,
                category: activeCategory,
            })) || [];

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            pages = pages.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.route.toLowerCase().includes(q)
            );
        }
        return pages;
    }, [activeCategory, searchQuery, allPages]);

    const navigateToPage = (route: string) => {
        router.push(`/${locale}/${route}`);
    };

    return (
        <MD3AppShell title="Navigator" subtitle="Page Index">
            <MD3SupportingPaneLayout
                mainContent={
                    <>
                        {/* Search Bar */}
                        <MD3Card>
                            <div
                                className="flex items-center"
                                style={{
                                    gap: 'var(--md-sys-spacing-icon-text-default, 12px)',
                                    padding: '8px 0'
                                }}
                            >
                                <Search
                                    className="w-5 h-5"
                                    style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                                />
                                <input
                                    type="text"
                                    placeholder="Search pages..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        flex: 1,
                                        background: 'transparent',
                                        border: 'none',
                                        outline: 'none',
                                        color: 'var(--md-sys-color-on-surface)',
                                        fontSize: 'var(--md-sys-typescale-body-large-size)',
                                    }}
                                />
                                <span
                                    style={{
                                        color: 'var(--md-sys-color-primary)',
                                        fontSize: 'var(--md-sys-typescale-label-medium-size)',
                                        fontWeight: 500
                                    }}
                                >
                                    {filteredPages.length} pages
                                </span>
                            </div>
                        </MD3Card>

                        {/* Page Grid */}
                        <div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                            style={{ gap: 'var(--md-sys-spacing-gap-lg, 16px)' }}
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredPages.map((page, index) => (
                                    <motion.div
                                        key={page.route}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2, delay: index * 0.015 }}
                                    >
                                        <button
                                            onClick={() => navigateToPage(page.route)}
                                            className="w-full text-left group"
                                            style={{
                                                padding: '16px',
                                                borderRadius: 'var(--md-sys-shape-corner-large, 16px)',
                                                backgroundColor: 'var(--md-sys-color-surface-container)',
                                                border: '1px solid var(--md-sys-color-outline-variant)',
                                                transition: 'all 0.2s ease',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-high)';
                                                e.currentTarget.style.borderColor = 'var(--md-sys-color-primary)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container)';
                                                e.currentTarget.style.borderColor = 'var(--md-sys-color-outline-variant)';
                                            }}
                                        >
                                            <div
                                                className="flex items-start justify-between"
                                                style={{ gap: 'var(--md-sys-spacing-gap-sm, 8px)' }}
                                            >
                                                <div className="flex items-center" style={{ gap: '12px' }}>
                                                    <span className="text-2xl">{page.emoji}</span>
                                                    <div>
                                                        <div style={{
                                                            color: 'var(--md-sys-color-on-surface)',
                                                            fontSize: 'var(--md-sys-typescale-title-medium-size)',
                                                            fontWeight: 500,
                                                        }}>
                                                            {page.name}
                                                        </div>
                                                        <div style={{
                                                            color: 'var(--md-sys-color-on-surface-variant)',
                                                            fontSize: 'var(--md-sys-typescale-body-small-size)',
                                                        }}>
                                                            /{page.route}
                                                        </div>
                                                    </div>
                                                </div>
                                                <ChevronRight
                                                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                                                    style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                                                />
                                            </div>
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Empty State */}
                        {filteredPages.length === 0 && (
                            <MD3Card>
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-4">🔍</div>
                                    <div style={{
                                        color: 'var(--md-sys-color-on-surface)',
                                        fontSize: 'var(--md-sys-typescale-title-medium-size)',
                                    }}>
                                        No pages found
                                    </div>
                                    <div style={{
                                        color: 'var(--md-sys-color-on-surface-variant)',
                                        fontSize: 'var(--md-sys-typescale-body-medium-size)',
                                    }}>
                                        Try a different search term
                                    </div>
                                </div>
                            </MD3Card>
                        )}
                    </>
                }
                supportingContent={
                    <>
                        {/* Category Filter */}
                        <MD3Card headline="Categories" subhead="Filter by department">
                            <div
                                className="flex flex-col"
                                style={{ gap: 'var(--md-sys-spacing-gap-sm, 8px)' }}
                            >
                                {CATEGORIES.map((cat) => {
                                    const Icon = cat.icon;
                                    const isActive = activeCategory === cat.id;
                                    const count = cat.id === 'all'
                                        ? allPages.length
                                        : PAGE_REGISTRY[cat.id as keyof typeof PAGE_REGISTRY]?.pages.length || 0;

                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategory(cat.id)}
                                            className="flex items-center justify-between w-full"
                                            style={{
                                                padding: '12px 16px',
                                                borderRadius: 'var(--md-sys-shape-corner-medium, 12px)',
                                                backgroundColor: isActive
                                                    ? 'var(--md-sys-color-primary-container)'
                                                    : 'transparent',
                                                color: isActive
                                                    ? 'var(--md-sys-color-on-primary-container)'
                                                    : 'var(--md-sys-color-on-surface)',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            <div
                                                className="flex items-center"
                                                style={{ gap: 'var(--md-sys-spacing-icon-text-default, 12px)' }}
                                            >
                                                <Icon className="w-5 h-5" />
                                                <span style={{
                                                    fontSize: 'var(--md-sys-typescale-label-large-size)',
                                                    fontWeight: 500
                                                }}>
                                                    {cat.label}
                                                </span>
                                            </div>
                                            <span style={{
                                                fontSize: 'var(--md-sys-typescale-label-small-size)',
                                                opacity: 0.8
                                            }}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </MD3Card>

                        {/* Quick Stats */}
                        <MD3Card headline="Overview" subhead="Page Statistics">
                            <div
                                className="flex flex-col"
                                style={{ gap: 'var(--md-sys-spacing-gap-sm, 8px)' }}
                            >
                                <div className="flex justify-between items-center">
                                    <span style={{
                                        color: 'var(--md-sys-color-on-surface-variant)',
                                        fontSize: 'var(--md-sys-typescale-body-medium-size)'
                                    }}>
                                        Total Pages
                                    </span>
                                    <span style={{
                                        color: 'var(--md-sys-color-primary)',
                                        fontWeight: 600,
                                        fontSize: 'var(--md-sys-typescale-title-medium-size)'
                                    }}>
                                        {allPages.length}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span style={{
                                        color: 'var(--md-sys-color-on-surface-variant)',
                                        fontSize: 'var(--md-sys-typescale-body-medium-size)'
                                    }}>
                                        Categories
                                    </span>
                                    <span style={{
                                        color: 'var(--md-sys-color-tertiary)',
                                        fontWeight: 600,
                                        fontSize: 'var(--md-sys-typescale-title-medium-size)'
                                    }}>
                                        {Object.keys(PAGE_REGISTRY).length}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span style={{
                                        color: 'var(--md-sys-color-on-surface-variant)',
                                        fontSize: 'var(--md-sys-typescale-body-medium-size)'
                                    }}>
                                        Filtered
                                    </span>
                                    <span style={{
                                        color: 'var(--md-sys-color-on-surface)',
                                        fontWeight: 600,
                                        fontSize: 'var(--md-sys-typescale-title-medium-size)'
                                    }}>
                                        {filteredPages.length}
                                    </span>
                                </div>
                            </div>
                        </MD3Card>
                    </>
                }
            />
        </MD3AppShell>
    );
}
