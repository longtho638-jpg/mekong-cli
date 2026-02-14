"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Download, RefreshCcw, DollarSign, PieChart, Activity, Layers, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

import { ModelArchetype } from "@/components/admin/ModelArchetype";
import { RevenueLogicMap } from "@/components/admin/RevenueLogicMap";
import { UnitEconomicsFrame } from "@/components/admin/UnitEconomicsFrame";
import { CostStructure } from "@/components/admin/CostStructure";
import { LeverageRisks } from "@/components/admin/LeverageRisks";

export default function EconomicsDashboard() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const auth = localStorage.getItem("admin_auth");
        if (auth === "true") setIsAuthenticated(true);
    }, []);

    const handleLogin = () => {
        if (password === "admin123") {
            localStorage.setItem("admin_auth", "true");
            setIsAuthenticated(true);
        } else {
            alert("Incorrect Password");
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-950 text-stone-100">
                <div className="bg-stone-900 p-8 rounded-2xl border border-stone-800 text-center max-w-md w-full">
                    <div className="bg-stone-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-stone-400" />
                    </div>
                    <h1 className="text-xl font-bold mb-2">Financial Access</h1>
                    <p className="text-stone-400 mb-6 text-sm">Restricted to CFO & Strategic Planning.</p>
                    <div className="space-y-4">
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Finance Key"
                            className="bg-stone-950 border-stone-800 text-white"
                            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                        />
                        <Button onClick={handleLogin} className="w-full bg-white text-stone-900 hover:bg-stone-200">
                            Unlock Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors duration-300">
            <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-1.5 rounded-lg">
                            <PieChart className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-lg font-bold text-stone-900 dark:text-stone-100 hidden md:block">
                            Unit Economics Dashboard
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                         <span className="text-xs text-stone-400 hidden sm:block">
                            Last updated: {new Date().toLocaleDateString()}
                        </span>
                        <Link href="/admin">
                             <Button variant="ghost" size="sm">Back to Admin</Button>
                        </Link>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 space-y-8">
                {/* Header Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-stone-900 p-4 rounded-lg border border-stone-200 dark:border-stone-800 shadow-sm">
                        <div className="text-xs text-stone-500 uppercase font-bold">Gross Margin</div>
                        <div className="text-2xl font-bold text-indigo-600 mt-1">35.0%</div>
                    </div>
                     <div className="bg-white dark:bg-stone-900 p-4 rounded-lg border border-stone-200 dark:border-stone-800 shadow-sm">
                        <div className="text-xs text-stone-500 uppercase font-bold">CAC Payback</div>
                        <div className="text-2xl font-bold text-green-600 mt-1">2.0 Mo</div>
                    </div>
                     <div className="bg-white dark:bg-stone-900 p-4 rounded-lg border border-stone-200 dark:border-stone-800 shadow-sm">
                        <div className="text-xs text-stone-500 uppercase font-bold">LTV:CAC</div>
                        <div className="text-2xl font-bold text-purple-600 mt-1">5.0x</div>
                    </div>
                     <div className="bg-white dark:bg-stone-900 p-4 rounded-lg border border-stone-200 dark:border-stone-800 shadow-sm">
                        <div className="text-xs text-stone-500 uppercase font-bold">Monthly Burn</div>
                        <div className="text-2xl font-bold text-red-500 mt-1">$15k</div>
                    </div>
                </div>

                {/* Main Tabs */}
                <Tabs defaultValue="economics" className="space-y-6">
                    <TabsList className="bg-white dark:bg-stone-900 p-1 border border-stone-200 dark:border-stone-800 w-full justify-start overflow-x-auto">
                        <TabsTrigger value="economics" className="gap-2"><Activity className="w-4 h-4"/> Unit Economics</TabsTrigger>
                        <TabsTrigger value="model" className="gap-2"><Layers className="w-4 h-4"/> Business Model</TabsTrigger>
                        <TabsTrigger value="revenue" className="gap-2"><DollarSign className="w-4 h-4"/> Revenue Streams</TabsTrigger>
                        <TabsTrigger value="costs" className="gap-2"><PieChart className="w-4 h-4"/> Cost Structure</TabsTrigger>
                        <TabsTrigger value="risks" className="gap-2"><AlertCircle className="w-4 h-4"/> Leverage & Risks</TabsTrigger>
                    </TabsList>

                    <TabsContent value="economics" className="space-y-6">
                        <UnitEconomicsFrame />
                    </TabsContent>

                    <TabsContent value="model" className="space-y-6">
                        <ModelArchetype />
                    </TabsContent>

                    <TabsContent value="revenue" className="space-y-6">
                        <RevenueLogicMap />
                    </TabsContent>

                    <TabsContent value="costs" className="space-y-6">
                        <CostStructure />
                    </TabsContent>

                     <TabsContent value="risks" className="space-y-6">
                        <LeverageRisks />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
