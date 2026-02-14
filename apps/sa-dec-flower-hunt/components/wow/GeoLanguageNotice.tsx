"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/lib/i18n"
import { MapPin, X } from "lucide-react"
import { useState, useEffect } from "react"

export function GeoLanguageNotice() {
    const { language } = useLanguage()
    const [show, setShow] = useState(false)
    const [hasShown, setHasShown] = useState(false)

    useEffect(() => {
        // Only show once per session
        const shown = sessionStorage.getItem("geo_notice_shown")
        if (shown) {
            setHasShown(true)
            return
        }

        // Delay show for smooth page load
        const timer = setTimeout(() => {
            setShow(true)
            sessionStorage.setItem("geo_notice_shown", "true")
        }, 1500)

        // Auto dismiss after 5 seconds
        const dismissTimer = setTimeout(() => {
            setShow(false)
        }, 6500)

        return () => {
            clearTimeout(timer)
            clearTimeout(dismissTimer)
        }
    }, [])

    if (hasShown && !show) return null

    const isVietnamese = language === "vi"

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%]"
                >
                    <div className={`relative backdrop-blur-xl rounded-2xl p-4 border shadow-2xl
                        ${isVietnamese
                            ? "bg-gradient-to-r from-red-900/80 to-yellow-900/80 border-yellow-500/30 shadow-red-500/20"
                            : "bg-gradient-to-r from-blue-900/80 to-indigo-900/80 border-blue-500/30 shadow-blue-500/20"
                        }`}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setShow(false)}
                            className="absolute top-2 right-2 text-white/50 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-start gap-3">
                            {/* Icon */}
                            <motion.div
                                animate={{ y: [0, -3, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className={`p-2 rounded-xl ${isVietnamese ? "bg-red-500/20" : "bg-blue-500/20"}`}
                            >
                                <MapPin className={`w-5 h-5 ${isVietnamese ? "text-yellow-400" : "text-blue-400"}`} />
                            </motion.div>

                            {/* Content */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">
                                        {isVietnamese ? "🇻🇳" : "🌍"}
                                    </span>
                                    <span className="font-bold text-white text-sm">
                                        {isVietnamese ? "Xin chào!" : "Welcome!"}
                                    </span>
                                </div>
                                <p className="text-xs text-white/80 leading-relaxed">
                                    {isVietnamese
                                        ? "Chào mừng bạn đến Sa Đéc! Ngôn ngữ Tiếng Việt đã được tự động chọn."
                                        : "Language set to English. Switch to Vietnamese for the full Sa Đéc experience!"
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <motion.div
                            className={`absolute bottom-0 left-0 h-0.5 rounded-full ${isVietnamese ? "bg-yellow-400" : "bg-blue-400"}`}
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: 5, ease: "linear" }}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
