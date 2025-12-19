'use client'
import { motion, HTMLMotionProps } from 'framer-motion'
import { forwardRef } from 'react'

/**
 * Type-safe Motion wrapper components
 * Resolves framer-motion type compatibility issues with Next.js 14
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MotionDiv = motion.div as React.FC<HTMLMotionProps<'div'> & { children?: React.ReactNode }>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MotionSpan = motion.span as React.FC<HTMLMotionProps<'span'> & { children?: React.ReactNode }>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MotionButton = motion.button as React.FC<HTMLMotionProps<'button'> & { children?: React.ReactNode }>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MotionA = motion.a as React.FC<HTMLMotionProps<'a'> & { children?: React.ReactNode }>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MotionH1 = motion.h1 as React.FC<HTMLMotionProps<'h1'> & { children?: React.ReactNode }>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MotionTr = motion.tr as React.FC<HTMLMotionProps<'tr'> & { children?: React.ReactNode }>

// eslint-disable-next-line @typescript-eslint/no-explicit-any  
export const MotionP = motion.p as React.FC<HTMLMotionProps<'p'> & { children?: React.ReactNode }>

export default MotionDiv
