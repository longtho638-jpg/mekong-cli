"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AnalyticsData {
    totalSubscribers: number;
    totalOpens: number;
    totalClicks: number;
    avgOpenRate: number;
    avgClickRate: number;
    recentIssues: Array<{
        id: string;
        subject: string;
        sentAt: string;
        openRate: number;
        clickRate: number;
    }>;
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [period, setPeriod] = useState("30d");
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            router.push("/login");
            return;
        }

        // Demo data
        setData({
            totalSubscribers: 4635,
            totalOpens: 12847,
            totalClicks: 3241,
            avgOpenRate: 52.3,
            avgClickRate: 14.2,
            recentIssues: [
                { id: "1", subject: "AI Trends in 2025", sentAt: "2 days ago", openRate: 61, clickRate: 18 },
                { id: "2", subject: "Design Digest #42", sentAt: "1 week ago", openRate: 48, clickRate: 12 },
                { id: "3", subject: "Tech Weekly Update", sentAt: "1 week ago", openRate: 52, clickRate: 15 },
            ],
        });
    }, [router]);

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin text-4xl">⏳</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#12121a] border-r border-gray-800 p-6">
                <Link href="/dashboard" className="text-xl font-bold gradient-text block mb-10">
                    📧 Mekong Mail
                </Link>
                <nav className="space-y-2">
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-400">
                        <span>📋</span> Newsletters
                    </Link>
                    <Link href="/dashboard/analytics" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <span>📊</span> Analytics
                    </Link>
                    <Link href="/dashboard/referral" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-400">
                        <span>🎁</span> Referrals
                    </Link>
                    <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-400">
                        <span>⚙️</span> Settings
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="ml-64 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Analytics</h1>
                        <p className="text-gray-400 mt-1">Overview of your newsletter performance</p>
                    </div>
                    <div className="flex gap-2">
                        {["7d", "30d", "90d"].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-2 rounded-lg transition-colors ${period === p ? "bg-indigo-500 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                    }`}
                            >
                                {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-5 gap-6 mb-8">
                    <div className="glass rounded-xl p-6">
                        <div className="text-gray-400 text-sm mb-1">Total Subscribers</div>
                        <div className="text-3xl font-bold">{data.totalSubscribers.toLocaleString()}</div>
                        <div className="text-green-400 text-sm mt-2">+12% vs last period</div>
                    </div>
                    <div className="glass rounded-xl p-6">
                        <div className="text-gray-400 text-sm mb-1">Total Opens</div>
                        <div className="text-3xl font-bold">{data.totalOpens.toLocaleString()}</div>
                    </div>
                    <div className="glass rounded-xl p-6">
                        <div className="text-gray-400 text-sm mb-1">Total Clicks</div>
                        <div className="text-3xl font-bold">{data.totalClicks.toLocaleString()}</div>
                    </div>
                    <div className="glass rounded-xl p-6">
                        <div className="text-gray-400 text-sm mb-1">Avg Open Rate</div>
                        <div className="text-3xl font-bold text-indigo-400">{data.avgOpenRate}%</div>
                    </div>
                    <div className="glass rounded-xl p-6">
                        <div className="text-gray-400 text-sm mb-1">Avg Click Rate</div>
                        <div className="text-3xl font-bold text-green-400">{data.avgClickRate}%</div>
                    </div>
                </div>

                {/* Recent Issues */}
                <div className="glass rounded-xl p-6">
                    <h2 className="text-xl font-semibold mb-4">Recent Issues</h2>
                    <table className="w-full">
                        <thead className="border-b border-gray-700">
                            <tr>
                                <th className="text-left py-3 text-gray-400 font-medium">Subject</th>
                                <th className="text-left py-3 text-gray-400 font-medium">Sent</th>
                                <th className="text-left py-3 text-gray-400 font-medium">Open Rate</th>
                                <th className="text-left py-3 text-gray-400 font-medium">Click Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.recentIssues.map((issue) => (
                                <tr key={issue.id} className="border-b border-gray-800/50">
                                    <td className="py-4 font-medium">{issue.subject}</td>
                                    <td className="py-4 text-gray-400">{issue.sentAt}</td>
                                    <td className="py-4 text-indigo-400">{issue.openRate}%</td>
                                    <td className="py-4 text-green-400">{issue.clickRate}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
