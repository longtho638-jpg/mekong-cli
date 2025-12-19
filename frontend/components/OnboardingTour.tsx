'use client'
import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Tour Step Definition
interface TourStep {
    id: string
    title: string
    description: string
    target?: string // CSS selector for spotlight
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
    action?: string
}

const TOUR_STEPS: TourStep[] = [
    {
        id: 'welcome',
        title: '🏯 Chào mừng đến Agency OS!',
        description: 'Nền tảng quản lý agency thông minh với 33 department hubs. Hãy cùng khám phá các tính năng chính!',
        position: 'center',
    },
    {
        id: 'quicknav',
        title: '🧭 Quick Navigation',
        description: 'Click vào nút 🏯 bên trái để mở sidebar điều hướng nhanh đến bất kỳ hub nào.',
        position: 'right',
        action: 'Click nút 🏯',
    },
    {
        id: 'favorites',
        title: '⭐ Pin Favorites',
        description: 'Click ☆ bên cạnh hub để pin vào favorites. Favorites xuất hiện ở đầu sidebar với màu vàng gold!',
        position: 'right',
    },
    {
        id: 'command',
        title: '⌨️ Command Palette',
        description: 'Nhấn Cmd+K (Mac) hoặc Ctrl+K (Windows) để mở Command Palette và tìm kiếm nhanh.',
        position: 'center',
        action: 'Thử Cmd+K ngay!',
    },
    {
        id: 'theme',
        title: '🌙 Light/Dark Mode',
        description: 'Toggle giữa Dark và Light mode bằng nút ở góc dưới bên trái.',
        position: 'left',
    },
    {
        id: 'warroom',
        title: '🏯 War Room',
        description: 'Trung tâm chỉ huy với metrics real-time. Mọi thứ đã sẵn sàng. WIN-WIN-WIN!',
        position: 'center',
    },
]

const STORAGE_KEY = 'agencyos-tour-completed'

// Context
interface TourContextType {
    isActive: boolean
    currentStep: number
    totalSteps: number
    step: TourStep | null
    startTour: () => void
    nextStep: () => void
    prevStep: () => void
    skipTour: () => void
    completeTour: () => void
    hasCompletedTour: boolean
}

const TourContext = createContext<TourContextType | null>(null)

export function useTour() {
    const context = useContext(TourContext)
    if (!context) {
        throw new Error('useTour must be used within TourProvider')
    }
    return context
}

// Provider Component
export function TourProvider({ children }: { children: ReactNode }) {
    const [isActive, setIsActive] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [hasCompletedTour, setHasCompletedTour] = useState(true) // Default true to prevent flash

    useEffect(() => {
        const completed = localStorage.getItem(STORAGE_KEY)
        setHasCompletedTour(completed === 'true')

        // Auto-start tour for new users after a short delay
        if (completed !== 'true') {
            const timer = setTimeout(() => setIsActive(true), 1500)
            return () => clearTimeout(timer)
        }
    }, [])

    const startTour = useCallback(() => {
        setCurrentStep(0)
        setIsActive(true)
    }, [])

    const nextStep = useCallback(() => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1)
        } else {
            completeTour()
        }
    }, [currentStep])

    const prevStep = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1)
        }
    }, [currentStep])

    const skipTour = useCallback(() => {
        setIsActive(false)
        localStorage.setItem(STORAGE_KEY, 'true')
        setHasCompletedTour(true)
    }, [])

    const completeTour = useCallback(() => {
        setIsActive(false)
        localStorage.setItem(STORAGE_KEY, 'true')
        setHasCompletedTour(true)
    }, [])

    const step = isActive ? TOUR_STEPS[currentStep] : null

    return (
        <TourContext.Provider value={{
            isActive,
            currentStep,
            totalSteps: TOUR_STEPS.length,
            step,
            startTour,
            nextStep,
            prevStep,
            skipTour,
            completeTour,
            hasCompletedTour,
        }}>
            {children}
            <TourOverlay />
        </TourContext.Provider>
    )
}

// Tour Overlay Component
function TourOverlay() {
    const { isActive, step, currentStep, totalSteps, nextStep, prevStep, skipTour } = useTour()

    if (!isActive || !step) return null

    const getCardPosition = () => {
        switch (step.position) {
            case 'center':
                return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
            case 'left':
                return { top: '50%', left: '100px', transform: 'translateY(-50%)' }
            case 'right':
                return { top: '50%', right: '100px', transform: 'translateY(-50%)' }
            case 'top':
                return { top: '100px', left: '50%', transform: 'translateX(-50%)' }
            case 'bottom':
                return { bottom: '100px', left: '50%', transform: 'translateX(-50%)' }
            default:
                return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm"
            >
                {/* Animated particles background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: '100vh' }}
                            animate={{
                                opacity: [0, 0.5, 0],
                                y: [100 + Math.random() * 200, -100],
                                x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
                            }}
                            transition={{
                                duration: 5 + Math.random() * 5,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                            }}
                            className="absolute w-1 h-1 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                        />
                    ))}
                </div>

                {/* Step Card */}
                <motion.div
                    key={step.id}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ type: 'spring', damping: 25 }}
                    style={getCardPosition()}
                    className="fixed w-[420px] max-w-[90vw] p-8 rounded-2xl ultra-glass border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-[#0a0a0f]/90"
                >
                    {/* Progress dots */}
                    <div className="flex justify-center gap-2 mb-6">
                        {[...Array(totalSteps)].map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{
                                    scale: i === currentStep ? 1.3 : 1,
                                    backgroundColor: i === currentStep ? '#ef4444' : i < currentStep ? '#22c55e' : '#333',
                                }}
                                className="w-2.5 h-2.5 rounded-full cursor-pointer transition-colors duration-300"
                            />
                        ))}
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-white mb-4 text-center tracking-tight">
                        {step.title}
                    </h2>

                    {/* Description */}
                    <p className="text-base text-gray-300 leading-relaxed text-center mb-6">
                        {step.description}
                    </p>

                    {/* Action hint */}
                    {step.action && (
                        <motion.p
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-sm text-yellow-400 text-center mb-6 font-medium bg-yellow-400/10 py-2 rounded-lg border border-yellow-400/20"
                        >
                            💡 {step.action}
                        </motion.p>
                    )}

                    {/* Buttons */}
                    <div className="flex justify-between items-center pt-2">
                        <button
                            onClick={skipTour}
                            className="text-white/40 hover:text-white text-sm transition-colors font-medium px-2 py-1"
                        >
                            Skip Tour
                        </button>

                        <div className="flex gap-3">
                            {currentStep > 0 && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={prevStep}
                                    className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all text-sm font-medium"
                                >
                                    ← Back
                                </motion.button>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={nextStep}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all text-sm"
                            >
                                {currentStep === totalSteps - 1 ? '🏯 Bắt đầu!' : 'Next →'}
                            </motion.button>
                        </div>
                    </div>

                    {/* Step counter */}
                    <p className="text-center mt-6 text-xs text-white/30 font-mono tracking-widest uppercase">
                        Step {currentStep + 1} of {totalSteps}
                    </p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

// Restart Tour Button (for Settings page)
export function RestartTourButton() {
    const { startTour, hasCompletedTour } = useTour()

    if (!hasCompletedTour) return null

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startTour}
            className="px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-2 font-medium shadow-sm hover:shadow-md hover:shadow-red-500/20"
        >
            🎬 Restart Onboarding Tour
        </motion.button>
    )
}
