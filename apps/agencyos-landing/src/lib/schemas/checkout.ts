import { z } from 'zod';

export const CheckoutSchema = z.object({
  priceId: z.string().min(1),
  customerEmail: z.string().email().optional(),
  locale: z.string().optional(),
});

export type CheckoutInput = z.infer<typeof CheckoutSchema>;
