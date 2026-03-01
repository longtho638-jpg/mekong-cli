import { motion } from 'framer-motion';

export interface MarqueeProps {
    children: React.ReactNode;
    speed?: number;
    direction?: 'left' | 'right';
    className?: string;
}

export function Marquee({ children, speed = 20, direction = 'left', className = '' }: MarqueeProps) {
    return (
        <div className={`overflow-hidden ${className}`}>
            <motion.div
                className="flex gap-8 whitespace-nowrap"
                animate={{ x: direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'] }}
                transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
            >
                {children}
                {children}
            </motion.div>
        </div>
    );
}
