"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, ThumbsUp } from "lucide-react";

interface Review {
    id: string;
    rating: number;
    comment: string;
    photos: string[];
    created_at: string;
    profiles: {
        name: string;
    };
}

interface ReviewListProps {
    farmerId: string;
    limit?: number;
}

export function ReviewList({ farmerId, limit = 10 }: ReviewListProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, [farmerId]);

    const fetchReviews = async () => {
        try {
            const response = await fetch(`/api/farmers/${farmerId}/reviews?limit=${limit}`);
            const data = await response.json();
            if (data.reviews) {
                setReviews(data.reviews);
            }
        } catch (error) {
            console.error("Failed to fetch reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-stone-950 border border-stone-800 rounded-sm p-6 animate-pulse">
                        <div className="flex gap-2 mb-3">
                            {[1, 2, 3, 4, 5].map(s => (
                                <div key={s} className="w-4 h-4 bg-stone-800 rounded" />
                            ))}
                        </div>
                        <div className="h-4 bg-stone-800 rounded w-3/4 mb-2" />
                        <div className="h-4 bg-stone-800 rounded w-1/2" />
                    </div>
                ))}
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-12 text-stone-500">
                <p>Chưa có đánh giá nào</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {reviews.map((review, index) => (
                <motion.div
                    key={review.id}
                    className="bg-stone-950 border border-stone-800 rounded-sm p-6 hover:border-emerald-500/30 transition-colors"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <div className="font-bold text-white mb-1">{review.profiles.name}</div>
                            <div className="flex gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-4 h-4 ${star <= review.rating
                                                ? "fill-amber-500 text-amber-500"
                                                : "text-stone-700"
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                        <span className="text-xs text-stone-500">
                            {new Date(review.created_at).toLocaleDateString('vi-VN')}
                        </span>
                    </div>

                    {/* Comment */}
                    {review.comment && (
                        <p className="text-stone-300 mb-4">{review.comment}</p>
                    )}

                    {/* Photos */}
                    {review.photos && review.photos.length > 0 && (
                        <div className="flex gap-2 mb-4">
                            {review.photos.map((photo, i) => (
                                <img
                                    key={i}
                                    src={photo}
                                    alt="Review photo"
                                    className="w-20 h-20 object-cover rounded border border-stone-700"
                                />
                            ))}
                        </div>
                    )}

                    {/* Helpful button (placeholder) */}
                    <button className="flex items-center gap-2 text-xs text-stone-500 hover:text-emerald-400 transition-colors">
                        <ThumbsUp className="w-3 h-3" />
                        <span>Hữu ích</span>
                    </button>
                </motion.div>
            ))}
        </div>
    );
}
