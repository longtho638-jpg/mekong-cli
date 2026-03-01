/**
 * @agencyos/nonprofit-hub-sdk — Fundraising Facade
 *
 * Campaign management, donation tracking, and donor relationship
 * management for nonprofit fundraising operations.
 *
 * Usage:
 *   import { createFundraisingEngine } from '@agencyos/nonprofit-hub-sdk/fundraising';
 */

export interface Campaign {
  campaignId: string;
  organizationId: string;
  title: string;
  description: string;
  goalAmount: number;
  raisedAmount: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  category: 'emergency' | 'education' | 'health' | 'environment' | 'community' | 'other';
  coverImageUrl?: string;
  isRecurringEnabled: boolean;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
}

export interface Donation {
  donationId: string;
  campaignId: string;
  donorId: string;
  amount: number;
  currency: string;
  isAnonymous: boolean;
  isRecurring: boolean;
  recurringIntervalDays?: number;
  dedicationMessage?: string;
  paymentMethod: string;
  transactionRef: string;
  donatedAt: Date;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
}

export interface DonorProfile {
  donorId: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  totalDonatedAmount: number;
  currency: string;
  donationCount: number;
  firstDonationAt: Date;
  lastDonationAt: Date;
  isRecurringDonor: boolean;
  tags: string[];
  communicationPreferences: {
    emailUpdates: boolean;
    smsUpdates: boolean;
    annualReport: boolean;
  };
}

export interface FundraisingEngine {
  createCampaign(data: Omit<Campaign, 'campaignId' | 'raisedAmount' | 'status'>): Promise<Campaign>;
  getCampaign(campaignId: string): Promise<Campaign>;
  listCampaigns(organizationId: string): Promise<Campaign[]>;
  recordDonation(data: Omit<Donation, 'donationId' | 'donatedAt' | 'status'>): Promise<Donation>;
  getDonor(donorId: string): Promise<DonorProfile>;
  listDonors(organizationId: string): Promise<DonorProfile[]>;
  generateTaxReceipt(donationId: string): Promise<{ receiptUrl: string }>;
}

/**
 * Create a fundraising engine for campaigns, donations, and donor management.
 * Implement with your nonprofit fundraising backend.
 */
export function createFundraisingEngine(): FundraisingEngine {
  return {
    async createCampaign(_data) {
      throw new Error('Implement with your nonprofit fundraising backend');
    },
    async getCampaign(_campaignId) {
      throw new Error('Implement with your nonprofit fundraising backend');
    },
    async listCampaigns(_organizationId) {
      throw new Error('Implement with your nonprofit fundraising backend');
    },
    async recordDonation(_data) {
      throw new Error('Implement with your nonprofit fundraising backend');
    },
    async getDonor(_donorId) {
      throw new Error('Implement with your nonprofit fundraising backend');
    },
    async listDonors(_organizationId) {
      throw new Error('Implement with your nonprofit fundraising backend');
    },
    async generateTaxReceipt(_donationId) {
      throw new Error('Implement with your nonprofit fundraising backend');
    },
  };
}
