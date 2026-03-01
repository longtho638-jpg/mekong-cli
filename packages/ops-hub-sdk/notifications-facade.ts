/**
 * Notifications facade — multi-channel delivery, templates, preferences
 */
export interface NotificationPayload {
  recipientId: string;
  channel: 'email' | 'sms' | 'push' | 'in_app' | 'webhook';
  template: string;
  data: Record<string, unknown>;
  priority?: 'high' | 'normal' | 'low';
}

export interface NotificationPreference {
  userId: string;
  channel: string;
  enabled: boolean;
  frequency?: 'realtime' | 'digest_daily' | 'digest_weekly';
}

export class NotificationsFacade {
  async send(payload: NotificationPayload): Promise<{ id: string; status: string }> {
    throw new Error('Implement with vibe-notifications provider');
  }

  async getPreferences(userId: string): Promise<NotificationPreference[]> {
    throw new Error('Implement with vibe-notifications provider');
  }

  async updatePreference(pref: NotificationPreference): Promise<void> {
    throw new Error('Implement with vibe-notifications provider');
  }
}
