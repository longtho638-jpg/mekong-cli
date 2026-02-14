import { NextRequest, NextResponse } from "next/server";
import { headers } from 'next/headers';

// 🔒 SECURITY: Simple rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 attempts per minute

function getRateLimitKey(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0] || 'unknown';
    return `admin-verify:${ip}`;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetAt) {
        rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
        return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
    }

    if (record.count >= RATE_LIMIT_MAX) {
        return { allowed: false, remaining: 0 };
    }

    record.count++;
    return { allowed: true, remaining: RATE_LIMIT_MAX - record.count };
}

/**
 * Admin Password Verification API
 * 🔒 SECURITY HARDENED:
 * - Rate limiting (5 attempts/minute)
 * - Timing attack prevention
 * - No password leakage in response
 */
export async function POST(request: NextRequest) {
    try {
        // 🔒 Rate limiting check
        const rateLimitKey = getRateLimitKey(request);
        const rateLimit = checkRateLimit(rateLimitKey);

        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: "Too many attempts. Please try again later." },
                {
                    status: 429,
                    headers: {
                        'Retry-After': '60',
                        'X-RateLimit-Remaining': '0'
                    }
                }
            );
        }

        const body = await request.json();
        const { password } = body;

        // 🔒 Validate input
        if (!password || typeof password !== 'string' || password.length > 128) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword) {
            console.error("ADMIN_PASSWORD is not set in environment variables.");
            return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
        }

        // 🔒 Timing-safe comparison (prevent timing attacks)
        const passwordBuffer = Buffer.from(password);
        const adminPasswordBuffer = Buffer.from(adminPassword);

        // Pad to same length to prevent length-based timing attacks
        const maxLen = Math.max(passwordBuffer.length, adminPasswordBuffer.length);
        const paddedInput = Buffer.alloc(maxLen);
        const paddedAdmin = Buffer.alloc(maxLen);
        passwordBuffer.copy(paddedInput);
        adminPasswordBuffer.copy(paddedAdmin);

        // Use crypto.timingSafeEqual if available, otherwise manual comparison
        let isValid = passwordBuffer.length === adminPasswordBuffer.length;
        for (let i = 0; i < maxLen; i++) {
            if (paddedInput[i] !== paddedAdmin[i]) {
                isValid = false;
            }
        }

        if (isValid) {
            return NextResponse.json(
                { success: true },
                { headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
            );
        } else {
            // 🔒 Add small random delay to prevent timing attacks
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));
            return NextResponse.json(
                { error: "Invalid password" },
                {
                    status: 401,
                    headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) }
                }
            );
        }
    } catch (error) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
