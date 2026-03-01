import { motion } from 'framer-motion';

export interface StaggeredListProps {
    children: React.ReactNode[];
    className?: string;
    staggerDelay?: number;
}

export function StaggeredList({ children, className = '', staggerDelay = 0.1 }: StaggeredListProps) {
    return (
        <div className={className}>
            {children.map((child, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * staggerDelay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                    {child}
                </motion.div>
            ))}
        </div>
    );
}
