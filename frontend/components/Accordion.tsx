'use client'
import { useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AccordionItem {
    id: string
    title: string
    content: ReactNode
    icon?: string
}

interface AccordionProps {
    items: AccordionItem[]
    allowMultiple?: boolean
    className?: string
    variant?: 'default' | 'card' | 'minimal'
}

export default function Accordion({
    items,
    allowMultiple = false,
    className = '',
    variant = 'default',
}: AccordionProps) {
    const [openIds, setOpenIds] = useState<string[]>([])

    const toggleItem = (id: string) => {
        if (allowMultiple) {
            setOpenIds((prev) =>
                prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
            )
        } else {
            setOpenIds((prev) => (prev.includes(id) ? [] : [id]))
        }
    }

    const variantClasses = {
        default: 'border border-white/10 rounded-3xl overflow-hidden',
        card: 'space-y-4',
        minimal: 'divide-y divide-white/10',
    }

    const itemClasses = {
        default: 'border-b border-white/10 last:border-b-0 bg-white/5 backdrop-blur-xl',
        card: `
            bg-white/5 backdrop-blur-2xl
            border border-white/10 rounded-3xl
            transition-all duration-500
            hover:border-cyan-500/30 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]
        `,
        minimal: '',
    }

    return (
        <div className={`${variantClasses[variant]} ${className}`}>
            {items.map((item) => {
                const isOpen = openIds.includes(item.id)

                return (
                    <motion.div
                        key={item.id}
                        className={`
                            ${itemClasses[variant]}
                            ${isOpen && variant === 'card' ? 'border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.2)] bg-white/10' : ''}
                        `}
                        initial={false}
                        animate={isOpen && variant === 'card' ? { scale: 1.01 } : { scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Header */}
                        <motion.button
                            onClick={() => toggleItem(item.id)}
                            className={`
                                w-full flex items-center justify-between p-6
                                text-left transition-all duration-300
                                ${isOpen ? 'text-white' : 'text-white/60 hover:text-white'}
                                ${variant === 'default' && isOpen ? 'bg-white/5' : ''}
                            `}
                        >
                            <span className="flex items-center gap-5">
                                {item.icon && (
                                    <span className={`text-3xl filter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] duration-300 ${isOpen ? 'scale-110' : 'grayscale opacity-70'}`}>
                                        {item.icon}
                                    </span>
                                )}
                                <span className={`font-bold text-lg md:text-xl tracking-wide transition-all duration-300 ${isOpen ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300' : ''}`}>
                                    {item.title}
                                </span>
                            </span>
                            <motion.div
                                className={`
                                    w-10 h-10 rounded-full flex items-center justify-center
                                    border border-white/10
                                    ${isOpen ? 'bg-white/20 text-white border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-white/5 text-white/50'}
                                `}
                                animate={{ rotate: isOpen ? 180 : 0 }}
                                transition={{ duration: 0.4, type: 'spring' }}
                                whileHover={{ scale: 1.1 }}
                            >
                                <span className="text-[10px] font-black">▼</span>
                            </motion.div>
                        </motion.button>

                        {/* Content */}
                        <AnimatePresence initial={false}>
                            {isOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-6 pt-2 text-white/70 leading-relaxed border-t border-white/5">
                                        <div className="bg-white/5 rounded-2xl p-6">
                                            {item.content}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )
            })}
        </div>
    )
}

// Single collapsible component
interface CollapsibleProps {
    title: string
    children: ReactNode
    defaultOpen?: boolean
    icon?: string
    className?: string
}

export function Collapsible({
    title,
    children,
    defaultOpen = false,
    icon,
    className = '',
}: CollapsibleProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div className={`
            border border-white/10 rounded-2xl overflow-hidden
            bg-white/5 backdrop-blur-xl transition-all duration-300
            ${isOpen ? 'border-cyan-500/30' : 'hover:border-white/20'}
            ${className}
        `}>
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full flex items-center justify-between p-4
                    text-left transition-colors duration-200
                    hover:bg-white/5
                    ${isOpen ? 'bg-white/5' : ''}
                `}
                whileTap={{ scale: 0.99 }}
            >
                <span className="flex items-center gap-3">
                    {icon && <span className="text-xl filter drop-shadow-sm">{icon}</span>}
                    <span className={`font-bold transition-colors ${isOpen ? 'text-white' : 'text-white/70'}`}>
                        {title}
                    </span>
                </span>
                <motion.span
                    className={`text-white/60 ${isOpen ? 'text-cyan-400' : ''}`}
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    ▼
                </motion.span>
            </motion.button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-0 text-white/70">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
