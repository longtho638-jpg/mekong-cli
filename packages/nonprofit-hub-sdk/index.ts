/**
 * @agencyos/nonprofit-hub-sdk — Unified Nonprofit & Social Impact Hub
 *
 * Facade package consolidating fundraising, volunteer management,
 * and impact measurement operations.
 *
 * Quick Start:
 *   import { createFundraisingEngine, createVolunteerManager, createImpactTracker } from '@agencyos/nonprofit-hub-sdk';
 *
 * Sub-path imports:
 *   import { createFundraisingEngine } from '@agencyos/nonprofit-hub-sdk/fundraising';
 *   import { createVolunteerManager } from '@agencyos/nonprofit-hub-sdk/volunteer';
 *   import { createImpactTracker } from '@agencyos/nonprofit-hub-sdk/impact';
 */

// Fundraising
export { createFundraisingEngine } from './fundraising-facade';
export type { Campaign, Donation, DonorProfile, FundraisingEngine } from './fundraising-facade';

// Volunteer Management
export { createVolunteerManager } from './volunteer-facade';
export type { Volunteer, VolunteerSchedule, HoursLog, VolunteerManager } from './volunteer-facade';

// Impact Measurement
export { createImpactTracker } from './impact-facade';
export type { ImpactMetric, SDGAlignment, ImpactReport, ImpactTracker } from './impact-facade';
