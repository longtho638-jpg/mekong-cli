import React from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';

// ===== BENTO GRID =====

export const BentoGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className = ''
}) => {
    return (
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto ${className}`}>
            {children}
        </div>
    );
};

// ===== BENTO CARD WITH SPOTLIGHT =====

export interface BentoCardProps {
    children: React.ReactNode;
    className?: string;
    colSpan?: 1 | 2 | 3;
    rowSpan?: 1 | 2;
    href?: string;
}

export const BentoCard: React.FC<BentoCardProps> = ({
    children,
    className = '',
    colSpan = 1,
    rowSpan = 1,
    href
}) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    const colClasses = {
        1: 'md:col-span-1',
        2: 'md:col-span-2',
        3: 'md:col-span-3'
    };

    const rowClasses = {
        1: 'row-span-1',
        2: 'row-span-2'
    };

    const Content = (
        <div
            className={`group relative border border-white/10 bg-zinc-900/50 overflow-hidden rounded-3xl ${colClasses[colSpan]} ${rowClasses[rowSpan]} ${className}`}
            onMouseMove={handleMouseMove}
            role="none"
        >
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(16, 185, 129, 0.1),
              transparent 80%
            )
          `
                }}
            />
            <div className="relative h-full">
                {children}
            </div>
        </div>
    );

    if (href) {
        return <a href={href} className="block h-full">{Content}</a>;
    }

    return Content;
};

// ===== GLOWING BADGE =====

export type AuraBadgeColor = 'cyan' | 'violet' | 'pink' | 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'teal' | 'indigo';

export const AuraBadge: React.FC<{ children: React.ReactNode; color?: AuraBadgeColor; className?: string }> = ({
    children,
    color = 'cyan',
    className = ''
}) => {
    const colors = {
        cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
        pink: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        teal: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
        indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    };

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${colors[color]} ${className}`}>
            <span className={`w-1.5 h-1.5 rounded-full bg-current mr-2 animate-pulse`} />
            {children}
        </span>
    );
};

// ===== GRID PATTERN BACKGROUND =====

export const GridPattern: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <div className={`absolute inset-0 -z-10 h-full w-full bg-zinc-950 bg-grid-pattern [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] ${className}`} />
    );
};
