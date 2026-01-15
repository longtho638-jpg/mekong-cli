'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, Settings, Plus, Megaphone, ShoppingCart, Users, LayoutGrid, Command, Contact, UsersRound } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * MD3 Navigation Rail (Google Standard) - GLOBAL OS SHELL
 * Features:
 * - 80dp width
 * - 56x32dp Active Pill (Elastic Animation)
 * - Filled Icons for Active State
 * - GLOBAL: Same destinations on ALL pages for OS consistency
 */

interface NavDestination {
    icon: React.ReactNode;
    label: string;
    href: string;
}

const destinations: NavDestination[] = [
    { icon: <LayoutGrid size={24} />, label: 'Nav', href: '/en/navigator' },
    { icon: <BarChart3 size={24} />, label: 'Revenue', href: '/en/revenue' },
    { icon: <Contact size={24} />, label: 'CRM', href: '/en/crm' },
    { icon: <UsersRound size={24} />, label: 'Team', href: '/en/team' },
    { icon: <Settings size={24} />, label: 'Settings', href: '/en/settings' },
];

export function MD3NavigationRail() {
    const pathname = usePathname();

    return (
        <nav
            className="fixed left-0 top-0 h-full flex flex-col items-center py-4 gap-3 z-50 bg-[var(--md-sys-color-surface-container-low)]"
            style={{
                width: '80px',
                borderRight: '1px solid var(--md-sys-color-outline-variant)',
            }}
        >
            {/* FAB */}
            <button
                className="flex items-center justify-center rounded-[16px] mb-4 transition-all hover:scale-105 active:scale-95"
                style={{
                    width: '56px',
                    height: '56px',
                    backgroundColor: 'var(--md-sys-color-primary-container)',
                    color: 'var(--md-sys-color-on-primary-container)',
                    boxShadow: 'var(--md-sys-elevation-level3)',
                }}
            >
                <Plus size={24} />
            </button>

            {/* Divider */}
            <div className="w-8 h-[1px] mb-2 bg-[var(--md-sys-color-outline-variant)]" />

            {/* Destinations */}
            {destinations.map((dest) => {
                const isActive = pathname === dest.href;

                return (
                    <Link
                        key={dest.href}
                        href={dest.href}
                        className="flex flex-col items-center gap-1 group relative w-14"
                    >
                        {/* 1. Icon Container (32px height) */}
                        <div className="relative flex items-center justify-center w-[56px] h-[32px]">

                            {/* ACTIVE PILL (Layout Animation) */}
                            {isActive && (
                                <motion.div
                                    layoutId="active-pill"
                                    className="absolute inset-0 rounded-[16px]"
                                    style={{
                                        backgroundColor: 'var(--md-sys-color-secondary-container)',
                                    }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 30
                                    }}
                                />
                            )}

                            {/* STATE LAYER (Hover) */}
                            <div className="absolute inset-0 rounded-[16px] bg-[var(--md-sys-color-on-surface)] opacity-0 group-hover:opacity-[0.08] transition-opacity" />

                            {/* ICON */}
                            <div className="relative z-10" style={{
                                color: isActive
                                    ? 'var(--md-sys-color-on-secondary-container)'
                                    : 'var(--md-sys-color-on-surface-variant)'
                            }}>
                                {/* Simulate "Filled" state with thicker stroke when active */}
                                {React.cloneElement(dest.icon as React.ReactElement, {
                                    strokeWidth: isActive ? 2.5 : 2,
                                    fill: isActive ? "currentColor" : "none",
                                    fillOpacity: isActive ? 0.2 : 0
                                })}
                            </div>
                        </div>

                        {/* Label */}
                        <span
                            className="text-[11px] font-medium tracking-wide text-center truncate w-full"
                            style={{
                                color: isActive
                                    ? 'var(--md-sys-color-on-surface)'
                                    : 'var(--md-sys-color-on-surface-variant)',
                                fontFamily: 'var(--font-outfit)',
                            }}
                        >
                            {dest.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
