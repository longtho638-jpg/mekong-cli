'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { useTranslations } from 'next-intl';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import { Target, TrendingUp, Award, Swords } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

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
    { time: '2h ago', chapter: 3, action: 'Applied "Attack by Stratagem"', result: 'Won $500K deal' },
    { time: '1d ago', chapter: 2, action: '"Waging War" cost optimization', result: 'Reduced burn 15%' },
    { time: '3d ago', chapter: 1, action: '"Laying Plans" for Q1', result: 'Board approved' },
];

export default function BinhPhapPage({ params: { locale } }: { params: { locale: string } }) {
    const { analytics } = useAnalytics();
    const t = useTranslations('Strategy');

    const avgProgress = Math.floor(chapters.reduce((sum, c) => sum + c.progress, 0) / chapters.length);
    const masteredCount = chapters.filter((c) => c.status === 'mastered').length;

    return (
        <MD3AppShell title="🏯 Binh Pháp - The Art of War" subtitle="Sun Tzu's 13 Chapters • Strategic Mastery • Win Without Fighting">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">Overall Progress</div>
                        <TrendingUp className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-2xl font-bold text-amber-400">{avgProgress}%</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">{t('win_probability')}</div>
                        <Target className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-400">87.5%</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">Chapters Mastered</div>
                        <Award className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-purple-400">{masteredCount}/13</div>
                </MD3Surface>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <MD3Surface shape="extra-large" className="auto-safe">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Target className="w-4 h-4 text-emerald-400" />
                        {t('win_probability')}
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={winProbabilityData} startAngle={180} endAngle={0}>
                            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                            <RadialBar background dataKey="value" cornerRadius={10} fill="#10b981" />
                        </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="text-center -mt-4">
                        <div className="text-4xl font-bold text-emerald-400">87.5%</div>
                        <div className="text-xs text-gray-500 mt-1">AI-Predicted Success Rate</div>
                    </div>
                </MD3Surface>

                <MD3Surface shape="extra-large" className="auto-safe lg:col-span-2">
                    <h3 className="text-lg font-bold mb-6">13 Chapters - Mastery Path</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {chapters.map((chapter) => (
                            <div key={chapter.id} className={`p-4 rounded-lg border transition-all cursor-pointer hover:scale-105 ${chapter.status === 'mastered' ? 'bg-emerald-500/10 border-emerald-500/30' :
                                    chapter.status === 'active' ? 'bg-amber-500/10 border-amber-500/30' :
                                        chapter.status === 'learning' ? 'bg-blue-500/10 border-blue-500/30' :
                                            'bg-gray-500/10 border-gray-500/30'
                                }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-500">Chapter {chapter.id}</span>
                                    <span className={`text-xs font-bold ${chapter.status === 'mastered' ? 'text-emerald-400' :
                                            chapter.status === 'active' ? 'text-amber-400' : 'text-gray-500'
                                        }`}>{chapter.progress}%</span>
                                </div>
                                <div className="text-sm font-bold mb-2 line-clamp-2">{t(chapter.key)}</div>
                                <div className="h-1 bg-gray-700 rounded overflow-hidden">
                                    <div className={`h-full rounded ${chapter.status === 'mastered' ? 'bg-emerald-500' :
                                            chapter.status === 'active' ? 'bg-amber-500' : 'bg-blue-500'
                                        }`} style={{ width: `${chapter.progress}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </MD3Surface>
            </div>

            <MD3Surface shape="extra-large" className="auto-safe">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Swords className="w-4 h-4 text-amber-400" />
                    Recent Strategic Moves
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
            </MD3Surface>
        </MD3AppShell>
    );
}
