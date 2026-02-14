"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Upload, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewFormProps {
    orderId: string;
    buyerId: string;
    onSuccess?: () => void;
}

export function ReviewForm({ orderId, buyerId, onSuccess }: ReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [photos, setPhotos] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            setError("Vui lòng chọn số sao đánh giá");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch(`/api/orders/${orderId}/review`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rating,
                    comment,
                    photos,
                    buyerId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Gửi đánh giá thất bại");
            }

            setSuccess(true);
            if (onSuccess) onSuccess();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <motion.div
                className="bg-emerald-950/30 border border-emerald-500/30 rounded-sm p-8 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Cảm ơn đánh giá của bạn!</h3>
                <p className="text-stone-400">Đánh giá của bạn giúp nông dân cải thiện chất lượng sản phẩm</p>
            </motion.div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating stars */}
            <div>
                <label className="block text-sm text-emerald-500 uppercase tracking-wider mb-3">
                    Đánh giá của bạn
                </label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="transition-transform hover:scale-110"
                        >
                            <Star
                                className={`w-8 h-8 ${star <= (hoverRating || rating)
                                        ? "fill-amber-500 text-amber-500"
                                        : "text-stone-700"
                                    }`}
                            />
                        </button>
                    ))}
                </div>
                {rating > 0 && (
                    <p className="text-sm text-stone-400 mt-2">
                        {rating === 5 ? "Xuất sắc! ⭐" : ""}
                        {rating === 4 ? "Rất tốt! 👍" : ""}
                        {rating === 3 ? "Tốt 😊" : ""}
                        {rating === 2 ? "Trung bình 😐" : ""}
                        {rating === 1 ? "Cần cải thiện 😔" : ""}
                    </p>
                )}
            </div>

            {/* Comment */}
            <div>
                <label className="block text-sm text-emerald-500 uppercase tracking-wider mb-3">
                    Nhận xét (tùy chọn)
                </label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm và dịch vụ..."
                    rows={4}
                    className="w-full bg-stone-900 border border-stone-800 rounded-sm p-4 text-white placeholder:text-stone-600 focus:border-emerald-500 focus:outline-none"
                />
            </div>

            {/* Photo upload (optional - simplified for now) */}
            <div>
                <label className="block text-sm text-emerald-500 uppercase tracking-wider mb-3">
                    Hình ảnh (tùy chọn)
                </label>
                <div className="border-2 border-dashed border-stone-800 rounded-sm p-8 text-center hover:border-emerald-500/30 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-stone-600 mx-auto mb-2" />
                    <p className="text-sm text-stone-500">Click để upload ảnh sản phẩm</p>
                    <p className="text-xs text-stone-600 mt-1">(Sắp ra mắt)</p>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-950/30 border border-red-500/30 rounded-sm p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{error}</p>
                </div>
            )}

            {/* Submit */}
            <Button
                type="submit"
                disabled={loading || rating === 0}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-4 rounded-sm disabled:opacity-50"
            >
                {loading ? "Đang gửi..." : "Gửi đánh giá"}
            </Button>
        </form>
    );
}
