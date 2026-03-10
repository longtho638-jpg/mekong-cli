import { z } from 'zod'

// Mirrors Python: src/core/parser.py RecipeStep + Recipe
export const RecipeStepSchema = z.object({
  order: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().default(''),
  command: z.string().optional(),
  mode: z.enum(['shell', 'llm', 'api']).default('shell'),
  agent: z.string().optional(),
  depends_on: z.array(z.number()).default([]),
  verification: z.record(z.unknown()).optional(),
  params: z.record(z.unknown()).default({}),
})

export const RecipeSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(''),
  tags: z.array(z.string()).default([]),
  steps: z.array(RecipeStepSchema).min(1),
  path: z.string().optional(),
})

export type RecipeStep = z.infer<typeof RecipeStepSchema>
export type Recipe = z.infer<typeof RecipeSchema>
