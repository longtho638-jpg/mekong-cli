"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Users, Brain, MessageSquare, Check, X as XIcon, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

import { PersonaProfiles } from "@/components/admin/PersonaProfiles";
import { EmpathyMap } from "@/components/admin/EmpathyMap";
import { MotivationChart } from "@/components/admin/MotivationChart";

export default function PsychologyPage() {
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
                    <h1 className="text-xl font-bold mb-2">Psychology Access</h1>
                    <p className="text-stone-400 mb-6 text-sm">Restricted to Marketing & Product teams.</p>
                    <div className="space-y-4">
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Key"
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
                        <div className="bg-pink-600 p-1.5 rounded-lg">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-lg font-bold text-stone-900 dark:text-stone-100 hidden md:block">
                            Customer Psychology & Personas
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
                
                {/* Section 1: Personas */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-stone-500" />
                        <h2 className="text-xl font-bold">Core Personas</h2>
                    </div>
                    <PersonaProfiles />
                </section>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Section 2: Deep Dive (Empathy Map takes 2 cols) */}
                    <section className="lg:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <MessageSquare className="w-5 h-5 text-stone-500" />
                            <h2 className="text-xl font-bold">Empathy Map</h2>
                        </div>
                        <EmpathyMap />
                    </section>

                    {/* Motivation Chart (1 col) */}
                    <section className="lg:col-span-1">
                         <div className="flex items-center gap-2 mb-4">
                            <Brain className="w-5 h-5 text-stone-500" />
                            <h2 className="text-xl font-bold">Motivation Drivers</h2>
                        </div>
                        <MotivationChart />
                    </section>
                </div>

                {/* Section 3: Actionable Insights */}
                <section>
                    <h2 className="text-xl font-bold mb-4">Copywriting Do's & Don'ts</h2>
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="border-l-4 border-l-green-500">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-green-700 flex items-center gap-2 text-lg">
                                    <Check className="w-5 h-5" /> DO (Nên dùng)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-stone-700 dark:text-stone-300 space-y-2">
                                <p>"Hoa tươi giữ trọn sắc xuân suốt 9 ngày Tết." (Safety/Family)</p>
                                <p>"Check-in vườn hoa độc lạ, chưa ai biết." (Status/Curiosity)</p>
                                <p>"Nguồn gốc Sa Đéc chính hiệu, bảo hành tươi." (Order/Safety)</p>
                                <p>"Mua ngay kẻo lỡ vụ hoa đẹp nhất năm." (Scarcity/FOMO)</p>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-red-500">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-red-700 flex items-center gap-2 text-lg">
                                    <XIcon className="w-5 h-5" /> DON'T (Tránh dùng)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-stone-700 dark:text-stone-300 space-y-2">
                                <p>"Hoa giá rẻ nhất thị trường." (Gây nghi ngờ chất lượng với nhóm Traditionalist)</p>
                                <p>"Quy trình trồng hoa phức tạp..." (Quá kỹ thuật, không chạm cảm xúc)</p>
                                <p>"Mua đi bạn ơi." (Thiếu động lực, hời hợt)</p>
                                <p>Dùng hình ảnh stock, không thực tế.</p>
                            </CardContent>
                        </Card>
                    </div>
                </section>

            </main>
        </div>
    );
}
