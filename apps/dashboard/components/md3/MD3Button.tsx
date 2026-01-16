'use client';

import React from 'react';
import clsx from 'clsx';

export interface MD3ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'filled' | 'outlined' | 'text' | 'elevated' | 'tonal';
    icon?: React.ReactNode;
}

export const MD3Button = React.forwardRef<HTMLButtonElement, MD3ButtonProps>(
    ({ className, variant = 'filled', icon, children, ...props }, ref) => {
        
        const baseStyles = "relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full overflow-hidden transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none m3-label-large";
        
        const variants = {
            filled: "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:bg-[var(--md-sys-color-primary)]/90 hover:shadow-lg",
            outlined: "border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary)]/10",
            text: "text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary)]/10 px-4",
            elevated: "bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-primary)] shadow-md hover:bg-[var(--md-sys-color-surface-container)] hover:shadow-lg",
            tonal: "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:bg-[var(--md-sys-color-secondary-container)]/80 hover:shadow-sm",
        };

        return (
            <button
                ref={ref}
                className={clsx(baseStyles, variants[variant], className)}
                {...props}
            >
                {/* State Layer (Ripple Effect placeholder) */}
                <div className="absolute inset-0 opacity-0 hover:opacity-[var(--md-sys-state-hover-state-layer-opacity)] bg-current transition-opacity pointer-events-none" />
                
                {icon && <span className="w-4 h-4">{icon}</span>}
                <span className="relative z-10">{children}</span>
            </button>
        );
    }
);

MD3Button.displayName = "MD3Button";
