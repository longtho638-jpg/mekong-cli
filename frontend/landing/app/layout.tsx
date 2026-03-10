import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mekong CLI — AGI Vibe Coding Factory',
  description:
    'Plan → Execute → Verify. Autonomous code generation with quality gates. Build 10x faster with AI-powered multi-agent orchestration.',
  keywords: ['AI coding', 'CLI', 'code generation', 'multi-agent', 'AGI'],
  openGraph: {
    title: 'Mekong CLI — AGI Vibe Coding Factory',
    description: 'Plan → Execute → Verify. Autonomous code generation with quality gates.',
    url: 'https://agencyos.network',
    siteName: 'AgencyOS',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
