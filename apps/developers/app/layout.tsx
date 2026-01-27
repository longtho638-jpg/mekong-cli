import './globals.css'
import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import { AuthProvider } from '@/lib/auth-context'
import { DeveloperNav } from '@/components/DeveloperNav'

const outfit = Outfit({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-outfit',
})

export const metadata: Metadata = {
    title: 'AgencyOS | Developer Portal',
    description: 'Build your integration with AgencyOS',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className={`${outfit.variable} dark`} suppressHydrationWarning>
            <body>
                <AuthProvider>
                    <div className="flex min-h-screen bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
                        <DeveloperNav />
                        <main className="flex-1 overflow-y-auto p-8">
                            <div className="max-w-7xl mx-auto">
                                {children}
                            </div>
                        </main>
                    </div>
                </AuthProvider>
            </body>
        </html>
    )
}
