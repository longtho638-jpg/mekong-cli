'use client'
import { ReactNode, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    children: ReactNode
    title?: string
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
    showClose?: boolean
    closeOnOverlayClick?: boolean
    closeOnEsc?: boolean
    className?: string
}

export default function Modal({
    isOpen,
    onClose,
    children,
    title,
    size = 'md',
    showClose = true,
    closeOnOverlayClick = true,
    closeOnEsc = true,
    className = '',
}: ModalProps) {
    // Handle ESC key
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (closeOnEsc && e.key === 'Escape') {
                onClose()
            }
        },
        [closeOnEsc, onClose]
    )

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = ''
        }
    }, [isOpen, handleKeyDown])

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-2xl',
        full: 'max-w-[95vw] max-h-[95vh]',
    }

    if (typeof window === 'undefined') return null

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Overlay */}
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeOnOverlayClick ? onClose : undefined}
                    />

                    {/* Modal */}
                    <motion.div
                        className={`
                            relative w-full ${sizeClasses[size]}
                            bg-white/5 backdrop-blur-3xl
                            border border-white/10
                            rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)]
                            ${className}
                        `}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', duration: 0.4, bounce: 0.3 }}
                    >
                        {/* Header */}
                        {(title || showClose) && (
                            <div className="flex items-center justify-between px-8 py-6 border-b border-white/5">
                                {title && (
                                    <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent filter drop-shadow-sm">{title}</h2>
                                )}
                                {showClose && (
                                    <motion.button
                                        onClick={onClose}
                                        className="
                                            p-2 rounded-xl text-white/50
                                            hover:text-white hover:bg-white/10
                                            transition-colors duration-200
                                        "
                                        whileHover={{ scale: 1.1, rotate: 90 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        ✕
                                    </motion.button>
                                )}
                            </div>
                        )}

                        {/* Content */}
                        <div className="p-8 text-white/80">{children}</div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}

// Confirmation dialog variant
interface ConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: ReactNode
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
}: ConfirmModalProps) {
    const variantClasses = {
        danger: 'bg-red-500 hover:bg-red-400',
        warning: 'bg-orange-500 hover:bg-orange-400',
        info: 'bg-cyan-500 hover:bg-cyan-400',
    }

    const handleConfirm = () => {
        onConfirm()
        onClose()
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <div className="text-white/70 mb-6">{message}</div>
            <div className="flex gap-3 justify-end">
                <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                    {cancelText}
                </button>
                <motion.button
                    onClick={handleConfirm}
                    className={`px-4 py-2 rounded-lg text-white font-medium ${variantClasses[variant]} transition-colors`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {confirmText}
                </motion.button>
            </div>
        </Modal>
    )
}
