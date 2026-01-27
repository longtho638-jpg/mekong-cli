'use client';

import React from 'react';
import clsx from 'clsx';

export interface MD3TopAppBarProps {
    title: string;
    leadingIcon?: React.ReactNode;
    trailingIcons?: React.ReactNode[];
    scrollBehavior?: 'center' | 'small' | 'medium' | 'large';
}

export const MD3TopAppBar = ({ title, leadingIcon, trailingIcons, scrollBehavior = 'small' }: MD3TopAppBarProps) => {
    return (
        <header className="bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] px-4 py-3 flex items-center justify-between sticky top-0 z-50 transition-all duration-200 border-b border-[var(--md-sys-color-surface-container-highest)]">
            <div className="flex items-center gap-4">
                {leadingIcon && (
                    <button className="p-2 rounded-full hover:bg-[var(--md-sys-color-on-surface)]/10 transition-colors">
                        {leadingIcon}
                    </button>
                )}
                <h1 className={clsx(
                    "text-[var(--md-sys-color-on-surface)]",
                    scrollBehavior === 'large' ? 'm3-headline-large' : 'm3-title-large font-medium text-lg'
                )}>
                    {title}
                </h1>
            </div>
            <div className="flex items-center gap-2">
                {trailingIcons?.map((icon, idx) => (
                    <button key={idx} className="p-2 rounded-full hover:bg-[var(--md-sys-color-on-surface)]/10 transition-colors text-[var(--md-sys-color-on-surface-variant)]">
                        {icon}
                    </button>
                ))}
            </div>
        </header>
    );
};
