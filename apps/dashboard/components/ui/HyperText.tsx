'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface HyperTextProps {
    text: string;
    duration?: number;
    className?: string;
    animateOnHover?: boolean;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';

export function HyperText({ text, duration = 800, className = '', animateOnHover = true }: HyperTextProps) {
    const [displayText, setDisplayText] = useState(text);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const iterations = useRef(0);
    const [isHovered, setIsHovered] = useState(false);

    const triggerAnimation = useCallback(() => {
        iterations.current = 0;
        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            setDisplayText((_) =>
                text
                    .split('')
                    .map((char, index) => {
                        if (index < iterations.current) {
                            return text[index];
                        }
                        return CHARS[Math.floor(Math.random() * CHARS.length)];
                    })
                    .join('')
            );

            if (iterations.current >= text.length) {
                if (intervalRef.current) clearInterval(intervalRef.current);
            }

            iterations.current += 1 / 3; // Adjust speed here
        }, duration / (text.length * 2));
    }, [text, duration]);

    useEffect(() => {
        triggerAnimation();
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [text, triggerAnimation]);

    const handleMouseEnter = () => {
        if (animateOnHover && !isHovered) {
            setIsHovered(true);
            triggerAnimation();
            setTimeout(() => setIsHovered(false), duration);
        }
    };

    return (
        <span
            className={`inline-block font-medium ${className}`}
            onMouseEnter={handleMouseEnter}
        >
            {displayText}
        </span>
    );
}
