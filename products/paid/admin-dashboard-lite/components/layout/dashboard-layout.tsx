import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { useSidebar } from "@/hooks/use-sidebar"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isOpen } = useSidebar()

  return (
    <div className="min-h-screen bg-muted/20">
      <Sidebar />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300 ease-in-out",
          isOpen ? "ml-64" : "ml-16"
        )}
      >
        <Header />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
