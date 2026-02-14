"use client";

import { RevenueChart } from "@/components/admin/RevenueChart";
import { LiveMetrics } from "@/components/admin/LiveMetrics";
import { RecentOrders } from "@/components/admin/RecentOrders";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDateRangePicker } from "@/components/admin/DateRangePicker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, LayoutDashboard, Map, Sprout, Users, Terminal, Bot, TrendingUp, PieChart, Brain } from "lucide-react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { GeminiTerminal } from "@/components/admin/GeminiTerminal";
import { AgentDashboard } from "@/components/admin/AgentDashboard";
import Link from "next/link";

import { useState, useEffect } from "react";
import { Lock } from "lucide-react";

export default function AdminDashboard() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");

    useEffect(() => {
        const auth = localStorage.getItem("admin_auth");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (auth === "true") setIsAuthenticated(true);
    }, []);

    const handleLogin = async () => {
        try {
            const response = await fetch('/api/admin/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                localStorage.setItem("admin_auth", "true");
                setIsAuthenticated(true);
            } else {
                alert("Sai mật khẩu!");
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Đã có lỗi xảy ra. Vui lòng thử lại.");
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-950">
                <div className="bg-stone-900 p-8 rounded-2xl border border-stone-800 text-center">
                    <div className="bg-stone-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-stone-400" />
                    </div>
                    <h1 className="text-xl font-bold text-white mb-4">Admin Access</h1>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter Password"
                        className="bg-stone-950 border border-stone-800 text-white px-4 py-2 rounded-lg mb-4 w-full"
                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    />
                    <Button onClick={handleLogin} className="w-full bg-white text-black hover:bg-stone-200">
                        Unlock
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6 bg-stone-950 min-h-screen transition-colors duration-300">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-2xl font-bold tracking-[0.1em] text-white font-mono">
                    COMMAND<span className="text-emerald-400">_CENTER</span>
                </h2>
                <div className="flex items-center space-x-2">
                    <CalendarDateRangePicker />
                    <Link href="/admin/psychology">
                        <Button variant="outline" className="border-stone-200 dark:border-stone-700">
                            <Brain className="mr-2 h-4 w-4 text-pink-600" />
                            Psychology
                        </Button>
                    </Link>
                    <Link href="/admin/economics">
                        <Button variant="outline" className="border-stone-200 dark:border-stone-700">
                            <PieChart className="mr-2 h-4 w-4 text-purple-600" />
                            Unit Economics
                        </Button>
                    </Link>
                    <Link href="/admin/gaps">
                        <Button variant="outline" className="border-stone-200 dark:border-stone-700">
                            <Map className="mr-2 h-4 w-4 text-indigo-600" />
                            Gap Roadmap
                        </Button>
                    </Link>
                    <Link href="/admin/ipo">
                        <Button variant="outline" className="border-stone-200 dark:border-stone-700">
                            <TrendingUp className="mr-2 h-4 w-4 text-blue-600" />
                            IPO Readiness
                        </Button>
                    </Link>
                    <Button className="bg-stone-900 text-white hover:bg-stone-800">
                        <Download className="mr-2 h-4 w-4" />
                        Export Report
                    </Button>
                </div>
            </div>
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="bg-white border border-stone-200">
                    <TabsTrigger value="overview">Tổng Quan</TabsTrigger>
                    <TabsTrigger value="agentic" className="flex items-center gap-2">
                        <Bot className="w-4 h-4" />
                        Agentic OS
                    </TabsTrigger>
                    <TabsTrigger value="terminal" className="flex items-center gap-2">
                        <Terminal className="w-4 h-4" />
                        Gemini Ops
                    </TabsTrigger>
                    <TabsTrigger value="analytics" disabled>Phân Tích (AI)</TabsTrigger>
                    <TabsTrigger value="reports" disabled>Báo Cáo</TabsTrigger>
                    <TabsTrigger value="notifications" disabled>Thông Báo</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                    <LiveMetrics />
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4 border-stone-200 shadow-sm">
                            <CardHeader>
                                <CardTitle>Doanh Thu Theo Thời Gian Thực</CardTitle>
                                <CardDescription>
                                    Tổng quan doanh thu từ tất cả các vườn trong 7 ngày qua.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <RevenueChart />
                            </CardContent>
                        </Card>
                        <Card className="col-span-3 border-stone-200 shadow-sm">
                            <CardHeader>
                                <CardTitle>Đơn Hàng Gần Đây</CardTitle>
                                <CardDescription>
                                    +23 đơn hàng mới trong giờ qua.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RecentOrders />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="agentic" className="space-y-4">
                    <AgentDashboard />
                </TabsContent>

                <TabsContent value="terminal" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <GeminiTerminal />
                        </div>
                        <div className="space-y-4">
                            <Card className="bg-stone-50 border-stone-200">
                                <CardHeader>
                                    <CardTitle className="text-sm">Lệnh Mẫu</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-2 text-stone-600">
                                    <div className="p-2 bg-white rounded border cursor-pointer hover:border-green-400 transition-colors">
                                        "Doanh thu hôm nay thế nào?"
                                    </div>
                                    <div className="p-2 bg-white rounded border cursor-pointer hover:border-green-400 transition-colors">
                                        "Tìm 5 đơn hàng mới nhất"
                                    </div>
                                    <div className="p-2 bg-white rounded border cursor-pointer hover:border-green-400 transition-colors">
                                        "Tạo mã giảm giá 20% cho khách VIP"
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs >
        </div >
    );
}

