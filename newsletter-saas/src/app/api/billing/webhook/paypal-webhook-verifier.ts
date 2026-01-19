/**
 * PayPal Webhook Signature Verification
 * Implements PayPal's webhook signature verification for security
 * @see https://developer.paypal.com/api/rest/webhooks/rest/
 */

import crypto from "crypto";

export interface PayPalWebhookVerificationInput {
  transmissionId: string;
  transmissionTime: string;
  certUrl: string;
  authAlgo: string;
  transmissionSig: string;
  webhookId: string;
  webhookEvent: unknown;
}

/**
 * Verifies PayPal webhook signature using RSASSA-PSS algorithm
 * @returns true if signature is valid, false otherwise
 */
export async function verifyPayPalWebhookSignature(
  input: PayPalWebhookVerificationInput
): Promise<boolean> {
  try {
    const {
      transmissionId,
      transmissionTime,
      certUrl,
      authAlgo,
      transmissionSig,
      webhookId,
      webhookEvent,
    } = input;

    // Validate required fields
    if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig || !webhookId) {
      console.error("[PayPal Webhook] Missing required verification fields");
      return false;
    }

    // Validate cert URL is from PayPal (security check)
    if (!certUrl.startsWith("https://api.paypal.com/") && !certUrl.startsWith("https://api.sandbox.paypal.com/")) {
      console.error("[PayPal Webhook] Invalid cert URL origin:", certUrl);
      return false;
    }

    // SECURITY: Whitelist allowed algorithms to prevent algorithm substitution attacks
    const ALLOWED_ALGORITHMS = ["SHA256withRSA", "RSA-SHA256"];
    if (!ALLOWED_ALGORITHMS.includes(authAlgo)) {
      console.error("[PayPal Webhook] Invalid auth algorithm:", authAlgo);
      return false;
    }

    // Fetch public key certificate from PayPal
    const certResponse = await fetch(certUrl);
    if (!certResponse.ok) {
      console.error("[PayPal Webhook] Failed to fetch certificate");
      return false;
    }
    const cert = await certResponse.text();

    // Construct expected signed payload
    const signedPayload = `${transmissionId}|${transmissionTime}|${webhookId}|${crc32(JSON.stringify(webhookEvent))}`;

    // Verify signature
    const verifier = crypto.createVerify(authAlgo);
    verifier.update(signedPayload);
    const isValid = verifier.verify(cert, transmissionSig, "base64");

    if (!isValid) {
      console.error("[PayPal Webhook] Signature verification failed");
    }

    return isValid;
  } catch (error) {
    console.error("[PayPal Webhook] Verification error:", error);
    return false;
  }
}

/**
 * Calculate CRC32 checksum for webhook event body
 * PayPal uses CRC32 as part of signature calculation
 */
function crc32(str: string): number {
  const crcTable = makeCRCTable();
  let crc = 0 ^ (-1);

  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xff];
  }

  return (crc ^ (-1)) >>> 0;
}

function makeCRCTable(): number[] {
  let c;
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    crcTable[n] = c;
  }
  return crcTable;
}

/**
 * Extract PayPal webhook verification headers from request
 */
export function extractPayPalWebhookHeaders(headers: Headers): {
  transmissionId: string | null;
  transmissionTime: string | null;
  certUrl: string | null;
  authAlgo: string | null;
  transmissionSig: string | null;
} {
  return {
    transmissionId: headers.get("paypal-transmission-id"),
    transmissionTime: headers.get("paypal-transmission-time"),
    certUrl: headers.get("paypal-cert-url"),
    authAlgo: headers.get("paypal-auth-algo"),
    transmissionSig: headers.get("paypal-transmission-sig"),
  };
}
