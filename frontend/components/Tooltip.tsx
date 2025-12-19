'use client'
import { useState, useRef, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TooltipProps {
    children: ReactNode
    content: ReactNode
    position?: 'top' | 'bottom' | 'left' | 'right'
    delay?: number
    className?: string
}

export default function Tooltip({
    children,
    content,
    position = 'top',
    delay = 200,
    className = '',
}: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const triggerRef = useRef<HTMLDivElement>(null)

    const showTooltip = () => {
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true)
        }, delay)
    }

    const hideTooltip = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        setIsVisible(false)
    }

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
        left: 'right-full top-1/2 -translate-y-1/2 mr-3',
        right: 'left-full top-1/2 -translate-y-1/2 ml-3',
    }

    // Updated to match glass border
    const arrowClasses = {
        top: 'top-[99%] left-1/2 -translate-x-1/2 border-t-white/10 border-l-transparent border-r-transparent border-b-transparent',
        bottom: 'bottom-[99%] left-1/2 -translate-x-1/2 border-b-white/10 border-l-transparent border-r-transparent border-t-transparent',
        left: 'left-[99%] top-1/2 -translate-y-1/2 border-l-white/10 border-t-transparent border-b-transparent border-r-transparent',
        right: 'right-[99%] top-1/2 -translate-y-1/2 border-r-white/10 border-t-transparent border-b-transparent border-l-transparent',
    }

    const motionVariants = {
        top: { initial: { opacity: 0, y: 10, scale: 0.9 }, animate: { opacity: 1, y: 0, scale: 1 } },
        bottom: { initial: { opacity: 0, y: -10, scale: 0.9 }, animate: { opacity: 1, y: 0, scale: 1 } },
        left: { initial: { opacity: 0, x: 10, scale: 0.9 }, animate: { opacity: 1, x: 0, scale: 1 } },
        right: { initial: { opacity: 0, x: -10, scale: 0.9 }, animate: { opacity: 1, x: 0, scale: 1 } },
    }

    return (
        <div
            ref={triggerRef}
            className={`relative inline-block ${className}`}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            onFocus={showTooltip}
            onBlur={hideTooltip}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        className={`
                            absolute z-[100] ${positionClasses[position]}
                            px-4 py-2.5 text-xs font-bold text-white
                            bg-black/60 backdrop-blur-xl
                            border border-white/10 rounded-xl
                            shadow-[0_4px_30px_rgba(0,0,0,0.5)]
                            whitespace-nowrap tracking-wide
                        `}
                        initial={motionVariants[position].initial}
                        animate={motionVariants[position].animate}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2, type: 'spring', bounce: 0.4 }}
                    >
                        {content}

                        {/* Inner Glass Glow */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

                        {/* Arrow */}
                        <div
                            className={`
                                absolute border-[6px] ${arrowClasses[position]}
                            `}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
