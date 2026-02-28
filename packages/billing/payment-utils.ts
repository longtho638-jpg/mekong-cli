/**
 * Payment utilities — signature verification, cart validation, order total calculation.
 * Provider-agnostic: works with PayOS, Stripe, or any HMAC-SHA256 webhook provider.
 */

import crypto from 'crypto';

/**
 * Verify webhook signature using HMAC-SHA256 (timing-safe)
 * @param payload - Raw webhook payload string
 * @param signature - Signature from webhook headers
 * @param secret - Webhook checksum/signing key
 * @returns boolean — true if signature matches
 */
export function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Signature verification error:', message);
    return false;
  }
}

export interface CartItem {
  id: string;
  quantity: number;
  price?: number;
}

export interface ValidatedItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

/**
 * Validate cart items against a product lookup function.
 * Prevents price tampering by using server-side prices.
 * @param cartItems - Items from client
 * @param lookupProducts - Function that returns products by IDs from your database
 * @returns Validated items with correct server-side prices
 */
export async function validateCartItems(
  cartItems: CartItem[],
  lookupProducts: (ids: string[]) => Promise<Array<{ id: string; price: number; name: string }>>
): Promise<ValidatedItem[]> {
  const ids = cartItems.map(item => item.id);
  const products = await lookupProducts(ids);

  const productMap = new Map(products.map(p => [p.id, p]));
  const validatedItems: ValidatedItem[] = [];

  for (const item of cartItems) {
    const product = productMap.get(item.id);
    if (!product) {
      throw new Error(`Invalid product: ${item.id}`);
    }
    validatedItems.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity
    });
  }

  return validatedItems;
}

/**
 * Calculate order total from validated items
 */
export function calculateOrderTotal(items: ValidatedItem[]): number {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

/**
 * Detect price tampering — compare client-submitted amount vs server-calculated
 * @param clientAmount - Amount submitted by client
 * @param serverAmount - Amount calculated server-side
 * @param toleranceThreshold - Max allowed difference (default 1000 = ~$0.04 USD for VND)
 * @returns true if price mismatch detected
 */
export function detectPriceTampering(
  clientAmount: number,
  serverAmount: number,
  toleranceThreshold = 1000
): boolean {
  return Math.abs(clientAmount - serverAmount) > toleranceThreshold;
}
