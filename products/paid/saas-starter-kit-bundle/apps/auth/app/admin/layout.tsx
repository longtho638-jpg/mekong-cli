import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/signin")
  }

  // In a real application, you would check a specific role here
  // e.g. if (user.role !== 'admin') redirect('/dashboard')
  // For this demo, we'll allow access but warn in the UI

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-destructive/10 backdrop-blur">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <a className="mr-6 flex items-center space-x-2 font-bold text-destructive" href="/admin">
              <span>Admin Portal</span>
            </a>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <a
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                href="/admin/users"
              >
                Users
              </a>
              <a
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                href="/admin/settings"
              >
                Settings
              </a>
            </nav>
          </div>
          <div className="ml-auto">
            <a href="/dashboard" className="text-sm font-medium hover:underline">Exit Admin</a>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-6">{children}</main>
    </div>
  )
}
