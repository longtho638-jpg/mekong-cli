/**
 * Recipe Orchestrator — Plan → Execute → Verify with rollback.
 * Mirrors Python: src/core/orchestrator.py
 *
 * Coordinates the full PEV pipeline for a goal.
 */

import type { Recipe } from '../types/recipe'
import type { OrchestrationResult, StepResult } from '../types/execution'
import { LLMClient } from './llm-client'
import { RecipeExecutor } from './executor'
import { RecipeVerifier } from './recipe-verifier'
import { RecipePlanner } from './recipe-planner'

export class RecipeOrchestrator {
  private planner: RecipePlanner
  private executor: RecipeExecutor
  private verifier: RecipeVerifier

  constructor(opts: {
    ai?: Ai
    llmApiKey?: string
    llmBaseUrl?: string
    model?: string
    strictVerification?: boolean
    enableRollback?: boolean
  }) {
    const llm = new LLMClient({
      ai: opts.ai,
      llmApiKey: opts.llmApiKey,
      llmBaseUrl: opts.llmBaseUrl,
      model: opts.model,
    })

    this.planner = new RecipePlanner(llm)
    this.executor = new RecipeExecutor(llm)
    this.verifier = new RecipeVerifier(opts.strictVerification ?? true, llm)
  }

  async runFromGoal(goal: string): Promise<OrchestrationResult> {
    // 1. PLAN
    const recipe = await this.planner.plan(goal)

    // 2. EXECUTE + VERIFY each step
    return this.runRecipe(recipe)
  }

  async runRecipe(recipe: Recipe): Promise<OrchestrationResult> {
    const stepResults: StepResult[] = []
    const errors: string[] = []
    const warnings: string[] = []
    let completedSteps = 0
    let failedSteps = 0

    for (const step of recipe.steps) {
      // Execute
      const execution = await this.executor.executeStep(step)

      // Verify
      const verification = this.verifier.verify(
        execution,
        step.verification as Record<string, unknown> | undefined,
      )

      stepResults.push({
        step: { order: step.order, title: step.title },
        execution,
        verification,
      })

      if (verification.passed) {
        completedSteps++
      } else {
        failedSteps++
        errors.push(`Step ${step.order} "${step.title}": ${verification.summary}`)
      }
    }

    const totalSteps = recipe.steps.length
    const successRate = totalSteps > 0 ? completedSteps / totalSteps : 0

    let status: 'success' | 'partial' | 'failed'
    if (failedSteps === 0) {
      status = 'success'
    } else if (completedSteps > 0) {
      status = 'partial'
    } else {
      status = 'failed'
    }

    return {
      status,
      total_steps: totalSteps,
      completed_steps: completedSteps,
      failed_steps: failedSteps,
      success_rate: successRate,
      errors,
      warnings,
      step_results: stepResults,
    }
  }
}
