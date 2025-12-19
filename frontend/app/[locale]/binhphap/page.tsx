'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Command, Target, TrendingUp, Award, Swords } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

// 13 Chapters of Sun Tzu's Art of War
const chapters = [
    { id: 1, key: 'chapter_1', progress: 100, status: 'mastered' },
    { id: 2, key: 'chapter_2', progress: 100, status: 'mastered' },
    { id: 3, key: 'chapter_3', progress: 95, status: 'active' },
    { id: 4, key: 'chapter_4', progress: 85, status: 'active' },
    { id: 5, key: 'chapter_5', progress: 70, status: 'learning' },
    { id: 6, key: 'chapter_6', progress: 65, status: 'learning' },
    { id: 7, key: 'chapter_7', progress: 50, status: 'learning' },
    { id: 8, key: 'chapter_8', progress: 40, status: 'learning' },
    { id: 9, key: 'chapter_9', progress: 30, status: 'planned' },
    { id: 10, key: 'chapter_10', progress: 20, status: 'planned' },
    { id: 11, key: 'chapter_11', progress: 10, status: 'planned' },
    { id: 12, key: 'chapter_12', progress: 5, status: 'planned' },
    { id: 13, key: 'chapter_13', progress: 0, status: 'locked' },
];

const winProbabilityData = [{ name: 'Win', value: 87.5, fill: '#10b981' }];

const recentMoves = [
    { time: '2h ago', chapter: 3, action: 'Applied "Attack by Stratagem" to client pitch', result: 'Won $500K deal' },
    { time: '1d ago', chapter: 2, action: 'Implemented "Waging War" cost optimization', result: 'Reduced burn rate 15%' },
    { time: '3d ago', chapter: 1, action: 'Used "Laying Plans" for Q1 strategy', result: 'Board approved' },
];

export default function BinhPhapPage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('Strategy');
    const tHubs = useTranslations('Hubs');

    const pathname = usePathname();
    const router = useRouter();

    const switchLocale = (newLocale: string) => {
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
    };

    const avgProgress = Math.floor(chapters.reduce((sum, c) => sum + c.progress, 0) / chapters.length);
    const masteredCount = chapters.filter((c) => c.status === 'mastered').length;

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono selection:bg-amber-500/30 selection:text-amber-300">
            <div className="fixed inset-0 bg-[linear-gradient(rgba(18,18,18,0)_2px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_2px,transparent_1px)] bg-[size:40px_40px] opacity-[0.05] pointer-events-none" />
            <div className="fixed top-[20%] left-[30%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(251,191,36,0.06)_0%,transparent_70%)] pointer-events-none" />

            {/* Top Nav */}
            <nav className="fixed top-0 w-full z-50 border-b border-amber-500/20 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-amber-400">
                        <Shield className="w-5 h-5" />
                        <span className="font-bold tracking-tighter">AGENCY OS</span>
                        <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 border border-amber-500/30 rounded text-amber-300 animate-pulse">
                            BINH PHÁP
                        </span>
                    </div>
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="opacity-50">/</span>
                        <span>{tHubs('strategy_hub')}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <Swords className="w-3 h-3 text-amber-400" />
                        <span className="text-xs text-amber-300 font-bold">{masteredCount}/13 Mastered</span>
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
                                        ? 'bg-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
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
                    <h1 className="text-4xl font-bold mb-2 tracking-tight flex items-center gap-3 text-amber-400">
                        🏯 Binh Pháp - The Art of War
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse box-content border-4 border-amber-500/20" />
                    </h1>
                    <p className="text-gray-400 text-sm max-w-xl">
                        Sun Tzu's 13 Chapters • Strategic Mastery Framework • Win Without Fighting
                    </p>
                </header>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <MetricCard label="Overall Progress" value={`${avgProgress}%`} icon={<TrendingUp />} color="text-amber-400" />
                    <MetricCard label={t('win_probability')} value="87.5%" icon={<Target />} color="text-emerald-400" />
                    <MetricCard label="Chapters Mastered" value={`${masteredCount}/13`} icon={<Award />} color="text-purple-400" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Win Probability Gauge */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <Target className="w-4 h-4 text-emerald-400" />
                            {t('win_probability')}
                        </h3>

                        <ResponsiveContainer width="100%" height={200}>
                            <RadialBarChart
                                cx="50%"
                                cy="50%"
                                innerRadius="60%"
                                outerRadius="90%"
                                data={winProbabilityData}
                                startAngle={180}
                                endAngle={0}
                            >
                                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                <RadialBar background dataKey="value" cornerRadius={10} fill="#10b981" />
                            </RadialBarChart>
                        </ResponsiveContainer>

                        <div className="text-center -mt-4">
                            <div className="text-4xl font-bold text-emerald-400">87.5%</div>
                            <div className="text-xs text-gray-500 mt-1">AI-Predicted Success Rate</div>
                        </div>
                    </div>

                    {/* Chapter Grid */}
                    <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6">13 Chapters - Mastery Path</h3>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {chapters.map((chapter) => (
                                <div
                                    key={chapter.id}
                                    className={`p-4 rounded-lg border transition-all cursor-pointer hover:scale-105 ${chapter.status === 'mastered'
                                            ? 'bg-emerald-500/10 border-emerald-500/30'
                                            : chapter.status === 'active'
                                                ? 'bg-amber-500/10 border-amber-500/30'
                                                : chapter.status === 'learning'
                                                    ? 'bg-blue-500/10 border-blue-500/30'
                                                    : chapter.status === 'planned'
                                                        ? 'bg-gray-500/10 border-gray-500/30'
                                                        : 'bg-white/5 border-white/10 opacity-50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-gray-500">Chapter {chapter.id}</span>
                                        <span
                                            className={`text-xs font-bold ${chapter.status === 'mastered'
                                                    ? 'text-emerald-400'
                                                    : chapter.status === 'active'
                                                        ? 'text-amber-400'
                                                        : 'text-gray-500'
                                                }`}
                                        >
                                            {chapter.progress}%
                                        </span>
                                    </div>

                                    <div className="text-sm font-bold mb-2 line-clamp-2">{t(chapter.key)}</div>

                                    <div className="h-1 bg-gray-700 rounded overflow-hidden">
                                        <div
                                            className={`h-full rounded ${chapter.status === 'mastered'
                                                    ? 'bg-emerald-500'
                                                    : chapter.status === 'active'
                                                        ? 'bg-amber-500'
                                                        : 'bg-blue-500'
                                                }`}
                                            style={{ width: `${chapter.progress}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Strategic Moves */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-400" />
                        Recent Strategic Moves (Command Log)
                    </h3>

                    <div className="space-y-3">
                        {recentMoves.map((move, i) => (
                            <div key={i} className="flex items-start gap-4 p-4 bg-white/5 rounded border border-white/10">
                                <div className="text-2xl font-bold text-amber-500">#{move.chapter}</div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-bold text-amber-300">{move.action}</span>
                                        <span className="text-xs text-gray-500">{move.time}</span>
                                    </div>
                                    <div className="text-xs text-gray-400">Result: <span className="text-emerald-400">{move.result}</span></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

function MetricCard({ label, value, icon, color }: any) {
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
