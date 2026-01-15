'use client';

import { MD3AppShell } from '@/components/md3/MD3AppShell';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Application Shell: Fixed Navigation Rail, Fluid Content
    return (
        <MD3AppShell variant="application">
            {children}
        </MD3AppShell>
    );
}
