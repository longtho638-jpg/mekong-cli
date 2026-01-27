/**
 * PayPal Webhook Verification
 *
 * Implements PayPal's webhook signature verification to prevent spoofing.
 * Reference: https://developer.paypal.com/api/rest/webhooks/
 */

import crypto from 'crypto';

interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  create_time: string;
  resource_type: string;
  resource: any;
  summary: string;
}

interface PayPalVerificationHeaders {
  'paypal-transmission-id': string;
  'paypal-transmission-time': string;
  'paypal-transmission-sig': string;
  'paypal-cert-url': string;
  'paypal-auth-algo': string;
}

/**
 * Environment validation
 */
if (!process.env.PAYPAL_WEBHOOK_ID) {
  throw new Error('PAYPAL_WEBHOOK_ID is missing. Create a webhook in PayPal Developer Dashboard.');
}

const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;

/**
 * Verify PayPal webhook signature using SDK
 *
 * This is the recommended approach using PayPal's official SDK.
 */
export async function verifyPayPalWebhookWithSDK(
  headers: PayPalVerificationHeaders,
  body: string | Buffer
): Promise<PayPalWebhookEvent> {
  try {
    // Import PayPal SDK (lazy load to avoid import errors if not installed)
    const { default: paypal } = await import('@paypal/checkout-server-sdk');

    const webhookVerify = {
      transmission_id: headers['paypal-transmission-id'],
      transmission_time: headers['paypal-transmission-time'],
      cert_url: headers['paypal-cert-url'],
      auth_algo: headers['paypal-auth-algo'],
      transmission_sig: headers['paypal-transmission-sig'],
      webhook_id: PAYPAL_WEBHOOK_ID,
      webhook_event: JSON.parse(body.toString())
    };

    // Verify using SDK
    const client = getPayPalClient();
    const request = new paypal.notifications.WebhookVerifySignature(webhookVerify);
    const response = await client.execute(request);

    if (response.result.verification_status === 'SUCCESS') {
      console.log('✅ PayPal webhook signature verified');
      return webhookVerify.webhook_event;
    } else {
      throw new Error('PayPal webhook verification failed');
    }
  } catch (error) {
    console.error('❌ PayPal webhook verification error:', error);
    throw new Error(`PayPal Webhook Verification Failed: ${(error as Error).message}`);
  }
}

/**
 * Manual PayPal signature verification (fallback method)
 *
 * Use this if you don't want to use the full PayPal SDK.
 */
export async function verifyPayPalWebhookManual(
  headers: PayPalVerificationHeaders,
  body: string | Buffer
): Promise<PayPalWebhookEvent> {
  try {
    const {
      'paypal-transmission-id': transmissionId,
      'paypal-transmission-time': transmissionTime,
      'paypal-transmission-sig': transmissionSig,
      'paypal-cert-url': certUrl,
      'paypal-auth-algo': authAlgo
    } = headers;

    // Validate required headers
    if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
      throw new Error('Missing required PayPal webhook headers');
    }

    // 1. Download the certificate from PayPal
    const certResponse = await fetch(certUrl);
    if (!certResponse.ok) {
      throw new Error(`Failed to download PayPal certificate: ${certResponse.status}`);
    }
    const certPem = await certResponse.text();

    // 2. Construct the expected message
    const expectedMessage = [
      transmissionId,
      transmissionTime,
      PAYPAL_WEBHOOK_ID,
      crc32(body.toString()) // PayPal uses CRC32 for body hash
    ].join('|');

    // 3. Verify signature
    const verifier = crypto.createVerify('SHA256');
    verifier.update(expectedMessage);
    verifier.end();

    const isValid = verifier.verify(certPem, transmissionSig, 'base64');

    if (!isValid) {
      throw new Error('PayPal webhook signature verification failed');
    }

    console.log('✅ PayPal webhook signature verified (manual method)');
    return JSON.parse(body.toString());
  } catch (error) {
    console.error('❌ PayPal manual verification error:', error);
    throw new Error(`PayPal Manual Verification Failed: ${(error as Error).message}`);
  }
}

/**
 * CRC32 implementation for PayPal body hash
 */
function crc32(str: string): number {
  const table = makeCRCTable();
  let crc = 0 ^ -1;

  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ str.charCodeAt(i)) & 0xff];
  }

  return (crc ^ -1) >>> 0;
}

function makeCRCTable(): number[] {
  let c: number;
  const crcTable: number[] = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }
  return crcTable;
}

/**
 * Get PayPal client (sandbox or live)
 */
function getPayPalClient() {
  const { default: paypal } = require('@paypal/checkout-server-sdk');

  const mode = process.env.PAYPAL_MODE || 'sandbox';
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials missing. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.');
  }

  const environment =
    mode === 'live'
      ? new paypal.core.LiveEnvironment(clientId, clientSecret)
      : new paypal.core.SandboxEnvironment(clientId, clientSecret);

  return new paypal.core.PayPalHttpClient(environment);
}

/**
 * Unified PayPal verification (tries SDK first, falls back to manual)
 */
export async function verifyPayPalWebhook(
  headers: PayPalVerificationHeaders,
  body: string | Buffer
): Promise<PayPalWebhookEvent> {
  try {
    // Try SDK method first (recommended)
    return await verifyPayPalWebhookWithSDK(headers, body);
  } catch (sdkError) {
    console.warn('⚠️  PayPal SDK verification failed, trying manual method...', sdkError);

    // Fallback to manual verification
    return await verifyPayPalWebhookManual(headers, body);
  }
}
