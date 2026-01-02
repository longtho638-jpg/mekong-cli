'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    Shield, Command, Search, ChevronLeft, ChevronRight,
    Home, Users, DollarSign, BarChart3, Settings, Briefcase,
    Zap, Bell, Sparkles, X
} from 'lucide-react';

// Sidebar navigation items
const navItems = [
    { icon: Home, label: 'Dashboard', href: '/' },
    { icon: Shield, label: 'Guild', href: '/guild' },
    { icon: Users, label: 'Defense', href: '/defense' },
    { icon: DollarSign, label: 'Pricing', href: '/pricing' },
    { icon: BarChart3, label: 'Revenue', href: '/revenue' },
    { icon: Briefcase, label: 'Sales', href: '/sales' },
    { icon: Users, label: 'HR', href: '/hr' },
    { icon: Zap, label: 'AgentOps', href: '/agentops' },
    { icon: Settings, label: 'Settings', href: '/settings' },
];

interface DashboardShellProps {
    children: React.ReactNode;
    locale?: string;
    accentColor?: string;
}

export function DashboardShell({ children, locale = 'en', accentColor = '#22c55e' }: DashboardShellProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [commandOpen, setCommandOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Command palette keyboard shortcut (Cmd/Ctrl + K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCommandOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setCommandOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const switchLocale = (newLocale: string) => {
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white font-mono flex">
            {/* Layer 0: Animated Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
                {/* Gradient Orbs */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-purple-500/10 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-cyan-500/10 via-transparent to-transparent" />
                {/* Noise Texture */}
                <div className="absolute inset-0 opacity-[0.015] bg-noise" />
            </div>

            {/* Layer 1: Sidebar */}
            <aside
                className={`fixed left-0 top-0 h-full z-40 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'
                    }`}
            >
                <div className="h-full glass-nav flex flex-col border-r border-white/5">
                    {/* Logo */}
                    <div className="h-14 flex items-center px-4 border-b border-white/5">
                        <div className="flex items-center gap-2" style={{ color: accentColor }}>
                            <Shield className="w-6 h-6" />
                            {!sidebarCollapsed && (
                                <span className="font-bold tracking-tighter text-sm">AGENCY OS</span>
                            )}
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 py-4 overflow-y-auto">
                        {navItems.map((item) => {
                            const isActive = pathname.includes(item.href) && item.href !== '/';
                            return (
                                <Link
                                    key={item.href}
                                    href={`/${locale}${item.href}`}
                                    className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200 group ${isActive
                                            ? 'bg-white/10 text-white'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <item.icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'group-hover:text-cyan-400'}`} />
                                    {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Collapse Toggle */}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="h-12 flex items-center justify-center border-t border-white/5 text-gray-500 hover:text-white transition-colors"
                    >
                        {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
                {/* Top Bar */}
                <header className="fixed top-0 right-0 z-30 h-14 glass-nav border-b border-white/5 flex items-center justify-between px-6"
                    style={{ left: sidebarCollapsed ? '64px' : '256px', transition: 'left 0.3s' }}
                >
                    {/* AI Ticker */}
                    <div className="flex items-center gap-2 text-xs">
                        <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                        <span className="text-gray-400">
                            <span className="text-purple-400">AI:</span> Processing 3 tasks...
                            <span className="text-green-400 ml-2">• Guild sync complete</span>
                        </span>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        {/* Command Palette Button */}
                        <button
                            onClick={() => setCommandOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-400 hover:border-white/20 transition-colors"
                        >
                            <Search className="w-3 h-3" />
                            <span>Search...</span>
                            <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px]">⌘K</kbd>
                        </button>

                        {/* Notifications */}
                        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                        </button>

                        {/* Language Switcher */}
                        <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10">
                            {['en', 'vi'].map((l) => (
                                <button
                                    key={l}
                                    onClick={() => switchLocale(l)}
                                    className={`px-2.5 py-1 text-xs font-bold rounded transition-all ${locale === l
                                            ? 'bg-cyan-500/20 text-cyan-400'
                                            : 'text-gray-500 hover:text-white'
                                        }`}
                                >
                                    {l.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="pt-14 min-h-screen">
                    {children}
                </main>
            </div>

            {/* Command Palette Modal */}
            {commandOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={() => setCommandOpen(false)}>
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                    {/* Modal */}
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-xl bg-[#0a0a0f] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-scale-in"
                    >
                        {/* Search Input */}
                        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
                            <Search className="w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search hubs, people, metrics..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                                autoFocus
                            />
                            <button onClick={() => setCommandOpen(false)} className="text-gray-500 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Quick Results */}
                        <div className="p-2 max-h-80 overflow-y-auto">
                            <div className="text-xs text-gray-500 px-3 py-2">Quick Access</div>
                            {navItems.slice(0, 5).map((item) => (
                                <Link
                                    key={item.href}
                                    href={`/${locale}${item.href}`}
                                    onClick={() => setCommandOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                                >
                                    <item.icon className="w-4 h-4 text-cyan-400" />
                                    <span className="text-sm">{item.label}</span>
                                </Link>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-t border-white/5 text-xs text-gray-500">
                            <span>↵ to select</span>
                            <span>esc to close</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
