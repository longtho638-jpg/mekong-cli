'use client'
import { motion } from 'framer-motion'

interface SkeletonProps {
    className?: string
    variant?: 'text' | 'circular' | 'rectangular' | 'card'
    width?: string | number
    height?: string | number
    lines?: number
}

export default function Skeleton({
    className = '',
    variant = 'rectangular',
    width,
    height,
    lines = 1,
}: SkeletonProps) {
    const baseClasses = 'bg-white/5 overflow-hidden relative'

    const shimmer = {
        initial: { x: '-100%' },
        animate: {
            x: '100%',
            transition: {
                repeat: Infinity,
                duration: 1.5,
                ease: "linear" as const,
            },
        },
    }

    const getVariantClasses = () => {
        switch (variant) {
            case 'text':
                return 'h-4 rounded-md'
            case 'circular':
                return 'rounded-full'
            case 'card':
                return 'rounded-2xl'
            case 'rectangular':
            default:
                return 'rounded-xl'
        }
    }

    const style: React.CSSProperties = {
        width: width || '100%',
        height: height || (variant === 'text' ? '1rem' : variant === 'circular' ? '40px' : '100px'),
    }

    if (variant === 'circular') {
        style.width = style.height
    }

    if (lines > 1 && variant === 'text') {
        return (
            <div className={`space-y-2.5 ${className}`}>
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={`${baseClasses} ${getVariantClasses()}`}
                        style={{
                            ...style,
                            width: i === lines - 1 ? '70%' : '100%',
                        }}
                    >
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                            variants={shimmer}
                            initial="initial"
                            animate="animate"
                        />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div
            className={`${baseClasses} ${getVariantClasses()} ${className}`}
            style={style}
        >
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                variants={shimmer}
                initial="initial"
                animate="animate"
            />
        </div>
    )
}

// Pre-built skeleton layouts for common patterns
export function HubCardSkeleton() {
    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/10">
            <div className="flex items-center gap-4 mb-4">
                <Skeleton variant="circular" width={48} height={48} className="bg-white/10" />
                <div className="flex-1">
                    <Skeleton variant="text" width="60%" className="mb-2.5 bg-white/10" />
                    <Skeleton variant="text" width="40%" height="0.75rem" className="bg-white/5" />
                </div>
            </div>
            <Skeleton variant="text" lines={3} className="mb-5 opacity-70" />
            <div className="flex gap-2.5">
                <Skeleton variant="rectangular" width={80} height={32} className="rounded-full bg-white/10" />
                <Skeleton variant="rectangular" width={80} height={32} className="rounded-full bg-white/10" />
            </div>
        </div>
    )
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
    return (
        <div className="flex items-center gap-4 py-4 border-b border-white/5">
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton
                    key={i}
                    variant="text"
                    width={i === 0 ? '30%' : `${20 + Math.random() * 10}%`}
                />
            ))}
        </div>
    )
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <Skeleton variant="text" width={200} height={32} />
                <Skeleton variant="rectangular" width={120} height={40} className="rounded-lg" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4">
                        <Skeleton variant="text" width="50%" className="mb-2" />
                        <Skeleton variant="text" width="70%" height={28} />
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-xl p-6">
                    <Skeleton variant="text" width={150} className="mb-4" />
                    <Skeleton variant="rectangular" height={200} />
                </div>
                <div className="bg-white/5 rounded-xl p-6">
                    <Skeleton variant="text" width={150} className="mb-4" />
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <TableRowSkeleton key={i} columns={3} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
