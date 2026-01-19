import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  rateLimitMiddleware,
  securityHeaders,
  isValidEmail,
  validatePassword,
  sanitizeInput,
  validateOrigin,
  handleSecureError,
} from "@/lib/security";

// POST /api/auth/signup - Handle signup with referral
export async function POST(request: NextRequest) {
  try {
    // Validate CORS
    if (!validateOrigin(request)) {
      return securityHeaders(
        NextResponse.json({ error: "Invalid origin" }, { status: 403 }),
      );
    }

    // Apply rate limiting
    const rateLimitResult = rateLimitMiddleware("/api/auth/signup");
    if (rateLimitResult) {
      const rateLimitResponse = rateLimitResult(request);
      if (rateLimitResponse instanceof NextResponse) {
        return securityHeaders(rateLimitResponse);
      }
    }

    const supabase = await createClient();
    const body = await request.json();

    const { email, password, name, plan = "free", referral_code } = body;

    // Input validation
    if (!email || !password) {
      return securityHeaders(
        NextResponse.json(
          { error: "Email and password are required" },
          { status: 400 },
        ),
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return securityHeaders(
        NextResponse.json({ error: "Invalid email format" }, { status: 400 }),
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return securityHeaders(
        NextResponse.json(
          { error: passwordValidation.errors.join(", ") },
          { status: 400 },
        ),
      );
    }

    // Sanitize inputs
    const sanitizedName = sanitizeInput(name || "");
    const sanitizedReferralCode = sanitizeInput(referral_code || "");

    // Sign up user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: sanitizedName,
          plan,
          referral_code: sanitizedReferralCode, // Store for processing after org creation
        },
      },
    });

    if (error) {
      return securityHeaders(
        NextResponse.json({ error: error.message }, { status: 400 }),
      );
    }

    // If referral code provided, process after trigger creates org
    if (sanitizedReferralCode && data.user) {
      // This will be processed by a database trigger
      // For now, we just note that a referral was used
    }

    return securityHeaders(
      NextResponse.json(
        {
          user: data.user,
          message: "Check your email for confirmation",
        },
        { status: 201 },
      ),
    );
  } catch (error) {
    return handleSecureError(error, "auth/signup");
  }
}
