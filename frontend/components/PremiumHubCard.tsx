'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'

interface HubCardProps {
    id: string
    name: string
    icon: string
    path: string
    description: string
    color: string
    stats: { label: string; value: string }[]
    index: number
}

export default function PremiumHubCard({
    name,
    icon,
    path,
    description,
    color,
    stats,
    index,
}: HubCardProps) {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <Link href={path} className="block no-underline">
            <motion.div
                className="premium-card relative overflow-hidden rounded-3xl p-6 h-[180px] group border border-white/10"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                    delay: index * 0.05,
                    type: 'spring',
                    stiffness: 200,
                    damping: 20,
                }}
                whileHover={{
                    scale: 1.03,
                    y: -8,
                }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                style={{
                    boxShadow: isHovered
                        ? `0 0 20px ${color}40, inset 0 0 20px ${color}20`
                        : 'none',
                    borderColor: isHovered ? `${color}80` : undefined,
                }}
            >
                {/* Dynamic Ambient Glow Background */}
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                    style={{ background: `radial-gradient(circle at top right, ${color}15, transparent 70%)` }}
                />

                {/* Shimmer Effect */}
                <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                {/* Top glow bar using CSS variable for color could be better, but inline style works for dynamic color */}
                <motion.div
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    animate={{
                        scaleX: isHovered ? 1 : 0.3,
                        opacity: isHovered ? 1 : 0.5,
                    }}
                    transition={{ duration: 0.3 }}
                    style={{
                        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                    }}
                />

                {/* Icon with pulse */}
                <div className="flex items-start gap-4 mb-4 relative z-10">
                    <motion.div
                        animate={{
                            scale: isHovered ? [1, 1.1, 1] : 1,
                            rotate: isHovered ? [0, -5, 5, 0] : 0,
                        }}
                        transition={{
                            duration: 0.5,
                            repeat: isHovered ? Infinity : 0,
                            repeatDelay: 1,
                        }}
                        className="text-5xl leading-none filter drop-shadow-md"
                        style={{
                            filter: isHovered ? `drop-shadow(0 0 15px ${color})` : 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
                        }}
                    >
                        {icon}
                    </motion.div>
                    <div className="flex-1">
                        <motion.h3
                            className="text-xl font-black mb-1 tracking-wide"
                            animate={{ color: isHovered ? color : '#fff' }}
                        >
                            {name}
                        </motion.h3>
                        <p className="text-xs text-white/60 leading-relaxed line-clamp-2">
                            {description}
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 relative z-10 mt-auto">
                    {stats.map((stat, j) => (
                        <motion.div
                            key={j}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 + j * 0.1 }}
                        >
                            <motion.p
                                className="text-2xl font-black tabular-nums"
                                animate={{
                                    color: isHovered ? color : '#fff',
                                }}
                            >
                                {stat.value}
                            </motion.p>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                                {stat.label}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* Hover indicator */}
                <motion.div
                    className="absolute right-4 bottom-4 text-2xl"
                    animate={{
                        opacity: isHovered ? 1 : 0,
                        x: isHovered ? 0 : -10,
                    }}
                    style={{ color }}
                >
                    →
                </motion.div>
            </motion.div>
        </Link>
    )
}
