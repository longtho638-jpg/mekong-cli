/**
 * ☀️ Core Treasury - Types
 */
export type Planet = 'venus' | 'uranus' | 'saturn' | 'jupiter' | 'mars' | 'earth' | 'mercury' | 'neptune';
export type EnergyType = 'template_sale' | 'agent_call' | 'subscription' | 'deploy_fee' | 'api_usage' | 'transaction_fee';

export interface EnergyTransaction {
  id: string; planet: Planet; type: EnergyType; amount: number; timestamp: Date;
}

export interface TreasuryState {
  balance: number; totalIn: number; totalOut: number; byPlanet: Record<Planet, number>;
}
