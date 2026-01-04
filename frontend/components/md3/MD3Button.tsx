'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * 🔘 MD3 Button Component
 * 
 * True Material Design 3 Button with:
 * - 5 variants: Filled, Tonal, Elevated, Outlined, Text
 * - Proper state layers
 * - Spring motion
 * - Loading state
 * 
 * Based on: https://m3.material.io/components/buttons/overview
 */

export type MD3ButtonVariant = 'filled' | 'tonal' | 'elevated' | 'outlined' | 'text';
export type MD3ButtonSize = 'small' | 'medium' | 'large';

export interface MD3ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
    variant?: MD3ButtonVariant;
    size?: MD3ButtonSize;
    loading?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    children: React.ReactNode;
}

const variantStyles: Record<MD3ButtonVariant, string> = {
    filled: `
        bg-[var(--md-sys-color-primary)]
        text-[var(--md-sys-color-on-primary)]
        hover:shadow-[var(--md-sys-elevation-1)]
    `,
    tonal: `
        bg-[var(--md-sys-color-secondary-container)]
        text-[var(--md-sys-color-on-secondary-container)]
    `,
    elevated: `
        bg-[var(--md-sys-color-surface-container-low)]
        text-[var(--md-sys-color-primary)]
        shadow-[var(--md-sys-elevation-1)]
        hover:shadow-[var(--md-sys-elevation-2)]
    `,
    outlined: `
        bg-transparent
        text-[var(--md-sys-color-primary)]
        border border-[var(--md-sys-color-outline)]
        hover:bg-[var(--md-sys-color-primary)]/[0.08]
    `,
    text: `
        bg-transparent
        text-[var(--md-sys-color-primary)]
        hover:bg-[var(--md-sys-color-primary)]/[0.08]
    `,
};

const sizeStyles: Record<MD3ButtonSize, string> = {
    small: 'h-9 px-4 text-sm gap-1.5',
    medium: 'h-10 px-6 text-sm gap-2',
    large: 'h-12 px-8 text-base gap-2.5',
};

export const MD3Button = forwardRef<HTMLButtonElement, MD3ButtonProps>(
    ({
        variant = 'filled',
        size = 'medium',
        loading = false,
        icon,
        iconPosition = 'left',
        className,
        children,
        disabled,
        ...props
    }, ref) => {
        const baseStyles = `
            relative
            inline-flex
            items-center
            justify-center
            font-medium
            rounded-[var(--md-sys-shape-corner-full)]
            overflow-hidden
            transition-all
            duration-[var(--md-sys-motion-duration-short4)]
            disabled:opacity-38
            disabled:pointer-events-none
        `;

        return (
            <motion.button
                ref={ref}
                className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)}
                disabled={disabled || loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                {...props}
            >
                {/* State layer */}
                <span className="absolute inset-0 bg-current opacity-0 hover:opacity-[0.08] focus:opacity-[0.12] active:opacity-[0.12] transition-opacity pointer-events-none" />

                {/* Content */}
                <span className="relative z-10 flex items-center gap-inherit">
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : icon && iconPosition === 'left' ? (
                        icon
                    ) : null}

                    {children}

                    {!loading && icon && iconPosition === 'right' && icon}
                </span>
            </motion.button>
        );
    }
);

MD3Button.displayName = 'MD3Button';

// Quick access variants
export const MD3FilledButton = forwardRef<HTMLButtonElement, Omit<MD3ButtonProps, 'variant'>>(
    (props, ref) => <MD3Button ref={ref} variant="filled" {...props} />
);
MD3FilledButton.displayName = 'MD3FilledButton';

export const MD3TonalButton = forwardRef<HTMLButtonElement, Omit<MD3ButtonProps, 'variant'>>(
    (props, ref) => <MD3Button ref={ref} variant="tonal" {...props} />
);
MD3TonalButton.displayName = 'MD3TonalButton';

export const MD3OutlinedButton = forwardRef<HTMLButtonElement, Omit<MD3ButtonProps, 'variant'>>(
    (props, ref) => <MD3Button ref={ref} variant="outlined" {...props} />
);
MD3OutlinedButton.displayName = 'MD3OutlinedButton';

export const MD3TextButton = forwardRef<HTMLButtonElement, Omit<MD3ButtonProps, 'variant'>>(
    (props, ref) => <MD3Button ref={ref} variant="text" {...props} />
);
MD3TextButton.displayName = 'MD3TextButton';

export default MD3Button;
