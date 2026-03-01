import { motion } from 'framer-motion';

export interface GradientTextProps {
    children: string;
    className?: string;
    colors?: string[];
}

export function GradientText({
    children,
    className = '',
    colors = ['#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#10b981']
}: GradientTextProps) {
    return (
        <motion.span
            className={`inline-block bg-clip-text text-transparent ${className}`}
            style={{
                backgroundImage: `linear-gradient(90deg, ${colors.join(', ')})`,
                backgroundSize: '200% 100%',
            }}
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        >
            {children}
        </motion.span>
    );
}
