import React, { ReactNode } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Settings,
  Activity,
  ShieldAlert,
  BarChart3,
  Webhook,
  DollarSign,
  Database,
  Globe,
  Bot
} from 'lucide-react';

interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

const SidebarItem = ({ icon, label, href, active }: SidebarItemProps) => {
  return (
    <Link href={href} className={`flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-colors ${active ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}>
      {icon}
      <span>{label}</span>
    </Link>
  );
};

export const Sidebar = () => {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col z-10">
      <div className="p-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
        <span className="text-xl font-bold text-gray-900">Admin</span>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">
          Overview
        </div>
        <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" href="/dashboard" />
        <SidebarItem icon={<BarChart3 size={20} />} label="Analytics" href="/analytics" />

        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2">
          Management
        </div>
        <SidebarItem icon={<Users size={20} />} label="Users" href="/users" />
        <SidebarItem icon={<DollarSign size={20} />} label="Payments" href="/payments" />
        <SidebarItem icon={<Webhook size={20} />} label="Webhooks" href="/webhooks" />

        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2">
          System
        </div>
        <SidebarItem icon={<ShieldAlert size={20} />} label="Audit Log" href="/audit" />
        <SidebarItem icon={<Settings size={20} />} label="Settings" href="/settings" />
        <SidebarItem icon={<ShieldAlert size={20} />} label="Rate Limits" href="/rate-limits" />
        <SidebarItem icon={<Activity size={20} />} label="Health" href="/webhooks/health" />
        <SidebarItem icon={<Database size={20} />} label="Cache" href="/cache" />
        <SidebarItem icon={<Globe size={20} />} label="CDN" href="/cdn" />
        <SidebarItem icon={<Bot size={20} />} label="AI Hub" href="/ai" />
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200"></div>
          <div>
            <div className="text-sm font-medium text-gray-900">Admin User</div>
            <div className="text-xs text-gray-500">admin@mekong.hq</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
