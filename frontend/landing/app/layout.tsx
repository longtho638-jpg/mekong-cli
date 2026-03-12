import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Mekong CLI — AI-Operated Business Platform',
  description:
    '319 commands, 463 skills, 127 AI agents. 5-layer pyramid from Founder to Ops.',
  keywords: ['AI agency', 'CLI', 'founder tools', 'multi-agent', 'mekong-cli'],
  openGraph: {
    title: 'Mekong CLI — AI-Operated Business Platform',
    description: '319 commands, 463 skills, 127 AI agents. 5-layer pyramid from Founder to Ops.',
    url: 'https://agencyos.network',
    siteName: 'Mekong CLI',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  )
}
