'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * MD3 Animated Grid - Staggered Children Animation
 * 
 * Makes dashboard cards animate in sequence for WOW effect
 */

interface MD3AnimatedGridProps {
    children: React.ReactNode;
    className?: string;
    /** Delay between each child animation (seconds) */
    staggerDelay?: number;
    /** Initial delay before first animation (seconds) */
    initialDelay?: number;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: {
        opacity: 0,
        y: 20,
        scale: 0.95,
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring" as const,
            stiffness: 400,
            damping: 25,
        },
    },
};

export function MD3AnimatedGrid({
    children,
    className = "",
    staggerDelay = 0.08,
    initialDelay = 0.1,
}: MD3AnimatedGridProps) {
    const customContainerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: staggerDelay,
                delayChildren: initialDelay,
            },
        },
    };

    return (
        <motion.div
            className={className}
            variants={customContainerVariants}
            initial="hidden"
            animate="visible"
        >
            {React.Children.map(children, (child, index) => {
                if (!React.isValidElement(child)) return null;
                return (
                    <motion.div key={index} variants={itemVariants}>
                        {child}
                    </motion.div>
                );
            })}
        </motion.div>
    );
}

/**
 * MD3 Animated Item - For individual animated elements
 */
export function MD3AnimatedItem({
    children,
    delay = 0,
    className = "",
}: {
    children: React.ReactNode;
    delay?: number;
    className?: string;
}) {
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
                delay,
            }}
        >
            {children}
        </motion.div>
    );
}

export default MD3AnimatedGrid;
