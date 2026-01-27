'use client';

import { LayoutDashboard, TrendingUp, Users, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { usePWAInstall } from '@/lib/pwa/install-prompt';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Control', href: '/dashboard' },
  { icon: TrendingUp, label: 'Revenue', href: '/dashboard/revenue' },
  { icon: Users, label: 'CRM', href: '/dashboard/crm' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' }
];

export default function BottomNav() {
  const pathname = usePathname();
  const { canInstall, promptInstall } = usePWAInstall();

  // Hide on desktop
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 border-t border-gray-200 dark:border-zinc-800 pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center w-full h-full ${
                isActive ? 'text-emerald-500' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">{label}</span>
            </Link>
          );
        })}

        {/* PWA Install Button (Only visible if installable) */}
        {canInstall && (
            <button
              onClick={promptInstall}
              className="flex flex-col items-center justify-center w-full h-full text-gray-500 dark:text-gray-400"
            >
                <div className="w-5 h-5 border-2 border-current rounded-md flex items-center justify-center">
                    <span className="text-xs font-bold leading-none">+</span>
                </div>
                <span className="text-[10px] mt-1 font-medium">App</span>
            </button>
        )}
      </div>
    </nav>
  );
}
