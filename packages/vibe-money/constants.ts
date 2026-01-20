/**
 * 💰 VIBE Money Constants
 */

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
