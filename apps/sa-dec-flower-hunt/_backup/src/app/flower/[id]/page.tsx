"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { flowers } from "@/lib/dummyData";
import { ChevronLeft, Share2, Info, Sparkles } from "lucide-react";

export default function FlowerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [flower, setFlower] = useState<(typeof flowers)[0] | null>(null);
    const [isCollected, setIsCollected] = useState(false);

    useEffect(() => {
        if (params.id) {
            const foundFlower = flowers.find((f) => f.id === params.id);
            if (foundFlower) {
                setFlower(foundFlower);
            }
        }
    }, [params.id]);

    const handleCollect = () => {
        if (isCollected) return;

        setIsCollected(true);

        // Confetti explosion
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 50 };

        const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
        };

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: ["#D94141", "#EAB308", "#3F6212"],
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: ["#D94141", "#EAB308", "#3F6212"],
            });
        }, 250);
    };

    if (!flower) return <div className="h-screen bg-[#FDFBF7]" />;

    return (
        <div className="relative h-screen w-full bg-[#FDFBF7] overflow-hidden font-sans text-stone-900">
            {/* Top Image Section (60% height) */}
            <div className="absolute top-0 left-0 w-full h-[65%] z-0">
                <Image
                    src={flower.imageUrl}
                    alt={flower.name}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />
            </div>

            {/* Navigation Buttons */}
            <div className="absolute top-6 left-6 z-20">
                <button
                    onClick={() => router.back()}
                    className="w-11 h-11 rounded-full bg-white/90 backdrop-blur-md shadow-soft-red flex items-center justify-center text-stone-900 hover:bg-white transition-all"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
            </div>
            <div className="absolute top-6 right-6 z-20 flex gap-3">
                <button className="w-11 h-11 rounded-full bg-white/90 backdrop-blur-md shadow-soft-red flex items-center justify-center text-stone-900 hover:bg-white transition-all">
                    <Share2 className="w-5 h-5" />
                </button>
            </div>

            {/* Bottom Sheet Information */}
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 25, stiffness: 100 }}
                className="absolute bottom-0 left-0 w-full h-[45%] bg-[#FDFBF7] rounded-t-[3rem] shadow-[0_-10px_60px_rgba(0,0,0,0.1)] z-10 flex flex-col px-8 pt-10 pb-6"
            >
                {/* Drag Handle */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-stone-200 rounded-full" />

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-secondary/20 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-secondary/20">
                                {flower.personality}
                            </span>
                        </div>
                        <h1 className="font-serif text-4xl font-black text-stone-900 leading-tight">
                            {flower.name}
                        </h1>
                    </div>

                    {/* Meaning Quote */}
                    <div className="mb-6 pl-5 border-l-[6px] border-secondary italic text-stone-600 font-medium text-lg">
                        "{flower.meaning}"
                    </div>

                    {/* Story / Info */}
                    <div className="mb-24">
                        <h3 className="font-bold text-stone-900 mb-3 flex items-center gap-2 text-lg">
                            <Info className="w-5 h-5 text-primary" />
                            Câu chuyện
                        </h3>
                        <p className="text-stone-600 text-base leading-relaxed font-medium">
                            {flower.story}
                        </p>
                    </div>
                </div>

                {/* Floating Action Button */}
                <div className="absolute bottom-8 left-8 right-8">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCollect}
                        disabled={isCollected}
                        className={`w-full py-4 rounded-3xl font-bold text-lg shadow-soft-red transition-all flex items-center justify-center gap-2 relative overflow-hidden group ${isCollected
                            ? "bg-stone-100 text-stone-400 cursor-default border border-stone-200"
                            : "bg-primary text-white hover:bg-red-600"
                            }`}
                    >
                        {isCollected ? (
                            <span>Đã thu thập ✅</span>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5 animate-pulse" />
                                <span>Thu thập ngay</span>
                                <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm ml-1">
                                    +10 điểm
                                </span>
                            </>
                        )}
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}
