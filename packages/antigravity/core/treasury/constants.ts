/**
 * ☀️ Core Treasury - Constants
 */
import { Planet, EnergyType } from './types';

export const PLANET_REVENUE: Record<Planet, { name: string; coreShare: number }> = {
  venus: { name: 'Venus', coreShare: 0.3 },
  saturn: { name: 'Saturn', coreShare: 0.4 },
  // ... other planets
} as any;
