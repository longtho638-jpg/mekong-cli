import { motion } from 'framer-motion';

export interface AnimatedBorderProps {
    children: React.ReactNode;
    className?: string;
}

export function AnimatedBorder({ children, className = '' }: AnimatedBorderProps) {
    return (
        <div className={`relative p-[2px] rounded-3xl overflow-hidden ${className}`}>
            <motion.div
                className="absolute inset-0"
                style={{ background: 'conic-gradient(from 0deg, #10b981, #06b6d4, #8b5cf6, #ec4899, #10b981)' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
            <div className="relative bg-zinc-900 rounded-3xl">{children}</div>
        </div>
    );
}
