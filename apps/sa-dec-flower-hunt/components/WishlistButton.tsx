"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface WishlistButtonProps {
    flowerId: number;
    flowerName: string;
    className?: string;
}

export default function WishlistButton({ flowerId, flowerName, className = "" }: WishlistButtonProps) {
    const [isWishlisted, setIsWishlisted] = useState(false);

    // Check localStorage on mount
    useEffect(() => {
        const wishlist = JSON.parse(localStorage.getItem("sadec_wishlist") || "[]");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsWishlisted(wishlist.some((item: any) => item.flowerId === flowerId));
    }, [flowerId]);

    const toggleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const wishlist = JSON.parse(localStorage.getItem("sadec_wishlist") || "[]");

        if (isWishlisted) {
            // Remove from wishlist
            const newWishlist = wishlist.filter((item: any) => item.flowerId !== flowerId);
            localStorage.setItem("sadec_wishlist", JSON.stringify(newWishlist));
            setIsWishlisted(false);
        } else {
            // Add to wishlist
            wishlist.push({ flowerId, flowerName, addedAt: new Date().toISOString() });
            localStorage.setItem("sadec_wishlist", JSON.stringify(wishlist));
            setIsWishlisted(true);

            // AARRR: Activation
            trackEvent("add_to_wishlist", { flower_id: flowerId, flower_name: flowerName });
        }
    };

    return (
        <button
            onClick={toggleWishlist}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isWishlisted
                ? "bg-red-500 text-white shadow-lg scale-110"
                : "bg-white/80 backdrop-blur-md text-stone-600 hover:bg-red-100 hover:text-red-500"
                } ${className}`}
        >
            <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
        </button>
    );
}
