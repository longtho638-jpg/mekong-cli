import { motion } from 'framer-motion';

export function PulseRing({ className = '' }: { className?: string }) {
    return (
        <div className={`relative ${className}`}>
            {[0, 0.5, 1].map((delay) => (
                <motion.div
                    key={delay}
                    className="absolute inset-0 rounded-full border-2 border-emerald-500/50"
                    animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0.25, 0] }}
                    transition={{ duration: 2, delay, repeat: Infinity, ease: 'easeOut' }}
                />
            ))}
        </div>
    );
}
