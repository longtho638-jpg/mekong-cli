'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MD3Surface, MD3Text } from '@/components/md3-dna';
import { Target } from 'lucide-react';

/* =====================================================
   Campaign Map - Built on MD3 DNA
   
   Timeline of 13 Chapters with progress tracking
   Uses MD3Surface for mission brief card
   ===================================================== */

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
    { id: 10, name: "Địa Hình" },
    { id: 11, name: "Cửu Địa" },
    { id: 12, name: "Hỏa Công" },
    { id: 13, name: "Dụng Gián" },
];

const CURRENT_CHAPTER = 10;

export function CampaignMap() {
    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span>🗺️</span>
                        <MD3Text variant="title-small" color="on-surface">
                            Campaign $1M
                        </MD3Text>
                    </div>
                    <MD3Text variant="label-small" color="on-surface-variant">
                        Chapter {CURRENT_CHAPTER}: {CHAPTERS[CURRENT_CHAPTER - 1].name}
                    </MD3Text>
                </div>
                <div className="text-right">
                    <MD3Text variant="title-medium" color="primary">
                        $850,000
                    </MD3Text>
                    <MD3Text variant="label-small" color="on-surface-variant">
                        War Chest
                    </MD3Text>
                </div>
            </div>

            {/* Progress Track */}
            <div className="relative py-4">
                {/* Background Track */}
                <div
                    className="absolute top-1/2 left-0 w-full h-1 rounded-full -translate-y-1/2"
                    style={{ backgroundColor: 'var(--md-sys-color-surface-container-highest)' }}
                />

                {/* Progress */}
                <motion.div
                    className="absolute top-1/2 left-0 h-1 rounded-full -translate-y-1/2"
                    style={{ backgroundColor: 'var(--md-sys-color-primary)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(CURRENT_CHAPTER / 13) * 100}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                />

                {/* Nodes */}
                <div className="flex justify-between relative">
                    {CHAPTERS.map((chapter) => {
                        const isCompleted = chapter.id < CURRENT_CHAPTER;
                        const isCurrent = chapter.id === CURRENT_CHAPTER;

                        return (
                            <div
                                key={chapter.id}
                                className="flex flex-col items-center group"
                                title={chapter.name}
                            >
                                <motion.div
                                    className="w-6 h-6 rounded-full flex items-center justify-center border-2 z-10 transition-colors"
                                    style={{
                                        backgroundColor: isCurrent
                                            ? 'var(--md-sys-color-tertiary-container)'
                                            : isCompleted
                                                ? 'var(--md-sys-color-primary-container)'
                                                : 'var(--md-sys-color-surface-container)',
                                        borderColor: isCurrent
                                            ? 'var(--md-sys-color-tertiary)'
                                            : isCompleted
                                                ? 'var(--md-sys-color-primary)'
                                                : 'var(--md-sys-color-outline-variant)',
                                    }}
                                    whileHover={{ scale: 1.2 }}
                                >
                                    {isCurrent ? (
                                        <Target
                                            size={12}
                                            style={{ color: 'var(--md-sys-color-on-tertiary-container)' }}
                                        />
                                    ) : (
                                        <span
                                            className="text-[8px] font-bold"
                                            style={{
                                                color: isCompleted
                                                    ? 'var(--md-sys-color-on-primary-container)'
                                                    : 'var(--md-sys-color-on-surface-variant)'
                                            }}
                                        >
                                            {chapter.id}
                                        </span>
                                    )}
                                </motion.div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Mission Brief */}
            <MD3Surface
                shape="medium"
                color="tertiary-container"
                className="mt-4"
            >
                <div className="flex items-start gap-3">
                    <div
                        className="p-1.5 rounded-lg shrink-0"
                        style={{ backgroundColor: 'var(--md-sys-color-tertiary)' }}
                    >
                        <Target size={16} style={{ color: 'var(--md-sys-color-on-tertiary)' }} />
                    </div>
                    <div className="min-w-0">
                        <MD3Text variant="label-medium" color="on-tertiary-container">
                            Objective: Địa Hình
                        </MD3Text>
                        <MD3Text variant="body-small" color="on-tertiary-container" lineClamp={2}>
                            82 Hub positions. Focus on Specialized Hubs for $150K push.
                        </MD3Text>
                    </div>
                </div>
            </MD3Surface>
        </div>
    );
}

export default CampaignMap;
