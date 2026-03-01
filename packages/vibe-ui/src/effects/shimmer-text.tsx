import { motion } from 'framer-motion';

export interface ShimmerTextProps {
    children: string;
    className?: string;
}

export function ShimmerText({ children, className = '' }: ShimmerTextProps) {
    return (
        <span className={`relative inline-block ${className}`}>
            <span className="relative z-10">{children}</span>
            <motion.span
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
                style={{
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black, transparent)',
                    maskImage: 'linear-gradient(to right, transparent, black, transparent)',
                }}
            />
        </span>
    );
}
