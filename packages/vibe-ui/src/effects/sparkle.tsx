import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Sparkle {
    id: number;
    x: number;
    y: number;
    size: number;
    delay: number;
}

export function SparkleEffect({ count = 20 }: { count?: number }) {
    const [sparkles, setSparkles] = useState<Sparkle[]>([]);

    useEffect(() => {
        setSparkles(Array.from({ length: count }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 4 + 2,
            delay: Math.random() * 2,
        })));
    }, [count]);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {sparkles.map((sparkle) => (
                <motion.div
                    key={sparkle.id}
                    className="absolute rounded-full bg-white"
                    style={{ left: `${sparkle.x}%`, top: `${sparkle.y}%`, width: sparkle.size, height: sparkle.size }}
                    animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
                    transition={{ duration: 2, delay: sparkle.delay, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}
        </div>
    );
}
