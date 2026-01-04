'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * MD3 Skeleton Loaders - Premium Loading States
 * 
 * Shimmer animation with MD3 styling for WOW loading UX
 */

interface MD3SkeletonProps {
    className?: string;
    /** Width - can be 'full', 'half', or custom */
    width?: string | 'full' | 'half' | 'quarter';
    /** Height in pixels or tailwind class */
    height?: string;
    /** Shape of skeleton */
    shape?: 'rectangle' | 'circle' | 'rounded';
}

const shimmerVariants = {
    initial: { x: '-100%' },
    animate: {
        x: '100%',
        transition: {
            repeat: Infinity,
            duration: 1.5,
            ease: 'linear',
        },
    },
};

export function MD3Skeleton({
    className = "",
    width = 'full',
    height = 'h-4',
    shape = 'rounded',
}: MD3SkeletonProps) {
    const widthClass = width === 'full' ? 'w-full' :
        width === 'half' ? 'w-1/2' :
            width === 'quarter' ? 'w-1/4' : width;

    const shapeClass = shape === 'circle' ? 'rounded-full' :
        shape === 'rounded' ? 'rounded-lg' : 'rounded-none';

    return (
        <div
            className={`relative overflow-hidden bg-white/5 ${widthClass} ${height} ${shapeClass} ${className}`}
            style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)' }}
        >
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: 'linear',
                }}
            />
        </div>
    );
}

/**
 * MD3 Card Skeleton - For dashboard cards
 */
export function MD3CardSkeleton({ className = "" }: { className?: string }) {
    return (
        <div
            className={`rounded-xl p-6 ${className}`}
            style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)' }}
        >
            <div className="flex items-center justify-between mb-4">
                <MD3Skeleton width="w-24" height="h-3" />
                <MD3Skeleton width="w-6" height="h-6" shape="circle" />
            </div>
            <MD3Skeleton width="w-32" height="h-8" className="mb-2" />
            <MD3Skeleton width="w-20" height="h-3" />
        </div>
    );
}

/**
 * MD3 Chart Skeleton - For chart containers
 */
export function MD3ChartSkeleton({ className = "", height = "h-64" }: { className?: string; height?: string }) {
    return (
        <div
            className={`rounded-xl p-6 ${className}`}
            style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)' }}
        >
            <MD3Skeleton width="w-40" height="h-5" className="mb-6" />
            <div className={`${height} flex items-end justify-around gap-2`}>
                {Array.from({ length: 8 }).map((_, i) => (
                    <MD3Skeleton
                        key={i}
                        width="w-8"
                        height={`h-${Math.floor(Math.random() * 40) + 20}%`}
                        className="flex-1"
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * MD3 Table Skeleton - For data tables
 */
export function MD3TableSkeleton({ rows = 5, className = "" }: { rows?: number; className?: string }) {
    return (
        <div
            className={`rounded-xl p-6 ${className}`}
            style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)' }}
        >
            <MD3Skeleton width="w-48" height="h-5" className="mb-6" />
            <div className="space-y-3">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <MD3Skeleton width="w-8" height="h-8" shape="circle" />
                        <MD3Skeleton width="w-32" height="h-4" />
                        <MD3Skeleton width="w-24" height="h-4" className="ml-auto" />
                        <MD3Skeleton width="w-16" height="h-6" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * MD3 Dashboard Skeleton - Full dashboard loading state
 */
export function MD3DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <MD3CardSkeleton key={i} />
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MD3ChartSkeleton />
                <MD3ChartSkeleton />
            </div>

            {/* Table */}
            <MD3TableSkeleton rows={5} />
        </div>
    );
}

export default MD3Skeleton;
