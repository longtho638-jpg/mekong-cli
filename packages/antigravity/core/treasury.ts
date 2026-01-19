/**
 * ☀️ Core Treasury - Energy Flow System
 * 
 * Manages $ exchange between 8 VIBE Planets and AgencyOS Core
 */

// ============================================
// TYPES
// ============================================

export type Planet = 
  | 'venus'    // UI
  | 'uranus'   // Analytics
  | 'saturn'   // AI Agents
  | 'jupiter'  // CRM
  | 'mars'     // Ops
  | 'earth'    // Dev
  | 'mercury'  // Marketing
  | 'neptune'; // Finance

export type EnergyType = 
  | 'template_sale'
  | 'agent_call'
  | 'subscription'
  | 'deploy_fee'
  | 'code_audit'
  | 'referral'
  | 'api_usage'
  | 'transaction_fee';

export interface EnergyTransaction {
  id: string;
  planet: Planet;
  type: EnergyType;
  amount: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface TreasuryState {
  balance: number;
  totalIn: number;
  totalOut: number;
  byPlanet: Record<Planet, number>;
}

// ============================================
// PLANET REVENUE CONFIG
// ============================================

export const PLANET_REVENUE: Record<Planet, {
  name: string;
  emoji: string;
  energyTypes: EnergyType[];
  coreShare: number; // % that flows to core
}> = {
  venus: {
    name: 'Venus (UI)',
    emoji: '🔵',
    energyTypes: ['template_sale'],
    coreShare: 0.30,
  },
  uranus: {
    name: 'Uranus (Data)',
    emoji: '⚪',
    energyTypes: ['api_usage'],
    coreShare: 0.20,
  },
  saturn: {
    name: 'Saturn (AI)',
    emoji: '🟣',
    energyTypes: ['agent_call'],
    coreShare: 0.40,
  },
  jupiter: {
    name: 'Jupiter (CRM)',
    emoji: '🟠',
    energyTypes: ['subscription'],
    coreShare: 0.25,
  },
  mars: {
    name: 'Mars (Ops)',
    emoji: '🔴',
    energyTypes: ['deploy_fee'],
    coreShare: 0.20,
  },
  earth: {
    name: 'Earth (Dev)',
    emoji: '🟢',
    energyTypes: ['code_audit'],
    coreShare: 0.40,
  },
  mercury: {
    name: 'Mercury (Mkt)',
    emoji: '🟡',
    energyTypes: ['referral'],
    coreShare: 0.10,
  },
  neptune: {
    name: 'Neptune (Fin)',
    emoji: '🟤',
    energyTypes: ['transaction_fee'],
    coreShare: 0.02,
  },
};

// ============================================
// DISTRIBUTION CONFIG
// ============================================

export const DISTRIBUTION: Record<string, {
  share: number;
  planets: Planet[];
}> = {
  rnd: { share: 0.40, planets: ['saturn', 'earth'] },
  growth: { share: 0.25, planets: ['mercury', 'jupiter'] },
  infra: { share: 0.20, planets: ['mars', 'uranus'] },
  design: { share: 0.10, planets: ['venus'] },
  reserve: { share: 0.05, planets: ['neptune'] },
};

// ============================================
// CORE TREASURY
// ============================================

export class CoreTreasury {
  private transactions: EnergyTransaction[] = [];
  private balance = 0;

  // Collect energy from planet
  collect(planet: Planet, type: EnergyType, amount: number): EnergyTransaction {
    const config = PLANET_REVENUE[planet];
    const coreAmount = amount * config.coreShare;
    
    const tx: EnergyTransaction = {
      id: `tx_${Date.now()}`,
      planet,
      type,
      amount: coreAmount,
      timestamp: new Date(),
    };
    
    this.transactions.push(tx);
    this.balance += coreAmount;
    
    return tx;
  }

  // Distribute energy to planets
  distribute(totalAmount: number): Record<string, number> {
    const result: Record<string, number> = {};
    
    for (const [category, config] of Object.entries(DISTRIBUTION)) {
      const allocation = totalAmount * config.share;
      result[category] = allocation;
      this.balance -= allocation;
    }
    
    return result;
  }

  // Get current state
  getState(): TreasuryState {
    const byPlanet = {} as Record<Planet, number>;
    const planets: Planet[] = ['venus', 'uranus', 'saturn', 'jupiter', 'mars', 'earth', 'mercury', 'neptune'];
    
    for (const planet of planets) {
      byPlanet[planet] = this.transactions
        .filter(t => t.planet === planet)
        .reduce((sum, t) => sum + t.amount, 0);
    }
    
    const totalIn = this.transactions.reduce((sum, t) => sum + t.amount, 0);
    
    return {
      balance: this.balance,
      totalIn,
      totalOut: totalIn - this.balance,
      byPlanet,
    };
  }

  // Check orbit health
  getOrbitHealth(): 'growth' | 'sustainable' | 'decay' {
    const state = this.getState();
    const netFlow = state.totalIn - state.totalOut;
    
    if (netFlow > 0) return 'growth';
    if (netFlow === 0) return 'sustainable';
    return 'decay';
  }

  getTransactions(): EnergyTransaction[] {
    return [...this.transactions];
  }
}

// ============================================
// EXPORTS
// ============================================

export const treasury = new CoreTreasury();

export default {
  CoreTreasury,
  PLANET_REVENUE,
  DISTRIBUTION,
  treasury,
};
