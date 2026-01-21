/**
 * Centralized Security Logging Framework
 * Structured logging with security events and audit trails
 */

import { z } from 'zod'

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TYPES & SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

export const LogLevelEnum = z.enum(['debug', 'info', 'warn', 'error', 'critical'])
export type LogLevel = z.infer<typeof LogLevelEnum>

export const SecurityEventEnum = z.enum([
  'authentication_success',
  'authentication_failure',
  'authorization_failure',
  'rate_limit_exceeded',
  'suspicious_activity',
  'data_breach_attempt',
  'privilege_escalation',
  'malicious_request',
  'sql_injection_attempt',
  'xss_attempt',
  'csrf_attempt',
  'file_upload_violation',
  'api_key_abuse',
  'session_hijack',
  'brute_force_attempt',
  'data_export',
  'data_deletion',
  'consent_change',
  'admin_action',
  'system_error',
  'configuration_change',
])
export type SecurityEvent = z.infer<typeof SecurityEventEnum>

export const LogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  level: LogLevelEnum,
  event: SecurityEventEnum.optional(),
  message: z.string(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  requestId: z.string().optional(),
  resource: z.string().optional(),
  action: z.string().optional(),
  context: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
  severity: z.number().min(1).max(10).default(5),
  tags: z.array(z.string()).default([]),
})

export type LogEntry = z.infer<typeof LogEntrySchema>

// ═══════════════════════════════════════════════════════════════════════════════
// 🔒 SECURITY LOGGER CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

interface SecurityLoggerConfig {
  level: LogLevel
  enableConsoleOutput: boolean
  enableFileOutput: boolean
  enableRemoteLogging: boolean
  remoteEndpoint?: string
  maxRetries: number
  batchSize: number
  flushInterval: number
  sanitizeFields: string[]
}

const defaultConfig: SecurityLoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  enableConsoleOutput: process.env.NODE_ENV !== 'production',
  enableFileOutput: true,
  enableRemoteLogging: process.env.NODE_ENV === 'production',
  remoteEndpoint: process.env.SECURITY_LOG_ENDPOINT,
  maxRetries: 3,
  batchSize: 100,
  flushInterval: 5000,
  sanitizeFields: ['password', 'token', 'secret', 'key', 'auth', 'cookie'],
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🧭 DATA SANITIZATION
// ═══════════════════════════════════════════════════════════════════════════════

class DataSanitizer {
  private sanitizeFields: string[]

  constructor(sanitizeFields: string[]) {
    this.sanitizeFields = sanitizeFields
  }

  sanitize<T extends Record<string, unknown>>(obj: T): T {
    if (!obj || typeof obj !== 'object') return obj

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitize(item as Record<string, unknown>)) as unknown as T
    }

    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      if (this.shouldSanitize(key)) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitize(value as Record<string, unknown>)
      } else {
        sanitized[key] = value
      }
    }
    return sanitized as T
  }

  private shouldSanitize(key: string): boolean {
    const lowerKey = key.toLowerCase()
    return this.sanitizeFields.some(field => lowerKey.includes(field.toLowerCase()))
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 SECURITY LOGGER
// ═══════════════════════════════════════════════════════════════════════════════

class SecurityLogger {
  private config: SecurityLoggerConfig
  private sanitizer: DataSanitizer
  private logBuffer: LogEntry[] = []
  private flushTimer: NodeJS.Timeout | null = null

  constructor(config: Partial<SecurityLoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
    this.sanitizer = new DataSanitizer(this.config.sanitizeFields)

    if (this.config.enableFileOutput || this.config.enableRemoteLogging) {
      this.startFlushTimer()
    }
  }

  private generateId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error', 'critical']
    const currentLevelIndex = levels.indexOf(this.config.level)
    const entryLevelIndex = levels.indexOf(level)
    return entryLevelIndex >= currentLevelIndex
  }

  private createLogEntry(
    level: LogLevel,
    event: SecurityEvent | undefined,
    message: string,
    context: Record<string, unknown> = {}
  ): LogEntry {
    const sanitizedContext = this.sanitizer.sanitize(context)

    return {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      event,
      message,
      severity: 5,
      tags: [],
      ...sanitizedContext,
    }
  }

  private async writeLog(entry: LogEntry): Promise<void> {
    try {
      // Console output
      if (this.config.enableConsoleOutput) {
        this.writeToConsole(entry)
      }

      // File output (in production, this would write to secure log files)
      if (this.config.enableFileOutput) {
        await this.writeToFile(entry)
      }

      // Remote logging (SIEM, security monitoring)
      if (this.config.enableRemoteLogging && this.config.remoteEndpoint) {
        await this.writeToRemote(entry)
      }
    } catch (error) {
      console.error('Failed to write security log:', error)
    }
  }

  private writeToConsole(entry: LogEntry): void {
    const emoji = this.getEmojiForLevel(entry.level)
    const prefix = `[${entry.level.toUpperCase()}]${emoji}`
    const eventTag = entry.event ? `[${entry.event.toUpperCase()}]` : ''
    const message = `${prefix} ${eventTag} ${entry.message}`
    const data = {
      id: entry.id,
      timestamp: entry.timestamp,
      userId: entry.userId,
      ipAddress: entry.ipAddress,
      ...entry.context,
    }

    // eslint-disable-next-line no-console
    switch (entry.level) {
      case 'debug':
        console.debug(message, data)
        break
      case 'info':
        console.info(message, data)
        break
      case 'warn':
        console.warn(message, data)
        break
      case 'error':
      case 'critical':
        console.error(message, data)
        break
      default:
        console.info(message, data)
    }
  }

  private getEmojiForLevel(level: string): string {
    const emojis: Record<string, string> = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      critical: '🚨',
    }
    return emojis[level] || ''
  }

  private async writeToFile(entry: LogEntry): Promise<void> {
    // In production, this would write to structured log files
    // For now, we'll simulate file logging
    const _logLine = JSON.stringify(entry) + '\n'
    // Implementation would go here
  }

  private async writeToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteEndpoint) return

    const response = await fetch(this.config.remoteEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SECURITY_LOG_TOKEN}`,
      },
      body: JSON.stringify(entry),
    })

    if (!response.ok) {
      throw new Error(`Remote logging failed: ${response.statusText}`)
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }

    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.config.flushInterval)
  }

  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return

    const batch = this.logBuffer.splice(0, this.config.batchSize)

    // Process batch in parallel
    await Promise.allSettled(batch.map(entry => this.writeLog(entry)))
  }

  // Public logging methods
  async log(
    level: LogLevel,
    event: SecurityEvent | undefined,
    message: string,
    context: Record<string, unknown> = {}
  ): Promise<void> {
    if (!this.shouldLog(level)) return

    const entry = this.createLogEntry(level, event, message, context)

    if (this.config.enableFileOutput || this.config.enableRemoteLogging) {
      this.logBuffer.push(entry)
      if (this.logBuffer.length >= this.config.batchSize) {
        await this.flush()
      }
    } else {
      await this.writeLog(entry)
    }
  }

  // Convenience methods
  async debug(message: string, context: Record<string, unknown> = {}): Promise<void> {
    await this.log('debug', undefined, message, context)
  }

  async info(message: string, context: Record<string, unknown> = {}): Promise<void> {
    await this.log('info', undefined, message, context)
  }

  async warn(message: string, context: Record<string, unknown> = {}): Promise<void> {
    await this.log('warn', undefined, message, context)
  }

  async error(
    message: string,
    error?: Error,
    context: Record<string, unknown> = {}
  ): Promise<void> {
    await this.log('error', 'system_error', message, {
      ...context,
      error: error?.message,
      stack: error?.stack,
    })
  }

  async critical(message: string, context: Record<string, unknown> = {}): Promise<void> {
    await this.log('critical', undefined, message, context)
  }

  // Security-specific methods
  async security(
    event: SecurityEvent,
    message: string,
    context: Record<string, unknown> = {}
  ): Promise<void> {
    await this.log('warn', event, message, context)
  }

  async authentication(
    success: boolean,
    userId?: string,
    context: Record<string, unknown> = {}
  ): Promise<void> {
    const event = success ? 'authentication_success' : 'authentication_failure'
    await this.log(
      success ? 'info' : 'warn',
      event,
      `Authentication ${success ? 'success' : 'failure'}`,
      { userId, ...context }
    )
  }

  async authorization(
    success: boolean,
    userId: string,
    resource: string,
    action: string,
    context: Record<string, unknown> = {}
  ): Promise<void> {
    const event = success ? undefined : 'authorization_failure'
    const level = success ? 'debug' : 'warn'

    await this.log(
      level,
      event,
      `Authorization ${success ? 'success' : 'failure'} for ${action} on ${resource}`,
      { userId, resource, action, ...context }
    )
  }

  async audit(
    action: string,
    resource: string,
    userId: string,
    context: Record<string, unknown> = {}
  ): Promise<void> {
    await this.log('info', 'admin_action', `Audit: ${action} on ${resource}`, {
      userId,
      resource,
      action,
      ...context,
    })
  }

  // Cleanup
  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    await this.flush()
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const securityLogger = new SecurityLogger()

// Ensure logs are flushed on process exit
process.on('SIGTERM', async () => {
  await securityLogger.close()
})

process.on('SIGINT', async () => {
  await securityLogger.close()
})

export { SecurityLogger, SecurityEventEnum as SecurityEvent, LogLevelEnum as LogLevel }
export type { LogEntry as LogEntryType }
export default securityLogger
