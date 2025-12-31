"use client";
import Link from "next/link";
import { useState } from "react";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<"profile" | "billing" | "api" | "team">("profile");

    // Demo data
    const user = {
        name: "Agency Admin",
        email: "admin@agency.com",
        company: "Premium Agency Co",
        plan: "Pro",
        plan_expires: "Mar 31, 2025",
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
                    <Link href="/dashboard/referral" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-400">
                        <span>🎁</span> Referral Program
                    </Link>
                    <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <span>⚙️</span> Settings
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="ml-64 p-8">
                <h1 className="text-3xl font-bold mb-8">Settings</h1>

                {/* Tabs */}
                <div className="flex gap-1 mb-8 bg-[#12121a] p-1 rounded-lg w-fit">
                    {(["profile", "billing", "api", "team"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-md font-medium transition-all capitalize ${activeTab === tab
                                    ? "bg-indigo-500 text-white"
                                    : "text-gray-400 hover:text-white"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Profile Tab */}
                {activeTab === "profile" && (
                    <div className="glass rounded-xl p-6 max-w-2xl">
                        <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    defaultValue={user.name}
                                    className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-3 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Email</label>
                                <input
                                    type="email"
                                    defaultValue={user.email}
                                    className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-3 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Company Name</label>
                                <input
                                    type="text"
                                    defaultValue={user.company}
                                    className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-3 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <button className="btn-primary px-8 py-3">Save Changes</button>
                        </div>
                    </div>
                )}

                {/* Billing Tab */}
                {activeTab === "billing" && (
                    <div className="space-y-6 max-w-2xl">
                        {/* Current Plan */}
                        <div className="glass rounded-xl p-6">
                            <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-bold">{user.plan}</span>
                                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-sm rounded">Active</span>
                                    </div>
                                    <p className="text-gray-400 mt-1">Renews on {user.plan_expires}</p>
                                </div>
                                <button className="btn-secondary px-6 py-2">Upgrade</button>
                            </div>
                        </div>

                        {/* Usage */}
                        <div className="glass rounded-xl p-6">
                            <h2 className="text-xl font-semibold mb-4">Usage This Month</h2>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-400">Newsletters</span>
                                        <span>3 / 10</span>
                                    </div>
                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: "30%" }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-400">Emails Sent</span>
                                        <span>4,523 / 50,000</span>
                                    </div>
                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 rounded-full" style={{ width: "9%" }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-400">AI Credits</span>
                                        <span>127 / 500</span>
                                    </div>
                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 rounded-full" style={{ width: "25%" }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="glass rounded-xl p-6">
                            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                            <div className="flex items-center justify-between p-4 bg-[#1a1a24] rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center text-xs font-bold">
                                        VISA
                                    </div>
                                    <div>
                                        <div>•••• •••• •••• 4242</div>
                                        <div className="text-sm text-gray-400">Expires 12/26</div>
                                    </div>
                                </div>
                                <button className="text-indigo-400 hover:underline">Change</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* API Tab */}
                {activeTab === "api" && (
                    <div className="space-y-6 max-w-2xl">
                        <div className="glass rounded-xl p-6">
                            <h2 className="text-xl font-semibold mb-4">API Keys</h2>
                            <p className="text-gray-400 mb-6">
                                Use these keys to integrate Mekong Mail with your applications.
                            </p>

                            <div className="space-y-4">
                                <div className="p-4 bg-[#1a1a24] rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium">Production Key</span>
                                        <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">Active</span>
                                    </div>
                                    <div className="flex gap-3">
                                        <input
                                            type="password"
                                            readOnly
                                            value="mm_live_sk_xxxxxxxxxxxxxxxxxxxx"
                                            className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded px-3 py-2 font-mono text-sm"
                                        />
                                        <button className="text-indigo-400 hover:underline text-sm">Reveal</button>
                                        <button className="text-indigo-400 hover:underline text-sm">Copy</button>
                                    </div>
                                </div>

                                <div className="p-4 bg-[#1a1a24] rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium">Test Key</span>
                                        <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">Test</span>
                                    </div>
                                    <div className="flex gap-3">
                                        <input
                                            type="password"
                                            readOnly
                                            value="mm_test_sk_xxxxxxxxxxxxxxxxxxxx"
                                            className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded px-3 py-2 font-mono text-sm"
                                        />
                                        <button className="text-indigo-400 hover:underline text-sm">Reveal</button>
                                        <button className="text-indigo-400 hover:underline text-sm">Copy</button>
                                    </div>
                                </div>
                            </div>

                            <button className="btn-secondary mt-6 px-6 py-2">Generate New Key</button>
                        </div>

                        {/* Webhooks */}
                        <div className="glass rounded-xl p-6">
                            <h2 className="text-xl font-semibold mb-4">Webhooks</h2>
                            <p className="text-gray-400 mb-4">
                                Receive real-time notifications for events.
                            </p>
                            <button className="btn-primary px-6 py-2">Add Webhook Endpoint</button>
                        </div>
                    </div>
                )}

                {/* Team Tab */}
                {activeTab === "team" && (
                    <div className="space-y-6 max-w-2xl">
                        <div className="glass rounded-xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold">Team Members</h2>
                                <button className="btn-primary px-4 py-2">Invite Member</button>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 bg-[#1a1a24] rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold">A</div>
                                        <div>
                                            <div>Agency Admin</div>
                                            <div className="text-sm text-gray-400">admin@agency.com</div>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-sm rounded">Owner</span>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-[#1a1a24] rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center font-bold">M</div>
                                        <div>
                                            <div>Marketing Lead</div>
                                            <div className="text-sm text-gray-400">marketing@agency.com</div>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-gray-500/20 text-gray-400 text-sm rounded">Admin</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
