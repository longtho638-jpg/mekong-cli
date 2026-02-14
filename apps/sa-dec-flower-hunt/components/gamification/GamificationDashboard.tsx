"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Star, Zap, Award, TrendingUp } from "lucide-react";
import Confetti from "react-confetti";

interface FarmerProgress {
    name: string;
    xp: number;
    level: number;
    totalOrders: number;
    totalRevenue: number;
    rating: number | null;
    achievements: Achievement[];
}

interface Achievement {
    id: string;
    achievement_type: string;
    achievement_name: string;
    xp_reward: number;
    unlocked_at: string;
    seen: boolean;
}

const LEVEL_DATA = [
    { level: 1, name: "Beginner", minXP: 0, maxXP: 99, commission: 3.0, color: "stone" },
    { level: 2, name: "Rising Star", minXP: 100, maxXP: 499, commission: 2.5, color: "cyan" },
    { level: 3, name: "Pro Seller", minXP: 500, maxXP: 1999, commission: 2.0, color: "emerald" },
    { level: 4, name: "Master", minXP: 2000, maxXP: 9999, commission: 1.5, color: "amber" },
    { level: 5, name: "Legend", minXP: 10000, maxXP: 999999, commission: 1.0, color: "purple" }
];

const ACHIEVEMENT_EMOJIS: Record<string, string> = {
    first_sale: "🎉",
    ten_orders: "⭐",
    hundred_orders: "💯",
    five_star_review: "✨",
    week_streak: "🔥",
    top_seller: "👑"
};

export function GamificationDashboard({ farmerId }: { farmerId: string }) {
    const [progress, setProgress] = useState<FarmerProgress | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProgress();
    }, [farmerId]);

    const fetchProgress = async () => {
        try {
            const response = await fetch(`/api/farmers/${farmerId}/progress`);
            const data = await response.json();
            setProgress(data);
        } catch (error) {
            console.error('Failed to fetch progress:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-stone-500">Loading progress...</div>
            </div>
        );
    }

    if (!progress) {
        return (
            <div className="bg-stone-950 border border-stone-800 rounded-sm p-8 text-center">
                <Trophy className="w-12 h-12 text-stone-700 mx-auto mb-4" />
                <p className="text-stone-500">No progress data available</p>
            </div>
        );
    }

    const currentLevel = LEVEL_DATA.find(l => l.level === progress.level) || LEVEL_DATA[0];
    const nextLevel = LEVEL_DATA.find(l => l.level === progress.level + 1);
    const xpInCurrentLevel = progress.xp - currentLevel.minXP;
    const xpNeededForNext = nextLevel ? nextLevel.minXP - currentLevel.minXP : 0;
    const levelProgress = nextLevel ? (xpInCurrentLevel / xpNeededForNext) * 100 : 100;

    const colorClasses = {
        stone: "text-stone-400 bg-stone-500/20 border-stone-500",
        cyan: "text-cyan-400 bg-cyan-500/20 border-cyan-500",
        emerald: "text-emerald-400 bg-emerald-500/20 border-emerald-500",
        amber: "text-amber-400 bg-amber-500/20 border-amber-500",
        purple: "text-purple-400 bg-purple-500/20 border-purple-500"
    };

    const levelColors = colorClasses[currentLevel.color as keyof typeof colorClasses];

    return (
        <div className="space-y-6">
            {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

            {/* Level Card */}
            <motion.div
                className={`${levelColors.split(' ')[1]} border ${levelColors.split(' ')[2]} rounded-sm p-8`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="text-sm text-stone-500 uppercase tracking-wider mb-1">
                            Current Level
                        </div>
                        <div className={`text-4xl font-bold ${levelColors.split(' ')[0]}`}>
                            Level {progress.level}: {currentLevel.name}
                        </div>
                    </div>
                    <div className={`w-20 h-20 border-4 ${levelColors.split(' ')[2]} rounded-full flex items-center justify-center`}>
                        <Trophy className={`w-10 h-10 ${levelColors.split(' ')[0]}`} />
                    </div>
                </div>

                {/* XP Progress Bar */}
                <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-white font-bold">{progress.xp} XP</span>
                        {nextLevel && (
                            <span className="text-stone-500">
                                {nextLevel.minXP - progress.xp} XP to Level {nextLevel.level}
                            </span>
                        )}
                    </div>
                    <div className="h-4 bg-stone-900 rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full ${levelColors.split(' ')[1]}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${levelProgress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        />
                    </div>
                </div>

                {/* Level Benefits */}
                <div className="bg-black/30 rounded p-4">
                    <div className="text-xs text-stone-500 uppercase tracking-wider mb-2">
                        Level Benefits
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-white">Commission Rate:</span>
                        <span className={`text-2xl font-bold ${levelColors.split(' ')[0]}`}>
                            {currentLevel.commission}%
                        </span>
                    </div>
                    {nextLevel && (
                        <div className="text-xs text-emerald-500 mt-1">
                            Reach Level {nextLevel.level} for {nextLevel.commission}% commission!
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-stone-950 border border-stone-800 rounded-sm p-4">
                    <div className="text-xs text-stone-500 mb-1">Total Orders</div>
                    <div className="text-2xl font-bold text-white">{progress.totalOrders}</div>
                </div>
                <div className="bg-stone-950 border border-stone-800 rounded-sm p-4">
                    <div className="text-xs text-stone-500 mb-1">Total Revenue</div>
                    <div className="text-2xl font-bold text-emerald-500">
                        {(progress.totalRevenue / 1000).toFixed(0)}K
                    </div>
                </div>
                <div className="bg-stone-950 border border-stone-800 rounded-sm p-4">
                    <div className="text-xs text-stone-500 mb-1">Rating</div>
                    <div className="text-2xl font-bold text-amber-500 flex items-center gap-1">
                        {progress.rating ? progress.rating.toFixed(1) : "N/A"}
                        {progress.rating && <Star className="w-5 h-5 fill-amber-500" />}
                    </div>
                </div>
            </div>

            {/* Achievements */}
            <div className="bg-stone-950 border border-stone-800 rounded-sm p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    Achievements
                </h3>

                {progress.achievements.length === 0 ? (
                    <div className="text-center py-8 text-stone-600">
                        <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Complete your first sale to unlock achievements!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {progress.achievements.map((achievement, index) => (
                            <motion.div
                                key={achievement.id}
                                className="bg-stone-900/50 border border-amber-500/30 rounded p-4 text-center"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.05 }}
                            >
                                <div className="text-4xl mb-2">
                                    {ACHIEVEMENT_EMOJIS[achievement.achievement_type] || "🏆"}
                                </div>
                                <div className="text-sm font-bold text-white mb-1">
                                    {achievement.achievement_name}
                                </div>
                                <div className="text-xs text-amber-500">
                                    +{achievement.xp_reward} XP
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Next Milestones */}
            <div className="bg-stone-950 border border-stone-800 rounded-sm p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-cyan-500" />
                    Next Milestones
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-stone-900/30 rounded">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">⭐</span>
                            <div>
                                <div className="font-bold text-white">Rising Star</div>
                                <div className="text-xs text-stone-500">Reach 10 orders</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-emerald-500 font-bold">+50 XP</div>
                            <div className="text-xs text-stone-600">
                                {Math.max(0, 10 - progress.totalOrders)} more
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-stone-900/30 rounded">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">💯</span>
                            <div>
                                <div className="font-bold text-white">Century Club</div>
                                <div className="text-xs text-stone-500">Complete 100 orders</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-emerald-500 font-bold">+500 XP</div>
                            <div className="text-xs text-stone-600">
                                {Math.max(0, 100 - progress.totalOrders)} more
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
