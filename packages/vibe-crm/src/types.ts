/**
 * 🟠 Jupiter - VIBE CRM Types
 */
export type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
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
