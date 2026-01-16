'use client';

import type { ReactNode } from 'react';
import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

/* =====================================================
   MD3 Surface - Atomic Base Container
   
   KEY INNOVATION: Auto-safe padding based on shape
   Guarantees text NEVER touches curved corners
   
   Reference: m3.material.io/styles/shape
   ===================================================== */

type ShapeSize = 'none' | 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large' | 'full';
type ElevationLevel = 0 | 1 | 2 | 3 | 4 | 5;
type SurfaceColor = 'surface' | 'surface-container-lowest' | 'surface-container-low' |
    'surface-container' | 'surface-container-high' | 'surface-container-highest' |
    'primary-container' | 'secondary-container' | 'tertiary-container' | 'error-container';

interface MD3SurfaceProps {
    /** Shape determines BOTH corner radius AND safe padding */
    shape?: ShapeSize;
    /** Surface color from M3 color system */
    color?: SurfaceColor;
    /** Elevation level (0-5) */
    elevation?: ElevationLevel;
    /** Enable hover elevation effect */
    interactive?: boolean;
    /** Additional className */
    className?: string;
    /** Content */
    children: ReactNode;
    /** Click handler */
    onClick?: () => void;
    /** Custom padding override (use sparingly) */
    padding?: string;
}

// Shape → CSS variable mapping
const shapeMap: Record<ShapeSize, { corner: string; padding: string }> = {
    'none': {
        corner: 'var(--md-sys-shape-corner-none)',
        padding: 'var(--md-sys-shape-padding-none)'
    },
    'extra-small': {
        corner: 'var(--md-sys-shape-corner-extra-small)',
        padding: 'var(--md-sys-shape-padding-extra-small)'
    },
    'small': {
        corner: 'var(--md-sys-shape-corner-small)',
        padding: 'var(--md-sys-shape-padding-small)'
    },
    'medium': {
        corner: 'var(--md-sys-shape-corner-medium)',
        padding: 'var(--md-sys-shape-padding-medium)'
    },
    'large': {
        corner: 'var(--md-sys-shape-corner-large)',
        padding: 'var(--md-sys-shape-padding-large)'
    },
    'extra-large': {
        corner: 'var(--md-sys-shape-corner-extra-large)',
        padding: 'var(--md-sys-shape-padding-extra-large)'
    },
    'full': {
        corner: 'var(--md-sys-shape-corner-full)',
        padding: 'var(--md-sys-shape-padding-full)'
    },
};

// M3 Spring transition
const m3Transition = {
    type: "spring",
    stiffness: 400,
    damping: 30,
    mass: 1
} as const;

export function MD3Surface({
    shape = 'large',
    color = 'surface-container-low',
    elevation = 0,
    interactive = false,
    className,
    children,
    onClick,
    padding,
}: MD3SurfaceProps) {
    const shapeConfig = shapeMap[shape];

    const baseStyle = {
        backgroundColor: `var(--md-sys-color-${color})`,
        borderRadius: shapeConfig.corner,
        padding: padding || shapeConfig.padding,
        boxShadow: elevation > 0 ? `var(--md-sys-elevation-level${elevation})` : undefined,
    };

    const hoverVariants = interactive ? {
        y: -2,
        boxShadow: 'var(--md-sys-elevation-level3)',
    } : {};

    return (
        <motion.div
            className={clsx(
                'relative overflow-hidden',
                interactive && 'cursor-pointer group',
                className
            )}
            style={baseStyle}
            whileHover={hoverVariants}
            whileTap={interactive ? { scale: 0.98 } : undefined}
            onClick={onClick}
        >
            {/* State Layer for interactive surfaces */}
            {interactive && (
                <div className="absolute inset-0 bg-[var(--md-sys-color-on-surface)] opacity-0 group-hover:opacity-[0.08] transition-opacity pointer-events-none" />
            )}

            {/* Content - no z-index needed since overflow is hidden */}
            <div className="relative">
                {children}
            </div>
        </motion.div>
    );
}

export default MD3Surface;
