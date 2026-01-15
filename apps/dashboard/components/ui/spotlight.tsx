'use client';

import * as React from 'react';
import { clsx } from 'clsx';

/* =====================================================
   M3 Spotlight Effect - Pure CSS/SVG Implementation
   Provides a subtle spotlight gradient effect
   ===================================================== */

interface SpotlightProps extends React.HTMLAttributes<HTMLDivElement> {
    fill?: string;
}

export function Spotlight({
    className,
    fill = 'white',
    ...props
}: SpotlightProps) {
    return (
        <div
            className={clsx(
                'pointer-events-none absolute z-0',
                className
            )}
            {...props}
        >
            <svg
                className="h-[400px] w-[400px] opacity-20"
                viewBox="0 0 400 400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <radialGradient
                        id="spotlight-gradient"
                        cx="50%"
                        cy="50%"
                        r="50%"
                        fx="50%"
                        fy="50%"
                    >
                        <stop offset="0%" stopColor={fill} stopOpacity="0.3" />
                        <stop offset="50%" stopColor={fill} stopOpacity="0.1" />
                        <stop offset="100%" stopColor={fill} stopOpacity="0" />
                    </radialGradient>
                </defs>
                <circle
                    cx="200"
                    cy="200"
                    r="200"
                    fill="url(#spotlight-gradient)"
                />
            </svg>
        </div>
    );
}
