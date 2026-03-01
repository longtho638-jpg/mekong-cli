/**
 * @agencyos/nonprofit-hub-sdk — Volunteer Management Facade
 *
 * Volunteer matching, shift scheduling, and hours tracking
 * for nonprofit volunteer program management.
 *
 * Usage:
 *   import { createVolunteerManager } from '@agencyos/nonprofit-hub-sdk/volunteer';
 */

export interface Volunteer {
  volunteerId: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  skills: string[];
  availableDays: Array<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'>;
  availableTimeSlots: Array<'morning' | 'afternoon' | 'evening'>;
  backgroundCheckStatus: 'not-required' | 'pending' | 'cleared' | 'flagged';
  totalHoursLogged: number;
  joinedAt: Date;
  status: 'active' | 'inactive' | 'suspended';
}

export interface VolunteerSchedule {
  scheduleId: string;
  organizationId: string;
  title: string;
  description?: string;
  requiredSkills: string[];
  location: string;
  startAt: Date;
  endAt: Date;
  spotsTotal: number;
  spotsFilledCount: number;
  assignedVolunteerIds: string[];
  status: 'open' | 'filled' | 'completed' | 'cancelled';
}

export interface HoursLog {
  logId: string;
  volunteerId: string;
  scheduleId?: string;
  organizationId: string;
  activityDescription: string;
  hoursLogged: number;
  loggedDate: Date;
  verifiedByStaffId?: string;
  verifiedAt?: Date;
  status: 'pending' | 'verified' | 'rejected';
}

export interface VolunteerManager {
  registerVolunteer(data: Omit<Volunteer, 'volunteerId' | 'totalHoursLogged' | 'joinedAt' | 'status'>): Promise<Volunteer>;
  getVolunteer(volunteerId: string): Promise<Volunteer>;
  matchVolunteers(scheduleId: string): Promise<Volunteer[]>;
  assignVolunteer(scheduleId: string, volunteerId: string): Promise<VolunteerSchedule>;
  createSchedule(data: Omit<VolunteerSchedule, 'scheduleId' | 'spotsFilledCount' | 'assignedVolunteerIds' | 'status'>): Promise<VolunteerSchedule>;
  listSchedules(organizationId: string): Promise<VolunteerSchedule[]>;
  logHours(data: Omit<HoursLog, 'logId' | 'status'>): Promise<HoursLog>;
  verifyHours(logId: string, staffId: string): Promise<HoursLog>;
  getVolunteerHoursSummary(volunteerId: string): Promise<{ totalHours: number; verifiedHours: number }>;
}

/**
 * Create a volunteer manager for matching, scheduling, and hours tracking.
 * Implement with your nonprofit volunteer backend.
 */
export function createVolunteerManager(): VolunteerManager {
  return {
    async registerVolunteer(_data) {
      throw new Error('Implement with your nonprofit volunteer backend');
    },
    async getVolunteer(_volunteerId) {
      throw new Error('Implement with your nonprofit volunteer backend');
    },
    async matchVolunteers(_scheduleId) {
      throw new Error('Implement with your nonprofit volunteer backend');
    },
    async assignVolunteer(_scheduleId, _volunteerId) {
      throw new Error('Implement with your nonprofit volunteer backend');
    },
    async createSchedule(_data) {
      throw new Error('Implement with your nonprofit volunteer backend');
    },
    async listSchedules(_organizationId) {
      throw new Error('Implement with your nonprofit volunteer backend');
    },
    async logHours(_data) {
      throw new Error('Implement with your nonprofit volunteer backend');
    },
    async verifyHours(_logId, _staffId) {
      throw new Error('Implement with your nonprofit volunteer backend');
    },
    async getVolunteerHoursSummary(_volunteerId) {
      throw new Error('Implement with your nonprofit volunteer backend');
    },
  };
}
