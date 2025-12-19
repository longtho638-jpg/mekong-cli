'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Toast types
type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
    id: string
    type: ToastType
    title: string
    message?: string
    duration?: number
}

interface ToastContextValue {
    toasts: Toast[]
    addToast: (toast: Omit<Toast, 'id'>) => void
    removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

// Toast styling per type
const TOAST_CONFIG: Record<ToastType, {
    containerClasses: string;
    icon: string;
    progressBarClasses: string;
    glowClasses: string;
}> = {
    success: {
        containerClasses: 'border-green-500/30 bg-green-500/10',
        progressBarClasses: 'bg-green-500',
        glowClasses: 'shadow-[0_0_20px_rgba(34,197,94,0.2)]',
        icon: '✅'
    },
    error: {
        containerClasses: 'border-red-500/30 bg-red-500/10',
        progressBarClasses: 'bg-red-500',
        glowClasses: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]',
        icon: '❌'
    },
    warning: {
        containerClasses: 'border-yellow-500/30 bg-yellow-500/10',
        progressBarClasses: 'bg-yellow-500',
        glowClasses: 'shadow-[0_0_20px_rgba(234,179,8,0.2)]',
        icon: '⚠️'
    },
    info: {
        containerClasses: 'border-cyan-500/30 bg-cyan-500/10',
        progressBarClasses: 'bg-cyan-500',
        glowClasses: 'shadow-[0_0_20px_rgba(6,182,212,0.2)]',
        icon: '💡'
    },
}

// Individual Toast component
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
    const config = TOAST_CONFIG[toast.type]
    const duration = toast.duration || 4000

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`
                relative overflow-hidden min-w-[320px] max-w-[400px] rounded-2xl border p-5 shadow-2xl backdrop-blur-xl ultra-glass
                ${config.containerClasses} ${config.glowClasses}
            `}
        >
            {/* Progress bar */}
            <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
                onAnimationComplete={onRemove}
                className={`absolute bottom-0 left-0 h-1 ${config.progressBarClasses}`}
            />

            <div className="flex gap-4 items-start">
                <span className="text-2xl filter drop-shadow-md">{config.icon}</span>
                <div className="flex-1">
                    <div className="font-bold text-white text-sm mb-1 tracking-wide">
                        {toast.title}
                    </div>
                    {toast.message && (
                        <div className="text-white/70 text-xs leading-relaxed font-medium">
                            {toast.message}
                        </div>
                    )}
                </div>
                <button
                    onClick={onRemove}
                    className="text-white/40 hover:text-white transition-colors text-xl leading-none p-1 -mt-1 -mr-2 rounded-full hover:bg-white/10"
                >
                    ×
                </button>
            </div>
        </motion.div>
    )
}

// Toast Provider
export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        setToasts(prev => [...prev, { ...toast, id }])
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-5 right-5 flex flex-col gap-3 z-[10000] pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map(toast => (
                        <div key={toast.id} className="pointer-events-auto">
                            <ToastItem
                                toast={toast}
                                onRemove={() => removeToast(toast.id)}
                            />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    )
}

// Hook to use toasts
export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}

// Shorthand helpers
export function useToastHelpers() {
    const { addToast } = useToast()

    return {
        success: (title: string, message?: string) => addToast({ type: 'success', title, message }),
        error: (title: string, message?: string) => addToast({ type: 'error', title, message }),
        warning: (title: string, message?: string) => addToast({ type: 'warning', title, message }),
        info: (title: string, message?: string) => addToast({ type: 'info', title, message }),
    }
}
