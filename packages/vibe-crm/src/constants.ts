/**
 * 🟠 Jupiter - VIBE CRM Constants
 */
import { DealTier } from './types';

export const TIER_CONFIG: Record<DealTier, {
    name: string;
    retainerMin: number;
    retainerMax: number;
    equityMin: number;
    equityMax: number;
}> = {
    warrior: { name: 'WARRIOR', retainerMin: 2000, retainerMax: 3000, equityMin: 5, equityMax: 8 },
    general: { name: 'GENERAL', retainerMin: 5000, retainerMax: 8000, equityMin: 3, equityMax: 5 },
    tuong_quan: { name: 'TƯỚNG QUÂN', retainerMin: 0, retainerMax: 0, equityMin: 15, equityMax: 30 },
};
