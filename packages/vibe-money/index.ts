/**
 * 💰 VIBE Money Facade
 */
import { VibeMoney } from './engine';
import { BINH_PHAP_PRICING, RETAINER_TIERS } from './constants';

export * from './types';
export * from './constants';
export { VibeMoney };

export const vibeMoney = new VibeMoney();
export default { VibeMoney, BINH_PHAP_PRICING, RETAINER_TIERS, vibeMoney };
