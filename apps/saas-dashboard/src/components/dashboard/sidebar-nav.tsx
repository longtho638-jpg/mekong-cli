'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Rocket,
  BarChart3,
  Settings,
  Zap,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/missions', label: 'Missions', icon: Rocket },
  { href: '/dashboard/usage', label: 'Usage', icon: BarChart3 },
  { href: '/dashboard/subscription', label: 'Subscription', icon: Zap },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col min-h-screen">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
        <Zap className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm tracking-tight">Mekong RaaS</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground">Powered by OpenClaw</p>
      </div>
    </aside>
  );
}
