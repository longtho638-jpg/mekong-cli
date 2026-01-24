/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { logger } from '@/lib/utils/logger'

export interface ThemePreset {
  id: string
  name: string
  emoji: string
  colors: {
    primary: string // Main accent
    secondary: string // Secondary accent
    background: string // Page background
    surface: string // Card background
    text: string // Primary text
    textMuted: string // Secondary text
    border: string // Border color
    glow: string // Glow effect
  }
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    emoji: '🌆',
    colors: {
      primary: '#ff0000',
      secondary: '#00bfff',
      background: '#050510',
      surface: 'rgba(20, 20, 40, 0.8)',
      text: '#ffffff',
      textMuted: '#888888',
      border: 'rgba(255, 0, 0, 0.2)',
      glow: 'rgba(255, 0, 0, 0.3)',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    emoji: '🌊',
    colors: {
      primary: '#00d4ff',
      secondary: '#0099cc',
      background: '#0a1628',
      surface: 'rgba(10, 40, 70, 0.8)',
      text: '#e0f4ff',
      textMuted: '#6bb8d9',
      border: 'rgba(0, 212, 255, 0.2)',
      glow: 'rgba(0, 212, 255, 0.3)',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    emoji: '🌲',
    colors: {
      primary: '#00ff88',
      secondary: '#00cc66',
      background: '#0a1a0f',
      surface: 'rgba(15, 45, 25, 0.8)',
      text: '#e0ffe8',
      textMuted: '#6bbd80',
      border: 'rgba(0, 255, 136, 0.2)',
      glow: 'rgba(0, 255, 136, 0.3)',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    emoji: '🌅',
    colors: {
      primary: '#ff6b35',
      secondary: '#ff9f1c',
      background: '#1a0f0a',
      surface: 'rgba(50, 25, 15, 0.8)',
      text: '#fff0e6',
      textMuted: '#d9a06b',
      border: 'rgba(255, 107, 53, 0.2)',
      glow: 'rgba(255, 107, 53, 0.3)',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    emoji: '🌙',
    colors: {
      primary: '#a855f7',
      secondary: '#7c3aed',
      background: '#0f0a1a',
      surface: 'rgba(30, 15, 50, 0.8)',
      text: '#f0e6ff',
      textMuted: '#a06bd9',
      border: 'rgba(168, 85, 247, 0.2)',
      glow: 'rgba(168, 85, 247, 0.3)',
    },
  },
]

const STORAGE_KEY = 'agencyos-theme-preset'

interface ThemePresetContextType {
  currentPreset: ThemePreset
  setPreset: (id: string) => void
  presets: ThemePreset[]
}

const ThemePresetContext = createContext<ThemePresetContextType | undefined>(undefined)

export function ThemePresetProvider({ children }: { children: ReactNode }) {
  const [currentPreset, setCurrentPreset] = useState<ThemePreset>(THEME_PRESETS[0])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const preset = THEME_PRESETS.find(p => p.id === stored)
        if (preset) {
          setCurrentPreset(preset)
          applyTheme(preset)
        }
      }
    } catch (e) {
      logger.error('Failed to load theme preset', e)
    }
    setIsLoaded(true)
  }, [])

  // Apply CSS variables
  const applyTheme = (preset: ThemePreset) => {
    const root = document.documentElement
    root.style.setProperty('--theme-primary', preset.colors.primary)
    root.style.setProperty('--theme-secondary', preset.colors.secondary)
    root.style.setProperty('--theme-background', preset.colors.background)
    root.style.setProperty('--theme-surface', preset.colors.surface)
    root.style.setProperty('--theme-text', preset.colors.text)
    root.style.setProperty('--theme-text-muted', preset.colors.textMuted)
    root.style.setProperty('--theme-border', preset.colors.border)
    root.style.setProperty('--theme-glow', preset.colors.glow)
  }

  const setPreset = (id: string) => {
    const preset = THEME_PRESETS.find(p => p.id === id)
    if (preset) {
      setCurrentPreset(preset)
      applyTheme(preset)
      localStorage.setItem(STORAGE_KEY, id)
    }
  }

  return (
    <ThemePresetContext.Provider value={{ currentPreset, setPreset, presets: THEME_PRESETS }}>
      {children}
    </ThemePresetContext.Provider>
  )
}

export function useThemePresets() {
  const context = useContext(ThemePresetContext)
  if (!context) {
    // Return defaults if not in provider (shouldn't happen)
    return {
      currentPreset: THEME_PRESETS[0],
      setPreset: () => {},
      presets: THEME_PRESETS,
    }
  }
  return context
}
