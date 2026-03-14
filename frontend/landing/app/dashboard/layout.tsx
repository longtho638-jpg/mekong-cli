import DashboardNav from '@/components/dashboard/dashboard-nav'
import WorkspaceSelector from '@/components/dashboard/workspace-selector'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[var(--md-surface)]">
      {/* Sidebar Navigation */}
      <DashboardNav />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Top Header */}
        <header className="flex items-center justify-between border-b border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] px-6 py-4">
          <WorkspaceSelector />
          <div className="flex items-center gap-4">
            <button
              className="rounded-lg p-2 text-[var(--md-on-surface-variant)] transition-colors hover:bg-[var(--md-surface-container)] hover:text-[var(--md-on-surface)]"
              aria-label="Notifications"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
            <div className="h-8 w-8 rounded-full bg-[var(--md-primary)] text-sm font-bold text-[var(--md-on-primary)] flex items-center justify-center">
              U
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
