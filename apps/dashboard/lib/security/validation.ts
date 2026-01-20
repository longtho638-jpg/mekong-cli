/**
 * Centralized Input Validation Middleware
 * Comprehensive input sanitization and validation rules
 */

import type { NextRequest, NextResponse } from 'next/server'
import { NextResponse as NextResponseClass } from 'next/server'
import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'
import { securityLogger } from './logger'

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

export const commonSchemas = {
  // Basic string validations
  nonEmptyString: z.string().min(1, 'Field cannot be empty'),
  safeString: z
    .string()
    .max(1000, 'Text too long')
    .transform(val => DOMPurify.sanitize(val.trim())),

  // ID validations
  uuid: z.string().uuid('Invalid ID format'),
  numericId: z.string().regex(/^\d+$/, 'Invalid numeric ID'),

  // Email validation
  email: z
    .string()
    .email('Invalid email format')
    .transform(val => val.toLowerCase().trim()),

  // URL validation
  url: z
    .string()
    .url('Invalid URL format')
    .transform(val => DOMPurify.sanitize(val.trim())),

  // Password validation
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/\d/, 'Password must contain number'),

  // Name validation
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Invalid name format')
    .transform(val => DOMPurify.sanitize(val.trim())),

  // Phone number validation
  phone: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone format')
    .min(10, 'Phone number too short')
    .max(20, 'Phone number too long'),

  // Date validation
  date: z.string().datetime('Invalid date format'),
  futureDate: z
    .string()
    .datetime('Invalid date format')
    .transform(val => {
      const date = new Date(val)
      if (date <= new Date()) {
        throw new Error('Date must be in the future')
      }
      return val
    }),

  // Pagination
  page: z
    .string()
    .regex(/^\d+$/, 'Invalid page number')
    .transform(Number)
    .pipe(z.number().min(1).max(1000).default(1)),
  limit: z
    .string()
    .regex(/^\d+$/, 'Invalid limit')
    .transform(Number)
    .pipe(z.number().min(1).max(100).default(20)),

  // Sort
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  // IP Address
  ipAddress: z.string().ip('Invalid IP address'),

  // Currency amount
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format')
    .transform(val => parseFloat(val)),

  // Select options
  booleanString: z.enum(['true', 'false']).transform(val => val === 'true'),

  // File upload metadata
  fileName: z
    .string()
    .min(1, 'Filename required')
    .max(255, 'Filename too long')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Invalid filename'),

  fileSize: z.string().regex(/^\d+$/, 'Invalid file size').transform(Number),

  mimeType: z
    .string()
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_.]*$/,
      'Invalid MIME type'
    ),
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ SECURITY VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

class SecurityValidator {
  // SQL Injection patterns
  private static readonly SQL_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
    /(--|\*\/|\/\*)/,
    /(\bOR\b.*=.*\bOR\b)/i,
    /(\bAND\b.*=.*\bAND\b)/i,
    /(\'|\"|`).*\1.*\1/,
  ]

  // XSS patterns
  private static readonly XSS_PATTERNS = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
  ]

  // Command injection patterns
  private static readonly CMD_PATTERNS = [
    /[;&|`$(){}[\]]/,
    /\b(rm|mv|cp|cat|ls|ps|kill|chmod|chown)\s/i,
    /\b(curl|wget|nc|netcat)\s/i,
  ]

  // Path traversal patterns
  private static readonly PATH_TRAVERSAL = [/\.\.[\/\\]/, /[\/\\]\.\.[\/\\]/, /\%2e\%2e[\/\\]/i]

  static async validateSqlInjection(value: string): Promise<boolean> {
    for (const pattern of this.SQL_PATTERNS) {
      if (pattern.test(value)) {
        await securityLogger.security('sql_injection_attempt', 'SQL injection pattern detected', {
          value: value.substring(0, 100),
        })
        return false
      }
    }
    return true
  }

  static async validateXss(value: string): Promise<boolean> {
    for (const pattern of this.XSS_PATTERNS) {
      if (pattern.test(value)) {
        await securityLogger.security('xss_attempt', 'XSS pattern detected', {
          value: value.substring(0, 100),
        })
        return false
      }
    }
    return true
  }

  static async validateCommandInjection(value: string): Promise<boolean> {
    for (const pattern of this.CMD_PATTERNS) {
      if (pattern.test(value)) {
        await securityLogger.security('malicious_request', 'Command injection pattern detected', {
          value: value.substring(0, 100),
        })
        return false
      }
    }
    return true
  }

  static async validatePathTraversal(value: string): Promise<boolean> {
    for (const pattern of this.PATH_TRAVERSAL) {
      if (pattern.test(value)) {
        await securityLogger.security('malicious_request', 'Path traversal pattern detected', {
          value: value.substring(0, 100),
        })
        return false
      }
    }
    return true
  }

  static async validateFileUpload(
    fileName: string,
    mimeType: string,
    size: number
  ): Promise<boolean> {
    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt']
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))

    if (!allowedExtensions.includes(extension)) {
      await securityLogger.security('file_upload_violation', 'Invalid file extension', {
        fileName,
        extension,
      })
      return false
    }

    // Check MIME type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]

    if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
      await securityLogger.security('file_upload_violation', 'Invalid MIME type', {
        fileName,
        mimeType,
      })
      return false
    }

    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (size > maxSize) {
      await securityLogger.security('file_upload_violation', 'File too large', { fileName, size })
      return false
    }

    return true
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 VALIDATION MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════════

export interface ValidationConfig {
  body?: z.ZodSchema
  query?: z.ZodSchema
  params?: z.ZodSchema
  headers?: z.ZodSchema
  requireAuth?: boolean
  sanitizeInput?: boolean
}

export class InputValidationError extends Error {
  constructor(
    public field: string,
    message: string,
    public code: string = 'VALIDATION_ERROR'
  ) {
    super(message)
    this.name = 'InputValidationError'
  }
}

export function createValidationMiddleware(config: ValidationConfig) {
  return async (
    request: NextRequest,
    context: { params?: Record<string, string> } = {}
  ): Promise<
    { success: true; data: Record<string, unknown> } | { success: false; error: NextResponse }
  > => {
    try {
      const validatedData: Record<string, unknown> = {}

      // Parse request body
      let body: Record<string, unknown> = {}
      if (config.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          body = await request.json()
        } catch (error) {
          return {
            success: false,
            error: NextResponseClass.json(
              { error: 'Invalid JSON in request body' },
              { status: 400 }
            ),
          }
        }

        validatedData.body = config.body.parse(body)
      }

      // Validate query parameters
      if (config.query) {
        const query = Object.fromEntries(request.nextUrl.searchParams)
        validatedData.query = config.query.parse(query)
      }

      // Validate route parameters
      if (config.params && context.params) {
        validatedData.params = config.params.parse(context.params)
      }

      // Validate headers
      if (config.headers) {
        const headers: Record<string, string> = {}
        request.headers.forEach((value, key) => {
          headers[key.toLowerCase().replace(/-/g, '_')] = value
        })
        validatedData.headers = config.headers.parse(headers)
      }

      // Security validations
      if (config.sanitizeInput !== false) {
        const allValues = JSON.stringify({
          body: validatedData.body,
          query: validatedData.query,
          params: validatedData.params,
        })

        // Run security validations in parallel
        const [sqlSafe, xssSafe, cmdSafe] = await Promise.all([
          SecurityValidator.validateSqlInjection(allValues),
          SecurityValidator.validateXss(allValues),
          SecurityValidator.validateCommandInjection(allValues),
        ])

        if (!sqlSafe || !xssSafe || !cmdSafe) {
          return {
            success: false,
            error: NextResponseClass.json({ error: 'Invalid input detected' }, { status: 400 }),
          }
        }
      }

      // Authentication check
      if (config.requireAuth) {
        const authHeader = request.headers.get('authorization')
        const userId = request.headers.get('x-user-id')

        if (!authHeader && !userId) {
          await securityLogger.authorization(false, 'anonymous', request.url, 'access')

          return {
            success: false,
            error: NextResponseClass.json({ error: 'Authentication required' }, { status: 401 }),
          }
        }
      }

      return { success: true, data: validatedData }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }))

        await securityLogger.security('malicious_request', 'Validation failed', {
          errors: fieldErrors,
        })

        return {
          success: false,
          error: NextResponseClass.json(
            {
              error: 'Validation failed',
              details: fieldErrors,
            },
            { status: 400 }
          ),
        }
      }

      console.error('Validation middleware error:', error)
      return {
        success: false,
        error: NextResponseClass.json({ error: 'Internal server error' }, { status: 500 }),
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 COMMON VALIDATION MIDDLEWARES
// ═══════════════════════════════════════════════════════════════════════════════

export const validatePagination = createValidationMiddleware({
  query: z.object({
    page: commonSchemas.page,
    limit: commonSchemas.limit,
    sortBy: commonSchemas.sortBy.optional(),
    sortOrder: commonSchemas.sortOrder.optional(),
  }),
})

export const validateUserId = createValidationMiddleware({
  params: z.object({
    userId: commonSchemas.uuid,
  }),
})

export const validateAuth = createValidationMiddleware({
  requireAuth: true,
})

export const validateEmailUpdate = createValidationMiddleware({
  body: z.object({
    email: commonSchemas.email,
  }),
  requireAuth: true,
})

export const validatePasswordChange = createValidationMiddleware({
  body: z.object({
    currentPassword: commonSchemas.nonEmptyString,
    newPassword: commonSchemas.password,
  }),
  requireAuth: true,
})

export const validateFileUpload = createValidationMiddleware({
  body: z.object({
    fileName: commonSchemas.fileName,
    fileSize: commonSchemas.fileSize,
    mimeType: commonSchemas.mimeType,
  }),
})

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { SecurityValidator, InputValidationError as ValidationError }
export default {
  createValidationMiddleware,
  commonSchemas,
  validatePagination,
  validateUserId,
  validateAuth,
  validateEmailUpdate,
  validatePasswordChange,
  validateFileUpload,
}
