'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    Shield, Search, ChevronLeft, ChevronRight,
    Home, Users, DollarSign, BarChart3, Settings, Briefcase,
    Zap, X
} from 'lucide-react';

// Slim navigation items
const navItems = [
    { icon: Home, label: 'Home', href: '/' },
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

export function DashboardShell({ children, locale = 'en', accentColor = '#8b5cf6' }: DashboardShellProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const [commandOpen, setCommandOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const cursorRef = useRef<HTMLDivElement>(null);

    // Cursor glow tracker
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (cursorRef.current) {
                cursorRef.current.style.left = `${e.clientX}px`;
                cursorRef.current.style.top = `${e.clientY}px`;
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Cmd+K shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCommandOpen(prev => !prev);
            }
            if (e.key === 'Escape') setCommandOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const switchLocale = (newLocale: string) => {
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white font-mono flex">
            {/* Cursor Glow */}
            <div ref={cursorRef} className="cursor-glow" />

            {/* Gradient Mesh Background */}
            <div className="fixed inset-0 pointer-events-none bg-mesh" />

            {/* Subtle Grid */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:48px_48px]" />
            </div>

            {/* Slim Sidebar */}
            <aside
                className={`fixed left-0 top-0 h-full z-40 transition-all duration-200 ${sidebarExpanded ? 'w-[200px]' : 'w-14'
                    }`}
                onMouseEnter={() => setSidebarExpanded(true)}
                onMouseLeave={() => setSidebarExpanded(false)}
            >
                <div className="h-full bg-[#0a0a0f]/90 backdrop-blur-xl border-r border-white/5 flex flex-col">
                    {/* Logo */}
                    <div className="h-12 flex items-center justify-center border-b border-white/5">
                        <Shield className="w-5 h-5" style={{ color: accentColor }} />
                        {sidebarExpanded && (
                            <span className="ml-2 text-xs font-semibold tracking-tight text-shimmer">
                                AGENCY OS
                            </span>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 py-2 overflow-y-auto">
                        {navItems.map((item, index) => {
                            const isActive = pathname.includes(item.href) && item.href !== '/';
                            return (
                                <Link
                                    key={item.href}
                                    href={`/${locale}${item.href}`}
                                    className={`flex items-center gap-3 h-10 mx-1 px-3 rounded-md transition-all stagger-in ${isActive
                                            ? 'bg-white/8 text-white'
                                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/4'
                                        }`}
                                    style={{ animationDelay: `${index * 0.03}s` }}
                                >
                                    <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                                    {sidebarExpanded && (
                                        <span className="text-xs font-medium truncate">{item.label}</span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Collapse indicator */}
                    <div className="h-10 flex items-center justify-center border-t border-white/5 text-gray-600">
                        {sidebarExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className={`flex-1 transition-all duration-200 ${sidebarExpanded ? 'ml-[200px]' : 'ml-14'}`}>
                {/* Clean Header - 48px */}
                <header
                    className="fixed top-0 right-0 z-30 h-12 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4"
                    style={{ left: sidebarExpanded ? '200px' : '56px', transition: 'left 0.2s' }}
                >
                    {/* Status - minimal */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="status-dot status-dot-pulse" style={{ background: accentColor }} />
                        <span>Active</span>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <button
                            onClick={() => setCommandOpen(true)}
                            className="btn-clean btn-magnetic text-xs"
                        >
                            <Search className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Search</span>
                            <kbd className="hidden sm:inline bg-white/5 px-1.5 py-0.5 rounded text-[10px] text-gray-500">⌘K</kbd>
                        </button>

                        {/* Language */}
                        <div className="flex items-center gap-0.5">
                            {['en', 'vi'].map((l) => (
                                <button
                                    key={l}
                                    onClick={() => switchLocale(l)}
                                    className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${locale === l
                                            ? 'bg-white/8 text-white'
                                            : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    {l.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="pt-12 min-h-screen">
                    {children}
                </main>
            </div>

            {/* Command Palette */}
            {commandOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => setCommandOpen(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-md bg-[#0f0f14] border border-white/10 rounded-lg shadow-2xl overflow-hidden glow-border"
                    >
                        {/* Search Input */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                            <Search className="w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                                autoFocus
                            />
                            <button onClick={() => setCommandOpen(false)} className="text-gray-500 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Results */}
                        <div className="py-2 max-h-64 overflow-y-auto">
                            <div className="text-label px-4 py-1.5">Navigation</div>
                            {navItems.slice(0, 6).map((item, index) => (
                                <Link
                                    key={item.href}
                                    href={`/${locale}${item.href}`}
                                    onClick={() => setCommandOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors stagger-in"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    <item.icon className="w-4 h-4" />
                                    <span className="text-sm">{item.label}</span>
                                </Link>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-4 py-2 bg-white/2 border-t border-white/5 text-[10px] text-gray-500">
                            <span>↵ select</span>
                            <span>esc close</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
