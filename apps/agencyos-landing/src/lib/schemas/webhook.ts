import { z } from 'zod';

export const WebhookEventSchema = z.object({
  type: z.string(),
  data: z.record(z.string(), z.unknown()),
});

export type WebhookEvent = z.infer<typeof WebhookEventSchema>;
