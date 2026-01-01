'use client';

import { Shield, AlertTriangle, Users, Eye, CheckCircle, XCircle, Search, Loader2 } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';
import { useState } from 'react';
import { useBlacklist } from '@/hooks/useBlueOcean';
import { checkClientDNA, ClientDNA } from '@/lib/api/blue-ocean';

export default function DefensePage({ params: { locale } }: { params: { locale: string } }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [checkResult, setCheckResult] = useState<ClientDNA | null>(null);
    const [isChecking, setIsChecking] = useState(false);

    const { data: blacklist, isLoading: blacklistLoading } = useBlacklist();

    // Handle client check
    const handleCheck = async () => {
        if (!searchQuery.trim()) return;
        setIsChecking(true);
        try {
            const result = await checkClientDNA(searchQuery);
            setCheckResult(result);
        } catch (error) {
            console.error('Check failed:', error);
        } finally {
            setIsChecking(false);
        }
    };

    // Build metrics from API
    const defenseMetrics = [
        { label: 'Protected Value', value: '$127K', icon: <Shield className="w-5 h-5" />, color: '#22c55e', trend: { value: '+$18K', direction: 'up' as const } },
        { label: 'Active Alerts', value: '3', icon: <AlertTriangle className="w-5 h-5" />, color: '#f59e0b', trend: { value: '-2', direction: 'down' as const } },
        { label: 'Blacklisted', value: blacklist ? `${blacklist.total}` : '...', icon: <XCircle className="w-5 h-5" />, color: '#ef4444', trend: { value: '+1', direction: 'up' as const } },
        { label: 'Verified Reports', value: '3.8K', icon: <CheckCircle className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+156', direction: 'up' as const } },
    ];

    // Threat trends (static for now)
    const threatTrends = [
        { name: 'Jul', value: 12 }, { name: 'Aug', value: 8 }, { name: 'Sep', value: 15 },
        { name: 'Oct', value: 10 }, { name: 'Nov', value: 6 }, { name: 'Dec', value: 3 },
    ];

    // Risk Categories
    const riskCategories = [
        { name: 'Payment Issues', value: 45, color: '#ef4444' },
        { name: 'Scope Creep', value: 28, color: '#f59e0b' },
        { name: 'Ghost Client', value: 15, color: '#a855f7' },
        { name: 'Legal Risk', value: 12, color: '#3b82f6' },
    ];

    const defenseCharts = [
        { type: 'area' as const, title: 'Threat Reports (30d)', data: threatTrends },
        { type: 'bar' as const, title: 'Risk Categories', data: riskCategories },
    ];

    const defenseActions = [
        { icon: '🔍', label: 'Check Client', onClick: () => console.log('Check') },
        { icon: '🚨', label: 'Report', onClick: () => console.log('Report') },
        { icon: '✅', label: 'Verify', onClick: () => console.log('Verify') },
        { icon: '📋', label: 'Blacklist', onClick: () => console.log('Blacklist') },
        { icon: '🛡️', label: 'My Cases', onClick: () => console.log('Cases') },
        { icon: '📊', label: 'Analytics', onClick: () => console.log('Analytics') },
    ];

    // Get blacklist clients from API
    const blacklistedClients = blacklist?.clients || [];

    return (
        <DepartmentDashboard
            title="Mutual Defense"
            subtitle="Client DNA • Risk Detection • Collective Protection"
            icon="🛡️"
            color="red"
            statusLabel="Protected"
            statusValue="$127K"
            metrics={defenseMetrics}
            charts={defenseCharts}
            quickActions={defenseActions}
            locale={locale}
        >
            {/* Client DNA Search */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 mt-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-400" />
                    Client DNA Passport Check
                </h3>

                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Enter client name or domain..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    </div>
                    <button
                        onClick={handleCheck}
                        disabled={isChecking}
                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isChecking && <Loader2 className="w-4 h-4 animate-spin" />}
                        Check
                    </button>
                </div>

                {/* Check Result */}
                <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${checkResult?.status === 'safe' ? 'bg-green-500/20' :
                                checkResult?.status === 'warning' ? 'bg-yellow-500/20' :
                                    checkResult?.status === 'danger' ? 'bg-red-500/20' : 'bg-green-500/20'
                            }`}>
                            {checkResult?.status === 'safe' && <CheckCircle className="w-6 h-6 text-green-400" />}
                            {checkResult?.status === 'warning' && <AlertTriangle className="w-6 h-6 text-yellow-400" />}
                            {checkResult?.status === 'danger' && <XCircle className="w-6 h-6 text-red-400" />}
                            {!checkResult && <CheckCircle className="w-6 h-6 text-green-400" />}
                        </div>
                        <div>
                            <div className="text-sm text-gray-400">{checkResult ? 'Check Result' : 'Last Check Result'}</div>
                            <div className={`font-bold ${checkResult?.status === 'safe' ? 'text-green-400' :
                                    checkResult?.status === 'warning' ? 'text-yellow-400' :
                                        checkResult?.status === 'danger' ? 'text-red-400' : 'text-green-400'
                                }`}>
                                {checkResult ? `${checkResult.status === 'safe' ? '✅' : '⚠️'} "${checkResult.client}" - ${checkResult.status.toUpperCase()}` : '✅ "Acme Corp" - SAFE'}
                            </div>
                            <div className="text-xs text-gray-500">
                                Payment history: {checkResult?.payment_history || 'Excellent'} |
                                Reports: {checkResult?.reports || 0} |
                                Trust: {checkResult?.trust_score || 92}/100
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Blacklist */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 mt-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-400" />
                    Network Blacklist ({blacklist?.total || 23} Clients)
                    {blacklistLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
                </h3>

                <div className="space-y-3">
                    {blacklistedClients.map((client) => (
                        <div key={client.name} className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className={`px-2 py-1 rounded text-xs font-bold ${client.risk === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                                    }`}>
                                    {client.risk.toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-bold text-white">{client.name}</div>
                                    <div className="text-xs text-gray-500">{client.reason}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-400">{client.reports} reports</div>
                            </div>
                        </div>
                    ))}
                </div>

                <button className="mt-4 w-full py-2 border border-white/10 rounded-lg text-sm text-gray-400 hover:bg-white/5 transition-colors">
                    View All {blacklist?.total || 23} Blacklisted Clients →
                </button>
            </div>
        </DepartmentDashboard>
    );
}
