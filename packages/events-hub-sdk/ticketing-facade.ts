/**
 * @agencyos/events-hub-sdk — Ticketing Facade
 *
 * Ticket tier management, QR code generation, and attendee check-in
 * for event ticketing and access control operations.
 *
 * Usage:
 *   import { createTicketingEngine } from '@agencyos/events-hub-sdk/ticketing';
 */

export interface TicketTier {
  tierId: string;
  eventId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  totalQuantity: number;
  soldQuantity: number;
  remainingQuantity: number;
  saleStartAt: Date;
  saleEndAt: Date;
  perOrderLimit: number;
  benefits: string[];
  isTransferable: boolean;
  status: 'upcoming' | 'on-sale' | 'sold-out' | 'closed';
}

export interface QRCodeTicket {
  ticketId: string;
  tierId: string;
  eventId: string;
  holderId: string;
  holderName: string;
  holderEmail: string;
  qrCodeData: string;
  qrCodeImageUrl: string;
  purchasedAt: Date;
  isCheckedIn: boolean;
  checkedInAt?: Date;
  seatNumber?: string;
  status: 'valid' | 'used' | 'cancelled' | 'transferred';
}

export interface CheckInRecord {
  checkInId: string;
  ticketId: string;
  eventId: string;
  scannedAt: Date;
  scannedByStaffId: string;
  entryGate: string;
  isValid: boolean;
  failureReason?: 'already-used' | 'invalid-qr' | 'wrong-event' | 'cancelled';
}

export interface TicketingEngine {
  createTier(eventId: string, data: Omit<TicketTier, 'tierId' | 'soldQuantity' | 'remainingQuantity' | 'status'>): Promise<TicketTier>;
  listTiers(eventId: string): Promise<TicketTier[]>;
  purchaseTickets(tierId: string, quantity: number, holderData: Pick<QRCodeTicket, 'holderName' | 'holderEmail' | 'holderId'>): Promise<QRCodeTicket[]>;
  getTicket(ticketId: string): Promise<QRCodeTicket>;
  transferTicket(ticketId: string, newHolderEmail: string): Promise<QRCodeTicket>;
  checkIn(qrCodeData: string, staffId: string, gate: string): Promise<CheckInRecord>;
  getCheckInStats(eventId: string): Promise<{ total: number; checkedIn: number; remaining: number }>;
}

/**
 * Create a ticketing engine for tier management, QR code tickets, and check-in processing.
 * Implement with your ticketing backend.
 */
export function createTicketingEngine(): TicketingEngine {
  return {
    async createTier(_eventId, _data) {
      throw new Error('Implement with your ticketing backend');
    },
    async listTiers(_eventId) {
      throw new Error('Implement with your ticketing backend');
    },
    async purchaseTickets(_tierId, _quantity, _holderData) {
      throw new Error('Implement with your ticketing backend');
    },
    async getTicket(_ticketId) {
      throw new Error('Implement with your ticketing backend');
    },
    async transferTicket(_ticketId, _newHolderEmail) {
      throw new Error('Implement with your ticketing backend');
    },
    async checkIn(_qrCodeData, _staffId, _gate) {
      throw new Error('Implement with your ticketing backend');
    },
    async getCheckInStats(_eventId) {
      throw new Error('Implement with your ticketing backend');
    },
  };
}
