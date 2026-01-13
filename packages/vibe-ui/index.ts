/**
 * 🎨 VIBE UI - Aura Elite Design System
 * 
 * Pattern 106: Composite Layout Animation Orchestration
 * Pattern 95: Reusable Component Topologies
 */

// ============================================
// DESIGN TOKENS
// ============================================

export const colors = {
    // Primary - Aura Gradient
    primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        500: '#0ea5e9',
        600: '#0284c7',
        900: '#0c4a6e',
    },
    // Accent - Vibe Purple
    accent: {
        50: '#faf5ff',
        500: '#a855f7',
        600: '#9333ea',
    },
    // Success - Win Green
    success: {
        500: '#22c55e',
        600: '#16a34a',
    },
    // Dark Mode
    dark: {
        bg: '#0f172a',
        card: '#1e293b',
        border: '#334155',
    }
} as const;

export const gradients = {
    aura: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    vibe: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    ocean: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    sunset: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
} as const;

// ============================================
// ANIMATION PRESETS (Pattern 106)
// ============================================

export const animations = {
    fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    },
    fadeInUp: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
    },
    slideInLeft: {
        initial: { opacity: 0, x: -50 },
        animate: { opacity: 1, x: 0 },
    },
    scaleIn: {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
    },
    stagger: (delay = 0.1) => ({
        animate: { transition: { staggerChildren: delay } }
    }),
} as const;

export const transitions = {
    spring: { type: 'spring', stiffness: 300, damping: 30 },
    smooth: { duration: 0.3, ease: 'easeInOut' },
    bounce: { type: 'spring', stiffness: 500, damping: 25 },
} as const;

// ============================================
// COMPONENT PATTERNS (Pattern 95)
// ============================================

export interface ButtonProps {
    variant: 'primary' | 'secondary' | 'ghost' | 'vibe';
    size: 'sm' | 'md' | 'lg';
    loading?: boolean;
    children: React.ReactNode;
}

export interface CardProps {
    variant: 'default' | 'glass' | 'gradient';
    hover?: boolean;
    children: React.ReactNode;
}

export interface BadgeProps {
    variant: 'success' | 'warning' | 'error' | 'info' | 'vibe';
    size: 'sm' | 'md';
    children: React.ReactNode;
}

// ============================================
// UTILITY CLASSES
// ============================================

export const vibeClasses = {
    // Glass morphism
    glass: 'backdrop-blur-xl bg-white/10 border border-white/20',
    // Gradient text
    gradientText: 'bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent',
    // Hover effects
    hoverScale: 'transition-transform hover:scale-105',
    hoverGlow: 'hover:shadow-lg hover:shadow-purple-500/25',
    // Focus ring
    focusRing: 'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
} as const;

// ============================================
// EXPORTS
// ============================================

export default {
    colors,
    gradients,
    animations,
    transitions,
    vibeClasses,
};
