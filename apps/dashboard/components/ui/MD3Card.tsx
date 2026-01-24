'use client';

import React, { type ReactNode } from 'react';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import { MD3Text } from '@/components/md3-dna/MD3Text';

/* =====================================================
   MD3 Card - Built on MD3Surface DNA
   
   Uses MD3Surface for auto-safe padding
   Text NEVER touches curved corners
   
   Reference: m3.material.io/components/cards
   ===================================================== */

interface MD3CardProps {
    /** Card shape (controls corner radius AND padding) */
    shape?: 'small' | 'medium' | 'large' | 'extra-large';
    /** Headline text */
    headline?: ReactNode;
    /** Subhead text */
    subhead?: ReactNode;
    /** Supporting text / main content */
    supportingText?: ReactNode;
    /** Action buttons */
    actions?: ReactNode;
    /** Enable hover effect */
    interactive?: boolean;
    /** Click handler */
    onClick?: () => void;
    /** Additional className */
    className?: string;
    /** Children content (alternative to supportingText) */
    children?: ReactNode;
}

export function MD3Card({
    shape = 'large',
    headline,
    subhead,
    supportingText,
    actions,
    interactive = true,
    onClick,
    className,
    children,
}: MD3CardProps) {
    return (
        <MD3Surface
            shape={shape}
            color="surface-container-low"
            interactive={interactive}
            onClick={onClick}
            className={className}
        >
            {/* Header */}
            {(headline || subhead) && (
                <div className="flex flex-col gap-1 mb-3">
                    {headline && (
                        typeof headline === 'string'
                            ? <MD3Text variant="title-medium" color="on-surface">{headline}</MD3Text>
                            : headline
                    )}
                    {subhead && (
                        typeof subhead === 'string'
                            ? <MD3Text variant="body-small" color="on-surface-variant">{subhead}</MD3Text>
                            : subhead
                    )}
                </div>
            )}

            {/* Content */}
            {(children || supportingText) && (
                <div className="flex flex-col gap-2">
                    {children || supportingText}
                </div>
            )}

            {/* Actions */}
            {actions && (
                <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
                    {actions}
                </div>
            )}
        </MD3Surface>
    );
}

export default MD3Card;
