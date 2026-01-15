'use client';

import { MD3AppShell } from '@/components/md3/MD3AppShell';

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Marketing Shell: No Rail, Centered Content, Window Scroll
    return (
        <MD3AppShell variant="marketing">
            {children}
        </MD3AppShell>
    );
}
