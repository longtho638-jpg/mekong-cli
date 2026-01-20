/**
 * 💰 VIBE Money Engine
 */
import { BINH_PHAP_PRICING, RETAINER_TIERS } from './constants';
import {
    Quote, QuoteItem, Invoice, InvoiceItem,
    Retainer, EquityPosition, BinhPhapChapter, RetainerTier
} from './types';

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

    getDashboard() {
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
