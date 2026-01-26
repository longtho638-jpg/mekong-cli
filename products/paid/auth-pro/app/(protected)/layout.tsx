import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/signin")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <a className="mr-6 flex items-center space-x-2" href="/dashboard">
              <span className="hidden font-bold sm:inline-block">
                Antigravity Auth PRO
              </span>
            </a>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <a
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                href="/dashboard"
              >
                Dashboard
              </a>
              <a
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                href="/settings/security"
              >
                Security
              </a>
              <a
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                href="/settings/sessions"
              >
                Sessions
              </a>
              <a
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                href="/settings/organizations"
              >
                Organizations
              </a>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
             <div className="w-full flex-1 md:w-auto md:flex-none">
              {/* Add search or other header items here */}
            </div>
            <nav className="flex items-center">
                <form action="/auth/signout" method="post">
                    <button className="text-sm font-medium transition-colors hover:text-destructive">
                        Sign Out
                    </button>
                </form>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-6">{children}</main>
    </div>
  )
}
