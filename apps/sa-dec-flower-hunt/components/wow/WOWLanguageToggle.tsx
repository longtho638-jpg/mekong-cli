"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/lib/i18n"
import { Globe, Sparkles } from "lucide-react"
import { useState } from "react"

export function WOWLanguageToggle() {
    const { language, setLanguage } = useLanguage()
    const [isHovered, setIsHovered] = useState(false)
    const [showSparkle, setShowSparkle] = useState(false)

    const handleSwitch = (lang: "vi" | "en") => {
        if (lang !== language) {
            setShowSparkle(true)
            setTimeout(() => setShowSparkle(false), 600)
            setLanguage(lang)
        }
    }

    return (
        <motion.div
            className="relative flex items-center gap-1 bg-black/60 backdrop-blur-xl border border-emerald-500/30 rounded-full p-1"
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            whileHover={{ scale: 1.02 }}
        >
            {/* Animated Globe */}
            <motion.div
                className="px-1.5"
                animate={{
                    rotate: isHovered ? 360 : 0,
                }}
                transition={{ duration: 1, ease: "easeInOut" }}
            >
                <Globe className="w-4 h-4 text-emerald-400" />
            </motion.div>

            {/* Language Options */}
            <div className="flex items-center gap-0.5">
                {/* Vietnamese */}
                <motion.button
                    onClick={() => handleSwitch("vi")}
                    className={`relative px-2.5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1
                        ${language === "vi"
                            ? "bg-gradient-to-r from-red-500 to-yellow-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                            : "text-stone-400 hover:text-white hover:bg-white/10"
                        }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <span className="text-sm">🇻🇳</span>
                    <span className="hidden sm:inline font-mono">VIE</span>
                </motion.button>

                {/* English */}
                <motion.button
                    onClick={() => handleSwitch("en")}
                    className={`relative px-2.5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1
                        ${language === "en"
                            ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                            : "text-stone-400 hover:text-white hover:bg-white/10"
                        }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <span className="text-sm">🇬🇧</span>
                    <span className="hidden sm:inline font-mono">ENG</span>
                </motion.button>
            </div>

            {/* Sparkle Burst Effect */}
            <AnimatePresence>
                {showSparkle && (
                    <div className="absolute inset-0 pointer-events-none overflow-visible">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute left-1/2 top-1/2"
                                initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                                animate={{
                                    opacity: [1, 0],
                                    scale: [0, 1],
                                    x: Math.cos((i / 8) * Math.PI * 2) * 30,
                                    y: Math.sin((i / 8) * Math.PI * 2) * 30,
                                }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            >
                                <Sparkles className="w-3 h-3 text-yellow-400" />
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

// Compact version for mobile/header
export function WOWLanguageToggleCompact() {
    const { language, setLanguage } = useLanguage()

    const toggle = () => {
        setLanguage(language === "vi" ? "en" : "vi")
    }

    return (
        <motion.button
            onClick={toggle}
            className="flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-xl border border-emerald-500/30 rounded-full text-xs"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <motion.span
                key={language}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-sm"
            >
                {language === "vi" ? "🇻🇳" : "🇬🇧"}
            </motion.span>
            <motion.span
                key={`label-${language}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-mono text-emerald-400"
            >
                {language === "vi" ? "VIE" : "ENG"}
            </motion.span>
        </motion.button>
    )
}
