'use client';

import { motion } from 'framer-motion';
import { Target } from 'lucide-react';

const CHAPTERS = [
    { id: 1, name: "Kế Hoạch" },
    { id: 2, name: "Tác Chiến" },
    { id: 3, name: "Mưu Công" },
    { id: 4, name: "Hình Thế" },
    { id: 5, name: "Thế Trận" },
    { id: 6, name: "Hư Thực" },
    { id: 7, name: "Quân Tranh" },
    { id: 8, name: "Cửu Biến" },
    { id: 9, name: "Hành Quân" },
    { id: 10, name: "Địa Hình" }, // Current
    { id: 11, name: "Cửu Địa" },
    { id: 12, name: "Hỏa Công" },
    { id: 13, name: "Dụng Gián" },
];

const CURRENT_CHAPTER = 10;
const PROGRESS_PERCENT = 85; // $850k / $1M

export function CampaignMap() {
    return (
        <div className="relative glass-liquid rounded-2xl p-6 border border-white/10 overflow-hidden section-in-fluid">
            {/* Background Map Texture (Abstract) */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('/map-texture.png')] bg-cover pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-2xl">🗺️</span>
                        The Campaign (Chiến Dịch $1M)
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                        Current Position: <span className="text-amber-400 font-bold">Chapter {CURRENT_CHAPTER} - {CHAPTERS[CURRENT_CHAPTER - 1].name}</span>
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold text-green-400 tracking-tight">$850,000</div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest">War Chest (YTD)</div>
                </div>
            </div>

            {/* 13 Chapters Roadmap */}
            <div className="relative z-10">
                {/* Progress Line Background */}
                <div className="absolute top-[15px] left-0 w-full h-1 bg-white/10 rounded-full" />

                {/* Live Progress Line */}
                <motion.div
                    className="absolute top-[15px] left-0 h-1 bg-gradient-to-r from-green-500 via-emerald-400 to-amber-400 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${(CURRENT_CHAPTER / 13) * 100}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                />

                {/* Nodes */}
                <div className="flex justify-between relative">
                    {CHAPTERS.map((chapter) => {
                        const isCompleted = chapter.id < CURRENT_CHAPTER;
                        const isCurrent = chapter.id === CURRENT_CHAPTER;
                        const isLocked = chapter.id > CURRENT_CHAPTER;

                        return (
                            <div key={chapter.id} className="flex flex-col items-center group relative cursor-pointer">
                                {/* Node Circle */}
                                <motion.div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-20 transition-all duration-300 ${isCurrent
                                            ? 'bg-amber-500 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)] scale-110'
                                            : isCompleted
                                                ? 'bg-green-900/80 border-green-500 text-green-400'
                                                : 'bg-[#0a0a0f] border-white/10 text-gray-600'
                                        }`}
                                    whileHover={{ scale: 1.2 }}
                                >
                                    {isCurrent ? <Target className="w-4 h-4 text-white animate-spin-slow" /> : <span className="text-[10px] font-bold">{chapter.id}</span>}
                                </motion.div>

                                {/* Tooltip on Hover */}
                                <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                                    <div className={`text-[10px] px-2 py-1 rounded bg-black/80 border border-white/10 backdrop-blur-md ${isCurrent ? 'text-amber-400' : isCompleted ? 'text-green-400' : 'text-gray-500'
                                        }`}>
                                        {chapter.name}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Current Mission Brief */}
            <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-4 relative z-10">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                    <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div>
                    <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-1">Current Objective: Market Entry (Địa Hình)</h4>
                    <p className="text-sm text-gray-300 leading-relaxed">
                        Establishing 82 fortified positions (Hubs). Key focus on securing high-ground advantages in <span className="text-white font-bold">Specialized Hubs</span> to prepare for the final $150K push.
                    </p>
                </div>
            </div>
        </div>
    );
}
