/**
 * @agencyos/travel-hub-sdk — Unified Travel & Hospitality Hub
 *
 * Facade consolidating flight/hotel booking, itinerary planning,
 * activity recommendations, and loyalty rewards programs.
 *
 * Quick Start:
 *   import { createBookingManager, createItineraryPlanner, createLoyaltyManager } from '@agencyos/travel-hub-sdk';
 *
 * Sub-path imports:
 *   import { createBookingManager } from '@agencyos/travel-hub-sdk/booking';
 *   import { createItineraryPlanner } from '@agencyos/travel-hub-sdk/itinerary';
 *   import { createLoyaltyManager } from '@agencyos/travel-hub-sdk/loyalty';
 */

export { createBookingManager } from './booking-facade';
export type { Flight, Hotel, TravelPackage } from './booking-facade';

export { createItineraryPlanner } from './itinerary-facade';
export type { Activity, ItineraryDay, Itinerary } from './itinerary-facade';

export { createLoyaltyManager } from './loyalty-facade';
export type { LoyaltyAccount, Reward, PointsTransaction } from './loyalty-facade';
