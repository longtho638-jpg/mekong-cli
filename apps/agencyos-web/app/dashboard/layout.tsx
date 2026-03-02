import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/dashboard/logout-button'
import {
  LayoutDashboard,
  Target,
  Bot,
  DollarSign,
  Settings,
  Key,
  CreditCard,
} from 'lucide-react'

const NAV_LINKS = [
  { href: '/dashboard',          label: 'Overview',  icon: LayoutDashboard },
  { href: '/dashboard/missions', label: 'Missions',  icon: Target },
  { href: '/dashboard/agents',   label: 'Agents',    icon: Bot },
  { href: '/dashboard/revenue',  label: 'Revenue',   icon: DollarSign },
  { href: '/dashboard/api-keys', label: 'API Keys',  icon: Key },
  { href: '/dashboard/billing',  label: 'Billing',   icon: CreditCard },
  { href: '/dashboard/settings', label: 'Settings',  icon: Settings },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const email = user.email ?? ''
  const initials = email.slice(0, 2).toUpperCase()

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-zinc-800 bg-zinc-950">
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-zinc-800">
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-xs font-bold">
            A
          </div>
          <span className="font-semibold tracking-tight">AgencyOS</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1" aria-label="Dashboard navigation">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              aria-label={label}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-zinc-800 p-3">
          <LogoutButton />
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top header */}
        <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6 py-3">
          <span className="text-sm text-zinc-400 truncate max-w-xs">{email}</span>
          <div
            className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-xs font-bold"
            aria-label={`User avatar for ${email}`}
          >
            {initials}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
