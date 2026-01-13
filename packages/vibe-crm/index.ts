/**
 * 🟠 Jupiter - VIBE CRM
 * Sales & Client Relationship Layer
 * 
 * WIN-WIN-WIN Validation Engine
 */

// ============================================
// TYPES
// ============================================

export type DealStage =
    | 'lead'
    | 'qualified'
    | 'proposal'
    | 'negotiation'
    | 'closed_won'
    | 'closed_lost';

export type DealTier = 'warrior' | 'general' | 'tuong_quan';

export interface Contact {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    tags: string[];
    createdAt: Date;
}

export interface Deal {
    id: string;
    contactId: string;
    name: string;
    value: number;
    stage: DealStage;
    tier: DealTier;
    probability: number;
    expectedCloseDate: Date;
    tags: string[];
    notes: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface WinCheck {
    ownerWin: string;
    agencyWin: string;
    clientWin: string;
    aligned: boolean;
}

// ============================================
// TIER CONFIG (Binh Pháp)
// ============================================

export const TIER_CONFIG: Record<DealTier, {
    name: string;
    retainerMin: number;
    retainerMax: number;
    equityMin: number;
    equityMax: number;
}> = {
    warrior: {
        name: 'WARRIOR (Pre-Seed/Seed)',
        retainerMin: 2000,
        retainerMax: 3000,
        equityMin: 5,
        equityMax: 8,
    },
    general: {
        name: 'GENERAL (Series A)',
        retainerMin: 5000,
        retainerMax: 8000,
        equityMin: 3,
        equityMax: 5,
    },
    tuong_quan: {
        name: 'TƯỚNG QUÂN (Venture Studio)',
        retainerMin: 0,
        retainerMax: 0,
        equityMin: 15,
        equityMax: 30,
    },
};

// ============================================
// WIN-WIN-WIN VALIDATOR
// ============================================

export function validateWinWinWin(deal: Deal): WinCheck {
    const tier = TIER_CONFIG[deal.tier];

    const ownerWin = `Equity ${tier.equityMin}-${tier.equityMax}% + Retainer $${tier.retainerMin}/mo`;
    const agencyWin = 'Deal flow + Knowledge + Infrastructure';
    const clientWin = 'Protection + Strategy + Network access';

    // Check if deal is properly structured
    const aligned = deal.value >= tier.retainerMin && deal.probability > 0;

    return {
        ownerWin,
        agencyWin,
        clientWin,
        aligned,
    };
}

// ============================================
// CRM ENGINE
// ============================================

export class VibeCRM {
    private contacts: Map<string, Contact> = new Map();
    private deals: Map<string, Deal> = new Map();

    // Contacts
    addContact(contact: Omit<Contact, 'id' | 'createdAt'>): Contact {
        const newContact: Contact = {
            ...contact,
            id: `contact_${Date.now()}`,
            createdAt: new Date(),
        };
        this.contacts.set(newContact.id, newContact);
        return newContact;
    }

    getContact(id: string): Contact | undefined {
        return this.contacts.get(id);
    }

    // Deals
    createDeal(deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Deal {
        const newDeal: Deal = {
            ...deal,
            id: `deal_${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.deals.set(newDeal.id, newDeal);
        return newDeal;
    }

    advanceStage(dealId: string): Deal | undefined {
        const deal = this.deals.get(dealId);
        if (!deal) return undefined;

        const stages: DealStage[] = [
            'lead', 'qualified', 'proposal', 'negotiation', 'closed_won'
        ];
        const currentIndex = stages.indexOf(deal.stage);

        if (currentIndex < stages.length - 1) {
            deal.stage = stages[currentIndex + 1];
            deal.updatedAt = new Date();
            deal.probability = Math.min(deal.probability + 20, 100);
        }

        return deal;
    }

    // Pipeline
    getPipeline(): Deal[] {
        return Array.from(this.deals.values())
            .filter(d => !d.stage.startsWith('closed_'));
    }

    getPipelineValue(): number {
        return this.getPipeline()
            .reduce((sum, d) => sum + d.value * (d.probability / 100), 0);
    }

    getByTier(tier: DealTier): Deal[] {
        return Array.from(this.deals.values())
            .filter(d => d.tier === tier);
    }

    // Analytics
    getStats(): {
        totalDeals: number;
        pipelineValue: number;
        winRate: number;
    } {
        const all = Array.from(this.deals.values());
        const closed = all.filter(d => d.stage.startsWith('closed_'));
        const won = all.filter(d => d.stage === 'closed_won');

        return {
            totalDeals: all.length,
            pipelineValue: this.getPipelineValue(),
            winRate: closed.length > 0 ? (won.length / closed.length) * 100 : 0,
        };
    }
}

// ============================================
// EXPORTS
// ============================================

export const crm = new VibeCRM();

export default {
    VibeCRM,
    TIER_CONFIG,
    validateWinWinWin,
    crm,
};
