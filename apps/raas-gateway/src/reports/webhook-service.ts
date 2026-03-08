import { WebhookPayload } from './types';

/**
 * Service for triggering webhooks to update AgencyOS dashboard
 */
export class WebhookService {
  private webhookUrl: string;
  private authToken: string;

  constructor(webhookUrl?: string, authToken?: string) {
    this.webhookUrl = webhookUrl || process.env.AGENCYOS_WEBHOOK_URL || '';
    this.authToken = authToken || process.env.AGENCYOS_WEBHOOK_AUTH_TOKEN || '';
  }

  /**
   * Trigger webhook to update AgencyOS dashboard
   */
  async triggerDashboardUpdate(payload: WebhookPayload): Promise<boolean> {
    if (!this.webhookUrl || !this.authToken) {
      console.warn('Webhook URL or auth token not configured, skipping dashboard update');
      return true; // Don't fail if webhook is not configured
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
          'User-Agent': 'RaaS-Gateway/1.0'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log('Dashboard update webhook sent successfully');
        return true;
      } else {
        console.error(`Webhook request failed with status: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error('Error sending webhook:', error);
      return false;
    }
  }
}