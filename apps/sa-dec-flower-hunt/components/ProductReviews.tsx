"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Star, ThumbsUp } from "lucide-react";

const REVIEWS = [
    {
        id: 1,
        user: "Chị Hạnh (HCM)",
        avatar: "H",
        rating: 5,
        date: "2 ngày trước",
        content: "Hoa đẹp y như hình! Đặt mua cho ba mẹ ở quê mà ai cũng khen. Giao hàng nhanh, đóng gói cẩn thận lắm. Sẽ ủng hộ tiếp.",
        images: ["https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=100", "https://images.unsplash.com/photo-1548690321-e3b507d8c110?w=100"],
        verified: true,
        likes: 12
    },
    {
        id: 2,
        user: "Anh Tuấn (Cần Thơ)",
        avatar: "T",
        rating: 4,
        date: "1 tuần trước",
        content: "Hoa tươi, giá tốt hơn mua ngoài chợ. Điểm trừ là shipper hơi khó tìm đường, nhưng bù lại rất nhiệt tình.",
        verified: true,
        likes: 5
    },
    {
        id: 3,
        user: "Ngọc Mai (Đà Nẵng)",
        avatar: "N",
        rating: 5,
        date: "3 tuần trước",
        content: "Đã mua lần 2. Cúc mâm xôi năm nay nở đều và đẹp hơn năm ngoái. Rất thích cách shop tư vấn chăm sóc.",
        verified: true,
        likes: 8
    }
];

export function ProductReviews() {
    return (
        <div className="space-y-8 py-8 border-t border-stone-200">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Summary */}
                <div className="w-full md:w-1/3 space-y-4">
                    <h3 className="text-2xl font-bold text-stone-900">Đánh giá & Nhận xét</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-5xl font-bold text-stone-900">4.8</span>
                        <div className="mb-2">
                            <div className="flex text-amber-400">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Star key={i} className="w-5 h-5 fill-current" />
                                ))}
                            </div>
                            <p className="text-sm text-stone-500 mt-1">Dựa trên 128 đánh giá</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => (
                            <div key={rating} className="flex items-center gap-2 text-sm">
                                <span className="w-3 text-stone-600 font-medium">{rating}</span>
                                <Star className="w-4 h-4 text-amber-400 fill-current" />
                                <Progress value={rating === 5 ? 85 : rating === 4 ? 10 : 5} className="h-2 flex-1" />
                                <span className="w-8 text-right text-stone-400 text-xs">{rating === 5 ? '85%' : rating === 4 ? '10%' : '5%'}</span>
                            </div>
                        ))}
                    </div>

                    <Button className="w-full bg-stone-900 text-white" variant="outline">Viết đánh giá</Button>
                </div>

                {/* Review List */}
                <div className="flex-1 space-y-6">
                    {REVIEWS.map((review) => (
                        <div key={review.id} className="border-b border-stone-100 last:border-0 pb-6 last:pb-0">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex gap-3">
                                    <Avatar>
                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${review.avatar}`} />
                                        <AvatarFallback>{review.avatar}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h4 className="font-semibold text-stone-900 text-sm">{review.user}</h4>
                                        <div className="flex items-center gap-2">
                                            <div className="flex text-amber-400">
                                                {Array.from({ length: review.rating }).map((_, i) => (
                                                    <Star key={i} className="w-3 h-3 fill-current" />
                                                ))}
                                            </div>
                                            {review.verified && (
                                                <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full font-medium">Đã mua hàng</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs text-stone-400">{review.date}</span>
                            </div>

                            <div className="pl-12 space-y-3">
                                <p className="text-stone-700 text-sm leading-relaxed">{review.content}</p>

                                {review.images && (
                                    <div className="flex gap-2">
                                        {review.images.map((img, i) => (
                                            <img key={i} src={img} alt="Review" className="w-16 h-16 rounded-md object-cover border border-stone-100" />
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center gap-4 pt-1">
                                    <button className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 text-xs font-medium transition-colors">
                                        <ThumbsUp className="w-3.5 h-3.5" />
                                        Hữu ích ({review.likes})
                                    </button>
                                    <button className="text-stone-400 hover:text-stone-600 text-xs font-medium transition-colors">
                                        Phản hồi
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
