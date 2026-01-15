'use client'
import { usePathname } from 'next/navigation'
import { DashboardShell } from '@/components/DashboardShell'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isDashboard = pathname?.startsWith('/dashboard')

    if (isDashboard) {
        return <DashboardShell>{children}</DashboardShell>
    }

    return (
        <div>
            {children}
        </div>
    )
}
