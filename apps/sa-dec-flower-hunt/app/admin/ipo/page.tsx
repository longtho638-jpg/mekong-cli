"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, TrendingUp, FileText, CheckSquare, Target, BarChart3, ListChecks } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { IPOScorecard } from "@/components/admin/IPOScorecard";
import { ListingPathways } from "@/components/admin/ListingPathways";
import { GovernanceGaps } from "@/components/admin/GovernanceGaps";
import { FinancialKPIReadiness } from "@/components/admin/FinancialKPIReadiness";
import { IPORoadmap } from "@/components/admin/IPORoadmap";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";

export default function IPOReadinessPage() {
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
                    <h1 className="text-xl font-bold mb-2">IPO Readiness Access</h1>
                    <p className="text-stone-400 mb-6 text-sm">Strategic data restricted to executive team.</p>
                    <div className="space-y-4">
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Executive Key"
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

    // Calculate Overall Score (Mock)
    const overallScore = 3.0; // Average of dimensions in Scorecard
    const progressPercentage = (overallScore / 5) * 100;

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors duration-300">
            <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-lg font-bold text-stone-900 dark:text-stone-100 hidden md:block">
                            IPO Readiness Control Tower
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="sm">Home</Button>
                        </Link>
                        <Link href="/admin">
                            <Button variant="ghost" size="sm">Back to Admin</Button>
                        </Link>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 space-y-8">
                {/* Hero / Summary Section */}
                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-2 bg-gradient-to-br from-blue-900 to-stone-900 text-white border-0">
                        <CardHeader>
                            <CardTitle className="text-2xl">Readiness Status: Series A Ready</CardTitle>
                            <CardDescription className="text-stone-300">
                                You are on track for VN_HOSE listing in 48+ months. Current focus should be on governance and audit readiness.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex gap-8 pt-4">
                            <div>
                                <div className="text-3xl font-bold">{overallScore}/5.0</div>
                                <div className="text-sm text-stone-400">Overall Score</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold">18 mo</div>
                                <div className="text-sm text-stone-400">Est. Time to IPO</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-yellow-400">5</div>
                                <div className="text-sm text-stone-400">Critical Gaps</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="flex flex-col justify-center items-center p-6">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            {/* Simple circular progress visualization */}
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <circle
                                    className="text-stone-200 stroke-current"
                                    strokeWidth="10"
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="transparent"
                                ></circle>
                                <circle
                                    className="text-blue-600 progress-ring__circle stroke-current transition-all duration-1000 ease-out"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="transparent"
                                    strokeDasharray="251.2"
                                    strokeDashoffset={251.2 - (251.2 * progressPercentage) / 100}
                                    transform="rotate(-90 50 50)"
                                ></circle>
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-2xl font-bold">{progressPercentage}%</span>
                                <span className="text-xs text-stone-500">Ready</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Main Tabs */}
                <Tabs defaultValue="roadmap" className="space-y-6">
                    <TabsList className="bg-white dark:bg-stone-900 p-1 border border-stone-200 dark:border-stone-800 w-full justify-start overflow-x-auto">
                        <TabsTrigger value="scorecard" className="gap-2"><Target className="w-4 h-4" /> Scorecard</TabsTrigger>
                        <TabsTrigger value="pathways" className="gap-2"><ListChecks className="w-4 h-4" /> Pathways</TabsTrigger>
                        <TabsTrigger value="gaps" className="gap-2"><CheckSquare className="w-4 h-4" /> Governance Gaps</TabsTrigger>
                        <TabsTrigger value="kpis" className="gap-2"><BarChart3 className="w-4 h-4" /> Financial KPIs</TabsTrigger>
                        <TabsTrigger value="roadmap" className="gap-2"><FileText className="w-4 h-4" /> Roadmap</TabsTrigger>
                    </TabsList>

                    <TabsContent value="scorecard" className="space-y-4">
                        <IPOScorecard />
                    </TabsContent>

                    <TabsContent value="pathways" className="space-y-4">
                        <ListingPathways />
                    </TabsContent>

                    <TabsContent value="gaps" className="space-y-4">
                        <GovernanceGaps />
                    </TabsContent>

                    <TabsContent value="kpis" className="space-y-4">
                        <FinancialKPIReadiness />
                    </TabsContent>

                    <TabsContent value="roadmap" className="space-y-4">
                        <div className="-mx-4 -mt-4">
                            <IPORoadmap />
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
