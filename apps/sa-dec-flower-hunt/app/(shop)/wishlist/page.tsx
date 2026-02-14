"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FLOWERS, formatPrice } from "@/data/flowers";
import { ChevronLeft, Heart, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface WishlistItem {
    flowerId: number;
    flowerName: string;
    addedAt: string;
}

export default function WishlistPage() {
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem("sadec_wishlist") || "[]");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setWishlist(saved);
    }, []);

    const removeItem = (flowerId: number) => {
        const newWishlist = wishlist.filter((item) => item.flowerId !== flowerId);
        localStorage.setItem("sadec_wishlist", JSON.stringify(newWishlist));
        setWishlist(newWishlist);
    };

    const wishlistFlowers = wishlist
        .map((item) => FLOWERS.find((f) => f.id === item.flowerId))
        .filter(Boolean);

    return (
        <div className="min-h-screen bg-[#FDFBF7] pb-8">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md px-4 py-4 border-b border-stone-100 flex items-center gap-3">
                <Link href="/" className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center">
                    <ChevronLeft className="w-6 h-6 text-stone-600" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-stone-800">Danh Sách Yêu Thích</h1>
                    <p className="text-sm text-stone-500">{wishlist.length} loài hoa</p>
                </div>
            </header>

            {/* Content */}
            <div className="px-4 pt-6">
                {wishlist.length === 0 ? (
                    <div className="text-center py-16">
                        <Heart className="w-16 h-16 text-stone-200 mx-auto mb-4" />
                        <h2 className="text-lg font-bold text-stone-600 mb-2">Chưa có hoa nào</h2>
                        <p className="text-stone-400 text-sm mb-6">
                            Bấm vào biểu tượng ❤️ để thêm hoa vào danh sách yêu thích
                        </p>
                        <Link
                            href="/"
                            className="inline-block bg-red-500 text-white px-6 py-3 rounded-full font-bold"
                        >
                            Khám Phá Hoa
                        </Link>
                    </div>
                ) : (
                    <AnimatePresence>
                        {wishlistFlowers.map((flower) => (
                            <motion.div
                                key={flower!.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex items-center gap-4 bg-white rounded-2xl p-3 mb-3 shadow-sm"
                            >
                                {/* Image */}
                                <Link href={`/flower/${flower!.id}`} className="flex-shrink-0">
                                    <Image
                                        src={flower!.image}
                                        alt={flower!.name}
                                        width={80}
                                        height={80}
                                        className="w-20 h-20 rounded-xl object-cover"
                                    />
                                </Link>

                                {/* Info */}
                                <Link href={`/flower/${flower!.id}`} className="flex-1 min-w-0">
                                    <h3 className="font-bold text-stone-800 truncate">{flower!.name}</h3>
                                    <p className="text-sm text-yellow-600">{flower!.vibe}</p>
                                    <p className="text-sm text-red-600 font-bold">{formatPrice(flower!.basePrice)}</p>
                                </Link>

                                {/* Remove Button */}
                                <button
                                    onClick={() => removeItem(flower!.id)}
                                    className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
