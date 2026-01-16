/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
/**
 * Multi-Currency Support for AgencyOS
 * SEA Markets: VND, THB, IDR, PHP, SGD
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 💱 CURRENCY DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export type CurrencyCode = 'USD' | 'VND' | 'THB' | 'IDR' | 'PHP' | 'SGD' | 'MYR';

export interface Currency {
    code: CurrencyCode;
    symbol: string;
    name: string;
    locale: string;
    decimalPlaces: number;
    exchangeRate: number; // Relative to USD
}

export const CURRENCIES: Record<CurrencyCode, Currency> = {
    USD: {
        code: 'USD',
        symbol: '$',
        name: 'US Dollar',
        locale: 'en-US',
        decimalPlaces: 2,
        exchangeRate: 1,
    },
    VND: {
        code: 'VND',
        symbol: '₫',
        name: 'Vietnamese Dong',
        locale: 'vi-VN',
        decimalPlaces: 0,
        exchangeRate: 24500, // 1 USD ≈ 24,500 VND
    },
    THB: {
        code: 'THB',
        symbol: '฿',
        name: 'Thai Baht',
        locale: 'th-TH',
        decimalPlaces: 2,
        exchangeRate: 35.5, // 1 USD ≈ 35.5 THB
    },
    IDR: {
        code: 'IDR',
        symbol: 'Rp',
        name: 'Indonesian Rupiah',
        locale: 'id-ID',
        decimalPlaces: 0,
        exchangeRate: 15800, // 1 USD ≈ 15,800 IDR
    },
    PHP: {
        code: 'PHP',
        symbol: '₱',
        name: 'Philippine Peso',
        locale: 'fil-PH',
        decimalPlaces: 2,
        exchangeRate: 56.5, // 1 USD ≈ 56.5 PHP
    },
    SGD: {
        code: 'SGD',
        symbol: 'S$',
        name: 'Singapore Dollar',
        locale: 'en-SG',
        decimalPlaces: 2,
        exchangeRate: 1.35, // 1 USD ≈ 1.35 SGD
    },
    MYR: {
        code: 'MYR',
        symbol: 'RM',
        name: 'Malaysian Ringgit',
        locale: 'ms-MY',
        decimalPlaces: 2,
        exchangeRate: 4.7, // 1 USD ≈ 4.7 MYR
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 💰 PRICING IN LOCAL CURRENCIES
// ═══════════════════════════════════════════════════════════════════════════════

export interface LocalizedPricing {
    currency: CurrencyCode;
    free: number;
    pro: number;
    enterprise: number;
}

// Localized pricing (rounded for local markets)
export const LOCALIZED_PRICING: Record<CurrencyCode, LocalizedPricing> = {
    USD: { currency: 'USD', free: 0, pro: 49, enterprise: 199 },
    VND: { currency: 'VND', free: 0, pro: 990000, enterprise: 3990000 }, // ~$40, ~$163
    THB: { currency: 'THB', free: 0, pro: 1490, enterprise: 5990 }, // ~$42, ~$169
    IDR: { currency: 'IDR', free: 0, pro: 690000, enterprise: 2790000 }, // ~$44, ~$177
    PHP: { currency: 'PHP', free: 0, pro: 2490, enterprise: 9990 }, // ~$44, ~$177
    SGD: { currency: 'SGD', free: 0, pro: 59, enterprise: 239 }, // ~$44, ~$177
    MYR: { currency: 'MYR', free: 0, pro: 199, enterprise: 799 }, // ~$42, ~$170
};

// ═══════════════════════════════════════════════════════════════════════════════
// 💱 CONVERSION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

export function convertCurrency(
    amount: number,
    from: CurrencyCode,
    to: CurrencyCode
): number {
    const fromCurrency = CURRENCIES[from];
    const toCurrency = CURRENCIES[to];

    // Convert to USD first, then to target
    const usdAmount = amount / fromCurrency.exchangeRate;
    const targetAmount = usdAmount * toCurrency.exchangeRate;

    // Round based on decimal places
    return Number(targetAmount.toFixed(toCurrency.decimalPlaces));
}

export function formatCurrency(
    amount: number,
    currencyCode: CurrencyCode
): string {
    const currency = CURRENCIES[currencyCode];

    return new Intl.NumberFormat(currency.locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: currency.decimalPlaces,
        maximumFractionDigits: currency.decimalPlaces,
    }).format(amount);
}

export function formatCurrencyCompact(
    amount: number,
    currencyCode: CurrencyCode
): string {
    const currency = CURRENCIES[currencyCode];

    return new Intl.NumberFormat(currency.locale, {
        style: 'currency',
        currency: currencyCode,
        notation: 'compact',
        compactDisplay: 'short',
    }).format(amount);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🌏 LOCALE DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

const LOCALE_TO_CURRENCY: Record<string, CurrencyCode> = {
    'vi': 'VND',
    'vi-VN': 'VND',
    'th': 'THB',
    'th-TH': 'THB',
    'id': 'IDR',
    'id-ID': 'IDR',
    'fil': 'PHP',
    'fil-PH': 'PHP',
    'tl': 'PHP',
    'en-SG': 'SGD',
    'ms': 'MYR',
    'ms-MY': 'MYR',
    'en': 'USD',
    'en-US': 'USD',
};

export function getCurrencyFromLocale(locale: string): CurrencyCode {
    return LOCALE_TO_CURRENCY[locale] || 'USD';
}

export function getPricingForLocale(locale: string): LocalizedPricing {
    const currency = getCurrencyFromLocale(locale);
    return LOCALIZED_PRICING[currency];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🧾 TAX CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface TaxInfo {
    rate: number;
    name: string;
    included: boolean;
}

const TAX_RATES: Record<CurrencyCode, TaxInfo> = {
    USD: { rate: 0, name: 'None', included: false },
    VND: { rate: 0.10, name: 'VAT', included: true },
    THB: { rate: 0.07, name: 'VAT', included: true },
    IDR: { rate: 0.11, name: 'PPN', included: true },
    PHP: { rate: 0.12, name: 'VAT', included: true },
    SGD: { rate: 0.08, name: 'GST', included: false },
    MYR: { rate: 0.06, name: 'SST', included: false },
};

export function calculateTax(amount: number, currency: CurrencyCode): {
    subtotal: number;
    tax: number;
    total: number;
    taxInfo: TaxInfo;
} {
    const taxInfo = TAX_RATES[currency];

    if (taxInfo.included) {
        // Tax is already in the price
        const subtotal = amount / (1 + taxInfo.rate);
        return {
            subtotal: Number(subtotal.toFixed(2)),
            tax: Number((amount - subtotal).toFixed(2)),
            total: amount,
            taxInfo,
        };
    } else {
        // Add tax to price
        const tax = amount * taxInfo.rate;
        return {
            subtotal: amount,
            tax: Number(tax.toFixed(2)),
            total: Number((amount + tax).toFixed(2)),
            taxInfo,
        };
    }
}
