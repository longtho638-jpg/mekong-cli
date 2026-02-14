/**
 * AGRIOS.tech Design System
 * Terminal OS - Zero Technical Debt Foundation
 * Standard: WOW Factor, IPO-Ready
 */

export const COLORS = {
    // Primary Brand
    neon: '#10B981', // Emerald - The "Digital Life" signal
    soil: '#0C0A09', // Stone 950 - The "Physical Earth" foundation

    // Accents
    gold: '#F59E0B', // Yield/Profit
    alert: '#EF4444', // Risk/Danger
    info: '#3B82F6', // Data/Stream

    // Surfaces (Glassmorphism)
    glass: {
        low: 'rgba(255, 255, 255, 0.05)',
        medium: 'rgba(255, 255, 255, 0.1)',
        high: 'rgba(255, 255, 255, 0.2)',
        border: 'rgba(16, 185, 129, 0.2)', // Neon border
    }
}

export const TYPOGRAPHY = {
    heading: 'font-sans font-bold tracking-tight', // Inter/Outfit
    body: 'font-sans text-stone-300', // Inter
    mono: 'font-mono tracking-wider', // JetBrains Mono
}

export const EFFECTS = {
    glass: "backdrop-blur-xl bg-white/5 border border-emerald-500/20 shadow-xl",
    neonGlow: "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
    textGlow: "drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]",
}

export const ANIMATIONS = {
    hover: "transition-all duration-300 ease-out hover:scale-[1.02]",
    click: "active:scale-95",
}
