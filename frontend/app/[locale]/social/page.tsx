'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Command, Hash, Heart, Share2, TrendingUp, Users, MessageCircle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Platform performance
const platformData = [
    { platform: 'Instagram', followers: 24500, engagement: 4.2, posts: 156, color: '#e4405f' },
    { platform: 'LinkedIn', followers: 12800, engagement: 2.8, posts: 89, color: '#0077b5' },
    { platform: 'Twitter', followers: 18200, engagement: 3.5, posts: 320, color: '#1da1f2' },
    { platform: 'TikTok', followers: 35000, engagement: 8.1, posts: 124, color: '#00f2ea' },
    { platform: 'Facebook', followers: 19500, engagement: 2.1, posts: 145, color: '#1877f2' },
];

// Engagement over time
const engagementTrend = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    likes: 2000 + i * 400 + Math.random() * 500,
    comments: 150 + i * 30 + Math.random() * 50,
    shares: 80 + i * 20 + Math.random() * 30,
}));

// Top posts
const topPosts = [
    { title: 'Agency OS v2.0 Launch', platform: 'LinkedIn', likes: 1240, comments: 89, shares: 156, reach: 45000 },
    { title: 'Behind the Scenes: Building...', platform: 'Instagram', likes: 2850, comments: 234, shares: 89, reach: 38500 },
    { title: 'Win-Win-Win Framework', platform: 'Twitter', likes: 890, comments: 67, shares: 234, reach: 28000 },
    { title: 'Product Demo Video', platform: 'TikTok', likes: 5200, comments: 456, shares: 892, reach: 125000 },
    { title: 'Customer Success Story', platform: 'Facebook', likes: 456, comments: 34, shares: 67, reach: 15000 },
];

export default function SocialPage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('Common');

    const pathname = usePathname();
    const router = useRouter();

    const switchLocale = (newLocale: string) => {
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
    };

    const totalFollowers = platformData.reduce((sum, p) => sum + p.followers, 0);
    const avgEngagement = (platformData.reduce((sum, p) => sum + p.engagement, 0) / platformData.length).toFixed(1);
    const totalPosts = platformData.reduce((sum, p) => sum + p.posts, 0);
    const totalReach = topPosts.reduce((sum, p) => sum + p.reach, 0);

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono selection:bg-sky-500/30 selection:text-sky-300">
            <div className="fixed inset-0 bg-[linear-gradient(rgba(18,18,18,0)_2px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_2px,transparent_1px)] bg-[size:40px_40px] opacity-[0.05] pointer-events-none" />
            <div className="fixed top-[18%] left-[28%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(14,165,233,0.08)_0%,transparent_70%)] pointer-events-none" />

            <nav className="fixed top-0 w-full z-50 border-b border-sky-500/20 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sky-400">
                        <Shield className="w-5 h-5" />
                        <span className="font-bold tracking-tighter">AGENCY OS</span>
                        <span className="px-1.5 py-0.5 text-[10px] bg-sky-500/20 border border-sky-500/30 rounded text-sky-300 animate-pulse">
                            SOCIAL
                        </span>
                    </div>
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="opacity-50">/</span>
                        <span>Social Media</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-500/10 border border-sky-500/30 rounded-lg">
                        <Hash className="w-3 h-3 text-sky-400" />
                        <span className="text-xs text-sky-300 font-bold">{avgEngagement}% Engage</span>
                    </div>

                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-gray-400">
                        <Command className="w-3 h-3" />
                        <span>Search...</span>
                        <span className="bg-white/10 px-1 rounded text-[10px]">⌘K</span>
                    </div>

                    <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
                        {['en', 'vi', 'zh'].map((l) => (
                            <button
                                key={l}
                                onClick={() => switchLocale(l)}
                                className={`px-3 py-1 text-xs font-bold rounded transition-all ${locale === l
                                        ? 'bg-sky-500/20 text-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.2)]'
                                        : 'text-gray-500 hover:text-white'
                                    }`}
                            >
                                {l.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            <main className="pt-24 px-6 max-w-[1920px] mx-auto pb-20">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 tracking-tight flex items-center gap-3 text-sky-400">
                        📱 Social Media Dashboard
                        <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse box-content border-4 border-sky-500/20" />
                    </h1>
                    <p className="text-gray-400 text-sm max-w-xl">
                        Multi-Platform Analytics • Engagement Tracking • Content Performance
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <StatCard label="Total Followers" value={`${(totalFollowers / 1000).toFixed(1)}K`} icon={<Users />} color="text-sky-400" />
                    <StatCard label="Avg Engagement" value={`${avgEngagement}%`} icon={<Heart />} color="text-pink-400" />
                    <StatCard label="Total Posts" value={totalPosts.toString()} icon={<MessageCircle />} color="text-blue-400" />
                    <StatCard label="Total Reach" value={`${(totalReach / 1000).toFixed(0)}K`} icon={<TrendingUp />} color="text-emerald-400" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Platform Performance */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6">Platform Performance</h3>

                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={platformData} layout="vertical">
                                <XAxis type="number" stroke="#6b7280" fontSize={10} />
                                <YAxis type="category" dataKey="platform" stroke="#6b7280" fontSize={12} width={80} />
                                <Tooltip
                                    content={({ payload }) => {
                                        if (!payload || !payload[0]) return null;
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-black/90 border border-white/20 rounded p-2">
                                                <div className="text-xs font-bold mb-1">{data.platform}</div>
                                                <div className="text-sm" style={{ color: data.color }}>
                                                    {(data.followers / 1000).toFixed(1)}K followers
                                                </div>
                                                <div className="text-xs text-gray-400">{data.engagement}% engagement</div>
                                            </div>
                                        );
                                    }}
                                />
                                <Bar dataKey="followers" radius={[0, 4, 4, 0]}>
                                    {platformData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Engagement Trend */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6">Engagement Trend (12 Months)</h3>

                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={engagementTrend}>
                                <XAxis dataKey="month" stroke="#6b7280" fontSize={10} />
                                <YAxis stroke="#6b7280" fontSize={10} />
                                <Tooltip
                                    content={({ payload }) => {
                                        if (!payload || !payload[0]) return null;
                                        return (
                                            <div className="bg-black/90 border border-white/20 rounded p-2">
                                                <div className="text-xs text-gray-400">{payload[0].payload.month}</div>
                                                <div className="text-sm text-pink-400">Likes: {Math.round(payload[0].payload.likes).toLocaleString()}</div>
                                                <div className="text-sm text-blue-400">Comments: {Math.round(payload[0].payload.comments)}</div>
                                                <div className="text-sm text-emerald-400">Shares: {Math.round(payload[0].payload.shares)}</div>
                                            </div>
                                        );
                                    }}
                                />
                                <Line type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899', r: 3 }} />
                                <Line type="monotone" dataKey="comments" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
                                <Line type="monotone" dataKey="shares" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>

                        <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                            <div className="p-2 bg-pink-500/10 rounded text-center">
                                <div className="text-pink-400 font-bold">Likes</div>
                            </div>
                            <div className="p-2 bg-blue-500/10 rounded text-center">
                                <div className="text-blue-400 font-bold">Comments</div>
                            </div>
                            <div className="p-2 bg-emerald-500/10 rounded text-center">
                                <div className="text-emerald-400 font-bold">Shares</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Performing Posts */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-6">Top Performing Posts</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-3 text-gray-400">Post</th>
                                    <th className="text-left p-3 text-gray-400">Platform</th>
                                    <th className="text-right p-3 text-gray-400">Likes</th>
                                    <th className="text-right p-3 text-gray-400">Comments</th>
                                    <th className="text-right p-3 text-gray-400">Shares</th>
                                    <th className="text-right p-3 text-gray-400">Reach</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topPosts.map((post, i) => {
                                    const platform = platformData.find((p) => p.platform === post.platform);
                                    return (
                                        <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-3 font-bold text-sky-300">{post.title}</td>
                                            <td className="p-3">
                                                <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: `${platform?.color}20`, color: platform?.color }}>
                                                    {post.platform}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right text-pink-400 font-bold">{post.likes.toLocaleString()}</td>
                                            <td className="p-3 text-right text-blue-400 font-bold">{post.comments}</td>
                                            <td className="p-3 text-right text-emerald-400 font-bold">{post.shares}</td>
                                            <td className="p-3 text-right font-mono text-gray-400">{(post.reach / 1000).toFixed(0)}K</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatCard({ label, value, icon, color }: any) {
    return (
        <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</div>
                <div className={color}>{icon}</div>
            </div>
            <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
        </div>
    );
}
