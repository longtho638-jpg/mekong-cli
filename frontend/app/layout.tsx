import './globals.css'
import type { Metadata } from 'next'

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
        <html lang="vi">
            <head>
                <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />
            </head>
            <body>{children}</body>
        </html>
    )
}
