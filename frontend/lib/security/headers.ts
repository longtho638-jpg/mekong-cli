/**
 * Security Headers Configuration
 * CSP, HSTS, and other security headers
 */

import { NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ SECURITY HEADERS
// ═══════════════════════════════════════════════════════════════════════════════

export interface SecurityHeadersConfig {
    enableCSP: boolean;
    enableHSTS: boolean;
    enableFrameOptions: boolean;
    enableXSSProtection: boolean;
    enableContentTypeOptions: boolean;
    enableReferrerPolicy: boolean;
    enablePermissionsPolicy: boolean;
    customCSPDirectives?: Record<string, string[]>;
}

const defaultConfig: SecurityHeadersConfig = {
    enableCSP: true,
    enableHSTS: true,
    enableFrameOptions: true,
    enableXSSProtection: true,
    enableContentTypeOptions: true,
    enableReferrerPolicy: true,
    enablePermissionsPolicy: true,
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 CONTENT SECURITY POLICY
// ═══════════════════════════════════════════════════════════════════════════════

const CSP_DIRECTIVES: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
        "'self'",
        "'unsafe-inline'", // Required for Next.js
        "'unsafe-eval'",   // Required for development
        'https://js.stripe.com',
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com',
    ],
    'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for styled-components/emotion
        'https://fonts.googleapis.com',
    ],
    'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https:',
    ],
    'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
    ],
    'connect-src': [
        "'self'",
        'https://api.stripe.com',
        'https://www.google-analytics.com',
        'wss://*.supabase.co',
        'https://*.supabase.co',
    ],
    'frame-src': [
        "'self'",
        'https://js.stripe.com',
        'https://hooks.stripe.com',
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'self'"],
    'upgrade-insecure-requests': [],
};

function buildCSP(customDirectives?: Record<string, string[]>): string {
    const directives = { ...CSP_DIRECTIVES, ...customDirectives };

    return Object.entries(directives)
        .map(([key, values]) => {
            if (values.length === 0) return key;
            return `${key} ${values.join(' ')}`;
        })
        .join('; ');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔒 PERMISSIONS POLICY
// ═══════════════════════════════════════════════════════════════════════════════

const PERMISSIONS_POLICY = {
    'camera': [],
    'microphone': [],
    'geolocation': [],
    'interest-cohort': [], // Disable FLoC
    'payment': ['self', 'https://js.stripe.com'],
    'fullscreen': ['self'],
    'autoplay': ['self'],
};

function buildPermissionsPolicy(): string {
    return Object.entries(PERMISSIONS_POLICY)
        .map(([feature, origins]) => {
            if (origins.length === 0) return `${feature}=()`;
            return `${feature}=(${origins.join(' ')})`;
        })
        .join(', ');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 APPLY HEADERS
// ═══════════════════════════════════════════════════════════════════════════════

export function applySecurityHeaders(
    response: NextResponse,
    config: Partial<SecurityHeadersConfig> = {}
): NextResponse {
    const finalConfig = { ...defaultConfig, ...config };

    // Content Security Policy
    if (finalConfig.enableCSP) {
        response.headers.set(
            'Content-Security-Policy',
            buildCSP(finalConfig.customCSPDirectives)
        );
    }

    // HTTP Strict Transport Security
    if (finalConfig.enableHSTS) {
        response.headers.set(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload'
        );
    }

    // X-Frame-Options (legacy, but still useful)
    if (finalConfig.enableFrameOptions) {
        response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    }

    // X-XSS-Protection (legacy, but doesn't hurt)
    if (finalConfig.enableXSSProtection) {
        response.headers.set('X-XSS-Protection', '1; mode=block');
    }

    // X-Content-Type-Options
    if (finalConfig.enableContentTypeOptions) {
        response.headers.set('X-Content-Type-Options', 'nosniff');
    }

    // Referrer Policy
    if (finalConfig.enableReferrerPolicy) {
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    // Permissions Policy
    if (finalConfig.enablePermissionsPolicy) {
        response.headers.set('Permissions-Policy', buildPermissionsPolicy());
    }

    // Additional security headers
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('X-Download-Options', 'noopen');
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

    return response;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📄 NEXT.JS CONFIG HEADERS
// ═══════════════════════════════════════════════════════════════════════════════

export const securityHeadersConfig = [
    {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
    },
    {
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
    },
    {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
    },
    {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
    },
    {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
    },
    {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
    },
    {
        key: 'Permissions-Policy',
        value: buildPermissionsPolicy(),
    },
];

// For next.config.js
export function getSecurityHeaders() {
    return [
        {
            source: '/:path*',
            headers: securityHeadersConfig,
        },
    ];
}
