'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false)
    const [isHovered, setIsHovered] = useState(false)

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true)
            } else {
                setIsVisible(false)
            }
        }

        window.addEventListener('scroll', toggleVisibility)
        return () => window.removeEventListener('scroll', toggleVisibility)
    }, [])

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={scrollToTop}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: '2rem',
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        border: '1px solid rgba(0, 255, 255, 0.4)',
                        background: isHovered
                            ? 'rgba(0, 255, 255, 0.2)'
                            : 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(12px)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        color: '#0ff',
                        boxShadow: isHovered
                            ? '0 0 30px rgba(0, 255, 255, 0.5), 0 0 60px rgba(0, 255, 255, 0.3)'
                            : '0 4px 20px rgba(0, 0, 0, 0.4)',
                        zIndex: 1000,
                        transition: 'background 0.3s, box-shadow 0.3s',
                    }}
                    aria-label="Scroll to top"
                >
                    <motion.span
                        animate={{ y: isHovered ? -3 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        ↑
                    </motion.span>
                </motion.button>
            )}
        </AnimatePresence>
    )
}
