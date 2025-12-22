/**
 * Design Tokens - Centralized design system for Agency OS
 * 
 * AgencyOS Standard: Single source of truth for all UI values
 */

// ============================================
// Color Palette
// ============================================

export const colors = {
    // Core Brand
    primary: '#8b5cf6',    // Purple 500
    primaryLight: '#a78bfa', // Purple 400
    primaryDark: '#7c3aed',  // Purple 600

    accent: '#ec4899',     // Pink 500
    accentLight: '#f472b6', // Pink 400

    // Status Colors
    success: '#00ff41',    // Matrix Green
    warning: '#ffd700',    // Gold
    error: '#ef4444',      // Red 500
    info: '#00bfff',       // Cyan

    // Neutral
    bg: '#050505',
    bgCard: 'rgba(255,255,255,0.02)',
    bgHover: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.05)',
    borderHover: 'rgba(255,255,255,0.1)',

    text: '#ffffff',
    textMuted: '#888888',
    textDim: '#666666',

    // Hub-specific Colors (33 hubs)
    hubs: {
        crm: '#ff69b4',
        marketing: '#e4405f',
        sales: '#00bfff',
        operations: '#10b981',
        finance: '#ffd700',
        hr: '#f97316',
        it: '#06b6d4',
        legal: '#8b5cf6',
        product: '#ec4899',
        data: '#3b82f6',
        security: '#ef4444',
        support: '#22c55e',
        learning: '#a855f7',
        executive: '#f59e0b',
        // Add more as needed
    } as Record<string, string>,
} as const

// ============================================
// Spacing (8px base unit)
// ============================================

export const spacing = {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    section: '120px',
    container: '1400px',
} as const

// ============================================
// Typography
// ============================================

export const typography = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSans: "system-ui, -apple-system, sans-serif",

    sizes: {
        hero: 'clamp(48px, 8vw, 96px)',
        h1: 'clamp(36px, 6vw, 72px)',
        h2: 'clamp(28px, 4vw, 48px)',
        h3: 'clamp(20px, 3vw, 32px)',
        lg: '20px',
        base: '16px',
        sm: '14px',
        xs: '12px',
    },

    weights: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
    },
} as const

// ============================================
// Glass Effects
// ============================================

export const glass = {
    bg: 'rgba(255,255,255,0.02)',
    bgStrong: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.05)',
    borderAccent: 'rgba(255,255,255,0.1)',
    blur: 'blur(12px)',
    blurStrong: 'blur(20px)',
    shadow: '0 8px 32px rgba(0,0,0,0.3)',
    shadowHover: '0 12px 40px rgba(139,92,246,0.2)',
} as const

// ============================================
// Borders & Radius
// ============================================

export const borders = {
    radius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        full: '9999px',
    },
} as const

// ============================================
// Animations
// ============================================

export const animations = {
    duration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
    },
    easing: {
        default: 'cubic-bezier(0.4, 0, 0.2, 1)',
        in: 'cubic-bezier(0.4, 0, 1, 1)',
        out: 'cubic-bezier(0, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
} as const

// ============================================
// Z-Index Scale
// ============================================

export const zIndex = {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modal: 40,
    popover: 50,
    tooltip: 60,
} as const

// ============================================
// Type Exports
// ============================================

export type HubColor = keyof typeof colors.hubs
