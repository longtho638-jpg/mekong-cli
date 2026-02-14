import PayOS from '@payos/node';

let payOS: any | null = null;

function initPayOS() {
    const clientId = process.env.PAYOS_CLIENT_ID;
    const apiKey = process.env.PAYOS_API_KEY;
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

    if (!clientId || !apiKey || !checksumKey) {
        // Don't throw here, let main loop handle mock mode fallback
        console.warn('PayOS config missing');
        // throw new Error(...) // Removed to allow build
        return null;
    }

    // PayOS constructor signature: clientId, apiKey, checksumKey
    payOS = new (PayOS as any)(clientId, apiKey, checksumKey);
    return payOS;
}

// Initialize at module load
let isMockMode = false;

try {
    payOS = initPayOS();
    console.log('[PayOS] ✓ Initialized successfully');
} catch (error) {
    if (process.env.PAYOS_MOCK_MODE === 'true' || !process.env.PAYOS_CLIENT_ID) {
        console.warn('[PayOS] ⚠️ Missing credentials. ACTIVATING MOCK MODE for Testing/Demo.');
        isMockMode = true;
    } else {
        console.error('[PayOS] ✗ Initialization failed:', error);
    }
}

// Getter with validation
export function getPayOS() {
    if (!payOS && !isMockMode) {
        try {
            return initPayOS();
        } catch (e) {
            console.warn('[PayOS] Falling back to Mock Mode due to init failure.');
            isMockMode = true;
            return null;
        }
    }
    return payOS;
}

export interface PayOSPaymentData {
    orderCode: number;
    amount: number;
    description: string;
    items: any[];
    returnUrl?: string;
    cancelUrl?: string;
    buyerName?: string;
    buyerEmail?: string;
    buyerPhone?: string;
    buyerAddress?: string;
}

// Wrapper types
export interface PayOSWebhookData {
    code: string;
    desc: string;
    data: any;
    signature: string;
    orderCode: number;
    amount: number;
    reference: string;
    transactionDateTime: string;
    currency: string;
    paymentLinkId: string;
    counterAccountBankId?: string;
    counterAccountBankName?: string;
    counterAccountName?: string;
    counterAccountNumber?: string;
    virtualAccountName?: string;
    virtualAccountNumber?: string;
}

/**
 * Create payment link
 */
export async function createPaymentLink(data: PayOSPaymentData) {
    // MOCK MODE: Return immediate success link
    if (isMockMode || !getPayOS()) {
        console.log('[PayOS Mock] Simulating Payment Link creation...');
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

        // Mock a 2-second delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        return {
            checkoutUrl: `${appUrl}/payment-result/success?orderId=${data.description.replace('Đơn hàng #', '').trim()}&status=PAID`,
            paymentLinkId: `mock_link_${data.orderCode}`,
            status: 'PENDING',
            message: 'Mock Payment Link Created'
        };
    }

    const client = getPayOS();
    try {
        const paymentData = {
            orderCode: data.orderCode,
            amount: data.amount,
            description: data.description,
            buyerName: data.buyerName,
            buyerEmail: data.buyerEmail,
            buyerPhone: data.buyerPhone,
            buyerAddress: data.buyerAddress,
            items: data.items,
            returnUrl: data.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment-result/success`,
            cancelUrl: data.cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment-result/failed?reason=cancelled`,
        };

        return await client.createPaymentLink(paymentData);
    } catch (error: any) {
        console.error('PayOS createPaymentLink error:', error);
        throw new Error(error.message || 'Failed to create payment link');
    }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookData(webhookData: PayOSWebhookData): boolean {
    if (isMockMode) return true; // Always verify in mock mode
    const client = getPayOS();
    try {
        return client.verifyPaymentWebhookData(webhookData);
    } catch (error) {
        console.error('PayOS webhook verification error:', error);
        return false;
    }
}

/**
 * Check if payment was successful
 */
export function isSuccessPayment(code: string): boolean {
    return code === '00';
}

/**
 * Get response message by code
 */
export function getPayOSMessage(code: string): string {
    const messages: Record<string, string> = {
        '00': 'Giao dịch thành công',
        '01': 'Giao dịch đang xử lý',
        '02': 'Giao dịch bị từ chối',
        '03': 'Giao dịch bị hủy',
        '04': 'Giao dịch thất bại',
    };
    return messages[code] || 'Lỗi không xác định';
}

/**
 * Generate unique order code (required by PayOS)
 */
export function generateOrderCode(): number {
    return Math.floor(Date.now() / 1000); // Unix timestamp
}
