import React from "react";

export default function SkeletonCard() {
    return (
        <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden bg-stone-200 animate-pulse">
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />

            {/* Placeholder Content */}
            <div className="absolute bottom-4 left-4 right-4">
                <div className="h-6 bg-stone-300 rounded-md w-3/4 mb-2" />
                <div className="h-4 bg-stone-300 rounded-md w-1/2" />
            </div>

            {/* Placeholder Icon */}
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-stone-300" />
        </div>
    );
}
