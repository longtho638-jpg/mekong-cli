import { z } from 'zod'

// Mirrors Python: src/core/verifier.py ExecutionResult
export const ExecutionResultSchema = z.object({
  exit_code: z.number().int(),
  stdout: z.string().default(''),
  stderr: z.string().default(''),
  metadata: z.record(z.unknown()).default({}),
})

export const VerificationCheckSchema = z.object({
  name: z.string(),
  passed: z.boolean(),
  message: z.string().default(''),
})

export const VerificationReportSchema = z.object({
  passed: z.boolean(),
  checks: z.array(VerificationCheckSchema).default([]),
  summary: z.string().default(''),
})

// Mirrors Python: src/core/orchestrator.py StepResult
export const StepResultSchema = z.object({
  step: z.object({
    order: z.number(),
    title: z.string(),
  }),
  execution: ExecutionResultSchema,
  verification: VerificationReportSchema,
})

export const OrchestrationStatusSchema = z.enum([
  'success',
  'partial',
  'failed',
])

export const OrchestrationResultSchema = z.object({
  status: OrchestrationStatusSchema,
  total_steps: z.number().int(),
  completed_steps: z.number().int(),
  failed_steps: z.number().int(),
  success_rate: z.number(),
  errors: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  step_results: z.array(StepResultSchema).default([]),
})

export type ExecutionResult = z.infer<typeof ExecutionResultSchema>
export type VerificationCheck = z.infer<typeof VerificationCheckSchema>
export type VerificationReport = z.infer<typeof VerificationReportSchema>
export type StepResult = z.infer<typeof StepResultSchema>
export type OrchestrationStatus = z.infer<typeof OrchestrationStatusSchema>
export type OrchestrationResult = z.infer<typeof OrchestrationResultSchema>
