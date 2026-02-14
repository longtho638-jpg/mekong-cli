'use client';

import React from 'react';
import {
    Truck,
    MapPin,
    Clock,
    CheckCircle,
    AlertCircle,
    Package,
    Navigation,
    BarChart3,
    TrendingUp,
    TrendingDown
} from 'lucide-react';

export default function LogisticsPortal() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                        Agrios Logistics Tower
                    </h1>
                    <p className="text-sm text-slate-500">Physical Distribution Network • Powered by Logistics AI</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-4 py-2 rounded-lg bg-slate-900 border border-white/10 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs font-bold text-slate-300">Network: OPTIMAL</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* 1. Fleet Status */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                        <h2 className="text-sm font-bold text-slate-400 mb-4 uppercase">Fleet Status</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500"><Truck className="h-5 w-5" /></div>
                                    <div>
                                        <p className="text-xl font-bold text-white">12</p>
                                        <p className="text-xs text-slate-500">Active Trucks</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500"><Clock className="h-5 w-5" /></div>
                                    <div>
                                        <p className="text-xl font-bold text-white">8</p>
                                        <p className="text-xs text-slate-500">Pending Pickup</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><Package className="h-5 w-5" /></div>
                                    <div>
                                        <p className="text-xl font-bold text-white">1,450</p>
                                        <p className="text-xs text-slate-500">Items Shipped</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                        <h2 className="text-sm font-bold text-slate-400 mb-4 uppercase">Driver Alerts</h2>
                        <div className="space-y-3">
                            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex gap-3">
                                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-1" />
                                <div>
                                    <p className="text-xs font-bold text-white">Delay Warning: Route HCM-04</p>
                                    <p className="text-[10px] text-slate-400">Traffic Jam at Trung Luong Hwy (+30m)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Live Map & Routes */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 min-h-[400px] relative overflow-hidden group">
                        {/* Mock Map Background */}
                        <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/105.7,10.3,9,0/800x400?access_token=pk.mock')] bg-cover opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>

                        <div className="relative z-10">
                            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <Navigation className="h-5 w-5 text-blue-400" />
                                Live Route Optimization
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Route Card 1 */}
                                <div className="p-4 rounded-xl bg-slate-800/80 backdrop-blur border border-white/10">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-bold text-white">Route: Sa Dec → HCMC</h3>
                                            <p className="text-xs text-slate-400">Truck: 51C-123.45 • Driver: Nguyen Van A</p>
                                        </div>
                                        <span className="px-2 py-1 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400">IN TRANSIT</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm mb-4">
                                        <div className="flex items-center gap-1 text-slate-300"><MapPin className="h-3 w-3" /> Sa Dec (10:00)</div>
                                        <div className="h-px flex-1 bg-slate-600"></div>
                                        <div className="flex items-center gap-1 text-slate-300"><MapPin className="h-3 w-3" /> HCMC (13:30)</div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500">Cargo: <span className="text-white">500x Rose Pots</span></span>
                                        <span className="text-emerald-400 font-bold">On Time</span>
                                    </div>
                                </div>

                                {/* Route Card 2 */}
                                <div className="p-4 rounded-xl bg-slate-800/80 backdrop-blur border border-white/10">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-bold text-white">Route: Local Pickup (Tan Quy Dong)</h3>
                                            <p className="text-xs text-slate-400">Tuk Tuk: 66-G1 5678 • Driver: Le Van B</p>
                                        </div>
                                        <span className="px-2 py-1 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">PICKING UP</span>
                                    </div>
                                    <div className="w-full bg-slate-700 h-1.5 rounded-full mb-2">
                                        <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: '60%' }}></div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500">Progress: 3/5 Stops</span>
                                        <span className="text-white">ETA: 15 mins</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Performance Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Delivery Success Rate</h3>
                            <p className="text-2xl font-bold text-white">98.5%</p>
                            <p className="text-xs text-emerald-400 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> +1.2% vs last week</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Avg. Cost / Km</h3>
                            <p className="text-2xl font-bold text-white">₫12,000</p>
                            <p className="text-xs text-emerald-400 flex items-center gap-1"><TrendingDown className="h-3 w-3" /> -5% optimized</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">CO2 Savings</h3>
                            <p className="text-2xl font-bold text-white">150 kg</p>
                            <p className="text-xs text-blue-400">Green Logistics Route</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
