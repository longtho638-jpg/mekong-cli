/**
 * ☀️ Core Treasury - Engine
 */
import { Planet, EnergyType, EnergyTransaction, TreasuryState } from './types';
import { PLANET_REVENUE } from './constants';

export class CoreTreasury {
  private transactions: EnergyTransaction[] = [];
  private balance = 0;

  collect(planet: Planet, type: EnergyType, amount: number): EnergyTransaction {
    const share = PLANET_REVENUE[planet]?.coreShare || 0.1;
    const tx = { id: `tx_${Date.now()}`, planet, type, amount: amount * share, timestamp: new Date() };
    this.transactions.push(tx);
    this.balance += tx.amount;
    return tx;
  }
}

export const treasury = new CoreTreasury();
