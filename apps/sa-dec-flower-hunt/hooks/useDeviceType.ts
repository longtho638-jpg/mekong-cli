"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect device type (mobile vs desktop)
 * Updates on window resize
 */
export function useDeviceType() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkDevice = () => {
            setIsMobile(window.innerWidth < 768); // md breakpoint
        };

        // Initial check
        checkDevice();

        // Listen for resize
        window.addEventListener('resize', checkDevice);

        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    return { isMobile, isDesktop: !isMobile };
}
