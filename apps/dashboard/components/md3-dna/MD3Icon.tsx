'use client'

import React from 'react'
import { clsx } from 'clsx'
import * as LucideIcons from 'lucide-react'

/* =====================================================
   MD3 Icon - Atomic Icon Component
   
   Uses Lucide icons with M3 sizing conventions
   Reference: m3.material.io/styles/icons
   ===================================================== */

type IconSize = 'small' | 'medium' | 'large'
type IconColor =
  | 'on-surface'
  | 'on-surface-variant'
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'error'
  | 'on-primary-container'
  | 'on-secondary-container'
  | 'on-tertiary-container'

interface MD3IconProps {
  /** Lucide icon name (e.g., 'Home', 'Settings', 'ChevronRight') */
  name: keyof typeof LucideIcons
  /** Icon size: small (20px), medium (24px), large (40px) */
  size?: IconSize
  /** Icon color from M3 color system */
  color?: IconColor
  /** Filled style (simulated with thicker stroke) */
  filled?: boolean
  /** Additional className */
  className?: string
}

// Size → pixels mapping (M3 standard)
const sizeMap: Record<IconSize, number> = {
  small: 20,
  medium: 24,
  large: 40,
}

export function MD3Icon({
  name,
  size = 'medium',
  color = 'on-surface',
  filled = false,
  className,
}: MD3IconProps) {
  // Dynamically get the icon component
  const IconComponent = LucideIcons[name] as React.ComponentType<{
    size: number
    strokeWidth: number
    fill?: string
    fillOpacity?: number
    className?: string
  }>

  if (!IconComponent) {
    if (process.env.NODE_ENV === 'development') {
       
      console.warn(`MD3Icon: Icon "${name}" not found in Lucide`)
    }
    return null
  }

  const iconSize = sizeMap[size]

  return (
    <span style={{ color: `var(--md-sys-color-${color})` }}>
      <IconComponent
        size={iconSize}
        strokeWidth={filled ? 2.5 : 2}
        fill={filled ? 'currentColor' : 'none'}
        fillOpacity={filled ? 0.15 : 0}
        className={clsx(className)}
      />
    </span>
  )
}

export default MD3Icon
