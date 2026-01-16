import './globals.css'
import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import ClientLayout from '@/components/ClientLayout'

const outfit = Outfit({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-outfit',
})

export const metadata: Metadata = {
    title: 'Mekong-CLI | Mission Control',
    description: 'Deploy Your Agency in 15 Minutes',
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
                <ClientLayout>{children}</ClientLayout>
            </body>
        </html>
    )
}

