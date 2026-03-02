/**
 * Dashboard layout: sidebar navigation + main content area.
 * Dark theme, responsive (sidebar collapses on mobile).
 */
import { ReactNode, useState } from 'react';
import { SidebarNavigation } from './sidebar-navigation';

export function LayoutShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-56 bg-bg-card border-r border-bg-border
        transform transition-transform md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 border-b border-bg-border">
          <h1 className="text-accent font-bold text-lg">Algo Trader</h1>
          <p className="text-muted text-xs mt-1">Trading Dashboard</p>
        </div>
        <SidebarNavigation onNavigate={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        <div className="md:hidden p-3 border-b border-bg-border flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted hover:text-white p-1"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <span className="ml-3 text-accent font-bold">Algo Trader</span>
        </div>
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
