import { z } from 'zod'

// Mirrors Python: src/core/agent_base.py
export const TaskStatusSchema = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
])

export const TaskSchema = z.object({
  id: z.string(),
  description: z.string(),
  status: TaskStatusSchema.default('pending'),
  params: z.record(z.unknown()).default({}),
})

export const ResultSchema = z.object({
  task_id: z.string(),
  success: z.boolean(),
  output: z.unknown().optional(),
  error: z.string().optional(),
})

export type TaskStatus = z.infer<typeof TaskStatusSchema>
export type Task = z.infer<typeof TaskSchema>
export type Result = z.infer<typeof ResultSchema>

// Agent interface — all agents implement plan/execute/verify
export interface AgentBase {
  name: string
  description: string
  plan(input: string): Promise<Task[]>
  execute(tasks: Task[]): Promise<Result[]>
  verify(results: Result[]): Promise<boolean>
}

// Agent registry type
export type AgentRegistry = Record<string, AgentBase>
