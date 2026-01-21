import { NextRequest, NextResponse } from "next/server";

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  max: number;
  window: number; // in milliseconds
}

const rateLimitConfigs: Record<string, RateLimitConfig> = {
  "/api/auth/signup": { max: 5, window: 15 * 60 * 1000 }, // 5 per 15 minutes
  "/api/billing/checkout": { max: 10, window: 60 * 1000 }, // 10 per minute
  "/api/email/send": { max: 20, window: 60 * 1000 }, // 20 per minute
};

export function rateLimit(
  identifier: string,
  config: RateLimitConfig,
): { success: boolean; remaining?: number; reset?: number } {
  const now = Date.now();
  const key = identifier;

  // Clean expired entries
  if (rateLimitStore.has(key)) {
    const entry = rateLimitStore.get(key)!;
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }

  // Check current limit
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.window,
    });
    return {
      success: true,
      remaining: config.max - 1,
      reset: now + config.window,
    };
  }

  const entry = rateLimitStore.get(key)!;

  if (entry.count >= config.max) {
    return {
      success: false,
      remaining: 0,
      reset: entry.resetTime,
    };
  }

  entry.count++;
  return {
    success: true,
    remaining: config.max - entry.count,
    reset: entry.resetTime,
  };
}

export function getClientIdentifier(request: NextRequest): string {
  // Use IP address for rate limiting (in production, consider user ID when authenticated)
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : request.ip || "unknown";
  return ip;
}

export function rateLimitMiddleware(pathname: string) {
  const config = rateLimitConfigs[pathname];
  if (!config) return null;

  return (request: NextRequest) => {
    const identifier = getClientIdentifier(request);
    const result = rateLimit(identifier, config);

    if (!result.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": config.max.toString(),
            "X-RateLimit-Remaining": result.remaining?.toString() || "0",
            "X-RateLimit-Reset": result.reset?.toString() || "0",
            "Retry-After": Math.ceil(
              (result.reset! - Date.now()) / 1000,
            ).toString(),
          },
        },
      );
    }

    // Add rate limit headers to successful responses
    const headers = new Headers();
    headers.set("X-RateLimit-Limit", config.max.toString());
    headers.set("X-RateLimit-Remaining", result.remaining?.toString() || "0");
    headers.set("X-RateLimit-Reset", result.reset?.toString() || "0");

    return { headers };
  };
}

// Security headers middleware
export function securityHeaders(response: NextResponse): NextResponse {
  const headers = response.headers;

  // Prevent clickjacking
  headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  headers.set("X-Content-Type-Options", "nosniff");

  // XSS Protection
  headers.set("X-XSS-Protection", "1; mode=block");

  // Content Security Policy
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self'; " +
      "connect-src 'self' https://api.paypal.com ",
  );

  // Referrer Policy
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy
  headers.set(
    "Permissions-Policy",
    "geolocation=(), " +
      "microphone=(), " +
      "camera=(), " +
      "payment=(), " +
      "usb=()",
  );

  return response;
}

// Input validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function isValidPlan(plan: string): boolean {
  const validPlans = ["free", "starter", "pro", "enterprise"];
  return validPlans.includes(plan);
}

export function isValidBillingCycle(billing: string): boolean {
  return billing === "monthly" || billing === "yearly";
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, "") // Remove scripts
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "") // Remove iframes
    .replace(/javascript:/gi, "") // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .trim()
    .substring(0, 1000); // Limit length
}

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (password.length > 128) {
    errors.push("Password must be less than 128 characters long");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return { valid: errors.length === 0, errors };
}

// CORS validation
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");

  if (!origin) return true; // Same-origin requests don't have Origin header

  if (process.env.NODE_ENV !== "production") {
    return true; // Allow all in development
  }

  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    "https://newsletter-saas.vercel.app",
    "https://www.newsletter-saas.com",
  ].filter(Boolean);

  return allowedOrigins.includes(origin);
}

// Error handler that doesn't leak sensitive information
export function handleSecureError(
  error: unknown,
  context: string,
): NextResponse {
  console.error(`Error in ${context}:`, error);

  // Don't leak sensitive error details in production
  const isDevelopment = process.env.NODE_ENV !== "production";
  const message =
    isDevelopment && error instanceof Error
      ? error.message
      : "An unexpected error occurred";

  return NextResponse.json({ error: message }, { status: 500 });
}
