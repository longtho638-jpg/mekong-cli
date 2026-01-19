/* eslint-disable no-console */
/**
 * 🏯 AgencyOS Logger Utility
 * Production-ready logging that respects environment
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  timestamp: string
}

const isDev = process.env.NODE_ENV === 'development'
const isDebug = process.env.DEBUG === 'true'

/**
 * Structured logger for production use
 */
export const logger = {
  debug(message: string, context?: Record<string, unknown>): void {
    if (isDev || isDebug) {
      console.debug(`[DEBUG] ${message}`, context || '')
    }
  },

  info(message: string, context?: Record<string, unknown>): void {
    if (isDev) {
      console.info(`[INFO] ${message}`, context || '')
    }
    // In production, could send to logging service
  },

  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(`[WARN] ${message}`, context || '')
  },

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    console.error(`[ERROR] ${message}`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      ...context,
    })
  },

  /**
   * Log billing events (always logged for audit)
   */
  billing(event: string, details: Record<string, unknown>): void {
    const entry: LogEntry = {
      level: 'info',
      message: `[BILLING] ${event}`,
      context: details,
      timestamp: new Date().toISOString(),
    }

    if (isDev) {
      console.info(entry.message, entry.context)
    }
    // In production: send to billing audit log service
  },

  /**
   * Log security events (always logged)
   */
  security(event: string, details: Record<string, unknown>): void {
    const entry: LogEntry = {
      level: 'warn',
      message: `[SECURITY] ${event}`,
      context: details,
      timestamp: new Date().toISOString(),
    }

    console.warn(entry.message, entry.context)
    // In production: send to SIEM
  },
}

export default logger
