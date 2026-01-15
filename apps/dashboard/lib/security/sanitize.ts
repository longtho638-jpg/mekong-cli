/**
 * Input Sanitization & Validation
 * Protects against XSS, SQL injection, and malicious input
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 🧹 HTML SANITIZATION
// ═══════════════════════════════════════════════════════════════════════════════

const HTML_ENTITIES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
};

export function escapeHtml(input: string): string {
    return input.replace(/[&<>"'`=/]/g, char => HTML_ENTITIES[char] || char);
}

export function stripHtml(input: string): string {
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ SQL INJECTION PREVENTION
// ═══════════════════════════════════════════════════════════════════════════════

const SQL_INJECTION_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|UNION|DECLARE)\b)/gi,
    /(-{2}|;|\*|\/\*|\*\/)/g,
    /(\bOR\b|\bAND\b)[\s]*[\d\w'"][\s]*(=|LIKE)/gi,
    /(\'|\"|;|--)/g,
];

export function detectSqlInjection(input: string): boolean {
    for (const pattern of SQL_INJECTION_PATTERNS) {
        if (pattern.test(input)) {
            return true;
        }
        pattern.lastIndex = 0; // Reset regex state
    }
    return false;
}

export function sanitizeSqlInput(input: string): string {
    return input
        .replace(/['";\\]/g, '')
        .replace(/--/g, '')
        .trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔗 URL SANITIZATION
// ═══════════════════════════════════════════════════════════════════════════════

export function sanitizeUrl(url: string): string | null {
    try {
        const parsed = new URL(url);

        // Only allow http and https
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return null;
        }

        // Block javascript: URLs
        if (url.toLowerCase().includes('javascript:')) {
            return null;
        }

        // Block data: URLs
        if (url.toLowerCase().startsWith('data:')) {
            return null;
        }

        return parsed.toString();
    } catch {
        return null;
    }
}

export function isValidRedirectUrl(url: string, allowedDomains: string[]): boolean {
    try {
        const parsed = new URL(url);
        return allowedDomains.some(domain =>
            parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
        );
    } catch {
        // Relative URLs are allowed
        return url.startsWith('/') && !url.startsWith('//');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📧 EMAIL SANITIZATION
// ═══════════════════════════════════════════════════════════════════════════════

export function sanitizeEmail(email: string): string {
    return email
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9@._+-]/g, '');
}

export function isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 GENERAL INPUT SANITIZATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface SanitizeOptions {
    maxLength?: number;
    stripHtml?: boolean;
    allowNewlines?: boolean;
    allowSpecialChars?: boolean;
}

export function sanitizeInput(input: string, options: SanitizeOptions = {}): string {
    let result = input;

    // Strip HTML if requested
    if (options.stripHtml) {
        result = stripHtml(result);
    }

    // Always escape HTML entities
    result = escapeHtml(result);

    // Remove control characters
    result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Handle newlines
    if (!options.allowNewlines) {
        result = result.replace(/[\r\n]+/g, ' ');
    }

    // Remove special chars if not allowed
    if (!options.allowSpecialChars) {
        result = result.replace(/[<>{}[\]\\^`|~]/g, '');
    }

    // Trim and limit length
    result = result.trim();
    if (options.maxLength && result.length > options.maxLength) {
        result = result.substring(0, options.maxLength);
    }

    return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔐 PASSWORD VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface PasswordStrength {
    score: number; // 0-100
    level: 'weak' | 'fair' | 'good' | 'strong';
    suggestions: string[];
}

export function checkPasswordStrength(password: string): PasswordStrength {
    const suggestions: string[] = [];
    let score = 0;

    // Length checks
    if (password.length >= 8) score += 20;
    else suggestions.push('Use at least 8 characters');

    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Character variety
    if (/[a-z]/.test(password)) score += 10;
    else suggestions.push('Add lowercase letters');

    if (/[A-Z]/.test(password)) score += 10;
    else suggestions.push('Add uppercase letters');

    if (/[0-9]/.test(password)) score += 10;
    else suggestions.push('Add numbers');

    if (/[^a-zA-Z0-9]/.test(password)) score += 15;
    else suggestions.push('Add special characters');

    // Penalize common patterns
    if (/^[a-z]+$|^[A-Z]+$|^[0-9]+$/.test(password)) {
        score -= 20;
        suggestions.push('Avoid using only one type of character');
    }

    if (/(.)\1{2,}/.test(password)) {
        score -= 10;
        suggestions.push('Avoid repeated characters');
    }

    // Common password check
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (commonPasswords.some(p => password.toLowerCase().includes(p))) {
        score -= 30;
        suggestions.push('Avoid common passwords');
    }

    score = Math.max(0, Math.min(100, score));

    let level: PasswordStrength['level'];
    if (score < 30) level = 'weak';
    else if (score < 50) level = 'fair';
    else if (score < 70) level = 'good';
    else level = 'strong';

    return { score, level, suggestions };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 OBJECT SANITIZATION
// ═══════════════════════════════════════════════════════════════════════════════

export function sanitizeObject<T extends Record<string, any>>(
    obj: T,
    fieldConfigs: Record<keyof T, SanitizeOptions>
): T {
    const result = { ...obj };

    for (const [key, options] of Object.entries(fieldConfigs)) {
        if (typeof result[key] === 'string') {
            result[key as keyof T] = sanitizeInput(result[key], options) as any;
        }
    }

    return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚨 THREAT DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

export interface ThreatDetectionResult {
    safe: boolean;
    threats: string[];
}

export function detectThreats(input: string): ThreatDetectionResult {
    const threats: string[] = [];

    // XSS patterns
    if (/<script|javascript:|on\w+=/i.test(input)) {
        threats.push('Potential XSS attack');
    }

    // SQL injection
    if (detectSqlInjection(input)) {
        threats.push('Potential SQL injection');
    }

    // Path traversal
    if (/\.\.\/|\.\.\\/.test(input)) {
        threats.push('Path traversal attempt');
    }

    // Command injection
    if (/[;&|`$]/.test(input)) {
        threats.push('Potential command injection');
    }

    // LDAP injection
    if (/[()\\*]/.test(input) && /[=|&]/.test(input)) {
        threats.push('Potential LDAP injection');
    }

    return {
        safe: threats.length === 0,
        threats,
    };
}
