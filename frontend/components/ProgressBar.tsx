'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname, useSearchParams } from 'next/navigation'

export default function ProgressBar() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = useState(false)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        // Start loading animation
        setIsLoading(true)
        setProgress(0)

        // Simulate progress
        const timer1 = setTimeout(() => setProgress(30), 50)
        const timer2 = setTimeout(() => setProgress(60), 200)
        const timer3 = setTimeout(() => setProgress(80), 400)
        const timer4 = setTimeout(() => {
            setProgress(100)
            setTimeout(() => setIsLoading(false), 200)
        }, 500)

        return () => {
            clearTimeout(timer1)
            clearTimeout(timer2)
            clearTimeout(timer3)
            clearTimeout(timer4)
        }
    }, [pathname, searchParams])

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        zIndex: 10000,
                        background: 'rgba(0, 0, 0, 0.3)',
                        overflow: 'hidden',
                    }}
                >
                    {/* Progress bar */}
                    <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: `${progress}%` }}
                        transition={{
                            duration: progress === 100 ? 0.1 : 0.3,
                            ease: 'easeOut'
                        }}
                        style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, #00ffff, #00ff88, #00ffff)',
                            boxShadow: '0 0 20px rgba(0, 255, 255, 0.8), 0 0 40px rgba(0, 255, 255, 0.4)',
                            borderRadius: '0 2px 2px 0',
                        }}
                    />

                    {/* Shimmer effect */}
                    <motion.div
                        animate={{
                            x: ['-100%', '200%'],
                        }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '30%',
                            height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    )
}
