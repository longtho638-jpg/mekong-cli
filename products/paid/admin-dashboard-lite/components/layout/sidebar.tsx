import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/hooks/use-sidebar"
import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut,
  Menu
} from "lucide-react"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isOpen, toggle } = useSidebar()

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/" className={cn("flex items-center gap-2 font-bold", !isOpen && "hidden")}>
          <div className="h-8 w-8 rounded-lg bg-primary" />
          <span>AdminLite</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={toggle} className="ml-auto">
          <Menu className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex h-[calc(100vh-4rem)] flex-col gap-2 p-2">
        <nav className="flex-1 space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                !isOpen && "justify-center px-2"
              )}
            >
              <item.icon className="h-5 w-5" />
              {isOpen && <span>{item.title}</span>}
            </Link>
          ))}
        </nav>
        
        <div className="mt-auto border-t pt-2">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 text-muted-foreground hover:text-foreground",
              !isOpen && "justify-center px-2"
            )}
          >
            <LogOut className="h-5 w-5" />
            {isOpen && <span>Logout</span>}
          </Button>
        </div>
      </div>
    </aside>
  )
}
