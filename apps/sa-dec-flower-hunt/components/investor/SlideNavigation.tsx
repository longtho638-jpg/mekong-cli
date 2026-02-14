"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const SLIDES = [
    { path: "/investor/deck", label: "Cover" },
    { path: "/investor/deck/problem", label: "Problem" },
    { path: "/investor/deck/solution", label: "Solution" },
    { path: "/investor/deck/traction", label: "Traction" },
    { path: "/investor/deck/business", label: "Business" },
    { path: "/investor/deck/team", label: "Team" },
    { path: "/investor/deck/ask", label: "Ask" },
];

export const SlideNavigation = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const index = SLIDES.findIndex(s => s.path === pathname);
        setCurrentIndex(index >= 0 ? index : 0);
    }, [pathname]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight" && currentIndex < SLIDES.length - 1) {
                router.push(SLIDES[currentIndex + 1].path);
            } else if (e.key === "ArrowLeft" && currentIndex > 0) {
                router.push(SLIDES[currentIndex - 1].path);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentIndex, router]);

    const goToNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            router.push(SLIDES[currentIndex + 1].path);
        }
    };

    const goToPrevious = () => {
        if (currentIndex > 0) {
            router.push(SLIDES[currentIndex - 1].path);
        }
    };

    return (
        <div className="fixed bottom-8 left-0 right-0 z-50 flex items-center justify-center gap-8">
            {/* Previous Button */}
            <button
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                className="w-12 h-12 rounded-full bg-emerald-900/30 border border-emerald-500/30 flex items-center justify-center hover:bg-emerald-900/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
                <ChevronLeft className="w-6 h-6 text-emerald-400" />
            </button>

            {/* Progress Dots */}
            <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-emerald-500/20">
                {SLIDES.map((slide, index) => (
                    <button
                        key={slide.path}
                        onClick={() => router.push(slide.path)}
                        className="group relative"
                    >
                        <motion.div
                            className={`w-2 h-2 rounded-full transition-all ${index === currentIndex
                                    ? "bg-emerald-500 w-8"
                                    : index < currentIndex
                                        ? "bg-emerald-700"
                                        : "bg-slate-700"
                                }`}
                            whileHover={{ scale: 1.5 }}
                        />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-2 py-1 rounded text-[10px] text-emerald-400 font-mono">
                            {slide.label}
                        </div>
                    </button>
                ))}
                <span className="text-xs text-emerald-500 font-mono ml-2">
                    {currentIndex + 1} / {SLIDES.length}
                </span>
            </div>

            {/* Next Button */}
            <button
                onClick={goToNext}
                disabled={currentIndex === SLIDES.length - 1}
                className="w-12 h-12 rounded-full bg-emerald-900/30 border border-emerald-500/30 flex items-center justify-center hover:bg-emerald-900/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
                <ChevronRight className="w-6 h-6 text-emerald-400" />
            </button>
        </div>
    );
};
