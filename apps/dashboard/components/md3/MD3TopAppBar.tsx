'use client';

import React from 'react';
import { Menu, Search, MoreVertical } from 'lucide-react';

/**
 * MD3 Top App Bar
 * Official M3 spec: 64dp height, title, navigation icon, actions
 */

interface MD3TopAppBarProps {
    title: string;
    subtitle?: string;
    onMenuClick?: () => void;
}

export function MD3TopAppBar({ title, subtitle, onMenuClick }: MD3TopAppBarProps) {
    return (
        <header
            className="flex items-center justify-between px-4 gap-4"
            style={{
                height: '64px',  // M3 Spec: 64dp
                backgroundColor: 'var(--md-sys-color-surface)',
                borderBottom: '1px solid var(--md-sys-color-outline-variant)',
            }}
        >
            {/* Leading: Navigation Icon */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="flex items-center justify-center w-12 h-12 rounded-full transition-colors relative group"
                    style={{ color: 'var(--md-sys-color-on-surface)' }}
                >
                    {/* State Layer */}
                    <div
                        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-[0.08] transition-opacity"
                        style={{ backgroundColor: 'var(--md-sys-color-on-surface)' }}
                    />
                    <Menu size={24} />
                </button>

                {/* Title */}
                <div className="flex flex-col">
                    <h1
                        style={{
                            fontFamily: 'var(--md-sys-typescale-title-large-font)',
                            fontSize: 'var(--md-sys-typescale-title-large-size)',
                            lineHeight: 'var(--md-sys-typescale-title-large-line-height)',
                            fontWeight: 'var(--md-sys-typescale-title-large-weight)',
                            color: 'var(--md-sys-color-on-surface)',
                        }}
                    >
                        {title}
                    </h1>
                    {subtitle && (
                        <span
                            style={{
                                fontFamily: 'var(--md-sys-typescale-body-small-font)',
                                fontSize: 'var(--md-sys-typescale-body-small-size)',
                                color: 'var(--md-sys-color-on-surface-variant)',
                            }}
                        >
                            {subtitle}
                        </span>
                    )}
                </div>
            </div>

            {/* Trailing: Actions */}
            <div className="flex items-center gap-1">
                <button
                    className="flex items-center justify-center w-12 h-12 rounded-full transition-colors relative group"
                    style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                >
                    <div
                        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-[0.08] transition-opacity"
                        style={{ backgroundColor: 'var(--md-sys-color-on-surface)' }}
                    />
                    <Search size={24} />
                </button>
                <button
                    className="flex items-center justify-center w-12 h-12 rounded-full transition-colors relative group"
                    style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                >
                    <div
                        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-[0.08] transition-opacity"
                        style={{ backgroundColor: 'var(--md-sys-color-on-surface)' }}
                    />
                    <MoreVertical size={24} />
                </button>
            </div>
        </header>
    );
}
