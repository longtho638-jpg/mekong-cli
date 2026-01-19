/**
 * 💳 PayPal SDK v6 Client
 * =======================
 * Replaces Polar for payments.
 * Uses PayPal REST API v2.
 */

// PayPal API endpoints
const PAYPAL_API = {
  sandbox: "https://api-m.sandbox.paypal.com",
  live: "https://api-m.paypal.com",
};

// Get base URL based on environment
const getBaseUrl = () => {
  return process.env.PAYPAL_MODE === "live"
    ? PAYPAL_API.live
    : PAYPAL_API.sandbox;
};

// PayPal pricing tiers
export const PAYPAL_PRODUCTS = {
  starter: "newsletter_starter",
  pro: "newsletter_pro",
  agency: "newsletter_agency",
};

export const PAYPAL_PRICES = {
  starter: { monthly: 29, yearly: 290 },
  pro: { monthly: 99, yearly: 990 },
  agency: { monthly: 299, yearly: 2990 },
};

export const PLAN_LIMITS = {
  starter: { subscribers: 5000, emails_per_month: 20000 },
  pro: { subscribers: 25000, emails_per_month: 100000 },
  agency: { subscribers: 100000, emails_per_month: 500000 },
};

// Get PayPal access token
async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const baseUrl = getBaseUrl();

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to get PayPal access token: ${response.statusText}`,
    );
  }

  const data = await response.json();
  return data.access_token;
}

// Create order for checkout
export async function createOrder(params: {
  amount: number;
  currency?: string;
  description: string;
  returnUrl?: string;
  cancelUrl?: string;
}): Promise<{ orderId: string; approvalUrl: string }> {
  const {
    amount,
    currency = "USD",
    description,
    returnUrl,
    cancelUrl,
  } = params;
  const accessToken = await getAccessToken();
  const baseUrl = getBaseUrl();

  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
          description,
        },
      ],
      application_context: {
        return_url:
          returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
        cancel_url:
          cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create PayPal order: ${JSON.stringify(error)}`);
  }

  const order = await response.json();
  const approvalUrl = order.links.find(
    (link: { rel: string }) => link.rel === "approve",
  )?.href;

  return {
    orderId: order.id,
    approvalUrl: approvalUrl || "",
  };
}

// Capture order after approval
export async function captureOrder(orderId: string): Promise<{
  transactionId: string;
  status: string;
  payerEmail: string;
  amount: number;
}> {
  const accessToken = await getAccessToken();
  const baseUrl = getBaseUrl();

  const response = await fetch(
    `${baseUrl}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to capture PayPal order: ${JSON.stringify(error)}`);
  }

  const capture = await response.json();
  const payment = capture.purchase_units?.[0]?.payments?.captures?.[0];

  return {
    transactionId: capture.id,
    status: capture.status,
    payerEmail: capture.payer?.email_address || "",
    amount: parseFloat(payment?.amount?.value || "0"),
  };
}

// Get client token for SDK v6 frontend
export async function getClientToken(): Promise<string> {
  const accessToken = await getAccessToken();
  const baseUrl = getBaseUrl();

  const response = await fetch(`${baseUrl}/v1/identity/generate-token`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    // Fallback for basic integration without client token
    return "";
  }

  const data = await response.json();
  return data.client_token;
}
