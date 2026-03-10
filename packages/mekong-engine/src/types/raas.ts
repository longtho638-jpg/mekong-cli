import { z } from 'zod'

// Mirrors Python: src/raas/tenant.py
export const TenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  api_key_hash: z.string(),
  tier: z.enum(['free', 'pro', 'enterprise']).default('free'),
  created_at: z.string(),
})

// Mirrors Python: src/raas/credits.py
export const CreditEntrySchema = z.object({
  id: z.number().int(),
  tenant_id: z.string().uuid(),
  amount: z.number().int(),
  reason: z.string().default(''),
  created_at: z.string(),
})

// Mirrors Python: src/raas/missions.py
export const MissionStatusSchema = z.enum([
  'pending',
  'planning',
  'executing',
  'verifying',
  'completed',
  'failed',
])

export const MissionSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  goal: z.string().min(1),
  status: MissionStatusSchema.default('pending'),
  credits_used: z.number().int().default(0),
  total_steps: z.number().int().default(0),
  completed_steps: z.number().int().default(0),
  result: z.string().nullable().optional(),
  created_at: z.string(),
  completed_at: z.string().nullable().optional(),
})

// Credit tiers from README
export const CREDIT_TIERS = {
  simple: 1,
  standard: 3,
  complex: 5,
} as const

// BYOK — tenant LLM settings
export const LLMProviderSchema = z.enum(['openai', 'google', 'anthropic', 'custom', 'workers-ai'])

export const TenantSettingsSchema = z.object({
  tenant_id: z.string().uuid(),
  llm_provider: LLMProviderSchema.default('workers-ai'),
  llm_api_key_encrypted: z.string().nullable().optional(),
  llm_base_url: z.string().nullable().optional(),
  llm_model: z.string().nullable().optional(),
  updated_at: z.string(),
})

export type Tenant = z.infer<typeof TenantSchema>
export type CreditEntry = z.infer<typeof CreditEntrySchema>
export type MissionStatus = z.infer<typeof MissionStatusSchema>
export type Mission = z.infer<typeof MissionSchema>
export type LLMProvider = z.infer<typeof LLMProviderSchema>
export type TenantSettings = z.infer<typeof TenantSettingsSchema>
