"use client";
import Link from "next/link";
import { useState } from "react";

export default function ReferralPage() {
    const [copied, setCopied] = useState(false);

    // Demo data
    const referralCode = "MEKONG-ABC123";
    const referralLink = `https://mekongmail.com/signup?ref=${referralCode}`;
    const referrals = [
        { id: 1, email: "agency1@example.com", date: "2024-12-28", status: "active", reward: "3mo Pro" },
        { id: 2, email: "startup@example.com", date: "2024-12-25", status: "active", reward: "3mo Pro" },
        { id: 3, email: "creator@example.com", date: "2024-12-20", status: "pending", reward: "pending" },
    ];

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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
                    <Link href="/dashboard/subscribers" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-400">
                        <span>👥</span> Subscribers
                    </Link>
                    <Link href="/dashboard/analytics" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-400">
                        <span>📊</span> Analytics
                    </Link>
                    <Link href="/dashboard/referral" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <span>🎁</span> Referral Program
                    </Link>
                    <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-400">
                        <span>⚙️</span> Settings
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="ml-64 p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">🎁 Referral Program</h1>
                    <p className="text-gray-400 mt-1">Earn rewards by inviting other agencies</p>
                </div>

                {/* Reward Banner */}
                <div className="glass rounded-xl p-8 mb-8 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">🎉 Give 3 months, Get 3 months!</h2>
                            <p className="text-gray-300 max-w-lg">
                                When someone signs up with your referral code, both of you get <strong>3 months of Pro FREE</strong>.
                                No limits on referrals!
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl font-bold gradient-text">3</div>
                            <div className="text-gray-400">Referrals</div>
                        </div>
                    </div>
                </div>

                {/* Referral Code */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="glass rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-4">Your Referral Code</h3>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                readOnly
                                value={referralCode}
                                className="flex-1 bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-3 font-mono text-lg"
                            />
                            <button
                                onClick={() => copyToClipboard(referralCode)}
                                className="btn-primary px-6"
                            >
                                {copied ? "Copied!" : "Copy"}
                            </button>
                        </div>
                    </div>

                    <div className="glass rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-4">Share Link</h3>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                readOnly
                                value={referralLink}
                                className="flex-1 bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-3 text-sm truncate"
                            />
                            <button
                                onClick={() => copyToClipboard(referralLink)}
                                className="btn-primary px-6"
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                </div>

                {/* Social Share */}
                <div className="glass rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-semibold mb-4">Share on Social</h3>
                    <div className="flex gap-4">
                        <a
                            href={`https://twitter.com/intent/tweet?text=I'm loving @MekongMail for my newsletters! Sign up with my link and get 3 months FREE: ${referralLink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-3 bg-[#1da1f2] rounded-lg hover:opacity-80 transition-opacity"
                        >
                            𝕏 Twitter
                        </a>
                        <a
                            href={`https://www.linkedin.com/sharing/share-offsite/?url=${referralLink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-3 bg-[#0077b5] rounded-lg hover:opacity-80 transition-opacity"
                        >
                            💼 LinkedIn
                        </a>
                        <a
                            href={`mailto:?subject=Check out Mekong Mail&body=I've been using Mekong Mail for my newsletters and it's amazing! Sign up with my link to get 3 months Pro free: ${referralLink}`}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-700 rounded-lg hover:opacity-80 transition-opacity"
                        >
                            ✉️ Email
                        </a>
                    </div>
                </div>

                {/* Referral Stats */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="glass rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-indigo-400">3</div>
                        <div className="text-sm text-gray-400">Total Referrals</div>
                    </div>
                    <div className="glass rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-green-400">2</div>
                        <div className="text-sm text-gray-400">Active</div>
                    </div>
                    <div className="glass rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-400">1</div>
                        <div className="text-sm text-gray-400">Pending</div>
                    </div>
                    <div className="glass rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-purple-400">6 mo</div>
                        <div className="text-sm text-gray-400">Pro Earned</div>
                    </div>
                </div>

                {/* Referral History */}
                <div className="glass rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-gray-800">
                        <h3 className="text-lg font-semibold">Referral History</h3>
                    </div>
                    <table className="w-full">
                        <thead className="bg-[#1a1a24]">
                            <tr>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium">Email</th>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium">Date</th>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium">Status</th>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium">Reward</th>
                            </tr>
                        </thead>
                        <tbody>
                            {referrals.map((ref) => (
                                <tr key={ref.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                                    <td className="px-6 py-4">{ref.email}</td>
                                    <td className="px-6 py-4 text-gray-400">{ref.date}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-sm font-medium ${ref.status === "active" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                                            }`}>
                                            {ref.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">{ref.reward}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
