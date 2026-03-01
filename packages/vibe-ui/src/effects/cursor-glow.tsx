import { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { isSafari } from '../utils/browser-detect';

export function CursorGlow() {
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    const springConfig = { damping: 25, stiffness: 200 };
    const cursorXSpring = useSpring(cursorX, springConfig);
    const cursorYSpring = useSpring(cursorY, springConfig);

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            cursorX.set(e.clientX - 200);
            cursorY.set(e.clientY - 200);
        };

        window.addEventListener('mousemove', moveCursor);
        return () => window.removeEventListener('mousemove', moveCursor);
    }, [cursorX, cursorY]);

    if (isSafari()) return null;

    return (
        <motion.div
            className="pointer-events-none fixed inset-0 z-30"
            style={{
                background: 'radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(16, 185, 129, 0.1), transparent 80%)',
            }}
        >
            <motion.div
                className="w-[400px] h-[400px] rounded-full opacity-30"
                style={{
                    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
                    x: cursorXSpring,
                    y: cursorYSpring,
                    filter: 'blur(40px)',
                }}
            />
        </motion.div>
    );
}
