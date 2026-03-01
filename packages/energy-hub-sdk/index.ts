/**
 * @agencyos/energy-hub-sdk — Unified Energy & Utilities Hub
 *
 * Facade package consolidating smart grid management, renewable monitoring,
 * and energy trading operations.
 *
 * Quick Start:
 *   import { createGridManager, createRenewableMonitor, createEnergyTrader } from '@agencyos/energy-hub-sdk';
 *
 * Sub-path imports:
 *   import { createGridManager } from '@agencyos/energy-hub-sdk/grid';
 *   import { createRenewableMonitor } from '@agencyos/energy-hub-sdk/renewable';
 *   import { createEnergyTrader } from '@agencyos/energy-hub-sdk/trading';
 */

// Grid Management
export { createGridManager } from './grid-facade';
export type { SmartGrid, LoadBalancingConfig, OutageEvent, GridManager } from './grid-facade';

// Renewable Monitoring
export { createRenewableMonitor } from './renewable-facade';
export type { SolarPanel, WindTurbine, CapacityPlan, RenewableMonitor } from './renewable-facade';

// Energy Trading
export { createEnergyTrader } from './trading-facade';
export type { EnergyTrade, P2PExchangeOffer, CarbonCredit, EnergyTrader } from './trading-facade';
