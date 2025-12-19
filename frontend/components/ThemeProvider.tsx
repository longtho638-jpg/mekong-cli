'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Theme = 'dark' | 'light'

interface ThemeContextType {
    theme: Theme
    toggleTheme: () => void
    setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) throw new Error('useTheme must be used within ThemeProvider')
    return context
}

// CSS Variables for themes
const THEMES = {
    dark: {
        '--bg-primary': '#0a0a0f',
        '--bg-secondary': '#12121a',
        '--bg-card': 'rgba(255, 255, 255, 0.03)',
        '--text-primary': '#ffffff',
        '--text-secondary': '#888888',
        '--text-muted': '#666666',
        '--border-color': 'rgba(255, 255, 255, 0.1)',
        '--accent-primary': '#00bfff',
        '--accent-success': '#00ff41',
        '--accent-warning': '#ffd700',
        '--accent-danger': '#ff4444',
        '--glow-primary': 'rgba(0, 191, 255, 0.3)',
        '--shadow-card': '0 10px 40px rgba(0, 0, 0, 0.3)',
    },
    light: {
        '--bg-primary': '#f8fafc',
        '--bg-secondary': '#ffffff',
        '--bg-card': 'rgba(0, 0, 0, 0.02)',
        '--text-primary': '#1a1a2e',
        '--text-secondary': '#64748b',
        '--text-muted': '#94a3b8',
        '--border-color': 'rgba(0, 0, 0, 0.08)',
        '--accent-primary': '#0284c7',
        '--accent-success': '#16a34a',
        '--accent-warning': '#ca8a04',
        '--accent-danger': '#dc2626',
        '--glow-primary': 'rgba(2, 132, 199, 0.15)',
        '--shadow-card': '0 10px 40px rgba(0, 0, 0, 0.08)',
    }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('dark')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Check localStorage first
        const stored = localStorage.getItem('mekong-theme') as Theme
        if (stored && (stored === 'dark' || stored === 'light')) {
            setThemeState(stored)
            applyTheme(stored)
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            const systemTheme = prefersDark ? 'dark' : 'light'
            setThemeState(systemTheme)
            applyTheme(systemTheme)
        }
    }, [])

    const applyTheme = (newTheme: Theme) => {
        const root = document.documentElement
        const vars = THEMES[newTheme]
        Object.entries(vars).forEach(([key, value]) => {
            root.style.setProperty(key, value)
        })
        root.setAttribute('data-theme', newTheme)
    }

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme)
        localStorage.setItem('mekong-theme', newTheme)
        applyTheme(newTheme)
    }

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark'
        setTheme(newTheme)
    }

    // Prevent hydration mismatch
    if (!mounted) return <>{children}</>

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

// Theme Toggle Button Component
export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()

    return (
        <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
                position: 'fixed',
                bottom: '80px',
                right: '20px',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: theme === 'dark'
                    ? 'linear-gradient(135deg, #1a1a2e 0%, #0a0a0f 100%)'
                    : 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                border: `2px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                boxShadow: theme === 'dark'
                    ? '0 4px 20px rgba(0, 191, 255, 0.3)'
                    : '0 4px 20px rgba(0, 0, 0, 0.15)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9990,
                overflow: 'hidden',
            }}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
            <AnimatePresence mode="wait">
                <motion.span
                    key={theme}
                    initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.3 }}
                    style={{ fontSize: '20px' }}
                >
                    {theme === 'dark' ? '🌙' : '☀️'}
                </motion.span>
            </AnimatePresence>
        </motion.button>
    )
}
