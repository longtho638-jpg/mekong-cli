"use client";

import { useDeviceType } from "@/hooks/useDeviceType";
import { DesktopLayout } from "./DesktopLayout";
import { MobileLayout } from "./MobileLayout";
import { LoginModal } from "@/components/LoginModal";
import { useState } from "react";

interface ResponsiveLayoutProps {
    children: React.ReactNode;
}

/**
 * Adaptive Layout - Automatically switches between Desktop and Mobile layouts
 * Based on screen width (< 768px = mobile, >= 768px = desktop)
 */
export function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
    const { isMobile } = useDeviceType();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const handleLoginClick = () => setIsLoginModalOpen(true);
    const handleLoginClose = () => setIsLoginModalOpen(false);

    return (
        <>
            {isMobile ? (
                <MobileLayout onLoginClick={handleLoginClick}>
                    {children}
                </MobileLayout>
            ) : (
                <DesktopLayout onLoginClick={handleLoginClick}>
                    {children}
                </DesktopLayout>
            )}

            <LoginModal isOpen={isLoginModalOpen} onClose={handleLoginClose} />
        </>
    );
}
