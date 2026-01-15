'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MD3NavigationRail } from './MD3NavigationRail';
import { MD3TopAppBar } from './MD3TopAppBar';
import { MD3BottomNavigation } from './MD3BottomNavigation';
import { clsx } from 'clsx';

/**
 * 🏗️ MD3 App Shell v2.0
 * 
 * Global Layout Architecture supporting two distinct modes:
 * 
 * 1. APPLICATION MODE (default):
 *    - Fixed Navigation Rail (Desktop) / Bottom Nav (Mobile)
 *    - Top App Bar
 *    - Fluid Container (100% width)
 *    - Container Scrolling (Gmail-style)
 * 
 * 2. MARKETING MODE:
 *    - No Navigation Rail
 *    - Window Scrolling (Standard Website)
 *    - Centered Container (max-w-7xl)
 *    - Immersive Background
 */

interface MD3AppShellProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    variant?: 'application' | 'marketing';
}

export function MD3AppShell({
    children,
    title,
    subtitle,
    variant = 'application'
}: MD3AppShellProps) {
    const isApp = variant === 'application';

    // marketing mode uses the window scroll, so no fixed height wrapper
    const wrapperClass = isApp
        ? "h-screen overflow-hidden flex"
        : "min-h-screen flex flex-col";

    return (
        <div
            className={wrapperClass}
            style={{
                backgroundColor: 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface)',
            }}
        >
            {/* === APPLICATION MODE: NAVIGATION === */}
            {isApp && (
                <>
                    {/* Navigation Rail (Desktop) */}
                    <div className="hidden lg:block z-50">
                        <MD3NavigationRail />
                    </div>
                </>
            )}

            {/* === MAIN LAYOUT === */}
            <div
                className="flex-1 flex flex-col min-w-0"
                style={{
                    // App mode needs offset for Rail
                    paddingLeft: isApp ? 'var(--md-app-shell-content-offset, 0px)' : '0px',
                }}
            >
                {/* Top App Bar (Rendered if title is provided) */}
                {isApp && title && <MD3TopAppBar title={title} subtitle={subtitle} />}

                {/* Content Area */}
                <main
                    className={clsx(
                        "flex-1 relative",
                        isApp ? "overflow-y-auto overflow-x-hidden" : "", // App scrolls here
                        !isApp && "w-full" // Marketing takes full width
                    )}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={variant} // Remount on variant change
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                            }}
                            className={clsx(
                                "h-full",
                                // Marketing mode centers content properly
                                !isApp && "max-w-[1440px] mx-auto"
                            )}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* Bottom Navigation (Mobile App Only) */}
            {isApp && (
                <div className="lg:hidden z-50">
                    <MD3BottomNavigation />
                </div>
            )}
        </div>
    );
}
