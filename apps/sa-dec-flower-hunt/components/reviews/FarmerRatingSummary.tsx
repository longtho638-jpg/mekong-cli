"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, TrendingUp } from "lucide-react";

interface FarmerRatingSummaryProps {
    farmerId: string;
    compact?: boolean;
}

interface RatingSummary {
    average_rating: number;
    total_reviews: number;
    five_star: number;
    four_star: number;
    three_star: number;
    two_star: number;
    one_star: number;
}

export function FarmerRatingSummary({ farmerId, compact = false }: FarmerRatingSummaryProps) {
    const [summary, setSummary] = useState<RatingSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSummary();
    }, [farmerId]);

    const fetchSummary = async () => {
        try {
            const response = await fetch(`/api/farmers/${farmerId}/reviews`);
            const data = await response.json();
            if (data.summary) {
                setSummary(data.summary);
            }
        } catch (error) {
            console.error("Failed to fetch rating summary:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-6 bg-stone-800 rounded w-32 mb-2" />
                <div className="h-4 bg-stone-800 rounded w-24" />
            </div>
        );
    }

    if (!summary || summary.total_reviews === 0) {
        return (
            <div className="text-sm text-stone-500">
                Chưa có đánh giá
            </div>
        );
    }

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span className="font-bold text-white">
                        {summary.average_rating.toFixed(1)}
                    </span>
                </div>
                <span className="text-xs text-stone-500">
                    ({summary.total_reviews} đánh giá)
                </span>
            </div>
        );
    }

    const ratingBars = [
        { stars: 5, count: summary.five_star },
        { stars: 4, count: summary.four_star },
        { stars: 3, count: summary.three_star },
        { stars: 2, count: summary.two_star },
        { stars: 1, count: summary.one_star },
    ];

    return (
        <div className="space-y-4">
            {/* Overall rating */}
            <div className="flex items-center gap-4">
                <div className="text-center">
                    <div className="text-4xl font-bold text-white mb-1">
                        {summary.average_rating.toFixed(1)}
                    </div>
                    <div className="flex gap-0.5 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`w-4 h-4 ${star <= Math.round(summary.average_rating)
                                        ? "fill-amber-500 text-amber-500"
                                        : "text-stone-700"
                                    }`}
                            />
                        ))}
                    </div>
                    <div className="text-xs text-stone-500">
                        {summary.total_reviews} đánh giá
                    </div>
                </div>

                {/* Rating distribution */}
                <div className="flex-1 space-y-2">
                    {ratingBars.map(({ stars, count }) => {
                        const percentage = summary.total_reviews > 0
                            ? (count / summary.total_reviews) * 100
                            : 0;

                        return (
                            <div key={stars} className="flex items-center gap-2">
                                <span className="text-xs text-stone-500 w-8">{stars}★</span>
                                <div className="flex-1 h-2 bg-stone-900 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-amber-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 0.5, delay: stars * 0.1 }}
                                    />
                                </div>
                                <span className="text-xs text-stone-500 w-8 text-right">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Trust badge */}
            {summary.average_rating >= 4.5 && summary.total_reviews >= 10 && (
                <motion.div
                    className="bg-emerald-950/30 border border-emerald-500/30 rounded-sm p-3 flex items-center gap-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-emerald-400 font-bold">Nhà cung cấp uy tín</span>
                </motion.div>
            )}
        </div>
    );
}
