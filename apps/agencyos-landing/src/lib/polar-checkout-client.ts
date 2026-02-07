// Mock Polar.sh client until @agencyos/money is available
// This will be replaced with actual SDK implementation

export type CheckoutSessionParams = {
  priceId: string;
  successUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
};

export async function createCheckoutSession(params: CheckoutSessionParams) {
  // Mock implementation - replace with actual Polar.sh SDK
  // TODO: Integrate real Polar.sh SDK

  return {
    url: `https://polar.sh/checkout/${params.priceId}?success_url=${encodeURIComponent(params.successUrl)}`,
    id: `checkout_${Date.now()}`,
  };
}

export async function verifyWebhookSignature(
  _payload: string,
  _signature: string
): Promise<boolean> {
  // Mock implementation - replace with actual webhook verification
  // TODO: Implement real signature verification
  return true;
}
