import type { VercelRequest, VercelResponse } from "@vercel/node";

// Fallback promo codes
const FALLBACK_CODES: Record<
  string,
  { discount: number; type: "percentage" | "fixed"; name: string }
> = {
  FOUNDER100: { discount: 100, type: "percentage", name: "Founder Edition" },
  MEKONG: { discount: 100, type: "percentage", name: "Internal Use" },
  VIP100: { discount: 100, type: "percentage", name: "VIP Access" },
  LAUNCH100: { discount: 100, type: "percentage", name: "Launch Day" },
  AGENCYOS100: { discount: 100, type: "percentage", name: "AgencyOS Launch" },
  VIPFREE: { discount: 100, type: "percentage", name: "VIP Free Access" },
  BETA50: { discount: 50, type: "percentage", name: "Beta Tester" },
  AFFILIATE50: { discount: 50, type: "percentage", name: "Affiliate Special" },
  WELCOME25: { discount: 25, type: "percentage", name: "Welcome Discount" },
  LAUNCH20: { discount: 20, type: "percentage", name: "Launch Discount" },
  EARLYBIRD: { discount: 30, type: "percentage", name: "Early Bird" },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { code } = req.body;

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        valid: false,
        error: "Promo code is required",
      });
    }

    const normalizedCode = code.trim().toUpperCase();

    // Check fallback codes
    const fallback = FALLBACK_CODES[normalizedCode];
    if (fallback) {
      return res.status(200).json({
        valid: true,
        source: "fallback",
        discountId: null,
        code: normalizedCode,
        name: fallback.name,
        type: fallback.type,
        value: fallback.discount,
        currency: "usd",
        duration: "once",
        note: "Fallback code - applied at checkout",
      });
    }

    // Check pattern-based codes (AGENCYOS-XXXX-XXXX)
    const patternMatch = /^AGENCYOS-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(
      normalizedCode,
    );
    if (patternMatch) {
      return res.status(200).json({
        valid: true,
        source: "pattern",
        discountId: null,
        code: normalizedCode,
        name: "Agency Launch Code",
        type: "percentage",
        value: 100,
        currency: "usd",
        duration: "once",
      });
    }

    return res.status(400).json({
      valid: false,
      error: "Invalid promo code",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown validation error";
    return res.status(500).json({
      valid: false,
      error: "Failed to validate promo code",
    });
  }
}
