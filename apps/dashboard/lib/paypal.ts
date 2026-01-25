/**
 * PayPal SDK Configuration & Helpers
 *
 * Server-side PayPal REST API client setup for order creation and payment capture.
 * Uses PayPal REST SDK for backend operations.
 */

// Environment configuration
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';

// PayPal API base URLs
const PAYPAL_API_BASE = {
  sandbox: 'https://api-m.sandbox.paypal.com',
  live: 'https://api-m.paypal.com'
} as const;

const API_BASE = PAYPAL_API_BASE[PAYPAL_MODE as keyof typeof PAYPAL_API_BASE];

/**
 * Generate PayPal OAuth access token
 */
export async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error(`Failed to get PayPal access token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create PayPal order
 */
export async function createOrder(amount: string, currency: string = 'USD') {
  const accessToken = await getAccessToken();

  const response = await fetch(`${API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount
          }
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create PayPal order: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Capture PayPal order payment
 */
export async function captureOrder(orderId: string) {
  const accessToken = await getAccessToken();

  const response = await fetch(`${API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to capture PayPal order: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Get order details
 */
export async function getOrderDetails(orderId: string) {
  const accessToken = await getAccessToken();

  const response = await fetch(`${API_BASE}/v2/checkout/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get PayPal order details: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Verify webhook signature
 */
export async function verifyWebhookSignature(
  webhookId: string,
  headers: Record<string, string>,
  body: string
): Promise<boolean> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      transmission_id: headers['paypal-transmission-id'],
      transmission_time: headers['paypal-transmission-time'],
      cert_url: headers['paypal-cert-url'],
      auth_algo: headers['paypal-auth-algo'],
      transmission_sig: headers['paypal-transmission-sig'],
      webhook_id: webhookId,
      webhook_event: JSON.parse(body)
    })
  });

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  return data.verification_status === 'SUCCESS';
}

export const paypalConfig = {
  mode: PAYPAL_MODE,
  clientId: PAYPAL_CLIENT_ID,
  currency: 'USD'
} as const;
