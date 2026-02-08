// Polar.sh client stub — replaced by @agencyos/money SDK when available

export type CheckoutSessionParams = {
  priceId: string;
  successUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
};

export type CheckoutSession = {
  url: string;
  id: string;
};

export async function createCheckoutSession(
  params: CheckoutSessionParams
): Promise<CheckoutSession> {
  // Stub: generates a direct Polar.sh checkout URL
  return {
    url: `https://polar.sh/checkout/${params.priceId}?success_url=${encodeURIComponent(params.successUrl)}`,
    id: `checkout_${Date.now()}`,
  };
}

export async function verifyWebhookSignature(
  payload: string,
  signature: string
): Promise<boolean> {
  // Stub: accepts any valid payload+signature pair
  // Replace with HMAC-SHA256 verification against POLAR_WEBHOOK_SECRET
  return !!(payload && signature);
}
