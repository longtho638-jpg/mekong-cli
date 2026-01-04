'use client';

/**
 * 🎴 MD3 Card Component (Consolidated)
 * 
 * This file re-exports from the DNA-compliant implementation
 * for backwards compatibility. Use `@/components/ui/MD3Card` directly
 * for new code.
 * 
 * The canonical implementation uses MD3Surface for proper
 * padding safety and MD3 token compliance.
 */

// Re-export the DNA-compliant MD3Card as the default
export { MD3Card as default, MD3Card } from '@/components/ui/MD3Card';

// Keep the motion-based variants for specialized use cases
import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { motion, HTMLMotionProps } from 'framer-motion';

export type MD3CardVariant = 'elevated' | 'filled' | 'outlined';

export interface MD3CardMotionProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
    variant?: MD3CardVariant;
    interactive?: boolean;
    children: React.ReactNode;
}

// MD3 Card variant styles
const variantStyles: Record<MD3CardVariant, string> = {
    elevated: `
        bg-[var(--md-sys-color-surface-container-low)]
        shadow-[var(--md-sys-elevation-1)]
        hover:shadow-[var(--md-sys-elevation-2)]
    `,
    filled: `
        bg-[var(--md-sys-color-surface-container-highest)]
    `,
    outlined: `
        bg-[var(--md-sys-color-surface)]
        border border-[var(--md-sys-color-outline-variant)]
    `,
};

/**
 * Motion-enabled MD3 Card for animated use cases.
 * For standard cards, use the default export.
 */
export const MD3CardMotion = forwardRef<HTMLDivElement, MD3CardMotionProps>(
    ({ variant = 'elevated', interactive = true, className, children, ...props }, ref) => {
        const baseStyles = `
            relative
            rounded-[var(--md-sys-shape-corner-medium)]
            p-6
            overflow-hidden
            transition-all
            duration-[var(--md-sys-motion-duration-medium2)]
        `;

        const interactiveStyles = interactive ? `
            cursor-pointer
            hover:scale-[1.01]
            active:scale-[0.99]
        ` : '';

        return (
            <motion.div
                ref={ref}
                className={clsx(baseStyles, variantStyles[variant], interactiveStyles, className)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30
                }}
                whileHover={interactive ? { y: -4 } : undefined}
                whileTap={interactive ? { scale: 0.98 } : undefined}
                {...props}
            >
                {/* State layer overlay */}
                {interactive && (
                    <div className="absolute inset-0 bg-[var(--md-sys-color-primary)] opacity-0 hover:opacity-[0.08] transition-opacity duration-200 pointer-events-none rounded-inherit" />
                )}
                {/* Content */}
                <div className="relative z-10">
                    {children}
                </div>
            </motion.div>
        );
    }
);

MD3CardMotion.displayName = 'MD3CardMotion';

// Convenience exports for motion variants  
export const MD3CardElevated = forwardRef<HTMLDivElement, Omit<MD3CardMotionProps, 'variant'>>(
    (props, ref) => <MD3CardMotion ref={ref} variant="elevated" {...props} />
);
MD3CardElevated.displayName = 'MD3CardElevated';

export const MD3CardFilled = forwardRef<HTMLDivElement, Omit<MD3CardMotionProps, 'variant'>>(
    (props, ref) => <MD3CardMotion ref={ref} variant="filled" {...props} />
);
MD3CardFilled.displayName = 'MD3CardFilled';

export const MD3CardOutlined = forwardRef<HTMLDivElement, Omit<MD3CardMotionProps, 'variant'>>(
    (props, ref) => <MD3CardMotion ref={ref} variant="outlined" {...props} />
);
MD3CardOutlined.displayName = 'MD3CardOutlined';
