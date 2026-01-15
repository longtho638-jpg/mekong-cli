'use client'
import { usePathname } from 'next/navigation'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isLandingPage = pathname === '/'

    return (
        <div>
            {children}
        </div>
    )
}
