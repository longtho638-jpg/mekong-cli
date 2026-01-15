'use client';

import * as React from 'react';
import { clsx } from 'clsx';

/* =====================================================
   MD3 Separator/Divider - Pure M3 Implementation
   Replaces: @radix-ui/react-separator
   Reference: m3.material.io/components/divider
   ===================================================== */

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role={decorative ? 'none' : 'separator'}
        aria-orientation={orientation}
        className={clsx(
          'shrink-0 bg-[var(--md-sys-color-outline-variant)]',
          orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
          className
        )}
        {...props}
      />
    );
  }
);

Separator.displayName = 'Separator';
