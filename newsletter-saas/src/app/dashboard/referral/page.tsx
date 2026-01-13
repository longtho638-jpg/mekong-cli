"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ReferralData {
    referralCode: string;
    referralLink: string;
    credits: number;
    totalReferrals: number;
}

export default function ReferralPage() {
    const [data, setData] = useState<ReferralData | null>(null);
    const [copied, setCopied] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            router.push("/login");
            return;
        }

        // Fetch referral data
        fetch("/api/referral")
            .then((res) => res.json())
            .then((result) => {
                setData({
                    referralCode: result.referral_code || "MM-DEMO1234",
                    referralLink: result.referral_link || "https://mekongmail.com/signup?ref=MM-DEMO1234",
                    credits: result.credits || 0,
                    totalReferrals: result.total_referrals || 0,
                });
            })
            .catch(() => {
                // Demo data
                setData({
                    referralCode: "MM-DEMO1234",
                    referralLink: "https://mekongmail.com/signup?ref=MM-DEMO1234",
                    credits: 3,
                    totalReferrals: 5,
                });
            });
    }, [router]);

    const copyLink = () => {
        if (data) {
            navigator.clipboard.writeText(data.referralLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

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
                    <Link href="/dashboard/analytics" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-400">
                        <span>📊</span> Analytics
                    </Link>
                    <Link href="/dashboard/referral" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <span>🎁</span> Referrals
                    </Link>
                    <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-400">
                        <span>⚙️</span> Settings
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="ml-64 p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Referral Program</h1>
                    <p className="text-gray-400 mt-1">Share Mekong Mail and earn free Pro months</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="glass rounded-xl p-6">
                        <div className="text-gray-400 text-sm mb-1">Total Referrals</div>
                        <div className="text-3xl font-bold">{data.totalReferrals}</div>
                    </div>
                    <div className="glass rounded-xl p-6">
                        <div className="text-gray-400 text-sm mb-1">Credits Earned</div>
                        <div className="text-3xl font-bold text-green-400">{data.credits}</div>
                    </div>
                    <div className="glass rounded-xl p-6">
                        <div className="text-gray-400 text-sm mb-1">Free Months Earned</div>
                        <div className="text-3xl font-bold text-indigo-400">{data.credits * 3}</div>
                    </div>
                </div>

                {/* Referral Link */}
                <div className="glass rounded-xl p-8 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Your Referral Link</h2>
                    <div className="flex gap-4 mb-4">
                        <input
                            type="text"
                            value={data.referralLink}
                            readOnly
                            className="flex-1 px-4 py-3 bg-[#12121a] border border-gray-700 rounded-lg text-gray-400"
                        />
                        <button onClick={copyLink} className="btn-primary">
                            {copied ? "✓ Copied!" : "Copy Link"}
                        </button>
                    </div>
                    <p className="text-gray-500 text-sm">
                        Share this link with fellow agency founders. When they sign up, you both get 3 months Pro free!
                    </p>
                </div>

                {/* How it works */}
                <div className="glass rounded-xl p-8">
                    <h2 className="text-xl font-semibold mb-6">How It Works</h2>
                    <div className="grid grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-4xl mb-4">📤</div>
                            <h3 className="font-semibold mb-2">1. Share Your Link</h3>
                            <p className="text-gray-400 text-sm">Send your referral link to other agency founders</p>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl mb-4">✅</div>
                            <h3 className="font-semibold mb-2">2. They Sign Up</h3>
                            <p className="text-gray-400 text-sm">When they create an account using your link</p>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl mb-4">🎉</div>
                            <h3 className="font-semibold mb-2">3. Both Get Rewarded</h3>
                            <p className="text-gray-400 text-sm">You both receive 3 months of Pro for free!</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
