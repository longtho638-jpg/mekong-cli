"use client";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SettingsContent() {
    const searchParams = useSearchParams();
    const billingSuccess = searchParams.get("billing") === "success";

    const [user, setUser] = useState<{ name: string; email: string; plan: string } | null>(null);
    const [currentPlan, setCurrentPlan] = useState("free");
    const [isUpgrading, setIsUpgrading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            router.push("/login");
            return;
        }
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setCurrentPlan(parsed.plan || "free");
    }, [router]);

    const handleUpgrade = async (plan: string) => {
        setIsUpgrading(true);
        try {
            const res = await fetch("/api/billing/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan, interval: "monthly" }),
            });
            const data = await res.json();
            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            } else if (data.demo) {
                // Demo mode - update local storage
                if (user) {
                    const updated = { ...user, plan };
                    localStorage.setItem("user", JSON.stringify(updated));
                    setUser(updated);
                    setCurrentPlan(plan);
                }
                alert(`Upgraded to ${plan}! (Demo mode)`);
            }
        } catch {
            alert("Upgrade failed. Please try again.");
        } finally {
            setIsUpgrading(false);
        }
    };

    if (!user) {
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
                    <Link href="/dashboard/referral" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-400">
                        <span>🎁</span> Referrals
                    </Link>
                    <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <span>⚙️</span> Settings
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="ml-64 p-8">
                {billingSuccess && (
                    <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
                        ✓ Your subscription has been updated successfully!
                    </div>
                )}

                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Settings</h1>
                    <p className="text-gray-400 mt-1">Manage your account and billing</p>
                </div>

                {/* Profile Section */}
                <div className="glass rounded-xl p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Profile</h2>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Name</label>
                            <input
                                type="text"
                                value={user.name}
                                readOnly
                                className="w-full px-4 py-3 bg-[#12121a] border border-gray-700 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Email</label>
                            <input
                                type="email"
                                value={user.email}
                                readOnly
                                className="w-full px-4 py-3 bg-[#12121a] border border-gray-700 rounded-lg"
                            />
                        </div>
                    </div>
                </div>

                {/* Billing Section */}
                <div className="glass rounded-xl p-6">
                    <h2 className="text-xl font-semibold mb-4">Billing & Plan</h2>
                    <div className="mb-6">
                        <span className="text-gray-400">Current Plan: </span>
                        <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 font-semibold">
                            {currentPlan.toUpperCase()}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        {/* Free */}
                        <div className={`rounded-xl p-6 border ${currentPlan === "free" ? "border-indigo-500 bg-indigo-500/5" : "border-gray-700"}`}>
                            <h3 className="font-semibold mb-2">Free</h3>
                            <div className="text-2xl font-bold mb-4">$0/mo</div>
                            <ul className="text-sm text-gray-400 space-y-2 mb-6">
                                <li>• 1 newsletter</li>
                                <li>• 500 subscribers</li>
                                <li>• 1,000 sends/month</li>
                            </ul>
                            {currentPlan === "free" ? (
                                <button disabled className="w-full btn-secondary opacity-50">Current Plan</button>
                            ) : (
                                <button onClick={() => handleUpgrade("free")} className="w-full btn-secondary">
                                    Downgrade
                                </button>
                            )}
                        </div>

                        {/* Pro */}
                        <div className={`rounded-xl p-6 border ${currentPlan === "pro" ? "border-indigo-500 bg-indigo-500/5" : "border-gray-700"}`}>
                            <h3 className="font-semibold mb-2">Pro</h3>
                            <div className="text-2xl font-bold mb-4">$29/mo</div>
                            <ul className="text-sm text-gray-400 space-y-2 mb-6">
                                <li>• 5 newsletters</li>
                                <li>• 10,000 subscribers</li>
                                <li>• AI writing assistant</li>
                            </ul>
                            {currentPlan === "pro" ? (
                                <button disabled className="w-full btn-primary opacity-50">Current Plan</button>
                            ) : (
                                <button onClick={() => handleUpgrade("pro")} disabled={isUpgrading} className="w-full btn-primary">
                                    {isUpgrading ? "Processing..." : "Upgrade"}
                                </button>
                            )}
                        </div>

                        {/* Agency */}
                        <div className={`rounded-xl p-6 border ${currentPlan === "agency" ? "border-indigo-500 bg-indigo-500/5" : "border-gray-700"}`}>
                            <h3 className="font-semibold mb-2">Agency</h3>
                            <div className="text-2xl font-bold mb-4">$99/mo</div>
                            <ul className="text-sm text-gray-400 space-y-2 mb-6">
                                <li>• Unlimited newsletters</li>
                                <li>• Unlimited subscribers</li>
                                <li>• White-label option</li>
                            </ul>
                            {currentPlan === "agency" ? (
                                <button disabled className="w-full btn-primary opacity-50">Current Plan</button>
                            ) : (
                                <button onClick={() => handleUpgrade("agency")} disabled={isUpgrading} className="w-full btn-primary">
                                    {isUpgrading ? "Processing..." : "Upgrade"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <SettingsContent />
        </Suspense>
    );
}
