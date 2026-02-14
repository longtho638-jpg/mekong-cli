"use client";

import { useFarmer, FarmerAuthProvider } from "@/components/auth/FarmerAuthProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Flower2, ShoppingBag, Wallet, Settings, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Image from "next/image";
import { useState } from "react";
import { AgriCopilot } from "@/components/farmer/AgriCopilot";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const NAV_ITEMS = [
    { label: "DASHBOARD", icon: LayoutDashboard, href: "/farmer" },
    { label: "MY_GARDEN", icon: Flower2, href: "/farmer/products" },
    { label: "ORDERS_LOG", icon: ShoppingBag, href: "/farmer/orders" },
    { label: "FINANCE_STREAM", icon: Wallet, href: "/farmer/finance" },
    { label: "SYSTEM_CONFIG", icon: Settings, href: "/farmer/settings" },
];

import { AgriosVectorLogo } from "@/components/brand/AgriosVectorLogo";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Updated Sidebar with Props
function FarmerSidebar({ collapsed = false, setCollapsed }: { collapsed: boolean; setCollapsed: any }) {
    const pathname = usePathname();
    const { profile } = useFarmer();
    // Removed local state, using props
    const isCollapsed = collapsed;
    const setIsCollapsed = setCollapsed;

    return (
        <div className={`flex flex-col h-full bg-[#030303] border-r border-white/10 text-zinc-400 font-mono text-sm transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
            <div className={`flex items-center justify-between p-6 border-b border-white/10 ${isCollapsed ? 'px-4' : ''}`}>
                <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center w-full' : ''}`}>
                    <AgriosVectorLogo
                        variant={isCollapsed ? 'icon' : 'full'}
                        className={`transition-all duration-300 ${isCollapsed ? 'h-8' : 'h-10'}`}
                        animate={false}
                    />
                </div>
            </div>

            {/* Collapse Toggle */}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute top-[28px] -right-3 h-6 w-6 rounded-full border border-white/10 bg-black text-white hover:bg-emerald-500/20 z-10 hidden md:flex items-center justify-center p-0"
            >
                {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </Button>

            {!isCollapsed && (
                <div className="p-6 pb-2">
                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5 hover:border-emerald-500/30 transition-colors">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                            <Image src={profile.avatar} alt={profile.farmerName} fill className="object-cover" sizes="40px" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold text-white truncate">{profile.farmerName}</p>
                            <p className="text-[10px] text-emerald-500 truncate">ID: {profile.id?.substring(0, 8)}</p>
                        </div>
                    </div>
                </div>
            )}

            <nav className="flex-1 p-4 space-y-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href}>
                            <Button
                                variant="ghost"
                                className={`w-full justify-start gap-3 rounded-none h-10 mb-1 transition-all duration-300
                                    ${isCollapsed ? 'px-0 justify-center' : 'border-l-2'}
                                    ${isActive
                                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                                        : 'border-transparent hover:bg-white/5 hover:text-white hover:border-white/20'
                                    }`}
                            >
                                <item.icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                                {!isCollapsed && item.label}
                            </Button>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-white/10">
                {!isCollapsed && (
                    <div className="bg-emerald-950/30 rounded border border-emerald-500/20 p-3 mb-4">
                        <div className="flex justify-between items-center text-[10px] text-emerald-400 mb-1">
                            <span>SYSTEM STATUS</span>
                            <span className="animate-pulse">● ONLINE</span>
                        </div>
                        <div className="w-full bg-black h-1 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 w-full h-full animate-[shimmer_2s_infinite]" />
                        </div>
                    </div>
                )}

                <Button variant="ghost" className={`w-full gap-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-mono text-xs uppercase hover:border-red-500/50 border border-transparent ${isCollapsed ? 'justify-center px-0' : 'justify-start'}`}>
                    <LogOut className="w-4 h-4 shrink-0" />
                    {!isCollapsed && "Logout_Terminal"}
                </Button>
            </div>
        </div>
    );
}

// Ensure clean wrapper component
function FarmerLayoutContent({ children }: { children: React.ReactNode }) {
    const { isLoading } = useFarmer();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505] text-emerald-500 font-mono">
                <span className="animate-pulse">INITIALIZING_FARMER_NODE...</span>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#050505] text-zinc-300 font-mono selection:bg-emerald-500/30 selection:text-emerald-200 relative">
            <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
                <img src="/assets/digital-twins/agrios_farmer_hyperreal_1765367316910.png" className="w-full h-full object-cover" />
            </div>
            {/* Desktop Sidebar with Prop */}
            <div className={`hidden md:block shrink-0 fixed inset-y-0 z-50 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
                <FarmerSidebar collapsed={isSidebarCollapsed} setCollapsed={setIsSidebarCollapsed} />
            </div>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full z-50 bg-[#030303]/90 backdrop-blur border-b border-white/10 px-4 h-14 flex items-center justify-between">
                <span className="font-bold text-white tracking-widest text-sm">AGRIOS.tech</span>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-emerald-500 hover:bg-emerald-500/10">
                            <Menu className="w-5 h-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 bg-[#030303] border-white/10 w-64">
                        <FarmerSidebar collapsed={false} setCollapsed={() => { }} />
                    </SheetContent>
                </Sheet>
            </div>

            {/* Main Content - Dynamic Margin */}
            <main className={`flex-1 p-4 md:p-6 pt-16 md:pt-6 overflow-x-hidden transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}

function FarmerProtection({ children }: { children: React.ReactNode }) {
    const { profile, isLoading } = useFarmer();
    const [email, setEmail] = useState("farmer1@sadec.local");
    const [password, setPassword] = useState("password123");
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-stone-50">Đang tải...</div>;

    // Helper Login for Dev/Demo purposes since we removed global mock
    const handleLogin = async () => {
        setIsLoggingIn(true);
        if (!supabase) {
            toast.error("Supabase client not initialized");
            setIsLoggingIn(false);
            return;
        }

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) {
            toast.error("Đăng nhập thất bại: " + error.message);
        } else {
            toast.success("Đăng nhập thành công!");
            window.location.reload(); // Refresh to pick up session
        }
        setIsLoggingIn(false);
    };

    if (!profile.id) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] p-4 relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img src="/assets/digital-twins/agrios_farmer_hyperreal_1765367316910.png" className="w-full h-full object-cover opacity-80" />
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/40 via-black/80 to-black z-0" />

                <div className="bg-stone-900/50 backdrop-blur-xl border border-emerald-500/20 p-8 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.1)] w-full max-w-md space-y-6 relative z-10">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold tracking-widest text-white mb-2">
                            AGRIOS.<span className="text-emerald-500">tech</span>
                        </h1>
                        <p className="text-emerald-500/60 font-mono text-xs uppercase tracking-widest">Garden OS // Restricted Access</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-stone-500 uppercase">Node ID (Email)</label>
                            <input
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-black/50 border border-emerald-500/20 rounded-lg p-3 text-emerald-400 font-mono focus:border-emerald-500/50 focus:outline-none transition-colors"
                                type="email"
                                placeholder="node@agrios.tech"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-stone-500 uppercase">Access Key (Password)</label>
                            <input
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-black/50 border border-emerald-500/20 rounded-lg p-3 text-emerald-400 font-mono focus:border-emerald-500/50 focus:outline-none transition-colors"
                                type="password"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleLogin}
                        disabled={isLoggingIn}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-bold tracking-wider py-6"
                    >
                        {isLoggingIn ? "AUTHENTICATING..." : "INITIALIZE SESSION"}
                    </Button>

                    <div className="text-[10px] text-center text-stone-600 font-mono">
                        Dev Bypass: farmer1@sadec.local / password123
                    </div>

                    <div className="pt-4 border-t border-emerald-500/10">
                        <Button
                            variant="ghost"
                            className="w-full text-red-900 hover:text-red-500 hover:bg-red-500/10 text-xs font-mono"
                            onClick={async () => {
                                setIsLoggingIn(true);
                                try {
                                    const res = await fetch('/api/debug/create-farmer', {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            email: "farmer_final@sadec.local",
                                            password: "password123",
                                            name: "Farmer Final (Fixed)"
                                        })
                                    });
                                    if (res.ok) {
                                        const data = await res.json();
                                        if (data.redirectTo) {
                                            toast.success("Redirecting...");
                                            window.location.href = data.redirectTo;
                                        } else {
                                            toast.success("Node Created. Auto-login...");
                                            setEmail("farmer_final@sadec.local");
                                            setPassword("password123");
                                            setTimeout(() => handleLogin(), 1000);
                                        }
                                    } else {
                                        const err = await res.json();
                                        toast.error("Error: " + err.error);
                                        setIsLoggingIn(false);
                                    }
                                } catch (e) {
                                    toast.error("API Connection Failed");
                                    setIsLoggingIn(false);
                                }
                            }}
                        >
                            ⚠ EMERGENCY NODE CREATION
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return <FarmerLayoutContent>{children}</FarmerLayoutContent>;
}

export default function FarmerLayout({ children }: { children: React.ReactNode }) {
    return (
        <FarmerAuthProvider>
            <FarmerProtection>
                {children}
            </FarmerProtection>
            <AgriCopilot />
        </FarmerAuthProvider>
    );
}
