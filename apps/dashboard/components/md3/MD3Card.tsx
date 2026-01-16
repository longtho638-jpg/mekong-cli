'use client';

import React from 'react';
import clsx from 'clsx';

export interface MD3CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'elevated' | 'filled' | 'outlined';
}

export const MD3Card = React.forwardRef<HTMLDivElement, MD3CardProps>(
    ({ className, variant = 'filled', children, ...props }, ref) => {
        
        const baseStyles = "rounded-[var(--md-sys-shape-corner-medium)] overflow-hidden p-4 transition-all duration-200 relative group";
        
        const variants = {
            elevated: "bg-[var(--md-sys-color-surface-container-low)] shadow-md hover:shadow-lg",
            filled: "bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)]",
            outlined: "bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]",
        };

        return (
            <div
                ref={ref}
                className={clsx(baseStyles, variants[variant], className)}
                {...props}
            >
                {/* State Layer */}
                <div className="absolute inset-0 bg-[var(--md-sys-color-on-surface)] opacity-0 group-hover:opacity-[var(--md-sys-state-hover-state-layer-opacity)] transition-opacity pointer-events-none" />
                <div className="relative z-10">{children}</div>
            </div>
        );
    }
);

MD3Card.displayName = "MD3Card";
