import { motion } from 'framer-motion';
import { isSafari } from '../utils/browser-detect';

export function MorphingBlob({ className = '' }: { className?: string }) {
    if (isSafari()) {
        return <div className={`absolute rounded-full opacity-20 ${className}`} />;
    }

    return (
        <motion.div
            className={`absolute rounded-full blur-3xl opacity-30 ${className}`}
            animate={{
                borderRadius: [
                    '60% 40% 30% 70%/60% 30% 70% 40%',
                    '30% 60% 70% 40%/50% 60% 30% 60%',
                    '60% 40% 30% 70%/60% 30% 70% 40%',
                ],
                scale: [1, 1.1, 1],
                rotate: [0, 180, 360],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
    );
}
