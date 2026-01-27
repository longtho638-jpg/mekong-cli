import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Outfit } from 'next/font/google'
import ClientLayout from '@/components/ClientLayout'
import { AuthProvider } from '@/lib/auth-context'
import PWAInit from '@/components/pwa-init'

const outfit = Outfit({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-outfit',
})

export const metadata: Metadata = {
    title: 'Mekong-CLI | Mission Control',
    description: 'Deploy Your Agency in 15 Minutes',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'AgencyOS',
    },
    formatDetection: {
        telephone: false,
    },
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: '#6200EE',
    viewportFit: 'cover',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="vi" className={`${outfit.variable} dark`} suppressHydrationWarning>
            <head>
                {/* Removed JetBrains Mono manual link in favor of next/font */}
            </head>
            <body>
                <PWAInit />
                <AuthProvider>
                    <ClientLayout>{children}</ClientLayout>
                </AuthProvider>
            </body>
        </html>
    )
}

