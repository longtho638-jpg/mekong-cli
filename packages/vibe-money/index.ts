/**
 * 💰 VIBE Money - Money-Making Workflows for AgencyEr
 * 
 * "Kiếm tiền dễ như ăn kẹo" - Making money as easy as eating candy
 * 
 * Pattern 71: Revenue-Driven Architecture
 * Pattern 251: WIN-WIN-WIN Alignment
 */

// ============================================
// CONSTANTS
// ============================================

export const BINH_PHAP_PRICING: Record<string, { name: string; price: number; type: 'one-time' | 'monthly' | 'quarterly' }> = {
    'KE_HOACH': { name: 'Kế Hoạch (Strategy)', price: 5000, type: 'one-time' },
    'TAC_CHIEN': { name: 'Tác Chiến (Runway)', price: 3000, type: 'one-time' },
    'MUU_CONG': { name: 'Mưu Công (Win-Without-Fighting)', price: 8000, type: 'one-time' },
    'HINH_THE': { name: 'Hình Thế (Moat Audit)', price: 5000, type: 'one-time' },
    'THE_TRAN': { name: 'Thế Trận (Growth)', price: 5000, type: 'monthly' },
    'HU_THUC': { name: 'Hư Thực (Anti-Dilution)', price: 10000, type: 'one-time' },
    'QUAN_TRANH': { name: 'Quân Tranh (Speed Sprint)', price: 15000, type: 'one-time' },
    'CUU_BIEN': { name: 'Cửu Biến (Pivot)', price: 5000, type: 'one-time' },
    'HANH_QUAN': { name: 'Hành Quân (OKR)', price: 3000, type: 'quarterly' },
    'DIA_HINH': { name: 'Địa Hình (Market Entry)', price: 8000, type: 'one-time' },
    'CUU_DIA': { name: 'Cửu Địa (Crisis)', price: 5000, type: 'monthly' },
    'HOA_CONG': { name: 'Hỏa Công (Disruption)', price: 10000, type: 'one-time' },
    'DUNG_GIAN': { name: 'Dụng Gián (VC Intel)', price: 3000, type: 'one-time' },
};

export const RETAINER_TIERS = {
    WARRIOR: { monthly: 2000, equityMin: 5, equityMax: 8, successFee: 2, commitment: 6 },
    GENERAL: { monthly: 5000, equityMin: 3, equityMax: 5, successFee: 1.5, commitment: 12 },
    TUONG_QUAN: { monthly: 0, equityMin: 15, equityMax: 30, successFee: 0, commitment: -1 }, // -1 = until exit
} as const;

// ============================================
// TYPES
// ============================================

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
    polarId?: string;
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

// ============================================
// VIBE MONEY ENGINE
// ============================================

export class VibeMoney {
    private quotes: Quote[] = [];
    private invoices: Invoice[] = [];
    private retainers: Retainer[] = [];
    private equityPositions: EquityPosition[] = [];

    // ==================
    // QUOTE MANAGEMENT
    // ==================

    createQuote(client: string, chapters: BinhPhapChapter[], discount = 0): Quote {
        const items: QuoteItem[] = chapters.map(chapter => {
            const pricing = BINH_PHAP_PRICING[chapter];
            return {
                chapter,
                name: pricing.name,
                price: pricing.price,
                type: pricing.type,
                quantity: 1,
            };
        });

        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const discountAmount = subtotal * (discount / 100);
        const total = subtotal - discountAmount;

        const quote: Quote = {
            id: `Q-${Date.now()}`,
            client,
            items,
            subtotal,
            discount: discountAmount,
            total,
            createdAt: new Date(),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            winWinWinValidated: true, // Auto-validated for Binh Pháp services
        };

        this.quotes.push(quote);
        return quote;
    }

    // ==================
    // INVOICE MANAGEMENT
    // ==================

    createInvoice(client: string, items: InvoiceItem[], dueDays = 15): Invoice {
        const total = items.reduce((sum, item) => sum + item.amount * item.quantity, 0);

        const invoice: Invoice = {
            id: `INV-${Date.now()}`,
            client,
            items,
            total,
            status: 'draft',
            dueDate: new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000),
        };

        this.invoices.push(invoice);
        return invoice;
    }

    invoiceFromQuote(quote: Quote, dueDays = 15): Invoice {
        const items: InvoiceItem[] = quote.items.map(item => ({
            description: `${item.chapter}: ${item.name}`,
            amount: item.price,
            quantity: item.quantity,
        }));

        const invoice = this.createInvoice(quote.client, items, dueDays);
        invoice.quoteId = quote.id;
        return invoice;
    }

    sendInvoice(invoiceId: string): void {
        const invoice = this.invoices.find(i => i.id === invoiceId);
        if (invoice) invoice.status = 'sent';
    }

    markPaid(invoiceId: string): void {
        const invoice = this.invoices.find(i => i.id === invoiceId);
        if (invoice) {
            invoice.status = 'paid';
            invoice.paidAt = new Date();
        }
    }

    // ==================
    // RETAINER MANAGEMENT
    // ==================

    setupRetainer(client: string, tier: RetainerTier, equity: number): Retainer {
        const tierConfig = RETAINER_TIERS[tier];

        // Validate equity within tier bounds
        const validEquity = Math.min(
            Math.max(equity, tierConfig.equityMin),
            tierConfig.equityMax
        );

        const retainer: Retainer = {
            id: `RET-${Date.now()}`,
            client,
            tier,
            monthly: tierConfig.monthly,
            equity: validEquity,
            successFee: tierConfig.successFee,
            startDate: new Date(),
            commitment: tierConfig.commitment,
            status: 'active',
        };

        this.retainers.push(retainer);
        return retainer;
    }

    getActiveRetainers(): Retainer[] {
        return this.retainers.filter(r => r.status === 'active');
    }

    getMRRFromRetainers(): number {
        return this.getActiveRetainers().reduce((sum, r) => sum + r.monthly, 0);
    }

    // ==================
    // EQUITY TRACKING
    // ==================

    addEquityPosition(startup: string, percentage: number, valuation: number): EquityPosition {
        const position: EquityPosition = {
            id: `EQ-${Date.now()}`,
            startup,
            percentage,
            entryValuation: valuation,
            currentValuation: valuation,
            paperValue: (percentage / 100) * valuation,
            acquiredAt: new Date(),
            lastUpdated: new Date(),
        };

        this.equityPositions.push(position);
        return position;
    }

    updateValuation(positionId: string, newValuation: number): void {
        const position = this.equityPositions.find(p => p.id === positionId);
        if (position) {
            position.currentValuation = newValuation;
            position.paperValue = (position.percentage / 100) * newValuation;
            position.lastUpdated = new Date();
        }
    }

    getTotalPaperValue(): number {
        return this.equityPositions.reduce((sum, p) => sum + p.paperValue, 0);
    }

    getPortfolioSummary(): { positions: number; totalPaperValue: number; avgMultiple: number } {
        const positions = this.equityPositions.length;
        const totalPaperValue = this.getTotalPaperValue();

        const avgMultiple = positions > 0
            ? this.equityPositions.reduce((sum, p) =>
                sum + (p.currentValuation / p.entryValuation), 0) / positions
            : 0;

        return { positions, totalPaperValue, avgMultiple };
    }

    // ==================
    // DASHBOARD STATS
    // ==================

    getDashboard(): {
        totalQuotes: number;
        openQuotes: number;
        totalInvoiced: number;
        totalPaid: number;
        mrr: number;
        activeRetainers: number;
        paperValue: number;
    } {
        const paidInvoices = this.invoices.filter(i => i.status === 'paid');

        return {
            totalQuotes: this.quotes.length,
            openQuotes: this.quotes.filter(q => q.validUntil > new Date()).length,
            totalInvoiced: this.invoices.reduce((sum, i) => sum + i.total, 0),
            totalPaid: paidInvoices.reduce((sum, i) => sum + i.total, 0),
            mrr: this.getMRRFromRetainers(),
            activeRetainers: this.getActiveRetainers().length,
            paperValue: this.getTotalPaperValue(),
        };
    }
}

// ============================================
// EXPORTS
// ============================================

export const vibeMoney = new VibeMoney();
export default { VibeMoney, BINH_PHAP_PRICING, RETAINER_TIERS, vibeMoney };
