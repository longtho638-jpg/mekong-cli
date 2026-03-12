/** Google Calendar integration via googleapis OAuth2 */
import { google } from 'googleapis';
import type { Integration, IntegrationCredentials } from '../types.js';
import type { CalendarEvent, TimeSlot } from './types.js';
import { ok, err } from '../../types/common.js';
import type { Result } from '../../types/common.js';

export class GoogleCalendarIntegration implements Integration {
  readonly name = 'google-calendar';
  connected = false;
  private calendar: ReturnType<typeof google.calendar> | null = null;

  async connect(credentials: IntegrationCredentials): Promise<Result<void>> {
    if (credentials.type !== 'oauth') {
      return err(new Error('Google Calendar requires oauth credentials'));
    }
    try {
      const auth = new google.auth.OAuth2(
        credentials.clientId,
        credentials.clientSecret,
      );
      auth.setCredentials({ refresh_token: credentials.refreshToken });
      this.calendar = google.calendar({ version: 'v3', auth });
      // Verify by listing one event
      await this.calendar.calendarList.list({ maxResults: 1 });
      this.connected = true;
      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async disconnect(): Promise<void> {
    this.calendar = null;
    this.connected = false;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.calendar) return false;
    try {
      await this.calendar.calendarList.list({ maxResults: 1 });
      return true;
    } catch {
      return false;
    }
  }

  async listEvents(calendarId = 'primary', maxResults = 20): Promise<Result<CalendarEvent[]>> {
    if (!this.calendar) return err(new Error('Not connected'));
    try {
      const res = await this.calendar.events.list({
        calendarId,
        maxResults,
        orderBy: 'startTime',
        singleEvents: true,
        timeMin: new Date().toISOString(),
      });
      const items = res.data.items ?? [];
      const events: CalendarEvent[] = items.map((e) => ({
        id: e.id,
        title: e.summary ?? '(no title)',
        description: e.description,
        startTime: e.start?.dateTime ?? e.start?.date ?? '',
        endTime: e.end?.dateTime ?? e.end?.date ?? '',
        attendees: (e.attendees ?? []).map((a: { email: string }) => a.email),
        location: e.location,
        meetingUrl: e.hangoutLink,
        calendarId,
      }));
      return ok(events);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async createEvent(event: CalendarEvent, calendarId = 'primary'): Promise<Result<string>> {
    if (!this.calendar) return err(new Error('Not connected'));
    try {
      const res = await this.calendar.events.insert({
        calendarId,
        resource: {
          summary: event.title,
          description: event.description,
          location: event.location,
          start: { dateTime: event.startTime },
          end: { dateTime: event.endTime },
          attendees: (event.attendees ?? []).map((email: string) => ({ email })),
        },
      });
      return ok(res.data.id as string);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async findFreeSlots(
    calendarId = 'primary',
    durationMinutes = 30,
    daysAhead = 7,
  ): Promise<Result<TimeSlot[]>> {
    if (!this.calendar) return err(new Error('Not connected'));
    try {
      const now = new Date();
      const until = new Date(now.getTime() + daysAhead * 86400_000);
      const res = await this.calendar.freebusy.query({
        resource: {
          timeMin: now.toISOString(),
          timeMax: until.toISOString(),
          items: [{ id: calendarId }],
        },
      });
      const busySlots: Array<{ start: string; end: string }> =
        res.data.calendars?.[calendarId]?.busy ?? [];

      const slots: TimeSlot[] = [];
      let cursor = new Date(now);
      cursor.setMinutes(Math.ceil(cursor.getMinutes() / 30) * 30, 0, 0);

      while (cursor < until && slots.length < 10) {
        const slotEnd = new Date(cursor.getTime() + durationMinutes * 60_000);
        const busy = busySlots.some(b => {
          const bs = new Date(b.start).getTime();
          const be = new Date(b.end).getTime();
          return cursor.getTime() < be && slotEnd.getTime() > bs;
        });
        if (!busy && cursor.getHours() >= 8 && cursor.getHours() < 18) {
          slots.push({ start: cursor.toISOString(), end: slotEnd.toISOString(), available: true });
        }
        cursor = new Date(cursor.getTime() + 30 * 60_000);
      }
      return ok(slots);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async todayAgenda(calendarId = 'primary'): Promise<Result<CalendarEvent[]>> {
    if (!this.calendar) return err(new Error('Not connected'));
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + 86400_000);
      const res = await this.calendar.events.list({
        calendarId,
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });
      const items = res.data.items ?? [];
      const events: CalendarEvent[] = items.map((e) => ({
        id: e.id,
        title: e.summary ?? '(no title)',
        description: e.description,
        startTime: e.start?.dateTime ?? e.start?.date ?? '',
        endTime: e.end?.dateTime ?? e.end?.date ?? '',
        attendees: (e.attendees ?? []).map((a: { email: string }) => a.email),
        location: e.location,
        meetingUrl: e.hangoutLink,
        calendarId,
      }));
      return ok(events);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }
}
