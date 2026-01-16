 
/**
 * Regional Payment Gateways for Southeast Asia
 * Supports Stripe, PayOS (Vietnam), Omise (Thailand), Xendit (Indonesia/Philippines)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type PaymentGateway = 'stripe' | 'payos' | 'omise' | 'xendit';

export interface PaymentGatewayConfig {
    gateway: PaymentGateway;
    displayName: string;
    countries: string[];
    currencies: string[];
    supportedMethods: PaymentMethod[];
    logo: string;
}

export type PaymentMethod =
    | 'card'
    | 'bank_transfer'
    | 'wallet'
    | 'qr_code'
    | 'installment'
    | 'bnpl'; // Buy Now Pay Later

export interface PaymentRequest {
    amount: number;
    currency: string;
    description: string;
    customerEmail: string;
    customerId?: string;
    tenantId: string;
    returnUrl: string;
    cancelUrl: string;
    metadata?: Record<string, any>;
}

export interface PaymentResult {
    success: boolean;
    transactionId?: string;
    redirectUrl?: string;
    error?: string;
    gateway: PaymentGateway;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🌏 GATEWAY CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const GATEWAY_CONFIGS: Record<PaymentGateway, PaymentGatewayConfig> = {
    stripe: {
        gateway: 'stripe',
        displayName: 'Stripe',
        countries: ['US', 'SG', 'AU', 'EU'],
        currencies: ['USD', 'SGD', 'AUD', 'EUR'],
        supportedMethods: ['card', 'bank_transfer'],
        logo: '/images/payment/stripe.svg',
    },
    payos: {
        gateway: 'payos',
        displayName: 'PayOS',
        countries: ['VN'],
        currencies: ['VND'],
        supportedMethods: ['bank_transfer', 'qr_code', 'wallet'],
        logo: '/images/payment/payos.svg',
    },
    omise: {
        gateway: 'omise',
        displayName: 'Omise',
        countries: ['TH', 'JP'],
        currencies: ['THB', 'JPY'],
        supportedMethods: ['card', 'bank_transfer', 'installment'],
        logo: '/images/payment/omise.svg',
    },
    xendit: {
        gateway: 'xendit',
        displayName: 'Xendit',
        countries: ['ID', 'PH', 'MY'],
        currencies: ['IDR', 'PHP', 'MYR'],
        supportedMethods: ['card', 'bank_transfer', 'wallet', 'qr_code', 'bnpl'],
        logo: '/images/payment/xendit.svg',
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔌 GATEWAY SELECTOR
// ═══════════════════════════════════════════════════════════════════════════════

export function getGatewayForCountry(countryCode: string): PaymentGateway {
    for (const [gateway, config] of Object.entries(GATEWAY_CONFIGS)) {
        if (config.countries.includes(countryCode)) {
            return gateway as PaymentGateway;
        }
    }
    return 'stripe'; // Default fallback
}

export function getGatewayForCurrency(currency: string): PaymentGateway {
    for (const [gateway, config] of Object.entries(GATEWAY_CONFIGS)) {
        if (config.currencies.includes(currency)) {
            return gateway as PaymentGateway;
        }
    }
    return 'stripe';
}

export function getAvailableGateways(countryCode: string): PaymentGatewayConfig[] {
    return Object.values(GATEWAY_CONFIGS).filter(
        config => config.countries.includes(countryCode) || config.gateway === 'stripe'
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💳 STRIPE INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

async function createStripePayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
        const response = await fetch('/api/billing/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                gateway: 'stripe',
                ...request,
            }),
        });

        const data = await response.json();

        if (data.url) {
            return {
                success: true,
                redirectUrl: data.url,
                transactionId: data.sessionId,
                gateway: 'stripe',
            };
        }

        throw new Error(data.error || 'Failed to create payment');
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            gateway: 'stripe',
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🇻🇳 PAYOS INTEGRATION (Vietnam)
// ═══════════════════════════════════════════════════════════════════════════════

async function createPayOSPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
        const response = await fetch('/api/billing/payos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderCode: Date.now(),
                amount: request.amount,
                description: request.description,
                returnUrl: request.returnUrl,
                cancelUrl: request.cancelUrl,
                buyerEmail: request.customerEmail,
            }),
        });

        const data = await response.json();

        if (data.checkoutUrl) {
            return {
                success: true,
                redirectUrl: data.checkoutUrl,
                transactionId: data.orderCode,
                gateway: 'payos',
            };
        }

        throw new Error(data.error || 'Failed to create PayOS payment');
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            gateway: 'payos',
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🇹🇭 OMISE INTEGRATION (Thailand)
// ═══════════════════════════════════════════════════════════════════════════════

async function createOmisePayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
        const response = await fetch('/api/billing/omise', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: request.amount * 100, // Omise uses smallest currency unit
                currency: request.currency.toLowerCase(),
                description: request.description,
                return_uri: request.returnUrl,
                metadata: {
                    tenantId: request.tenantId,
                    customerEmail: request.customerEmail,
                },
            }),
        });

        const data = await response.json();

        if (data.authorize_uri) {
            return {
                success: true,
                redirectUrl: data.authorize_uri,
                transactionId: data.id,
                gateway: 'omise',
            };
        }

        throw new Error(data.error || 'Failed to create Omise payment');
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            gateway: 'omise',
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🇮🇩 XENDIT INTEGRATION (Indonesia, Philippines, Malaysia)
// ═══════════════════════════════════════════════════════════════════════════════

async function createXenditPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
        const response = await fetch('/api/billing/xendit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                external_id: `${request.tenantId}-${Date.now()}`,
                amount: request.amount,
                currency: request.currency,
                description: request.description,
                payer_email: request.customerEmail,
                success_redirect_url: request.returnUrl,
                failure_redirect_url: request.cancelUrl,
            }),
        });

        const data = await response.json();

        if (data.invoice_url) {
            return {
                success: true,
                redirectUrl: data.invoice_url,
                transactionId: data.id,
                gateway: 'xendit',
            };
        }

        throw new Error(data.error || 'Failed to create Xendit payment');
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            gateway: 'xendit',
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 UNIFIED PAYMENT INTERFACE
// ═══════════════════════════════════════════════════════════════════════════════

export async function createPayment(
    request: PaymentRequest,
    gateway?: PaymentGateway
): Promise<PaymentResult> {
    // Auto-select gateway based on currency if not specified
    const selectedGateway = gateway || getGatewayForCurrency(request.currency);

    switch (selectedGateway) {
        case 'stripe':
            return createStripePayment(request);
        case 'payos':
            return createPayOSPayment(request);
        case 'omise':
            return createOmisePayment(request);
        case 'xendit':
            return createXenditPayment(request);
        default:
            return createStripePayment(request);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🧾 PAYMENT METHOD DISPLAY
// ═══════════════════════════════════════════════════════════════════════════════

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, Record<string, string>> = {
    card: {
        en: 'Credit/Debit Card',
        vi: 'Thẻ tín dụng/ghi nợ',
        th: 'บัตรเครดิต/เดบิต',
        id: 'Kartu Kredit/Debit',
        tl: 'Credit/Debit Card',
    },
    bank_transfer: {
        en: 'Bank Transfer',
        vi: 'Chuyển khoản ngân hàng',
        th: 'โอนเงินผ่านธนาคาร',
        id: 'Transfer Bank',
        tl: 'Bank Transfer',
    },
    wallet: {
        en: 'E-Wallet',
        vi: 'Ví điện tử',
        th: 'กระเป๋าเงินอิเล็กทรอนิกส์',
        id: 'E-Wallet',
        tl: 'E-Wallet',
    },
    qr_code: {
        en: 'QR Code',
        vi: 'Quét mã QR',
        th: 'QR Code',
        id: 'QR Code',
        tl: 'QR Code',
    },
    installment: {
        en: 'Installment',
        vi: 'Trả góp',
        th: 'ผ่อนชำระ',
        id: 'Cicilan',
        tl: 'Hulugan',
    },
    bnpl: {
        en: 'Buy Now, Pay Later',
        vi: 'Mua trước, trả sau',
        th: 'ซื้อก่อน จ่ายทีหลัง',
        id: 'Bayar Nanti',
        tl: 'Buy Now, Pay Later',
    },
};

export function getPaymentMethodLabel(method: PaymentMethod, locale: string): string {
    return PAYMENT_METHOD_LABELS[method][locale] || PAYMENT_METHOD_LABELS[method]['en'];
}
