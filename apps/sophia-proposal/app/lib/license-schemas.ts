// Zod Schemas for License Service Input Validation
// ROIaaS Phase 3 - Security Audit

import { z } from 'zod'

/**
 * License tier enum schema
 */
export const LicenseTierSchema = z.enum(['FREE', 'PRO', 'ENTERPRISE', 'MASTER'])

/**
 * License status enum schema
 */
export const LicenseStatusSchema = z.enum(['active', 'revoked', 'expired'])

/**
 * Subscription status enum schema (ROIaaS Phase 3)
 */
export const SubscriptionStatusSchema = z.enum(['active', 'cancelled', 'uncancelled'])

/**
 * Schema for creating a new license
 */
export const CreateLicenseInputSchema = z.object({
  tier: LicenseTierSchema,
  customerId: z.string().min(1, 'Customer ID is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  expiresInDays: z.number().int().positive('Expires in days must be positive').optional(),
  features: z.array(z.string()).optional(),
})

/**
 * Schema for updating subscription info
 */
export const UpdateSubscriptionInputSchema = z.object({
  subscriptionId: z.string().min(1, 'Subscription ID is required'),
  subscriptionStatus: SubscriptionStatusSchema,
})

/**
 * Type inference from schemas
 */
export type CreateLicenseInput = z.infer<typeof CreateLicenseInputSchema>
export type UpdateSubscriptionInput = z.infer<typeof UpdateSubscriptionInputSchema>
