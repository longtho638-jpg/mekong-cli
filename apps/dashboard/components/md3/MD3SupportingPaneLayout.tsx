'use client';

import React from 'react';

/**
 * MD3 Supporting Pane Layout
 * Official M3 Canonical Layout: Main content + Supporting side pane
 * Reference: m3.material.io/foundations/layout/canonical-layouts/supporting-pane
 * 
 * Responsive Behavior:
 * - Expanded (>=840px): Side-by-side panes
 * - Medium (600-839px): Collapsible/Modal pane
 * - Compact (<600px): Stacked single column
 */

interface MD3SupportingPaneLayoutProps {
    mainContent: React.ReactNode;
    supportingContent: React.ReactNode;
}

export function MD3SupportingPaneLayout({
    mainContent,
    supportingContent
}: MD3SupportingPaneLayoutProps) {
    return (
        <div
            className="flex flex-col lg:flex-row h-full"
            style={{
                padding: 'var(--md-sys-layout-margin)',
                gap: 'var(--md-sys-layout-spacer-pane)'
            }}
        >
            {/* Main Pane (Flexible) */}
            <div
                className="flex-1 flex flex-col overflow-auto order-1"
                style={{
                    minWidth: 0,
                    gap: 'var(--md-sys-layout-spacer-pane)',
                }}
            >
                {mainContent}
            </div>

            {/* Supporting Pane (Fixed on Desktop, Full Width on Mobile) */}
            <aside
                className="flex-shrink-0 flex flex-col overflow-auto order-2 lg:order-2 w-full lg:w-auto"
                style={{
                    width: 'var(--md-sys-layout-pane-fixed-width)',
                    maxWidth: '100%',
                    backgroundColor: 'var(--md-sys-color-surface-container-low)',
                    borderRadius: 'var(--md-sys-shape-corner-large)',
                    padding: '16px',
                    gap: '16px',
                }}
            >
                {supportingContent}
            </aside>
        </div>
    );
}
