"use client";
import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

export const KineticText = ({
    text,
    className,
}: {
    text: string;
    className?: string;
}) => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });

    const springConfig = { stiffness: 100, damping: 30, bounce: 0 };
    const translateX = useSpring(
        useTransform(scrollYProgress, [0, 1], [0, 100]),
        springConfig
    );

    const opacity = useSpring(
        useTransform(scrollYProgress, [0, 0.2, 0.9, 1], [1, 1, 1, 0]),
        springConfig
    );

    return (
        <div ref={ref} className={className}>
            <motion.h1
                style={{ x: translateX, opacity }}
                className="text-5xl md:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-emerald-200 via-white to-emerald-400 pb-2 font-mono"
            >
                {text}
            </motion.h1>
        </div>
    );
};

export const TypewriterEffect = ({
    words,
}: {
    words: {
        text: string;
        className?: string;
    }[];
}) => {
    // Split words into characters
    const wordsArray = words.map((word) => {
        return {
            ...word,
            text: word.text.split(""),
        };
    });

    const renderWords = () => {
        return (
            <motion.div initial="hidden" animate="visible" className="inline">
                {wordsArray.map((word, idx) => {
                    return (
                        <div key={`word-${idx}`} className="inline-block mr-4 last:mr-0">
                            {word.text.map((char, index) => (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    key={`char-${index}`}
                                    variants={{
                                        hidden: { opacity: 0, y: 10 },
                                        visible: {
                                            opacity: 1,
                                            y: 0,
                                            transition: {
                                                duration: 0.1,
                                            },
                                        },
                                    }}
                                    className={word.className}
                                >
                                    {char}
                                </motion.span>
                            ))}
                        </div>
                    );
                })}
            </motion.div>
        );
    };

    return (
        <div className={("text-base sm:text-x md:text-3xl lg:text-5xl font-bold text-center")}>
            <motion.div
                className="overflow-hidden pb-2"
                initial={{
                    width: "0%",
                }}
                whileInView={{
                    width: "fit-content",
                }}
                transition={{
                    duration: 2,
                    ease: "linear",
                    delay: 0.5,
                }}
            >
                {renderWords()}
            </motion.div>
        </div>
    );
};
