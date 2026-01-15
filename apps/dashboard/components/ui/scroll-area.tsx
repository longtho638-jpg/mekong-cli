'use client';

import * as React from 'react';
import { clsx } from 'clsx';

/* =====================================================
   MD3 Scroll Area - Pure CSS Implementation
   Replaces: @radix-ui/react-scroll-area
   ===================================================== */

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal' | 'both';
}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, orientation = 'vertical', ...props }, ref) => {
    const scrollClasses = {
      vertical: 'overflow-y-auto overflow-x-hidden',
      horizontal: 'overflow-x-auto overflow-y-hidden',
      both: 'overflow-auto',
    };

    return (
      <div
        ref={ref}
        className={clsx(
          'relative',
          scrollClasses[orientation],
          // Custom scrollbar styling (M3-styled)
          '[&::-webkit-scrollbar]:w-2',
          '[&::-webkit-scrollbar-track]:bg-transparent',
          '[&::-webkit-scrollbar-thumb]:bg-[var(--md-sys-color-outline-variant)]',
          '[&::-webkit-scrollbar-thumb]:rounded-full',
          '[&::-webkit-scrollbar-thumb]:hover:bg-[var(--md-sys-color-outline)]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ScrollArea.displayName = 'ScrollArea';

// Compatibility exports
export const ScrollBar = () => null; // No longer needed with CSS scroll
