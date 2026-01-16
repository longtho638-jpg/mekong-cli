'use client';

import type { ReactNode } from 'react';
import React from 'react';
import { clsx } from 'clsx';

/* =====================================================
   MD3 Text - Atomic Typography Component
   
   Uses official M3 typography scale tokens
   Reference: m3.material.io/styles/typography
   ===================================================== */

type TypographyVariant =
    | 'display-large' | 'display-medium' | 'display-small'
    | 'headline-large' | 'headline-medium' | 'headline-small'
    | 'title-large' | 'title-medium' | 'title-small'
    | 'body-large' | 'body-medium' | 'body-small'
    | 'label-large' | 'label-medium' | 'label-small';

type TextColor = 'on-surface' | 'on-surface-variant' | 'primary' | 'secondary' | 'tertiary' | 'error' |
    'on-primary-container' | 'on-secondary-container' | 'on-tertiary-container' | 'on-error-container';

interface MD3TextProps {
    /** Typography variant from M3 scale */
    variant?: TypographyVariant;
    /** Text color from M3 color system */
    color?: TextColor;
    /** HTML tag to render */
    as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div' | 'label';
    /** Text transform */
    transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    /** Text alignment */
    align?: 'left' | 'center' | 'right';
    /** Truncate text with ellipsis */
    truncate?: boolean;
    /** Line clamp (number of lines before truncation) */
    lineClamp?: number;
    /** Additional className */
    className?: string;
    /** Content */
    children: ReactNode;
}

// Variant → M3 typography class mapping
const variantClasses: Record<TypographyVariant, string> = {
    'display-large': 'md-typescale-display-large',
    'display-medium': 'md-typescale-display-medium',
    'display-small': 'md-typescale-display-small',
    'headline-large': 'md-typescale-headline-large',
    'headline-medium': 'md-typescale-headline-medium',
    'headline-small': 'md-typescale-headline-small',
    'title-large': 'md-typescale-title-large',
    'title-medium': 'md-typescale-title-medium',
    'title-small': 'md-typescale-title-small',
    'body-large': 'md-typescale-body-large',
    'body-medium': 'md-typescale-body-medium',
    'body-small': 'md-typescale-body-small',
    'label-large': 'md-typescale-label-large',
    'label-medium': 'md-typescale-label-medium',
    'label-small': 'md-typescale-label-small',
};

export function MD3Text({
    variant = 'body-medium',
    color = 'on-surface',
    as: Component = 'span',
    transform = 'none',
    align = 'left',
    truncate = false,
    lineClamp,
    className,
    children,
}: MD3TextProps) {
    const textStyle: React.CSSProperties = {
        color: `var(--md-sys-color-${color})`,
        textTransform: transform !== 'none' ? transform : undefined,
        textAlign: align !== 'left' ? align : undefined,
    };

    // Line clamp style
    const lineClampStyle: React.CSSProperties = lineClamp ? {
        display: '-webkit-box',
        WebkitLineClamp: lineClamp,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
    } : {};

    return (
        <Component
            className={clsx(
                variantClasses[variant],
                truncate && 'truncate',
                className
            )}
            style={{ ...textStyle, ...lineClampStyle }}
        >
            {children}
        </Component>
    );
}

export default MD3Text;
