"use client";

import { motion } from "framer-motion";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { TerminalHeader } from "@/components/terminal/TerminalHeader";
import { CreditScoreVisual, InventoryVisual, LogisticsMapVisual } from "@/components/ui/node-visuals";
import { StreamingChart, GlobeNetwork } from "@/components/ui/animated-charts";
import { DataStream } from "@/components/terminal/DataStream";

export const MobileNodeGrid = () => {
    return (
        <div className="space-y-4 w-full max-w-lg mx-auto">
            {/* Node 1: Banks */}
            <TerminalCard glowOnHover>
                <TerminalHeader status="online">FINTECH_NODE</TerminalHeader>
                <div className="h-40 border border-emerald-500/10 bg-black/50 rounded mb-3">
                    <CreditScoreVisual />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <DataStream label="LOANS" value="$840K" />
                    <DataStream label="RISK" value="0.4%" trend="down" unit="%" />
                </div>
            </TerminalCard>

            {/* Node 2: Suppliers */}
            <TerminalCard glowOnHover>
                <TerminalHeader status="online">SUPPLY_NODE</TerminalHeader>
                <div className="h-40 border border-emerald-500/10 bg-black/50 rounded mb-3">
                    <InventoryVisual />
                </div>
                <div className="text-[10px] bg-amber-900/20 p-2 rounded border border-amber-500/20 font-mono">
                    <span className="text-stone-500">ALERT:</span> <span className="text-amber-400">NPK-20 (LOW)</span>
                </div>
            </TerminalCard>

            {/* Node 3: Farmers (Centerpiece) */}
            <TerminalCard glowOnHover>
                <TerminalHeader status="online">PRODUCTION_CORE</TerminalHeader>
                <div className="h-48 border border-emerald-500/10 bg-black/50 rounded mb-3">
                    <StreamingChart />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <DataStream label="AVG_TEMP" value="28.4" unit="°C" />
                    <DataStream label="SOIL_PH" value="6.5" />
                    <DataStream label="HUMIDITY" value="62" unit="%" />
                    <DataStream label="HARVEST" value="4.2" unit="T" trend="up" />
                </div>
            </TerminalCard>

            {/* Node 4: Logistics */}
            <TerminalCard glowOnHover>
                <TerminalHeader status="online">LOGISTICS_NET</TerminalHeader>
                <div className="h-40 border border-emerald-500/10 bg-black/50 rounded">
                    <LogisticsMapVisual />
                </div>
            </TerminalCard>

            {/* Node 5: Market */}
            <TerminalCard glowOnHover>
                <TerminalHeader status="online">MARKET_DEMAND</TerminalHeader>
                <div className="h-40 border border-emerald-500/10 bg-black/50 rounded mb-3 flex items-center justify-center">
                    <GlobeNetwork />
                </div>
                <DataStream label="TRAFFIC" value="24K" unit="/hr" trend="up" />
            </TerminalCard>
        </div>
    );
};
