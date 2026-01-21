/**
 * 💰 VIBE Money Types
 */
import { BINH_PHAP_PRICING, RETAINER_TIERS } from './constants';

export type BinhPhapChapter = keyof typeof BINH_PHAP_PRICING;
export type RetainerTier = keyof typeof RETAINER_TIERS;

export interface Quote {
    id: string;
    client: string;
    items: QuoteItem[];
    subtotal: number;
    discount: number;
    total: number;
    createdAt: Date;
    validUntil: Date;
    winWinWinValidated: boolean;
}

export interface QuoteItem {
    chapter: BinhPhapChapter;
    name: string;
    price: number;
    type: 'one-time' | 'monthly' | 'quarterly';
    quantity: number;
}

export interface Invoice {
    id: string;
    quoteId?: string;
    client: string;
    items: InvoiceItem[];
    total: number;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
    dueDate: Date;
    paidAt?: Date;
    paypalSubscriptionId?: string;
}

export interface InvoiceItem {
    description: string;
    amount: number;
    quantity: number;
}

export interface Retainer {
    id: string;
    client: string;
    tier: RetainerTier;
    monthly: number;
    equity: number;
    successFee: number;
    startDate: Date;
    commitment: number; // months
    status: 'active' | 'paused' | 'completed';
}

export interface EquityPosition {
    id: string;
    startup: string;
    percentage: number;
    entryValuation: number;
    currentValuation: number;
    paperValue: number;
    acquiredAt: Date;
    lastUpdated: Date;
}
