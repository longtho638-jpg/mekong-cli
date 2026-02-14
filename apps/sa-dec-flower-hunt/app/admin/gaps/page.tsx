"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, AlertTriangle, Target, Map, Shield, FileDown, LayoutDashboard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

import { GapMatrix } from "@/components/admin/GapMatrix";
import { PriorityShortlist } from "@/components/admin/PriorityShortlist";
import { RoadmapTimeline } from "@/components/admin/RoadmapTimeline";
import { RiskHeatmap } from "@/components/admin/RiskHeatmap";
import { ExecutionPrinciples } from "@/components/admin/ExecutionPrinciples";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function GapReportPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");

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
                    <h1 className="text-xl font-bold mb-2">Strategic Gap Analysis</h1>
                    <p className="text-stone-400 mb-6 text-sm">Access restricted to Strategy Office.</p>
                    <div className="space-y-4">
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Strategy Key"
                            className="bg-stone-950 border-stone-800 text-white"
                            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                        />
                        <Button onClick={handleLogin} className="w-full bg-white text-stone-900 hover:bg-stone-200">
                            Unlock Report
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
                        <div className="bg-indigo-600 p-1.5 rounded-lg">
                            <Map className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-lg font-bold text-stone-900 dark:text-stone-100 hidden md:block">
                            Gap Report & Execution Roadmap
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/admin">
                             <Button variant="ghost" size="sm">Back to Admin</Button>
                        </Link>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 space-y-8">
                {/* Summary Stats */}
                 <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-stone-500">Total Identified Gaps</p>
                                <h3 className="text-2xl font-bold">24</h3>
                            </div>
                            <div className="p-3 bg-stone-100 dark:bg-stone-800 rounded-full">
                                <LayoutDashboard className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-stone-500">Critical "Now" Items</p>
                                <h3 className="text-2xl font-bold text-red-600">5</h3>
                            </div>
                            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-stone-500">Roadmap Progress</p>
                                <h3 className="text-2xl font-bold text-blue-600">12%</h3>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                                <Target className="w-5 h-5 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end">
                    <Button variant="outline" size="sm" className="text-stone-600">
                        <FileDown className="w-4 h-4 mr-2" />
                        Export Executive PDF
                    </Button>
                </div>

                <Tabs defaultValue="matrix" className="space-y-6">
                    <TabsList className="bg-white dark:bg-stone-900 p-1 border border-stone-200 dark:border-stone-800 w-full justify-start overflow-x-auto">
                        <TabsTrigger value="matrix" className="gap-2">Gap Matrix</TabsTrigger>
                        <TabsTrigger value="priority" className="gap-2">Priority Shortlist</TabsTrigger>
                        <TabsTrigger value="roadmap" className="gap-2">Timeline</TabsTrigger>
                        <TabsTrigger value="risks" className="gap-2">Risk Heatmap</TabsTrigger>
                        <TabsTrigger value="principles" className="gap-2">Execution Principles</TabsTrigger>
                    </TabsList>

                    <TabsContent value="matrix">
                        <GapMatrix />
                    </TabsContent>
                    <TabsContent value="priority">
                        <PriorityShortlist />
                    </TabsContent>
                    <TabsContent value="roadmap">
                        <Card>
                            <CardHeader>
                                <CardTitle>24-Month Execution Roadmap</CardTitle>
                                <CardDescription>Strategic horizons from Foundation to IPO</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RoadmapTimeline />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="risks">
                         <RiskHeatmap />
                    </TabsContent>
                    <TabsContent value="principles">
                        <ExecutionPrinciples />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
