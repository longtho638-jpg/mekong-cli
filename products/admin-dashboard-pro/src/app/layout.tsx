import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Calendar,
  Settings,
  Bell,
} from "lucide-react";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AgencyOS Admin Dashboard",
  description: "Mission control for your agency.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          inter.className,
          "bg-slate-950 text-slate-50 min-h-screen flex",
        )}
      >
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800 p-6 flex flex-col gap-6 fixed h-full bg-slate-950 z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">
              A
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AgencyOS
            </span>
          </div>

          <nav className="flex flex-col gap-2 flex-1">
            <NavLink
              href="/"
              icon={<LayoutDashboard size={20} />}
              label="Overview"
            />
            <NavLink
              href="/crm"
              icon={<Users size={20} />}
              label="CRM & Leads"
            />
            <NavLink
              href="/sales"
              icon={<CreditCard size={20} />}
              label="Revenue"
            />
            <NavLink
              href="/content"
              icon={<Calendar size={20} />}
              label="Content"
            />
          </nav>

          <nav className="flex flex-col gap-2">
            <NavLink
              href="/settings"
              icon={<Settings size={20} />}
              label="Settings"
            />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Mission Control</h1>
            <div className="flex gap-4">
              <button className="p-2 hover:bg-slate-800 rounded-full relative">
                <Bell size={20} className="text-slate-400" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-400">
                Me
              </div>
            </div>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}

function NavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
