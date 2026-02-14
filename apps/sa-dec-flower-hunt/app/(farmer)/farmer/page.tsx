"use client";

import { useFarmer } from "@/components/auth/FarmerAuthProvider";
import { useLanguage } from "@/lib/i18n";
import { GlassPanel } from "@/components/ui/glass-panel";
import { DataCard } from "@/components/ui/data-card";
import { NeonButton } from "@/components/ui/neon-button";
import {
    LayoutDashboard,
    TrendingUp,
    Package,
    Droplets,
    Thermometer,
    Wind,
    Sun,
    Flower2,
    Activity,
    Wifi
} from "lucide-react";

export default function FarmerTerminal() {
    const { profile, totalRevenue, pendingOrders } = useFarmer();
    const { t } = useLanguage();

    // Mock Real-time Data
    const sensorData = {
        temp: 28.5,
        humidity: 72,
        moisture: 65,
        light: 850
    };

    return (
        <div className="space-y-6">
            {/* Header / Status Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                        <LayoutDashboard className="w-8 h-8 text-emerald-500" />
                        Garden OS <span className="text-emerald-500 font-mono text-sm border border-emerald-500/30 px-2 py-0.5 rounded">v3.0</span>
                    </h1>
                    <p className="text-stone-400 font-mono text-xs mt-1">
                        NODE: {profile.farmerName?.toUpperCase() || "UNKNOWN"} // STATUS: <span className="text-emerald-500 animate-pulse">ONLINE</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <NeonButton variant="outline" className="h-10 text-xs text-stone-300 border-stone-700">
                        <Wifi className="w-4 h-4 mr-2" /> IoT Network
                    </NeonButton>
                    <NeonButton className="h-10 text-xs">
                        <Activity className="w-4 h-4 mr-2" /> AI Analysis
                    </NeonButton>
                </div>
            </div>

            {/* KPI Grid - The "Bloomberg" View */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <GlassPanel className="h-32" intensity="low">
                    <DataCard
                        label="Total Revenue"
                        value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue)}
                        trend="12.5%"
                        trendUp={true}
                        icon={TrendingUp}
                        subtext="vs. last month"
                    />
                </GlassPanel>

                <GlassPanel className="h-32" intensity="low">
                    <DataCard
                        label="Pending Orders"
                        value={pendingOrders.toString()}
                        trend="3 New"
                        trendUp={true}
                        icon={Package}
                        subtext="Processing queue"
                    />
                </GlassPanel>

                <GlassPanel className="h-32" intensity="low">
                    <DataCard
                        label="Inventory Load"
                        value="85%"
                        trend="High"
                        trendUp={true}
                        icon={Flower2}
                        subtext="Capacity optimization needed"
                    />
                </GlassPanel>

                <GlassPanel className="h-32" intensity="low">
                    <DataCard
                        label="Health Index"
                        value="98.2"
                        trend="Stable"
                        trendUp={true}
                        icon={Activity}
                        subtext="AI Crop Monitoring"
                    />
                </GlassPanel>
            </div>

            {/* Main Dashboard Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: IoT Sensor Array */}
                <div className="lg:col-span-2 space-y-6">
                    <GlassPanel className="p-6" intensity="medium">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-emerald-500" />
                                Live Environment
                            </h2>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20 font-mono">
                                UPDATE: LIVE
                            </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                                <div className="text-stone-500 text-xs uppercase mb-1 flex items-center gap-1"><Thermometer className="w-3 h-3" /> Temp</div>
                                <div className="text-2xl font-mono text-white">{sensorData.temp}°C</div>
                                <div className="w-full bg-stone-800 h-1 mt-2 rounded-full overflow-hidden">
                                    <div className="bg-orange-500 h-full w-[70%]" />
                                </div>
                            </div>

                            <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                                <div className="text-stone-500 text-xs uppercase mb-1 flex items-center gap-1"><Droplets className="w-3 h-3" /> Humidity</div>
                                <div className="text-2xl font-mono text-white">{sensorData.humidity}%</div>
                                <div className="w-full bg-stone-800 h-1 mt-2 rounded-full overflow-hidden">
                                    <div className="bg-blue-500 h-full w-[72%]" />
                                </div>
                            </div>

                            <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                                <div className="text-stone-500 text-xs uppercase mb-1 flex items-center gap-1"><Wind className="w-3 h-3" /> Moisture</div>
                                <div className="text-2xl font-mono text-white">{sensorData.moisture}%</div>
                                <div className="w-full bg-stone-800 h-1 mt-2 rounded-full overflow-hidden">
                                    <div className="bg-cyan-500 h-full w-[65%]" />
                                </div>
                            </div>

                            <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                                <div className="text-stone-500 text-xs uppercase mb-1 flex items-center gap-1"><Sun className="w-3 h-3" /> Light</div>
                                <div className="text-2xl font-mono text-white">{sensorData.light} lx</div>
                                <div className="w-full bg-stone-800 h-1 mt-2 rounded-full overflow-hidden">
                                    <div className="bg-yellow-500 h-full w-[85%]" />
                                </div>
                            </div>
                        </div>

                        {/* AI Insight Box */}
                        <div className="mt-4 bg-emerald-900/10 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-3">
                            <div className="bg-emerald-500/20 p-2 rounded-lg">
                                <Activity className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="text-emerald-400 text-sm font-bold mb-1">AI CROP INSIGHT</h4>
                                <p className="text-stone-300 text-xs leading-relaxed">
                                    Conditions are optimal for flowering. Suggested action: <span className="text-white font-bold">Increase irrigation by 10%</span> to maximize bloom size before harvest window (T-minus 14 days).
                                </p>
                            </div>
                        </div>
                    </GlassPanel>

                    {/* Pending Action Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <NeonButton className="h-24 flex flex-col items-center justify-center gap-2 bg-stone-900/50 hover:bg-stone-800" variant="secondary">
                            <Package className="w-6 h-6" />
                            <span>Process Orders ({pendingOrders})</span>
                        </NeonButton>
                        <NeonButton className="h-24 flex flex-col items-center justify-center gap-2 bg-stone-900/50 hover:bg-stone-800" variant="secondary">
                            <Flower2 className="w-6 h-6" />
                            <span>Update Inventory</span>
                        </NeonButton>
                    </div>
                </div>

                {/* Right: Quick Feed */}
                <div className="lg:col-span-1">
                    <GlassPanel className="h-full p-6" intensity="high">
                        <h3 className="text-lg font-bold text-white mb-4">System Log</h3>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex gap-3 text-xs border-b border-white/5 pb-3">
                                    <span className="text-stone-500 font-mono">10:4{i} AM</span>
                                    <div>
                                        <p className="text-stone-300">Sensor node #14 reported sync.</p>
                                        <span className="text-[10px] text-emerald-500">CONFIRMED</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassPanel>
                </div>
            </div>
        </div>
    );
}
