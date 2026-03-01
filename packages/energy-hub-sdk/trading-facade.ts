/**
 * @agencyos/energy-hub-sdk — Energy Trading Facade
 *
 * Energy market trading, peer-to-peer exchange offers, and carbon credit
 * management for prosumers and energy market participants.
 *
 * Usage:
 *   import { createEnergyTrader } from '@agencyos/energy-hub-sdk/trading';
 */

export interface EnergyTrade {
  tradeId: string;
  sellerId: string;
  buyerId: string;
  energyType: 'solar' | 'wind' | 'hydro' | 'grid' | 'mixed';
  quantityMwh: number;
  pricePerMwh: number;
  totalAmount: number;
  currency: string;
  deliveryStart: Date;
  deliveryEnd: Date;
  status: 'pending' | 'matched' | 'delivering' | 'settled' | 'cancelled';
  createdAt: Date;
}

export interface P2PExchangeOffer {
  offerId: string;
  prosumerId: string;
  direction: 'sell' | 'buy';
  availableQuantityKwh: number;
  pricePerKwh: number;
  currency: string;
  validFrom: Date;
  validUntil: Date;
  locationZone: string;
  status: 'open' | 'partially-matched' | 'matched' | 'expired' | 'cancelled';
}

export interface CarbonCredit {
  creditId: string;
  ownerId: string;
  standard: 'VCS' | 'Gold-Standard' | 'CAR' | 'ACR' | 'other';
  vintageYear: number;
  quantityTonsCO2e: number;
  projectType: 'renewable' | 'forestry' | 'methane' | 'efficiency' | 'other';
  projectCountry: string;
  pricePerTon: number;
  currency: string;
  status: 'available' | 'reserved' | 'retired' | 'transferred';
}

export interface EnergyTrader {
  placeTrade(data: Omit<EnergyTrade, 'tradeId' | 'status' | 'createdAt'>): Promise<EnergyTrade>;
  getTrade(tradeId: string): Promise<EnergyTrade>;
  listTrades(participantId: string): Promise<EnergyTrade[]>;
  postP2POffer(data: Omit<P2PExchangeOffer, 'offerId' | 'status'>): Promise<P2PExchangeOffer>;
  matchP2POffer(offerId: string, counterPartyId: string): Promise<EnergyTrade>;
  listCarbonCredits(ownerId: string): Promise<CarbonCredit[]>;
  retireCarbonCredits(creditId: string, quantityTons: number): Promise<CarbonCredit>;
}

/**
 * Create an energy trader for market trades, P2P exchange, and carbon credit management.
 * Implement with your energy trading backend.
 */
export function createEnergyTrader(): EnergyTrader {
  return {
    async placeTrade(_data) {
      throw new Error('Implement with your energy trading backend');
    },
    async getTrade(_tradeId) {
      throw new Error('Implement with your energy trading backend');
    },
    async listTrades(_participantId) {
      throw new Error('Implement with your energy trading backend');
    },
    async postP2POffer(_data) {
      throw new Error('Implement with your energy trading backend');
    },
    async matchP2POffer(_offerId, _counterPartyId) {
      throw new Error('Implement with your energy trading backend');
    },
    async listCarbonCredits(_ownerId) {
      throw new Error('Implement with your energy trading backend');
    },
    async retireCarbonCredits(_creditId, _quantityTons) {
      throw new Error('Implement with your energy trading backend');
    },
  };
}
