'use client'
import { usePathname } from 'next/navigation'
import { DashboardShell } from '@/components/DashboardShell'
import BottomNav from '@/components/mobile/bottom-nav'
import OfflineIndicator from '@/components/mobile/offline-indicator'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    // Check for dashboard in root or strict locale prefix (e.g. /en/dashboard)
    const isDashboard = pathname ? /^\/([a-z]{2}\/)?dashboard/.test(pathname) : false

    if (isDashboard) {
        return (
            <>
                <OfflineIndicator />
                <DashboardShell>
                    {children}
                    <BottomNav />
                </DashboardShell>
            </>
        )
    }

    return (
        <div>
            <OfflineIndicator />
            {children}
        </div>
    )
}
