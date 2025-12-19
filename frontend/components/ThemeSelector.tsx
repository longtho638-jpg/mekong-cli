'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemePresets, THEME_PRESETS } from '@/hooks/useThemePresets'

export default function ThemeSelector() {
    const { currentPreset, setPreset } = useThemePresets()
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="fixed bottom-4 right-4 z-[1000]">
            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl cursor-pointer transition-all duration-300 relative group"
                style={{
                    background: isOpen
                        ? `linear-gradient(135deg, ${currentPreset.colors.primary}, ${currentPreset.colors.secondary})`
                        : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${currentPreset.colors.border}`,
                    boxShadow: isOpen ? `0 0 20px ${currentPreset.colors.glow}` : '0 0 10px rgba(0,0,0,0.3)',
                }}
            >
                🎨
                {!isOpen && (
                    <div className="absolute inset-0 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
            </motion.button>

            {/* Theme Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-16 right-0 w-[280px] bg-[#0a0a0f]/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] ultra-glass"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 bg-white/5">
                            <h3 className="text-base text-white font-bold flex items-center gap-2">
                                🎨 Theme Presets
                            </h3>
                            <p className="text-[10px] text-white/50 mt-1 uppercase tracking-wider font-medium">
                                Current: {currentPreset.emoji} {currentPreset.name}
                            </p>
                        </div>

                        {/* Theme Options */}
                        <div className="p-2 flex flex-col gap-1">
                            {THEME_PRESETS.map((preset) => (
                                <motion.button
                                    key={preset.id}
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setPreset(preset.id)}
                                    className={`
                                        w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border border-transparent
                                        ${currentPreset.id === preset.id ? 'bg-white/10 border-white/10 shadow-inner' : 'hover:bg-white/5 hover:border-white/5'}
                                    `}
                                    style={{
                                        background: currentPreset.id === preset.id
                                            ? `linear-gradient(90deg, ${preset.colors.glow}40, transparent)`
                                            : undefined
                                    }}
                                >
                                    {/* Color Swatches */}
                                    <div className="flex -space-x-1">
                                        <div
                                            className="w-5 h-5 rounded-full border border-white/10 shadow-sm relative z-10"
                                            style={{ background: preset.colors.primary }}
                                        />
                                        <div
                                            className="w-5 h-5 rounded-full border border-white/10 shadow-sm relative z-0"
                                            style={{ background: preset.colors.secondary }}
                                        />
                                    </div>

                                    {/* Name */}
                                    <div className="flex-1 text-left">
                                        <p className={`text-sm ${currentPreset.id === preset.id ? 'text-white font-bold' : 'text-white/60 font-medium'}`}>
                                            {preset.emoji} {preset.name}
                                        </p>
                                    </div>

                                    {/* Active Indicator */}
                                    {currentPreset.id === preset.id && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
                                            style={{
                                                background: preset.colors.primary,
                                                color: preset.colors.primary
                                            }}
                                        />
                                    )}
                                </motion.button>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-white/5 text-center bg-black/20">
                            <p className="text-[10px] text-white/30 uppercase tracking-widest">
                                Persists across sessions
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
