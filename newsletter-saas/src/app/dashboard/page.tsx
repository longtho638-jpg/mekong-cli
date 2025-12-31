"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Newsletter {
    id: string;
    name: string;
    client: string;
    subs: number;
    openRate: string;
    status: "active" | "draft" | "paused";
    lastSent: string;
}

const demoNewsletters: Newsletter[] = [
    { id: "1", name: "Tech Weekly", client: "TechCo", subs: 1247, openRate: "52%", status: "active", lastSent: "2 days ago" },
    { id: "2", name: "Design Digest", client: "DesignHub", subs: 856, openRate: "48%", status: "active", lastSent: "1 week ago" },
    { id: "3", name: "AI Insights", client: "AI Corp", subs: 2100, openRate: "61%", status: "active", lastSent: "3 days ago" },
    { id: "4", name: "Startup News", client: "Venture Inc", subs: 432, openRate: "—", status: "draft", lastSent: "Never" },
];

export default function DashboardPage() {
    const [user, setUser] = useState<{ name: string; email: string; plan: string } | null>(null);
    const [newsletters, setNewsletters] = useState<Newsletter[]>(demoNewsletters);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState("");
    const [newClient, setNewClient] = useState("");
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            router.push("/login");
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        router.push("/");
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const newNl: Newsletter = {
            id: String(newsletters.length + 1),
            name: newName,
            client: newClient,
            subs: 0,
            openRate: "—",
            status: "draft",
            lastSent: "Never",
        };
        setNewsletters([newNl, ...newsletters]);
        setNewName("");
        setNewClient("");
        setShowCreate(false);
    };

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    const totalSubs = newsletters.reduce((sum, nl) => sum + nl.subs, 0);
    const activeNls = newsletters.filter(nl => nl.status === "active").length;

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#12121a] border-r border-gray-800 p-6">
                <Link href="/dashboard" className="text-xl font-bold gradient-text block mb-10">
                    📧 Mekong Mail
                </Link>

                <nav className="space-y-2">
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <span>📋</span> Newsletters
                    </Link>
                    <Link href="/dashboard/subscribers" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-400">
                        <span>👥</span> Subscribers
                    </Link>
                    <Link href="/dashboard/analytics" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-400">
                        <span>📊</span> Analytics
                    </Link>
                    <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-400">
                        <span>⚙️</span> Settings
                    </Link>
                </nav>

                <div className="absolute bottom-6 left-6 right-6">
                    <div className="glass rounded-lg p-4 mb-4">
                        <div className="text-sm font-medium">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                        <div className="mt-2 px-2 py-1 rounded bg-indigo-500/20 text-indigo-400 text-xs inline-block">
                            {user.plan.toUpperCase()} Plan
                        </div>
                    </div>
                    <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-white transition-colors">
                        ← Sign out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Newsletters</h1>
                        <p className="text-gray-400 mt-1">Manage all your client newsletters</p>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <span>+</span> New Newsletter
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                    <div className="glass rounded-xl p-6">
                        <div className="text-gray-400 text-sm mb-1">Total Newsletters</div>
                        <div className="text-3xl font-bold">{newsletters.length}</div>
                    </div>
                    <div className="glass rounded-xl p-6">
                        <div className="text-gray-400 text-sm mb-1">Active</div>
                        <div className="text-3xl font-bold text-green-400">{activeNls}</div>
                    </div>
                    <div className="glass rounded-xl p-6">
                        <div className="text-gray-400 text-sm mb-1">Total Subscribers</div>
                        <div className="text-3xl font-bold">{totalSubs.toLocaleString()}</div>
                    </div>
                    <div className="glass rounded-xl p-6">
                        <div className="text-gray-400 text-sm mb-1">Avg Open Rate</div>
                        <div className="text-3xl font-bold text-indigo-400">52%</div>
                    </div>
                </div>

                {/* Newsletter List */}
                <div className="glass rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-[#1a1a24] border-b border-gray-800">
                            <tr>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium">Newsletter</th>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium">Client</th>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium">Subscribers</th>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium">Open Rate</th>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium">Status</th>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium">Last Sent</th>
                                <th className="text-right px-6 py-4 text-gray-400 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {newsletters.map((nl) => (
                                <tr key={nl.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                                    <td className="px-6 py-4 font-medium">{nl.name}</td>
                                    <td className="px-6 py-4 text-gray-400">{nl.client}</td>
                                    <td className="px-6 py-4">{nl.subs.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-indigo-400">{nl.openRate}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${nl.status === "active" ? "bg-green-500/20 text-green-400" :
                                                nl.status === "draft" ? "bg-yellow-500/20 text-yellow-400" :
                                                    "bg-gray-500/20 text-gray-400"
                                            }`}>
                                            {nl.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400">{nl.lastSent}</td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/dashboard/editor/${nl.id}`}
                                            className="text-indigo-400 hover:underline mr-4"
                                        >
                                            Edit
                                        </Link>
                                        <button className="text-gray-400 hover:text-white">•••</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="glass rounded-2xl p-8 w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-6">Create Newsletter</h2>
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">Newsletter Name</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#12121a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g. Weekly Tech Digest"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Client Name</label>
                                <input
                                    type="text"
                                    value={newClient}
                                    onChange={(e) => setNewClient(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#12121a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g. Tech Startup Inc"
                                    required
                                />
                            </div>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary flex-1">
                                    Create →
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
