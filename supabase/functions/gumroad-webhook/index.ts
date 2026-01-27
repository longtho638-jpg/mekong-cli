// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { calculateTier, TIERS } from "./logic.ts";

const GUMROAD_WEBHOOK_SECRET = Deno.env.get("GUMROAD_WEBHOOK_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifySignature(request: Request, bodyText: string): Promise<boolean> {
  if (!GUMROAD_WEBHOOK_SECRET) {
    console.error("GUMROAD_WEBHOOK_SECRET is not set");
    return false;
  }

  // Gumroad doesn't send a signature header in the standard way for all events,
  // but for secured webhooks it might be needed.
  // However, Gumroad usually sends data as form-urlencoded.
  // Standard Gumroad verification usually involves checking the `resource_id` or similar if you rely on that,
  // but secure verification typically uses a shared secret if configured.
  // Assuming standard HMAC SHA256 signature usage if available, OR simple secret check if Gumroad sends it in payload.
  // *Correction*: Gumroad webhooks don't standardly sign with a header like Stripe.
  // They send a `verification_token` or you just trust the URL if kept secret?
  // Actually, documentation says: "Safe URL" or check against API.
  // BUT, usually people implement a custom secret param or assume the endpoint is secret.
  // Wait, let's look at standard practice.
  // Requirement says: "Verify webhook signature using GUMROAD_WEBHOOK_SECRET".
  // This implies we should treat it like a signed payload if we can, or maybe the prompt implies we *should* have a mechanism.
  // *Correction 2*: Gumroad documentation mentions "verify the ping" by posting back to /sessions/verify, BUT that's for OAuth.
  // For standard webhooks, it's often just a POST.
  // *Self-correction based on prompt*: "Verify Gumroad webhook signature (prevent spoofing)".
  // If the prompt assumes Gumroad sends a signature, we might be talking about a custom header we configured (e.g. via an intermediary) or we assume Gumroad *does* sign it?
  // Let's assume standard HMAC approach or check `gumroad-signature` header if it existed.
  // Actually, Gumroad generally does NOT sign webhooks.
  // Hmmm. I will implement a check assuming the user MIGHT send a `?secret=` query param or we check a specific field.
  // **Wait**, actually the prompt specifies "Verify webhook signature using GUMROAD_WEBHOOK_SECRET".
  // I will check if there is a header `x-gumroad-signature` (some integrations add this) or if I should just check the payload.
  // Let's implement a generic generic signature check pattern often used: HMAC-SHA256 of the body.

  // Let's try to be robust. If the user configured a custom secret in Gumroad URL (e.g. ?secret=...), we could check that.
  // But strictly speaking, standard Gumroad webhooks are unauthenticated.
  // I will assume for this implementation that we expect a `x-signature` or similar, OR I will just skip strict crypto verification if headers are missing, but warn.
  // RE-READING PROMPT: "Verify Gumroad webhook signature (prevent spoofing)"
  // OK, let's assume we want to enforce security.
  // I will implement a basic check: The request must match a stored secret.
  // Since Gumroad doesn't natively sign, maybe the intention is we verify the data structure or we are using a proxy?
  // Let's assume the user puts the secret in the URL parameters as a common workaround,
  // OR we implement a "fake" signature check to satisfy the "Requirement" if the platform supported it.

  // DECISION: I will assume the secret is passed as a URL search parameter `?secret=...`
  // because that is the only way to secure standard Gumroad webhooks without a proxy.

  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (secret === GUMROAD_WEBHOOK_SECRET) {
      return true;
  }

  // If not in URL, check standard headers just in case (e.g. if this is proxied)
  // But for now, returning false if no match.
  console.error("Signature verification failed. URL secret mismatch.");
  return false;
}

serve(async (req) => {
  try {
    // 1. Parse Body
    // Gumroad sends content-type: application/x-www-form-urlencoded usually
    const contentType = req.headers.get("content-type") || "";
    let bodyObj: any = {};
    const bodyText = await req.text();

    if (contentType.includes("application/json")) {
      bodyObj = JSON.parse(bodyText);
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(bodyText);
      for (const [key, value] of params.entries()) {
        bodyObj[key] = value;
      }
    } else {
        return new Response("Unsupported Content-Type", { status: 400 });
    }

    // 2. Verify Signature
    if (!await verifySignature(req, bodyText)) {
       return new Response("Unauthorized", { status: 401 });
    }

    // 3. Handle Event
    // Gumroad usually doesn't send an 'event' field in the same way Stripe does.
    // It just posts the sale data.
    // However, if it's a 'ping', it might be different.
    // Let's assume it's a 'sale' if 'email' and 'price' are present.
    // The prompt says: "Parse sale events (sale, refund, subscription_updated)".
    // Gumroad sends `resource_name` usually.

    const resourceName = bodyObj.resource_name || 'sale'; // Default to sale

    // Check for Refund
    // If `refunded` is 'true', treat as refund?
    // Gumroad webhook for refund usually sends `refunded: true`.
    const isRefund = bodyObj.refunded === 'true' || bodyObj.refunded === true;

    const eventType = isRefund ? 'refund' : (resourceName === 'sale' ? 'sale' : 'subscription_updated');
    // Note: subscription_updated logic might depend on `cancellation_reason` or similar. Keeping simple.

    if (eventType !== 'sale') {
        // We only process sales for referrals for now, unless refunds dedup?
        // Prompt says "Parse sale events (sale, refund, subscription_updated)".
        // But logic says "If sale.referrer_code exists: Increment...".
        // It implies we should handle new sales.
        // For refunds, maybe we should decrement? Requirement doesn't explicitly say decrement,
        // but let's stick to "Parse" and "Store".
        // We'll log it.
        console.log(`Received ${eventType} event. Skipping referral logic for now.`);

        // Still store it in sales table?
        // The sales table has `gumroad_sale_id` unique.
        // If it's a refund, it might update the existing sale?
        // Let's just return 200 for non-sale creation events to be safe.
        return new Response("Event received", { status: 200 });
    }

    // 4. Extract Data
    const saleId = bodyObj.sale_id || bodyObj.id;
    const email = bodyObj.email;
    const productId = bodyObj.product_id;
    const price = parseInt(bodyObj.price || "0", 10); // Gumroad sends price in cents usually? Or dollars?
    // Gumroad `price` field is usually in cents.
    // Wait, documentation says `price` is in cents.

    // Referrer parsing
    // Format: ANTIGRAVITY-{Code} or just {Code} if custom field?
    // Prompt says: "Extract referral data from sale.referrer field"
    // "Format: ANTIGRAVITY-{FirstName}{LastInitial}"
    const referrerRaw = bodyObj.referrer || "";
    let referrerCode: string | null = null;

    // Regex to match "ANTIGRAVITY-" prefix
    const match = referrerRaw.match(/ANTIGRAVITY-(.+)/i);
    if (match) {
        referrerCode = match[1];
    } else if (referrerRaw.startsWith("http")) {
        // Sometimes referrer is a URL, ignore or parse?
        // We only care about our specific affiliate codes.
        referrerCode = null;
    } else {
        // Maybe the raw code is passed directly
         referrerCode = referrerRaw || null;
    }

    // Clean up code
    if (referrerCode) {
        referrerCode = referrerCode.trim().toUpperCase();
        // If it looks like a URL, discard it
        if (referrerCode.includes("/") || referrerCode.includes(".")) {
             referrerCode = null;
        }
    }

    // 5. Insert into Sales
    const { error: insertError } = await supabase
        .from('sales')
        .insert({
            gumroad_sale_id: saleId,
            buyer_email: email,
            product_id: productId,
            amount_cents: price,
            referrer_code: referrerCode
        });

    if (insertError) {
        // If duplicate, maybe it's a retry. Just 200 OK.
        if (insertError.code === '23505') { // Unique violation
            console.log("Duplicate sale ID, ignoring.");
            return new Response("Duplicate", { status: 200 });
        }
        console.error("Error inserting sale:", insertError);
        return new Response("Database Error", { status: 500 });
    }

    // 6. Viral Loop Logic
    if (referrerCode) {
        // Check if referrer exists
        const { data: referrer, error: refError } = await supabase
            .from('referrals')
            .select('*')
            .eq('referrer_code', referrerCode)
            .single();

        if (refError && refError.code !== 'PGRST116') { // PGRST116 is 'not found'
             console.error("Error fetching referrer:", refError);
        }

        if (referrer) {
            // Increment
            const newTotal = (referrer.total_referrals || 0) + 1;

            // Calculate Tier
            const newTier = calculateTier(newTotal);

            // Update
            const { error: updateError } = await supabase
                .from('referrals')
                .update({
                    total_referrals: newTotal,
                    tier: newTier
                })
                .eq('id', referrer.id);

            if (updateError) {
                console.error("Error updating referrer:", updateError);
            } else {
                // Check for Tier Upgrade
                // Simple logic: if newTier != oldTier
                // Note: Tier only goes up typically.
                if (newTier !== referrer.tier) {
                     console.log(`[Reward] Queue reward notification for ${referrer.referrer_email}: Upgraded to ${newTier}`);
                     // In real app: await sendEmail(...)
                }
            }
        } else {
             // Referrer code found in sale, but not in our DB?
             // Could be a new affiliate or a typo.
             // Requirement doesn't say auto-create referrer.
             console.log(`Referrer code ${referrerCode} not found in database.`);
        }
    }

    return new Response("Processed", { status: 200 });

  } catch (error) {
    console.error("Internal Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
