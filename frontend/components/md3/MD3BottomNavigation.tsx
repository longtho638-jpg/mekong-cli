'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * MD3 Bottom Navigation (Mobile)
 * M3 Spec: 80dp height, 3-5 destinations
 * Visible only on Compact screens (<600px)
 */

interface NavDestination {
    icon: React.ReactNode;
    label: string;
    href: string;
}

const destinations: NavDestination[] = [
    { icon: <Home size={24} />, label: 'Home', href: '/en' },
    { icon: <BarChart3 size={24} />, label: 'Revenue', href: '/en/revenue' },
    { icon: <Settings size={24} />, label: 'Settings', href: '/en/settings' },
];

export function MD3BottomNavigation() {
    const pathname = usePathname();

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 flex justify-around items-center z-50 lg:hidden"
            style={{
                height: '80px',
                backgroundColor: 'var(--md-sys-color-surface-container)',
                borderTop: '1px solid var(--md-sys-color-outline-variant)',
            }}
        >
            {destinations.map((dest) => {
                const isActive = pathname === dest.href;

                return (
                    <Link
                        key={dest.href}
                        href={dest.href}
                        className="flex flex-col items-center justify-center gap-1 flex-1 h-full relative"
                    >
                        {/* Active Indicator (Pill) */}
                        <div className="relative flex items-center justify-center w-[64px] h-[32px]">
                            {isActive && (
                                <motion.div
                                    layoutId="bottom-nav-pill"
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

                            {/* Icon */}
                            <div className="relative z-10" style={{
                                color: isActive
                                    ? 'var(--md-sys-color-on-secondary-container)'
                                    : 'var(--md-sys-color-on-surface-variant)'
                            }}>
                                {React.cloneElement(dest.icon as React.ReactElement, {
                                    strokeWidth: isActive ? 2.5 : 2,
                                    fill: isActive ? "currentColor" : "none",
                                    fillOpacity: isActive ? 0.2 : 0
                                })}
                            </div>
                        </div>

                        {/* Label */}
                        <span
                            className="text-[12px] font-medium"
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
