"use client";

import { FarmerStoryType } from "@/lib/farmerStories";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, MapPin, Calendar, Star, ChevronLeft, ChevronRight, Sparkles, Heart } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

// Animated background particles
function FloatingParticles() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-amber-300 to-rose-300 opacity-40"
                    initial={{
                        x: `${Math.random() * 100}%`,
                        y: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        y: [null, `${Math.random() * 100}%`, `${Math.random() * 100}%`],
                        x: [null, `${Math.random() * 100}%`, `${Math.random() * 100}%`],
                        scale: [1, 1.5, 1],
                        opacity: [0.4, 0.8, 0.4],
                    }}
                    transition={{
                        duration: 10 + Math.random() * 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    );
}

// Single story card - WOW version
function StoryCard({ story, isActive }: { story: FarmerStoryType; isActive: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: isActive ? 1 : 0.5, scale: isActive ? 1 : 0.9 }}
            className={`relative bg-gradient-to-br from-white via-amber-50/50 to-rose-50/30 rounded-3xl shadow-2xl border border-amber-100/50 overflow-hidden ${isActive ? 'z-10' : 'z-0'}`}
        >
            {/* Glowing border effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 via-rose-400/20 to-amber-400/20 rounded-3xl blur-xl -z-10" />

            <div className="p-8 md:p-10">
                {/* Header with avatar and badge */}
                <div className="flex items-start gap-6 mb-8">
                    {/* Avatar with glow */}
                    <motion.div
                        className="relative shrink-0"
                        whileHover={{ scale: 1.05 }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-rose-400 rounded-full blur-lg opacity-50" />
                        <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-2xl overflow-hidden">
                            <Image
                                src={story.avatar}
                                alt={story.farmerName}
                                fill
                                className="object-cover"
                            />
                        </div>
                        {/* Experience badge */}
                        <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                            {story.experience}
                        </div>
                    </motion.div>

                    {/* Name and info */}
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-amber-100 to-rose-100 text-amber-800 rounded-full text-xs font-bold mb-2">
                            <Sparkles className="w-3 h-3" />
                            NGHỆ NHÂN HOA SA ĐÉC
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-stone-900 via-amber-800 to-stone-700 bg-clip-text text-transparent">
                            {story.farmerName}
                        </h3>
                        <p className="text-lg text-amber-600 font-medium mt-1 flex items-center gap-2">
                            <span className="text-2xl">🌸</span> {story.specialty}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-stone-500">
                            <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-amber-500" />
                                {story.location}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Title */}
                <motion.h2
                    className="text-2xl md:text-3xl font-bold text-stone-800 mb-6 leading-tight"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    &ldquo;{story.title}&rdquo;
                </motion.h2>

                {/* Quote highlight */}
                <motion.div
                    className="relative mb-8 p-6 bg-gradient-to-r from-amber-50 to-rose-50 rounded-2xl border-l-4 border-amber-400"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <Quote className="absolute top-2 left-2 w-8 h-8 text-amber-200" />
                    <p className="text-lg md:text-xl font-medium text-stone-700 italic pl-6">
                        {story.quote}
                    </p>
                    <Heart className="absolute bottom-2 right-4 w-5 h-5 text-rose-300 fill-rose-300" />
                </motion.div>

                {/* Story content */}
                <motion.div
                    className="prose prose-stone prose-lg max-w-none mb-8"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <p className="text-stone-600 leading-relaxed line-clamp-6 md:line-clamp-none">
                        {story.story}
                    </p>
                </motion.div>

                {/* Fun fact */}
                <motion.div
                    className="bg-gradient-to-r from-sky-50 to-cyan-50 rounded-2xl p-5 border border-sky-100 flex gap-4 items-start"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <span className="text-3xl">💡</span>
                    <div>
                        <h4 className="font-bold text-sky-900 mb-1">Bật mí thú vị</h4>
                        <p className="text-sky-700">{story.funFact}</p>
                    </div>
                </motion.div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-6">
                    {story.tags.map(tag => (
                        <Badge
                            key={tag}
                            className="bg-gradient-to-r from-stone-100 to-stone-200 text-stone-600 border-0 hover:from-amber-100 hover:to-rose-100 transition-all"
                        >
                            #{tag}
                        </Badge>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

// Carousel for multiple stories
export function FarmerStoryCarousel({ stories }: { stories: FarmerStoryType[] }) {
    const [current, setCurrent] = useState(0);
    const [autoPlay, setAutoPlay] = useState(true);

    useEffect(() => {
        if (!autoPlay || stories.length <= 1) return;
        const timer = setInterval(() => {
            setCurrent(prev => (prev + 1) % stories.length);
        }, 8000);
        return () => clearInterval(timer);
    }, [autoPlay, stories.length]);

    const next = () => {
        setAutoPlay(false);
        setCurrent(prev => (prev + 1) % stories.length);
    };

    const prev = () => {
        setAutoPlay(false);
        setCurrent(prev => (prev - 1 + stories.length) % stories.length);
    };

    if (!stories.length) return null;

    return (
        <section className="relative py-12 md:py-20 bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 overflow-hidden">
            <FloatingParticles />

            {/* Header */}
            <div className="text-center mb-12 relative z-10">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/30 text-amber-300 rounded-full text-sm font-bold mb-4"
                >
                    <Star className="w-4 h-4 fill-amber-400" />
                    CÂU CHUYỆN NGHỆ NHÂN
                    <Star className="w-4 h-4 fill-amber-400" />
                </motion.div>
                <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-200 via-rose-200 to-amber-200 bg-clip-text text-transparent mb-4">
                    Những Bàn Tay Vàng Sa Đéc
                </h2>
                <p className="text-stone-400 text-lg max-w-2xl mx-auto">
                    Khám phá câu chuyện đầy cảm hứng từ những nghệ nhân đã dành cả đời cho hoa
                </p>
            </div>

            {/* Carousel */}
            <div className="max-w-4xl mx-auto px-4 relative z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={current}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                    >
                        <StoryCard story={stories[current]} isActive={true} />
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                {stories.length > 1 && (
                    <>
                        <button
                            onClick={prev}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-16 w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            onClick={next}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-16 w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </>
                )}

                {/* Dots indicator */}
                <div className="flex justify-center gap-2 mt-8">
                    {stories.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => { setAutoPlay(false); setCurrent(index); }}
                            className={`w-3 h-3 rounded-full transition-all ${index === current
                                    ? 'bg-gradient-to-r from-amber-400 to-rose-400 w-8'
                                    : 'bg-white/30 hover:bg-white/50'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

// Single story display - Enhanced version
export default function FarmerStory({ story }: { story: FarmerStoryType }) {
    if (!story) return null;
    return <FarmerStoryCarousel stories={[story]} />;
}
