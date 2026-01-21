/**
 * Unit Tests: Input Sanitization
 * Coverage: HTML escaping, SQL sanitization, URL validation, threat detection
 */

import { describe, it, expect } from '@jest/globals';
import {
  escapeHtml,
  stripHtml,
  detectSqlInjection,
  sanitizeSqlInput,
  sanitizeUrl,
  isValidRedirectUrl,
  sanitizeEmail,
  isValidEmail,
  sanitizeInput,
  checkPasswordStrength,
  sanitizeObject,
  detectThreats,
} from '../sanitize';

describe('HTML Sanitization', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("XSS")</script>')).toBe(
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
      );
      expect(escapeHtml('A & B')).toBe('A &amp; B');
      expect(escapeHtml("It's a test")).toBe('It&#x27;s a test');
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should preserve safe text', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });
  });

  describe('stripHtml', () => {
    it('should remove script tags', () => {
      expect(stripHtml('<script>alert("XSS")</script>Hello')).toBe('Hello');
    });

    it('should remove style tags', () => {
      expect(stripHtml('<style>body{color:red}</style>Text')).toBe('Text');
    });

    it('should remove all HTML tags', () => {
      expect(stripHtml('<div><p>Hello</p></div>')).toBe('Hello');
    });

    it('should preserve plain text', () => {
      expect(stripHtml('Plain text content')).toBe('Plain text content');
    });
  });
});

describe('SQL Injection Prevention', () => {
  describe('detectSqlInjection', () => {
    it('should detect SQL keywords', () => {
      expect(detectSqlInjection("SELECT * FROM users")).toBe(true);
      expect(detectSqlInjection("'; DROP TABLE users; --")).toBe(true);
      expect(detectSqlInjection("1 UNION SELECT password")).toBe(true);
    });

    it('should detect SQL operators', () => {
      expect(detectSqlInjection("1' OR '1'='1")).toBe(true);
      expect(detectSqlInjection("admin'--")).toBe(true);
    });

    it('should allow safe input', () => {
      expect(detectSqlInjection('John Doe')).toBe(false);
      expect(detectSqlInjection('user@example.com')).toBe(false);
    });
  });

  describe('sanitizeSqlInput', () => {
    it('should remove dangerous characters', () => {
      expect(sanitizeSqlInput("'; DROP TABLE --")).toBe('DROP TABLE');
      expect(sanitizeSqlInput('test"value')).toBe('testvalue');
    });

    it('should trim whitespace', () => {
      expect(sanitizeSqlInput('  test  ')).toBe('test');
    });
  });
});

describe('URL Sanitization', () => {
  describe('sanitizeUrl', () => {
    it('should allow valid HTTP/HTTPS URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
      expect(sanitizeUrl('http://test.com/path')).toBe('http://test.com/path');
    });

    it('should reject javascript: URLs', () => {
      expect(sanitizeUrl('javascript:alert("XSS")')).toBeNull();
      expect(sanitizeUrl('JAVASCRIPT:void(0)')).toBeNull();
    });

    it('should reject data: URLs', () => {
      expect(sanitizeUrl('data:text/html,<script>alert("XSS")</script>')).toBeNull();
    });

    it('should reject invalid protocols', () => {
      expect(sanitizeUrl('file:///etc/passwd')).toBeNull();
      expect(sanitizeUrl('ftp://example.com')).toBeNull();
    });

    it('should handle malformed URLs', () => {
      expect(sanitizeUrl('not-a-url')).toBeNull();
      expect(sanitizeUrl('://malformed')).toBeNull();
    });
  });

  describe('isValidRedirectUrl', () => {
    const allowedDomains = ['example.com', 'trusted.com'];

    it('should allow whitelisted domains', () => {
      expect(isValidRedirectUrl('https://example.com', allowedDomains)).toBe(true);
      expect(isValidRedirectUrl('https://sub.example.com', allowedDomains)).toBe(true);
    });

    it('should reject non-whitelisted domains', () => {
      expect(isValidRedirectUrl('https://evil.com', allowedDomains)).toBe(false);
    });

    it('should allow relative URLs', () => {
      expect(isValidRedirectUrl('/dashboard', allowedDomains)).toBe(true);
      expect(isValidRedirectUrl('/api/users', allowedDomains)).toBe(true);
    });

    it('should reject protocol-relative URLs', () => {
      expect(isValidRedirectUrl('//evil.com', allowedDomains)).toBe(false);
    });
  });
});

describe('Email Sanitization', () => {
  describe('sanitizeEmail', () => {
    it('should lowercase and trim emails', () => {
      expect(sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
    });

    it('should remove invalid characters', () => {
      expect(sanitizeEmail('user<script>@example.com')).toBe('userscript@example.com');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
    });

    it('should reject too long emails', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(isValidEmail(longEmail)).toBe(false);
    });
  });
});

describe('General Input Sanitization', () => {
  describe('sanitizeInput', () => {
    it('should trim and escape by default', () => {
      const result = sanitizeInput('  <test>  ');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result.startsWith(' ')).toBe(false);
    });

    it('should enforce max length', () => {
      const result = sanitizeInput('a'.repeat(100), { maxLength: 50 });
      expect(result.length).toBe(50);
    });

    it('should remove newlines when not allowed', () => {
      const result = sanitizeInput('Line1\nLine2', { allowNewlines: false });
      expect(result).not.toContain('\n');
    });

    it('should strip HTML when requested', () => {
      const result = sanitizeInput('<p>Hello</p>', { stripHtml: true });
      expect(result).not.toContain('<p>');
    });

    it('should remove control characters', () => {
      const result = sanitizeInput('Test\x00\x08String');
      expect(result).toBe('TestString'); // Depends on escaping
    });
  });
});

describe('Password Strength', () => {
  describe('checkPasswordStrength', () => {
    it('should rate strong passwords highly', () => {
      const result = checkPasswordStrength('MySecureP@ssw0rd123');
      expect(result.level).toBe('strong');
      expect(result.score).toBeGreaterThanOrEqual(70);
    });

    it('should rate weak passwords low', () => {
      const result = checkPasswordStrength('weak');
      expect(result.level).toBe('weak');
      expect(result.score).toBeLessThan(30);
    });

    it('should penalize common passwords', () => {
      const result = checkPasswordStrength('Password123');
      expect(result.score).toBeLessThan(50);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should provide helpful suggestions', () => {
      const result = checkPasswordStrength('short');
      expect(result.suggestions).toContain('Use at least 8 characters');
      expect(result.suggestions).toContain('Add uppercase letters');
    });

    it('should reward length and variety', () => {
      const weak = checkPasswordStrength('aaaaaaaa');
      const strong = checkPasswordStrength('Str0ng!P@ssw0rd#2024');
      expect(strong.score).toBeGreaterThan(weak.score);
    });
  });
});

describe('Object Sanitization', () => {
  describe('sanitizeObject', () => {
    it('should sanitize specified fields', () => {
      const input = {
        name: '  <John>  ',
        email: 'test@example.com',
        bio: 'Safe text',
      };

      const result = sanitizeObject(input, {
        name: { stripHtml: true, maxLength: 50 },
        bio: { maxLength: 100 },
      });

      expect(result.name).not.toContain('<');
      expect(result.name.trim()).toBe(result.name);
    });

    it('should preserve unspecified fields', () => {
      const input = { name: 'John', age: 30 };
      const result = sanitizeObject(input, {
        name: { maxLength: 50 },
      });

      expect(result.age).toBe(30);
    });
  });
});

describe('Threat Detection', () => {
  describe('detectThreats', () => {
    it('should detect XSS threats', () => {
      const result = detectThreats('<script>alert("XSS")</script>');
      expect(result.safe).toBe(false);
      expect(result.threats).toContain('Potential XSS attack');
    });

    it('should detect SQL injection', () => {
      const result = detectThreats("'; DROP TABLE users; --");
      expect(result.safe).toBe(false);
      expect(result.threats).toContain('Potential SQL injection');
    });

    it('should detect path traversal', () => {
      const result = detectThreats('../../../etc/passwd');
      expect(result.safe).toBe(false);
      expect(result.threats).toContain('Path traversal attempt');
    });

    it('should detect command injection', () => {
      const result = detectThreats('test; rm -rf /');
      expect(result.safe).toBe(false);
      expect(result.threats).toContain('Potential command injection');
    });

    it('should allow safe input', () => {
      const result = detectThreats('Normal user input text');
      expect(result.safe).toBe(true);
      expect(result.threats.length).toBe(0);
    });

    it('should detect multiple threats', () => {
      const result = detectThreats('<script>; DROP TABLE; ../../../');
      expect(result.safe).toBe(false);
      expect(result.threats.length).toBeGreaterThan(1);
    });
  });
});
