'use client';

import { useState } from 'react';
import {
    Bot,
    Crown,
    Briefcase,
    Leaf,
    Play,
    Pause,
    Settings,
    CheckCircle,
    AlertCircle,
    Clock,
    Zap,
    TrendingUp,
    Shield,
    Scale,
    Users,
    Target,
    PenTool,
    Megaphone,
    MessageCircle,
    Package,
    Truck,
    Star,
    Calendar,
    Receipt,
    UserPlus,
    Cog
} from 'lucide-react';

// Agent Types
type AgentStatus = 'active' | 'idle' | 'running' | 'error';
type AgentOwner = 'chairman' | 'ceo' | 'coo';

interface Agent {
    id: number;
    name: string;
    nameVi: string;
    replaces: string;
    owner: AgentOwner;
    status: AgentStatus;
    icon: any;
    lastRun?: string;
    tasksCompleted: number;
}

// 30 Agents Data
const agentsData: Agent[] = [
    // Chairman (Long) - 10 Agents
    { id: 1, name: 'Strategic AI', nameVi: 'Chiến lược', replaces: 'Consultant', owner: 'chairman', status: 'idle', icon: Target, tasksCompleted: 12 },
    { id: 2, name: 'Cap Table AI', nameVi: 'Cổ phần', replaces: 'CFO Part-time', owner: 'chairman', status: 'idle', icon: TrendingUp, tasksCompleted: 8 },
    { id: 3, name: 'Investor Updates', nameVi: 'Cập nhật NĐT', replaces: 'IR Manager', owner: 'chairman', status: 'running', icon: MessageCircle, tasksCompleted: 24 },
    { id: 4, name: 'Fundraising AI', nameVi: 'Gọi vốn', replaces: 'Advisor', owner: 'chairman', status: 'idle', icon: Zap, tasksCompleted: 5 },
    { id: 5, name: 'Legal AI', nameVi: 'Pháp lý', replaces: 'Lawyer', owner: 'chairman', status: 'idle', icon: Scale, tasksCompleted: 3 },
    { id: 6, name: 'Board Meeting AI', nameVi: 'Họp HĐQT', replaces: 'EA', owner: 'chairman', status: 'idle', icon: Users, tasksCompleted: 2 },
    { id: 7, name: 'Risk AI', nameVi: 'Rủi ro', replaces: 'Risk Officer', owner: 'chairman', status: 'idle', icon: Shield, tasksCompleted: 4 },
    { id: 8, name: 'Governance AI', nameVi: 'Quản trị', replaces: 'Secretary', owner: 'chairman', status: 'idle', icon: Crown, tasksCompleted: 1 },
    { id: 9, name: 'IP Protection', nameVi: 'Sở hữu trí tuệ', replaces: 'IP Lawyer', owner: 'chairman', status: 'idle', icon: Shield, tasksCompleted: 2 },
    { id: 10, name: 'Exit Planning', nameVi: 'Kế hoạch Exit', replaces: 'M&A Advisor', owner: 'chairman', status: 'idle', icon: Target, tasksCompleted: 1 },

    // CEO (Thông) - 10 Agents
    { id: 11, name: 'Yield Predictor', nameVi: 'Dự báo Mùa vụ', replaces: 'Revenue Manager', owner: 'ceo', status: 'active', icon: TrendingUp, tasksCompleted: 45 },
    { id: 12, name: 'Hunter Guide', nameVi: 'Hoa tiêu Săn hoa', replaces: 'Tour Guide Lead', owner: 'ceo', status: 'running', icon: Megaphone, tasksCompleted: 78 },
    { id: 13, name: 'Content AI', nameVi: 'Nội dung', replaces: 'Content Team', owner: 'ceo', status: 'active', icon: PenTool, tasksCompleted: 156 },
    { id: 14, name: 'Ads AI', nameVi: 'Quảng cáo', replaces: 'Performance', owner: 'ceo', status: 'running', icon: Zap, tasksCompleted: 89 },
    { id: 15, name: 'Customer AI', nameVi: 'Khách hàng', replaces: 'CS Team', owner: 'ceo', status: 'active', icon: MessageCircle, tasksCompleted: 234 },
    { id: 16, name: 'Product AI', nameVi: 'Sản phẩm', replaces: 'Product Manager', owner: 'ceo', status: 'idle', icon: Package, tasksCompleted: 23 },
    { id: 17, name: 'Pricing AI', nameVi: 'Định giá', replaces: 'Revenue Analyst', owner: 'ceo', status: 'idle', icon: Receipt, tasksCompleted: 12 },
    { id: 18, name: 'Competitor AI', nameVi: 'Đối thủ', replaces: 'Market Research', owner: 'ceo', status: 'idle', icon: Target, tasksCompleted: 8 },
    { id: 19, name: 'KPI Dashboard', nameVi: 'Bảng KPI', replaces: 'Business Analyst', owner: 'ceo', status: 'active', icon: TrendingUp, tasksCompleted: 67 },
    { id: 20, name: 'Growth AI', nameVi: 'Tăng trưởng', replaces: 'Growth Hacker', owner: 'ceo', status: 'idle', icon: Zap, tasksCompleted: 18 },

    // COO (Còn) - 10 Agents
    { id: 21, name: 'Garden OS', nameVi: 'Hệ điều hành Vườn', replaces: 'Farm Manager', owner: 'coo', status: 'active', icon: Leaf, tasksCompleted: 89 },
    { id: 22, name: 'Logistics AI', nameVi: 'Logistics', replaces: 'Logistics Mgr', owner: 'coo', status: 'running', icon: Truck, tasksCompleted: 124 },
    { id: 23, name: 'Quality AI', nameVi: 'Chất lượng', replaces: 'QC Inspector', owner: 'coo', status: 'active', icon: Star, tasksCompleted: 67 },
    { id: 24, name: 'Supplier AI', nameVi: 'Nhà cung cấp', replaces: 'Procurement', owner: 'coo', status: 'idle', icon: Package, tasksCompleted: 34 },
    { id: 25, name: 'Inventory AI', nameVi: 'Tồn kho', replaces: 'Warehouse Mgr', owner: 'coo', status: 'idle', icon: Package, tasksCompleted: 45 },
    { id: 26, name: 'Farmer Training', nameVi: 'Đào tạo', replaces: 'Training Coord', owner: 'coo', status: 'idle', icon: Users, tasksCompleted: 12 },
    { id: 27, name: 'Scheduler AI', nameVi: 'Lịch trình', replaces: 'Ops Coordinator', owner: 'coo', status: 'active', icon: Calendar, tasksCompleted: 56 },
    { id: 28, name: 'Finance Ops', nameVi: 'Tài chính VH', replaces: 'Bookkeeper', owner: 'coo', status: 'active', icon: Receipt, tasksCompleted: 78 },
    { id: 29, name: 'HR AI', nameVi: 'Nhân sự', replaces: 'HR Generalist', owner: 'coo', status: 'idle', icon: UserPlus, tasksCompleted: 8 },
    { id: 30, name: 'Process AI', nameVi: 'Quy trình', replaces: 'Process Engineer', owner: 'coo', status: 'idle', icon: Cog, tasksCompleted: 15 },
];

// Status badge component
const StatusBadge = ({ status }: { status: AgentStatus }) => {
    const styles = {
        active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        running: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 animate-pulse',
        idle: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        error: 'bg-red-500/20 text-red-400 border-red-500/30'
    };

    const icons = {
        active: CheckCircle,
        running: Zap,
        idle: Clock,
        error: AlertCircle
    };

    const Icon = icons[status];

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${styles[status]}`}>
            <Icon className="h-3 w-3" />
            {status}
        </span>
    );
};

// Agent Card Component
const AgentCard = ({ agent, onToggle }: { agent: Agent; onToggle: (id: number) => void }) => {
    const Icon = agent.icon;
    const ownerColors = {
        chairman: 'from-amber-500 to-yellow-500',
        ceo: 'from-blue-500 to-cyan-500',
        coo: 'from-emerald-500 to-green-500'
    };

    return (
        <div className="group relative bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/5 p-4 hover:bg-slate-800/80 hover:border-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
            {/* Agent Number Badge */}
            <div className={`absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gradient-to-br ${ownerColors[agent.owner]} flex items-center justify-center text-[10px] font-bold text-white shadow-lg`}>
                {agent.id}
            </div>

            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${ownerColors[agent.owner]} bg-opacity-20 flex items-center justify-center`}>
                    <Icon className="h-5 w-5 text-white" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{agent.name}</h4>
                    <p className="text-[10px] text-slate-400">{agent.nameVi}</p>
                    <p className="text-[10px] text-slate-500 mt-1">↔ {agent.replaces}</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="mt-3 flex items-center justify-between">
                <StatusBadge status={agent.status} />
                <span className="text-[10px] text-slate-500 font-mono">{agent.tasksCompleted} tasks</span>
            </div>

            {/* Controls (on hover) */}
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                <button
                    onClick={() => onToggle(agent.id)}
                    className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors"
                >
                    {agent.status === 'running' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button className="p-2 rounded-lg bg-slate-500/20 hover:bg-slate-500/30 text-slate-400 transition-colors">
                    <Settings className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

export function AgentsTab() {
    const [agents, setAgents] = useState(agentsData);
    const [filter, setFilter] = useState<AgentOwner | 'all'>('all');

    const toggleAgent = (id: number) => {
        setAgents(prev => prev.map(agent => {
            if (agent.id === id) {
                return {
                    ...agent,
                    status: agent.status === 'running' ? 'idle' : 'running'
                };
            }
            return agent;
        }));
    };

    const filteredAgents = filter === 'all'
        ? agents
        : agents.filter(a => a.owner === filter);

    const stats = {
        total: agents.length,
        running: agents.filter(a => a.status === 'running').length,
        active: agents.filter(a => a.status === 'active').length,
        tasksTotal: agents.reduce((sum, a) => sum + a.tasksCompleted, 0)
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <Bot className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">30 Agentic Fleet</h2>
                        <p className="text-xs text-slate-400">Đội ngũ AI thay thế 11 nhân sự</p>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-4">
                    <div className="text-center px-4 py-2 rounded-lg bg-slate-800/50 border border-white/5">
                        <p className="text-2xl font-bold text-violet-400 font-mono">{stats.running}</p>
                        <p className="text-[10px] text-slate-500 uppercase">Running</p>
                    </div>
                    <div className="text-center px-4 py-2 rounded-lg bg-slate-800/50 border border-white/5">
                        <p className="text-2xl font-bold text-emerald-400 font-mono">{stats.active}</p>
                        <p className="text-[10px] text-slate-500 uppercase">Active</p>
                    </div>
                    <div className="text-center px-4 py-2 rounded-lg bg-slate-800/50 border border-white/5">
                        <p className="text-2xl font-bold text-cyan-400 font-mono">{stats.tasksTotal.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500 uppercase">Tasks Done</p>
                    </div>
                </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2">
                {[
                    { id: 'all', label: 'All Agents', count: 30 },
                    { id: 'chairman', label: '🏛️ Chairman (Long)', count: 10 },
                    { id: 'ceo', label: '💼 CEO (Thông)', count: 10 },
                    { id: 'coo', label: '🌿 COO (Còn)', count: 10 },
                ].map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id as AgentOwner | 'all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f.id
                            ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                            : 'bg-slate-800/50 text-slate-400 border border-white/5 hover:bg-slate-800'
                            }`}
                    >
                        {f.label} ({f.count})
                    </button>
                ))}
            </div>

            {/* Agents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {filteredAgents.map(agent => (
                    <AgentCard key={agent.id} agent={agent} onToggle={toggleAgent} />
                ))}
            </div>

            {/* Cost Savings Banner */}
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border border-violet-500/20">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white">💰 Monthly Savings</h3>
                        <p className="text-sm text-slate-400">30 AI Agents vs 11 Human Employees</p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold text-emerald-400 font-mono">$12,300</p>
                        <p className="text-xs text-slate-500">$147,600 / year</p>
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-slate-800/50">
                        <p className="text-xs text-slate-400">Human Cost</p>
                        <p className="text-lg font-bold text-red-400 font-mono line-through">$13,100/mo</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50">
                        <p className="text-xs text-slate-400">AI Cost</p>
                        <p className="text-lg font-bold text-emerald-400 font-mono">$800/mo</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
