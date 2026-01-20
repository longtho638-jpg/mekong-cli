/**
 * 🟠 Jupiter - VIBE CRM Engine
 */
import { Contact, Deal, DealStage, DealTier, WinCheck } from './types';
import { TIER_CONFIG } from './constants';

export function validateWinWinWin(deal: Deal): WinCheck {
    const tier = TIER_CONFIG[deal.tier];
    return {
        ownerWin: `Equity ${tier.equityMin}-${tier.equityMax}%`,
        agencyWin: 'Knowledge + Infrastructure',
        clientWin: 'Strategy + Network',
        aligned: deal.value >= tier.retainerMin,
    };
}

export class VibeCRM {
    private contacts: Map<string, Contact> = new Map();
    private deals: Map<string, Deal> = new Map();

    addContact(contact: Omit<Contact, 'id' | 'createdAt'>): Contact {
        const c = { ...contact, id: `c_${Date.now()}`, createdAt: new Date() };
        this.contacts.set(c.id, c);
        return c;
    }
}

export const crm = new VibeCRM();
