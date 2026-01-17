/**
 * Centralized Error Handling System
 * Standardized secure error responses with proper HTTP status codes
 */

import type { NextRequest } from 'next/server'
import { NextResponse as NextResponseClass } from 'next/server'
import { z } from 'zod'
import { securityLogger } from './logger'

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 ERROR TYPES & SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

export const ErrorCode = z.enum([
  // Client errors (4xx)
  'BAD_REQUEST',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'METHOD_NOT_ALLOWED',
  'CONFLICT',
  'VALIDATION_ERROR',
  'RATE_LIMITED',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',

  // Server errors (5xx)
  'INTERNAL_ERROR',
  'SERVICE_UNAVAILABLE',
  'DATABASE_ERROR',
  'EXTERNAL_SERVICE_ERROR',
  'TIMEOUT',

  // Security errors
  'SECURITY_VIOLATION',
  'AUTHENTICATION_FAILED',
  'AUTHORIZATION_FAILED',
  'TOKEN_EXPIRED',
  'INVALID_TOKEN',
  'CSRF_INVALID',

  // Business logic errors
  'INSUFFICIENT_PERMISSIONS',
  'RESOURCE_LIMIT_EXCEEDED',
  'SUBSCRIPTION_REQUIRED',
  'QUOTA_EXCEEDED',
  'ACCOUNT_SUSPENDED',
])
export type ErrorCode = z.infer<typeof ErrorCode>

export const ErrorCategory = z.enum(['CLIENT', 'SERVER', 'SECURITY', 'BUSINESS', 'EXTERNAL'])
export type ErrorCategory = z.infer<typeof ErrorCategory>

// ═══════════════════════════════════════════════════════════════════════════════
// 🚨 ERROR CLASSES
// ═══════════════════════════════════════════════════════════════════════════════

export abstract class BaseError extends Error {
  public readonly code: ErrorCode
  public readonly category: ErrorCategory
  public readonly statusCode: number
  public readonly userMessage: string
  public readonly context?: Record<string, unknown>
  public readonly shouldLog: boolean
  public readonly requestId?: string

  constructor(
    code: ErrorCode,
    userMessage: string,
    statusCode: number = 500,
    category: ErrorCategory = 'SERVER',
    context?: Record<string, unknown>,
    shouldLog: boolean = true,
    requestId?: string
  ) {
    super(userMessage)
    this.name = this.constructor.name
    this.code = code
    this.category = category
    this.statusCode = statusCode
    this.userMessage = userMessage
    this.context = context
    this.shouldLog = shouldLog
    this.requestId = requestId

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  toJSON() {
    return {
      error: this.code,
      message: this.userMessage,
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
    }
  }
}

// Client Errors (4xx)
export class BadRequestError extends BaseError {
  constructor(message: string = 'Bad request', context?: Record<string, unknown>) {
    super('BAD_REQUEST', message, 400, 'CLIENT', context)
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message: string = 'Authentication required', context?: Record<string, unknown>) {
    super('UNAUTHORIZED', message, 401, 'SECURITY', context)
  }
}

export class ForbiddenError extends BaseError {
  constructor(message: string = 'Access denied', context?: Record<string, unknown>) {
    super('FORBIDDEN', message, 403, 'SECURITY', context)
  }
}

export class NotFoundError extends BaseError {
  constructor(resource: string = 'Resource') {
    super('NOT_FOUND', `${resource} not found`, 404, 'CLIENT')
  }
}

export class ConflictError extends BaseError {
  constructor(message: string = 'Resource conflict', context?: Record<string, unknown>) {
    super('CONFLICT', message, 409, 'CLIENT', context)
  }
}

export class ValidationError extends BaseError {
  constructor(message: string = 'Validation failed', context?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, 400, 'CLIENT', context)
  }
}

export class RateLimitedError extends BaseError {
  constructor(message: string = 'Rate limit exceeded', context?: Record<string, unknown>) {
    super('RATE_LIMITED', message, 429, 'SECURITY', context)
  }
}

// Server Errors (5xx)
export class InternalError extends BaseError {
  constructor(message: string = 'Internal server error', originalError?: Error) {
    super('INTERNAL_ERROR', message, 500, 'SERVER', {
      originalError: originalError?.message,
      stack: process.env.NODE_ENV === 'development' ? originalError?.stack : undefined,
    })
  }
}

export class DatabaseError extends BaseError {
  constructor(message: string = 'Database operation failed', context?: Record<string, unknown>) {
    super('DATABASE_ERROR', message, 500, 'SERVER', context)
  }
}

export class ExternalServiceError extends BaseError {
  constructor(service: string, message: string = 'External service error') {
    super('EXTERNAL_SERVICE_ERROR', message, 502, 'EXTERNAL', { service })
  }
}

// Security Errors
export class SecurityViolationError extends BaseError {
  constructor(message: string = 'Security violation detected', context?: Record<string, unknown>) {
    super('SECURITY_VIOLATION', message, 400, 'SECURITY', context)
  }
}

export class AuthenticationError extends BaseError {
  constructor(message: string = 'Authentication failed', context?: Record<string, unknown>) {
    super('AUTHENTICATION_FAILED', message, 401, 'SECURITY', context)
  }
}

export class AuthorizationError extends BaseError {
  constructor(resource: string, action: string) {
    super('AUTHORIZATION_FAILED', `Cannot ${action} ${resource}`, 403, 'SECURITY', {
      resource,
      action,
    })
  }
}

// Business Logic Errors
export class InsufficientPermissionsError extends BaseError {
  constructor(permission: string) {
    super('INSUFFICIENT_PERMISSIONS', `Insufficient permissions: ${permission}`, 403, 'BUSINESS', {
      permission,
    })
  }
}

export class ResourceLimitError extends BaseError {
  constructor(limit: string, current: number) {
    super('RESOURCE_LIMIT_EXCEEDED', `Resource limit exceeded: ${limit}`, 429, 'BUSINESS', {
      limit,
      current,
    })
  }
}

export class SubscriptionRequiredError extends BaseError {
  constructor(feature: string) {
    super('SUBSCRIPTION_REQUIRED', `Subscription required for ${feature}`, 402, 'BUSINESS', {
      feature,
    })
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ ERROR HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

interface ErrorHandlerConfig {
  includeStackTrace: boolean
  includeContext: boolean
  logAllErrors: boolean
  sanitizeErrors: boolean
}

class ErrorHandler {
  private config: ErrorHandlerConfig

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      includeStackTrace: process.env.NODE_ENV === 'development',
      includeContext: process.env.NODE_ENV === 'development',
      logAllErrors: true,
      sanitizeErrors: process.env.NODE_ENV === 'production',
      ...config,
    }
  }

  async handleError(error: Error, request?: NextRequest): Promise<NextResponse> {
    // Generate request ID if not present
    const requestId = this.generateRequestId()

    // Extract request context
    const requestContext = request ? this.extractRequestContext(request) : {}

    // Handle known errors
    if (error instanceof BaseError) {
      await this.logError(error, requestContext)
      return this.createErrorResponse(error, requestId)
    }

    // Handle unknown errors
    const internalError = new InternalError(
      this.config.sanitizeErrors ? 'An error occurred' : error.message,
      error
    )

    await this.logError(internalError, { ...requestContext, originalError: error.message })
    return this.createErrorResponse(internalError, requestId)
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private extractRequestContext(request: NextRequest): Record<string, unknown> {
    return {
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip'),
      userId: request.headers.get('x-user-id'),
      sessionId: request.headers.get('x-session-id'),
    }
  }

  private async logError(error: BaseError, context: Record<string, unknown>): Promise<void> {
    if (!error.shouldLog && !this.config.logAllErrors) return

    const logData = {
      error: error.code,
      message: error.userMessage,
      category: error.category,
      statusCode: error.statusCode,
      context: error.context,
      requestContext: context,
      stack: error.stack,
    }

    if (error.category === 'SECURITY') {
      await securityLogger.security(
        'system_error' as any,
        `${error.category}: ${error.userMessage}`,
        logData
      )
    } else if (error.category === 'CLIENT') {
      await securityLogger.warn(`Client error: ${error.userMessage}`, logData)
    } else {
      await securityLogger.error(
        `Server error: ${error.userMessage}`,
        error instanceof Error ? error : new Error(error.userMessage),
        logData
      )
    }
  }

  private async createErrorResponse(error: BaseError, requestId: string): NextResponse {
    const response: any = {
      error: error.code,
      message: error.userMessage,
      requestId,
      timestamp: new Date().toISOString(),
    }

    // Include additional context in development
    if (this.config.includeContext && error.context) {
      response.context = error.context
    }

    if (this.config.includeStackTrace && error.stack) {
      response.stack = error.stack
    }

    return NextResponseClass.json(response, {
      status: error.statusCode,
      headers: {
        'X-Request-ID': requestId,
        'X-Error-Code': error.code,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    })
  }

  // Error factory methods for common scenarios
  static fromValidationError(zodError: z.ZodError): ValidationError {
    const fieldErrors = zodError.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }))

    return new ValidationError('Input validation failed', { fieldErrors })
  }

  static fromDatabaseError(error: any, operation: string): DatabaseError {
    const sanitizedError = {
      operation,
      message: error.message?.substring(0, 100) || 'Unknown database error',
      code: error.code,
    }

    return new DatabaseError(`Database ${operation} failed`, sanitizedError)
  }

  static fromExternalServiceError(
    service: string,
    error: any,
    operation: string
  ): ExternalServiceError {
    const sanitizedError = {
      service,
      operation,
      status: error.status,
      message: error.message?.substring(0, 100) || 'Unknown service error',
    }

    return new ExternalServiceError(service, `${service} ${operation} failed`)
  }

  static fromRateLimitError(
    identifier: string,
    limitType: string,
    resetTime: Date
  ): RateLimitedError {
    return new RateLimitedError(`Rate limit exceeded for ${limitType}`, {
      identifier: identifier.substring(0, 10) + '***',
      limitType,
      resetTime: resetTime.toISOString(),
    })
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 ERROR MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════════

export const errorHandler = new ErrorHandler()

export function withErrorHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context)
    } catch (error) {
      return await errorHandler.handleError(error as Error, request)
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default errorHandler
