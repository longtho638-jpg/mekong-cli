/**
 * @agencyos/events-hub-sdk — Event Planning Facade
 *
 * Event creation, venue management, scheduling, and RSVP tracking
 * for end-to-end event planning operations.
 *
 * Usage:
 *   import { createEventPlanner } from '@agencyos/events-hub-sdk/event-planning';
 */

export interface Event {
  eventId: string;
  organizerId: string;
  title: string;
  description: string;
  category: 'conference' | 'workshop' | 'concert' | 'sports' | 'corporate' | 'social' | 'other';
  venueId?: string;
  isVirtual: boolean;
  startAt: Date;
  endAt: Date;
  maxAttendees: number;
  currentAttendees: number;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  tags: string[];
  coverImageUrl?: string;
}

export interface Venue {
  venueId: string;
  name: string;
  address: string;
  city: string;
  country: string;
  capacitySeated: number;
  capacityStanding: number;
  amenities: string[];
  contactEmail: string;
  contactPhone: string;
  pricePerHour: number;
  currency: string;
  availabilityCalendarUrl?: string;
}

export interface EventSchedule {
  scheduleId: string;
  eventId: string;
  sessions: Array<{
    sessionId: string;
    title: string;
    speakerId?: string;
    startAt: Date;
    endAt: Date;
    roomOrStage: string;
    description?: string;
  }>;
}

export interface RSVPRecord {
  rsvpId: string;
  eventId: string;
  attendeeId: string;
  attendeeName: string;
  attendeeEmail: string;
  status: 'pending' | 'confirmed' | 'waitlisted' | 'declined' | 'cancelled';
  respondedAt: Date;
  checkInAt?: Date;
}

export interface EventPlanner {
  createEvent(data: Omit<Event, 'eventId' | 'currentAttendees' | 'status'>): Promise<Event>;
  getEvent(eventId: string): Promise<Event>;
  updateEvent(eventId: string, data: Partial<Event>): Promise<Event>;
  cancelEvent(eventId: string, reason: string): Promise<void>;
  searchVenues(city: string, minCapacity: number): Promise<Venue[]>;
  getVenue(venueId: string): Promise<Venue>;
  setEventSchedule(eventId: string, schedule: Omit<EventSchedule, 'scheduleId'>): Promise<EventSchedule>;
  submitRSVP(eventId: string, attendeeData: Pick<RSVPRecord, 'attendeeName' | 'attendeeEmail'>): Promise<RSVPRecord>;
  listRSVPs(eventId: string): Promise<RSVPRecord[]>;
}

/**
 * Create an event planner for event creation, venue booking, scheduling, and RSVP management.
 * Implement with your events backend.
 */
export function createEventPlanner(): EventPlanner {
  return {
    async createEvent(_data) {
      throw new Error('Implement with your events backend');
    },
    async getEvent(_eventId) {
      throw new Error('Implement with your events backend');
    },
    async updateEvent(_eventId, _data) {
      throw new Error('Implement with your events backend');
    },
    async cancelEvent(_eventId, _reason) {
      throw new Error('Implement with your events backend');
    },
    async searchVenues(_city, _minCapacity) {
      throw new Error('Implement with your events backend');
    },
    async getVenue(_venueId) {
      throw new Error('Implement with your events backend');
    },
    async setEventSchedule(_eventId, _schedule) {
      throw new Error('Implement with your events backend');
    },
    async submitRSVP(_eventId, _attendeeData) {
      throw new Error('Implement with your events backend');
    },
    async listRSVPs(_eventId) {
      throw new Error('Implement with your events backend');
    },
  };
}
