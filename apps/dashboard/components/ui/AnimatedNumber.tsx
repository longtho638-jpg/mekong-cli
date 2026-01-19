'use client';

import React, { useState, useEffect, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// ✨ ANIMATED NUMBER - WOW Counting Animation Component
// Premium number counter with easing for KPI cards
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    className?: string;
    style?: React.CSSProperties;
    formatFn?: (num: number) => string;
}

export function AnimatedNumber({
    value,
    duration = 1000,
    prefix = '',
    suffix = '',
    decimals = 0,
    className,
    style,
    formatFn,
}: AnimatedNumberProps) {
    const [displayValue, setDisplayValue] = useState(0);
    const previousValue = useRef(0);
    const animationRef = useRef<number>(0);

    useEffect(() => {
        const startValue = previousValue.current;
        const endValue = value;
        const startTime = performance.now();

        // Easing function: easeOutExpo for smooth WOW effect
        const easeOutExpo = (t: number): number => {
            return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        };

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutExpo(progress);

            const currentValue = startValue + (endValue - startValue) * easedProgress;
            setDisplayValue(currentValue);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                previousValue.current = endValue;
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [value, duration]);

    const formattedValue = formatFn
        ? formatFn(displayValue)
        : displayValue.toFixed(decimals);

    return (
        <span
            className={className}
            style={{
                ...style,
                transition: 'transform 0.3s ease, color 0.3s ease',
            }}
        >
            {prefix}{formattedValue}{suffix}
        </span>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💰 ANIMATED CURRENCY - Special formatter for money values
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedCurrencyProps {
    value: number;
    duration?: number;
    className?: string;
    style?: React.CSSProperties;
}

export function AnimatedCurrency({
    value,
    duration = 1200,
    className,
    style,
}: AnimatedCurrencyProps) {
    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
        return `$${amount.toFixed(0)}`;
    };

    return (
        <AnimatedNumber
            value={value}
            duration={duration}
            formatFn={formatCurrency}
            className={className}
            style={style}
        />
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 ANIMATED PERCENT - Percentage with smooth transition
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedPercentProps {
    value: number;
    duration?: number;
    className?: string;
    style?: React.CSSProperties;
    decimals?: number;
}

export function AnimatedPercent({
    value,
    duration = 1000,
    decimals = 1,
    className,
    style,
}: AnimatedPercentProps) {
    return (
        <AnimatedNumber
            value={value}
            duration={duration}
            suffix="%"
            decimals={decimals}
            className={className}
            style={style}
        />
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 PULSE INDICATOR - Glowing pulse for live data
// ═══════════════════════════════════════════════════════════════════════════════

interface PulseIndicatorProps {
    color?: string;
    size?: number;
}

export function PulseIndicator({ color = '#22c55e', size = 8 }: PulseIndicatorProps) {
    return (
        <span
            style={{
                display: 'inline-block',
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: color,
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
        >
            <style jsx>{`
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                        box-shadow: 0 0 0 0 ${color}40;
                    }
                    50% {
                        opacity: 0.7;
                        box-shadow: 0 0 0 ${size}px ${color}00;
                    }
                }
            `}</style>
        </span>
    );
}

export default AnimatedNumber;
