'use client'
import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Particle {
    id: number
    x: number
    y: number
    color: string
    rotation: number
    size: number
}

const COLORS = ['#22d3ee', '#a855f7', '#ec4899', '#f472b6', '#34d399', '#fbbf24']

export function useConfetti() {
    const [particles, setParticles] = useState<Particle[]>([])
    const [isActive, setIsActive] = useState(false)

    const fire = useCallback((count = 50) => {
        const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
            id: Date.now() + i,
            x: 50 + (Math.random() - 0.5) * 20,
            y: 50,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            rotation: Math.random() * 360,
            size: 6 + Math.random() * 6,
        }))

        setParticles(newParticles)
        setIsActive(true)

        setTimeout(() => {
            setIsActive(false)
            setParticles([])
        }, 3000)
    }, [])

    return { particles, isActive, fire }
}

interface ConfettiProps {
    particles: Particle[]
    isActive: boolean
}

export default function Confetti({ particles, isActive }: ConfettiProps) {
    return (
        <AnimatePresence>
            {isActive && (
                <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
                    {particles.map((particle) => {
                        const endX = particle.x + (Math.random() - 0.5) * 80
                        const endY = particle.y + 60 + Math.random() * 40

                        return (
                            <motion.div
                                key={particle.id}
                                className="absolute"
                                style={{
                                    left: `${particle.x}%`,
                                    top: `${particle.y}%`,
                                    width: particle.size,
                                    height: particle.size,
                                    backgroundColor: particle.color,
                                    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                                }}
                                initial={{
                                    opacity: 1,
                                    scale: 0,
                                    rotate: 0,
                                }}
                                animate={{
                                    opacity: [1, 1, 0],
                                    scale: [0, 1, 1],
                                    x: `${(endX - particle.x) * 8}px`,
                                    y: `${(endY - particle.y) * 12}px`,
                                    rotate: particle.rotation + Math.random() * 720,
                                }}
                                exit={{ opacity: 0 }}
                                transition={{
                                    duration: 2 + Math.random(),
                                    ease: [0.25, 0.46, 0.45, 0.94],
                                }}
                            />
                        )
                    })}
                </div>
            )}
        </AnimatePresence>
    )
}

// Trigger button for celebrations
interface ConfettiButtonProps {
    children: React.ReactNode
    onClick?: () => void
    className?: string
}

export function ConfettiButton({ children, onClick, className = '' }: ConfettiButtonProps) {
    const { particles, isActive, fire } = useConfetti()

    const handleClick = () => {
        fire(60)
        onClick?.()
    }

    return (
        <>
            <Confetti particles={particles} isActive={isActive} />
            <motion.button
                onClick={handleClick}
                className={`
                    px-6 py-3 rounded-xl font-medium
                    bg-gradient-to-r from-cyan-500 to-purple-500
                    hover:from-cyan-400 hover:to-purple-400
                    text-white shadow-lg shadow-cyan-500/25
                    transition-all duration-300
                    ${className}
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {children}
            </motion.button>
        </>
    )
}
