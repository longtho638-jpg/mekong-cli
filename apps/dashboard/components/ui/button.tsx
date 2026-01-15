'use client';

import * as React from 'react';
import { clsx } from 'clsx';

/* =====================================================
   MD3 Button - Pure M3 Implementation
   Replaces: @radix-ui/react-slot
   Reference: m3.material.io/components/buttons
   ===================================================== */

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'outlined' | 'text' | 'elevated' | 'tonal';
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'filled', children, ...props }, ref) => {
    const baseStyles = `
            inline-flex items-center justify-center gap-2
            rounded-full px-6 h-10
            font-medium transition-all duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
            disabled:opacity-50 disabled:pointer-events-none
        `;

    const variantStyles = {
      filled: `
                bg-[var(--md-sys-color-primary)]
                text-[var(--md-sys-color-on-primary)]
                hover:shadow-md hover:brightness-110
            `,
      outlined: `
                border border-[var(--md-sys-color-outline)]
                text-[var(--md-sys-color-primary)]
                hover:bg-[var(--md-sys-color-primary)]/10
            `,
      text: `
                text-[var(--md-sys-color-primary)]
                hover:bg-[var(--md-sys-color-primary)]/10
            `,
      elevated: `
                bg-[var(--md-sys-color-surface-container-low)]
                text-[var(--md-sys-color-primary)]
                shadow-md
                hover:shadow-lg
            `,
      tonal: `
                bg-[var(--md-sys-color-secondary-container)]
                text-[var(--md-sys-color-on-secondary-container)]
                hover:brightness-105
            `,
    };

    return (
      <button
        ref={ref}
        className={clsx(baseStyles, variantStyles[variant], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button as button };
