'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Command, Search, X, Zap, Play } from 'lucide-react';

// 135 Commands Data with Binh Pháp alignment
const COMMAND_SUITES = {
    marketing: {
        name: 'Marketing',
        icon: '🔥',
        binh_phap: '謀攻篇',
        commands: [
            { cmd: '/ke-hoach-tiep-thi', desc: 'AI Marketing Plan Generator' },
            { cmd: '/seo', desc: 'SEO Strategy & Keywords' },
            { cmd: '/pr', desc: 'PR Campaign Creator' },
            { cmd: '/content', desc: 'Content Calendar' },
            { cmd: '/social', desc: 'Social Media Strategy' },
            { cmd: '/ads', desc: 'Ad Campaign Planner' },
            { cmd: '/branding', desc: 'Brand Guidelines' },
            { cmd: '/email', desc: 'Email Sequences' },
        ]
    },
    sales: {
        name: 'Sales',
        icon: '🛒',
        binh_phap: '作戰篇',
        commands: [
            { cmd: '/khach-hang', desc: 'Customer Research AI' },
            { cmd: '/crm', desc: 'CRM Setup' },
            { cmd: '/leadgen', desc: 'Lead Generation' },
            { cmd: '/pipeline', desc: 'Sales Pipeline' },
            { cmd: '/proposal', desc: 'Proposal Generator' },
            { cmd: '/pricing', desc: 'Pricing Analysis' },
            { cmd: '/demo', desc: 'Demo Builder' },
            { cmd: '/close', desc: 'Closing Playbook' },
        ]
    },
    finance: {
        name: 'Finance',
        icon: '💰',
        binh_phap: '計篇',
        commands: [
            { cmd: '/bao-cao-tai-chinh', desc: 'Financial Reports' },
            { cmd: '/ngan-sach', desc: 'Budget Planning' },
            { cmd: '/invoice', desc: 'Invoice Generator' },
            { cmd: '/cashflow', desc: 'Cashflow Analysis' },
            { cmd: '/tax', desc: 'Tax Planning' },
            { cmd: '/forecast', desc: 'Financial Forecasting' },
            { cmd: '/expense', desc: 'Expense Tracking' },
            { cmd: '/revenue', desc: 'Revenue Analysis' },
        ]
    },
    development: {
        name: 'Development',
        icon: '⚡',
        binh_phap: '九變篇',
        commands: [
            { cmd: '/refactor', desc: 'Code Refactoring' },
            { cmd: '/migrate', desc: 'Database Migration' },
            { cmd: '/api', desc: 'API Builder' },
            { cmd: '/component', desc: 'Component Generator' },
            { cmd: '/optimize', desc: 'Performance Optimization' },
            { cmd: '/security', desc: 'Security Audit' },
            { cmd: '/deploy:prod', desc: 'Deploy Production' },
            { cmd: '/rollback', desc: 'Rollback Deployment' },
        ]
    },
    testing: {
        name: 'Testing',
        icon: '🧪',
        binh_phap: '虛實篇',
        commands: [
            { cmd: '/test:unit', desc: 'Unit Tests' },
            { cmd: '/test:e2e', desc: 'E2E Tests' },
            { cmd: '/coverage', desc: 'Code Coverage' },
            { cmd: '/lint', desc: 'Lint Check' },
            { cmd: '/format', desc: 'Code Format' },
            { cmd: '/typecheck', desc: 'Type Check' },
            { cmd: '/audit', desc: 'Dependency Audit' },
            { cmd: '/benchmark', desc: 'Performance Benchmark' },
        ]
    },
    strategy: {
        name: 'Strategy',
        icon: '🎯',
        binh_phap: '始計篇',
        commands: [
            { cmd: '/swot', desc: 'SWOT Analysis' },
            { cmd: '/competitor', desc: 'Competitor Analysis' },
            { cmd: '/market', desc: 'Market Research' },
            { cmd: '/persona', desc: 'Customer Personas' },
            { cmd: '/roadmap', desc: 'Product Roadmap' },
            { cmd: '/kpi', desc: 'KPI Dashboard' },
            { cmd: '/retro', desc: 'Retrospective' },
            { cmd: '/quarterly', desc: 'Quarterly Review' },
        ]
    },
    vietnamese: {
        name: 'Vietnamese',
        icon: '🇻🇳',
        binh_phap: '地形篇',
        commands: [
            { cmd: '/phan-tich', desc: 'Phân Tích Thị Trường' },
            { cmd: '/bao-cao', desc: 'Báo Cáo Tự Động' },
            { cmd: '/du-an', desc: 'Quản Lý Dự Án' },
            { cmd: '/nhan-su', desc: 'Quản Lý Nhân Sự' },
            { cmd: '/hop-dong', desc: 'Tạo Hợp Đồng' },
            { cmd: '/lich-trinh', desc: 'Lịch Trình' },
            { cmd: '/muc-tieu', desc: 'Đặt Mục Tiêu' },
            { cmd: '/danh-gia', desc: 'Đánh Giá Hiệu Suất' },
        ]
    },
    sync: {
        name: 'Sync',
        icon: '🔄',
        binh_phap: '用間篇',
        commands: [
            { cmd: '/sync-agent', desc: 'Sync Agent Config' },
            { cmd: '/sync-rules', desc: 'Sync Rules' },
            { cmd: '/sync-tasks', desc: 'Sync Tasks' },
            { cmd: '/sync-mcp', desc: 'Sync MCP Servers' },
            { cmd: '/sync-all', desc: 'Sync Everything' },
        ]
    },
    newsletter: {
        name: 'Newsletter',
        icon: '📧',
        binh_phap: '火攻篇',
        commands: [
            { cmd: '/newsletter', desc: 'Newsletter Dashboard' },
            { cmd: '/newsletter:create', desc: 'Create New Newsletter' },
            { cmd: '/newsletter:edit', desc: 'Open Newsletter Editor' },
            { cmd: '/newsletter:ai-write', desc: 'AI Content Generator' },
            { cmd: '/newsletter:send', desc: 'Send Newsletter' },
            { cmd: '/newsletter:analytics', desc: 'View Analytics' },
            { cmd: '/newsletter:subscribers', desc: 'Manage Subscribers' },
            { cmd: '/newsletter:automations', desc: 'Email Automations' },
        ]
    },
    navigation: {
        name: 'Navigate',
        icon: '🚀',
        binh_phap: '行軍篇',
        commands: [
            { cmd: '/go:dashboard', desc: 'Go to Dashboard', action: 'navigate', path: '/dashboard' },
            { cmd: '/go:hubs', desc: 'Go to Hubs', action: 'navigate', path: '/hubs' },
            { cmd: '/go:analytics', desc: 'Go to Analytics', action: 'navigate', path: '/analytics' },
            { cmd: '/go:clients', desc: 'Go to Clients', action: 'navigate', path: '/clients' },
            { cmd: '/go:projects', desc: 'Go to Projects', action: 'navigate', path: '/projects' },
            { cmd: '/go:invoices', desc: 'Go to Invoices', action: 'navigate', path: '/invoices' },
            { cmd: '/go:marketing', desc: 'Go to Marketing', action: 'navigate', path: '/marketing' },
            { cmd: '/go:sales', desc: 'Go to Sales', action: 'navigate', path: '/sales' },
            { cmd: '/go:warroom', desc: 'Go to War Room', action: 'navigate', path: '/warroom' },
            { cmd: '/go:binhphap', desc: 'Go to Binh Pháp', action: 'navigate', path: '/binhphap' },
            { cmd: '/go:agents', desc: 'Go to Agents', action: 'navigate', path: '/agents' },
            { cmd: '/go:settings', desc: 'Go to Settings', action: 'navigate', path: '/settings' },
        ]
    }
};

const API_BASE = process.env.NEXT_PUBLIC_AGENTIC_API_URL || 'http://localhost:8080';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    onExecute?: (command: string, result: any) => void;
}

export default function CommandPalette({ isOpen, onClose, onExecute }: CommandPaletteProps) {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [executing, setExecuting] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<any>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Flatten all commands for search
    const allCommands = Object.entries(COMMAND_SUITES).flatMap(([key, suite]) =>
        suite.commands.map(cmd => ({
            ...cmd,
            suite: suite.name,
            icon: suite.icon,
            binh_phap: suite.binh_phap,
        }))
    );

    // Filter commands based on query
    const filteredCommands = allCommands.filter(cmd =>
        cmd.cmd.toLowerCase().includes(query.toLowerCase()) ||
        cmd.desc.toLowerCase().includes(query.toLowerCase()) ||
        cmd.suite.toLowerCase().includes(query.toLowerCase())
    );

    // Execute command via API
    const executeCommand = useCallback(async (command: string) => {
        setExecuting(command);
        try {
            const response = await fetch(`${API_BASE}/command/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: command.replace('/', ''), params: {} }),
            });
            const result = await response.json();
            setLastResult(result);
            onExecute?.(command, result);
        } catch (error) {
            console.error('Command execution failed:', error);
            setLastResult({ success: false, error: 'Connection failed' });
        } finally {
            setExecuting(null);
        }
    }, [onExecute]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(i => Math.max(i - 1, 0));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (filteredCommands[selectedIndex]) {
                        executeCommand(filteredCommands[selectedIndex].cmd);
                    }
                    break;
                case 'Escape':
                    onClose();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredCommands, selectedIndex, executeCommand, onClose]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Command Palette */}
            <div className="relative w-full max-w-2xl bg-gray-900/95 border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
                    <Command className="w-5 h-5 text-emerald-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                        placeholder="Type a command... (135 available)"
                        className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-lg"
                    />
                    <span className="text-xs text-gray-500 px-2 py-1 bg-gray-800 rounded">ESC</span>
                </div>

                {/* Last Result */}
                {lastResult && (
                    <div className={`px-4 py-2 text-sm ${lastResult.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {lastResult.success ? '✅ ' : '❌ '}
                        {lastResult.binh_phap && <span className="mr-2">🏯 {lastResult.binh_phap}</span>}
                        {lastResult.command || lastResult.error}
                    </div>
                )}

                {/* Commands List */}
                <div className="max-h-[400px] overflow-y-auto">
                    {filteredCommands.slice(0, 20).map((cmd, index) => (
                        <div
                            key={cmd.cmd}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all ${index === selectedIndex
                                ? 'bg-emerald-500/20 border-l-2 border-emerald-400'
                                : 'hover:bg-gray-800/50'
                                }`}
                            onClick={() => executeCommand(cmd.cmd)}
                        >
                            <span className="text-2xl">{cmd.icon}</span>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <code className="text-emerald-400 font-mono">{cmd.cmd}</code>
                                    {executing === cmd.cmd && (
                                        <span className="animate-spin text-amber-400">⚡</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-400">{cmd.desc}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-gray-500">{cmd.suite}</span>
                                <div className="text-xs text-gray-600">{cmd.binh_phap}</div>
                            </div>
                            <Play className="w-4 h-4 text-gray-600 group-hover:text-emerald-400" />
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-gray-800 text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                        <span>↑↓ Navigate</span>
                        <span>↵ Execute</span>
                        <span>ESC Close</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-emerald-400" />
                        <span>{filteredCommands.length} / 143 commands</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Hook to open command palette with Cmd+K
export function useCommandPalette() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return { isOpen, setIsOpen };
}
