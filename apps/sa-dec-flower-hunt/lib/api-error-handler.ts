import { NextResponse } from 'next/server';

/**
 * Error Handling Utility for Next.js API Routes
 * 
 * Provides consistent error handling, logging, and retry logic
 */

export interface ApiError {
    statusCode: number;
    message: string;
    details?: any;
}

export class AppError extends Error {
    statusCode: number;
    details?: any;

    constructor(message: string, statusCode: number = 500, details?: any) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.details = details;
    }
}

/**
 * Wraps an API route handler with error handling
 * 
 * @example
 * export const GET = withErrorHandling(async (request) => {
 *   const data = await fetchSomeData();
 *   return NextResponse.json(data);
 * });
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<Response>>(
    handler: T
): T {
    return (async (...args: any[]) => {
        try {
            return await handler(...args);
        } catch (error: any) {
            console.error('[API Error]', {
                error: error.message,
                stack: error.stack,
                details: error.details,
                timestamp: new Date().toISOString(),
            });

            // Handle known AppError
            if (error instanceof AppError) {
                return NextResponse.json(
                    {
                        error: error.message,
                        details: error.details,
                    },
                    { status: error.statusCode }
                );
            }

            // Handle unknown errors
            return NextResponse.json(
                {
                    error: 'Internal Server Error',
                    message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
                },
                { status: 500 }
            );
        }
    }) as T;
}

/**
 * Retry wrapper for flaky operations (DB, external APIs)
 * 
 * @example
 * const data = await withRetry(() => supabase.from('users').select(), { maxRetries: 3 });
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: {
        maxRetries?: number;
        delay?: number;
        backoff?: boolean;
    } = {}
): Promise<T> {
    const { maxRetries = 3, delay = 1000, backoff = true } = options;

    let lastError: any;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            console.warn(`[Retry] Attempt ${attempt + 1}/${maxRetries} failed:`, error);

            if (attempt < maxRetries - 1) {
                const waitTime = backoff ? delay * Math.pow(2, attempt) : delay;
                await new Promise((resolve) => setTimeout(resolve, waitTime));
            }
        }
    }

    throw lastError;
}

/**
 * Validates required environment variables
 * 
 * @example
 * validateEnv(['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
 */
export function validateEnv(keys: string[]): void {
    const missing = keys.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        throw new AppError(
            `Missing required environment variables: ${missing.join(', ')}`,
            500,
            { missingKeys: missing }
        );
    }
}

/**
 * Rate limit helper (simple in-memory, for demo)
 * 
 * @example
 * if (!checkRateLimit('user-123', 10, 60000)) {
 *   throw new AppError('Too many requests', 429);
 * }
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
    identifier: string,
    maxRequests: number,
    windowMs: number
): boolean {
    const now = Date.now();
    const record = rateLimitStore.get(identifier);

    if (!record || now > record.resetAt) {
        rateLimitStore.set(identifier, {
            count: 1,
            resetAt: now + windowMs,
        });
        return true;
    }

    if (record.count >= maxRequests) {
        return false;
    }

    record.count++;
    return true;
}
