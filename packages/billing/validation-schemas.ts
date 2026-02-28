/**
 * Billing validation schemas (Zod) — reusable across e-commerce apps.
 * Covers: order creation, payment link, webhook payload.
 */

import { z } from 'zod';

/** Order creation schema — validates cart + customer info */
export const orderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1).optional(),
      id: z.string().min(1).optional(),
      name: z.string().min(1).max(200),
      quantity: z.number().int().min(1).max(99),
      price: z.number().positive(),
      weight: z.string().max(50).optional(),
      image: z.string().max(2048).optional(),
    })
  ).min(1).max(50),
  total: z.number().positive(),
  customerInfo: z.object({
    name: z.string().min(2).max(100),
    phone: z.string().min(10).max(15),
    email: z.string().email().max(255).optional().or(z.literal('')),
    address: z.string().min(5).max(500),
    city: z.string().min(1).max(100),
    note: z.string().max(500).optional().or(z.literal('')),
  }),
  paymentMethod: z.string().max(20).optional(),
});

/** Payment link creation schema — used by PayOS/Stripe payment link APIs */
export const paymentLinkSchema = z.object({
  orderCode: z.number().int().positive(),
  amount: z.number().positive().optional(),
  description: z.string().min(1).max(500),
  returnUrl: z.string().url().max(2048),
  cancelUrl: z.string().url().max(2048),
  items: z.array(
    z.object({
      id: z.string().min(1).optional(),
      productId: z.string().min(1).optional(),
      name: z.string().min(1).max(200),
      quantity: z.number().int().min(1).max(99),
      price: z.number().positive(),
    })
  ).min(1).max(50),
  buyerName: z.string().max(100).optional(),
  buyerPhone: z.string().max(15).optional(),
  buyerEmail: z.string().email().max(255).optional().or(z.literal('')),
  buyerAddress: z.string().max(500).optional(),
});

/** Webhook payload schema — basic structure validation before SDK-level verification */
export const webhookSchema = z.object({
  code: z.string(),
  desc: z.string().optional(),
  data: z.object({
    orderCode: z.number(),
    amount: z.number(),
    description: z.string().optional(),
    accountNumber: z.string().optional(),
    reference: z.string().optional(),
    transactionDateTime: z.string().optional(),
    paymentLinkId: z.string().optional(),
    code: z.string().optional(),
    desc: z.string().optional(),
    counterAccountBankId: z.string().nullable().optional(),
    counterAccountBankName: z.string().nullable().optional(),
    counterAccountName: z.string().nullable().optional(),
    counterAccountNumber: z.string().nullable().optional(),
    virtualAccountName: z.string().nullable().optional(),
    virtualAccountNumber: z.string().nullable().optional(),
    currency: z.string().optional(),
  }).passthrough(),
  signature: z.string(),
  success: z.boolean().optional(),
});

export type OrderInput = z.infer<typeof orderSchema>;
export type PaymentLinkInput = z.infer<typeof paymentLinkSchema>;
export type WebhookInput = z.infer<typeof webhookSchema>;
