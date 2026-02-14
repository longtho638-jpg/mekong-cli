"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Share, PlusSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PWAInstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false)
    const [isIOS, setIsIOS] = useState(false)

    useEffect(() => {
        // Check if iOS
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsIOS(isIosDevice)

        // Check if already installed (standalone mode)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone

        if (!isStandalone) {
            // Show prompt after 3 seconds
            const timer = setTimeout(() => {
                setShowPrompt(true)
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [])

    if (!showPrompt) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-4 left-4 right-4 z-50 md:hidden"
            >
                <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl p-4 border border-stone-200 dark:border-stone-800 relative">
                    <button
                        onClick={() => setShowPrompt(false)}
                        className="absolute top-2 right-2 text-stone-400 hover:text-stone-600"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex gap-4 items-center mb-4">
                        <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            FH
                        </div>
                        <div>
                            <h3 className="font-bold text-stone-900 dark:text-white">Cài đặt App Flower Hunt</h3>
                            <p className="text-xs text-stone-500 dark:text-stone-400">Trải nghiệm mượt mà hơn, không cần tải lại.</p>
                        </div>
                    </div>

                    {isIOS ? (
                        <div className="space-y-2 text-sm text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-800 p-3 rounded-xl">
                            <p className="flex items-center gap-2">
                                1. Nhấn vào nút <Share className="w-4 h-4" /> bên dưới trình duyệt.
                            </p>
                            <p className="flex items-center gap-2">
                                2. Chọn <PlusSquare className="w-4 h-4" /> <strong>Thêm vào MH chính</strong>.
                            </p>
                        </div>
                    ) : (
                        <Button className="w-full bg-green-600 hover:bg-green-500 text-white font-bold">
                            Cài Đặt Ngay
                        </Button>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
