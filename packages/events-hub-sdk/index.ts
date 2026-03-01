/**
 * @agencyos/events-hub-sdk — Unified Events & Experiences Hub
 *
 * Facade package consolidating event planning, ticketing,
 * and virtual/hybrid event operations.
 *
 * Quick Start:
 *   import { createEventPlanner, createTicketingEngine, createVirtualEventPlatform } from '@agencyos/events-hub-sdk';
 *
 * Sub-path imports:
 *   import { createEventPlanner } from '@agencyos/events-hub-sdk/event-planning';
 *   import { createTicketingEngine } from '@agencyos/events-hub-sdk/ticketing';
 *   import { createVirtualEventPlatform } from '@agencyos/events-hub-sdk/virtual-events';
 */

// Event Planning
export { createEventPlanner } from './event-planning-facade';
export type { Event, Venue, EventSchedule, RSVPRecord, EventPlanner } from './event-planning-facade';

// Ticketing
export { createTicketingEngine } from './ticketing-facade';
export type { TicketTier, QRCodeTicket, CheckInRecord, TicketingEngine } from './ticketing-facade';

// Virtual Events
export { createVirtualEventPlatform } from './virtual-events-facade';
export type { StreamSession, BreakoutRoom, VirtualBooth, VirtualEventPlatform } from './virtual-events-facade';
