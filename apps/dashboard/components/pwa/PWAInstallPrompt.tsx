'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [showPrompt, setShowPrompt] = useState(false)
    const [isInstalled, setIsInstalled] = useState(false)

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true)
            return
        }

        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e as BeforeInstallPromptEvent)
            // Show prompt after 5 seconds
            setTimeout(() => setShowPrompt(true), 5000)
        }

        window.addEventListener('beforeinstallprompt', handler)
        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return

        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            setIsInstalled(true)
        }
        setDeferredPrompt(null)
        setShowPrompt(false)
    }

    const handleDismiss = () => {
        setShowPrompt(false)
        // Don't show again this session
        sessionStorage.setItem('pwa-prompt-dismissed', 'true')
    }

    if (isInstalled || !showPrompt) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50"
            >
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900/90 to-neutral-900/90 border border-purple-500/30 backdrop-blur-xl shadow-2xl">
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
                            <span className="text-2xl">🚀</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-white">Install AgencyOS</h3>
                            <p className="text-sm text-neutral-300 mt-1">
                                Get the app for faster access and offline support
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={handleDismiss}
                            className="flex-1 px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
                        >
                            Not now
                        </button>
                        <button
                            onClick={handleInstall}
                            className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors font-medium"
                        >
                            Install
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
