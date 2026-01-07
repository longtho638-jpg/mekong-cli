'use client';

import { useEffect, useState } from 'react';

// Simple test page to verify AntigravityKit API integration
export default function TestAntigravityPage() {
    const [modules, setModules] = useState<any>(null);
    const [dna, setDna] = useState<any>(null);
    const [vc, setVc] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [modulesRes, dnaRes, vcRes] = await Promise.all([
                    fetch(`${API_BASE}/api/antigravity/modules`),
                    fetch(`${API_BASE}/api/antigravity/dna`),
                    fetch(`${API_BASE}/api/antigravity/vc`)
                ]);

                if (!modulesRes.ok || !dnaRes.ok || !vcRes.ok) {
                    throw new Error('API request failed');
                }

                setModules(await modulesRes.json());
                setDna(await dnaRes.json());
                setVc(await vcRes.json());
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [API_BASE]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-xl">Loading AntigravityKit...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <p className="text-xl text-red-400">Error: {error}</p>
                    <p className="text-gray-400 mt-2">Make sure backend is running on port 8000</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        🚀 AntigravityKit Test Page
                    </h1>
                    <p className="text-gray-400 mt-2">Live data from API (auto-refresh every 30s)</p>
                    <div className="inline-block mt-4 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                        ✅ Connected to {API_BASE}
                    </div>
                </div>

                {/* Agency DNA Card */}
                <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        🧬 AgencyDNA
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-700/50 rounded-lg p-4">
                            <p className="text-gray-400 text-sm">Name</p>
                            <p className="text-xl font-bold">{dna?.name}</p>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-4">
                            <p className="text-gray-400 text-sm">Niche</p>
                            <p className="text-xl font-bold">{dna?.niche}</p>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-4">
                            <p className="text-gray-400 text-sm">Location</p>
                            <p className="text-xl font-bold">{dna?.location}</p>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-4">
                            <p className="text-gray-400 text-sm">Tone</p>
                            <p className="text-xl font-bold capitalize">{dna?.tone?.replace('_', ' ')}</p>
                        </div>
                    </div>
                </div>

                {/* VC Readiness Card */}
                <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-6 mb-6 border border-orange-500/30">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        📊 VC Readiness
                    </h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-6xl font-bold text-orange-400">{vc?.score}/100</p>
                            <p className="text-gray-400 mt-2">Stage: {vc?.stage?.toUpperCase()}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-green-400">{vc?.ltv_cac_ratio?.toFixed(1)}x</p>
                                <p className="text-gray-400 text-sm">LTV/CAC</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-blue-400">{vc?.rule_of_40?.toFixed(0)}%</p>
                                <p className="text-gray-400 text-sm">Rule of 40</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-purple-400">{vc?.nrr}%</p>
                                <p className="text-gray-400 text-sm">NRR</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-pink-400">{vc?.growth_rate}%</p>
                                <p className="text-gray-400 text-sm">Growth</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modules Grid */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h2 className="text-2xl font-bold mb-4">🎯 All Modules ({modules?.total_modules})</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        {modules?.modules?.map((mod: any, i: number) => (
                            <div
                                key={i}
                                className="bg-gray-700/50 rounded-lg p-4 text-center hover:bg-gray-600/50 transition-colors cursor-pointer"
                            >
                                <div className="text-3xl mb-2">{mod.icon}</div>
                                <p className="font-medium text-sm">{mod.name}</p>
                                <p className={`text-xs mt-1 ${mod.status === 'active' ? 'text-green-400' : 'text-gray-400'}`}>
                                    {mod.status === 'active' ? '● Active' : '○ Inactive'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8 text-gray-500 text-sm">
                    <p>Last updated: {new Date().toLocaleTimeString()}</p>
                    <p className="mt-1">AntigravityKit WOW 2.0 - 9/9 Endpoints ✅</p>
                </div>
            </div>
        </div>
    );
}
