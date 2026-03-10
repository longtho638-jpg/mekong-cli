/**
 * Recipe Planner — decomposes goals into executable recipes.
 * Mirrors Python: src/core/planner.py
 *
 * PLAN phase of Plan-Execute-Verify pattern.
 * Uses LLM when available, falls back to rule-based decomposition.
 */

import type { Recipe, RecipeStep } from '../types/recipe'
import type { LLMClient } from './llm-client'

// Keyword → agent mapping for smart routing
const AGENT_KEYWORDS: Record<string, string[]> = {
  git: ['git', 'commit', 'branch', 'merge', 'diff', 'log', 'push', 'pull'],
  file: ['file', 'read', 'write', 'copy', 'move', 'delete', 'directory'],
  shell: ['run', 'execute', 'script', 'command', 'install', 'build'],
  lead: ['lead', 'prospect', 'ceo', 'email', 'company', 'hunt'],
  content: ['content', 'article', 'blog', 'seo', 'copywriting'],
  crawler: ['crawl', 'scrape', 'recipe', 'discover'],
}

export class RecipePlanner {
  constructor(private llm: LLMClient) {}

  suggestAgent(goal: string): string | undefined {
    const lower = goal.toLowerCase()
    let best: string | undefined
    let bestScore = 0

    for (const [agent, keywords] of Object.entries(AGENT_KEYWORDS)) {
      const score = keywords.filter((kw) => lower.includes(kw)).length
      if (score > bestScore) {
        bestScore = score
        best = agent
      }
    }
    return best
  }

  async plan(goal: string): Promise<Recipe> {
    if (this.llm.isAvailable) {
      return this.llmPlan(goal)
    }
    return this.ruleBasedPlan(goal)
  }

  private async llmPlan(goal: string): Promise<Recipe> {
    const prompt = `Decompose this goal into 2-5 executable steps.
Goal: "${goal}"

Respond with JSON:
{
  "name": "short recipe name",
  "description": "what this recipe does",
  "steps": [
    {"order": 1, "title": "Step title", "description": "What to do", "mode": "llm|api|shell"}
  ]
}

Rules:
- Each step must be atomic and independently verifiable
- Use "llm" mode for text generation, "api" for HTTP calls, "shell" for commands
- Steps should build on each other logically`

    try {
      const data = await this.llm.generateJson(prompt)

      const steps: RecipeStep[] = []
      const rawSteps = (data.steps ?? []) as Array<Record<string, unknown>>
      for (const s of rawSteps) {
        steps.push({
          order: (s.order as number) ?? steps.length + 1,
          title: (s.title as string) ?? 'Untitled',
          description: (s.description as string) ?? '',
          mode: ((s.mode as string) ?? 'shell') as 'shell' | 'llm' | 'api',
          depends_on: [],
          params: {},
        })
      }

      return {
        name: (data.name as string) ?? goal.slice(0, 50),
        description: (data.description as string) ?? goal,
        tags: [],
        steps: steps.length > 0 ? steps : this.fallbackSteps(goal),
      }
    } catch {
      return this.ruleBasedPlan(goal)
    }
  }

  private ruleBasedPlan(goal: string): Recipe {
    const agent = this.suggestAgent(goal)
    const steps = this.fallbackSteps(goal, agent)

    return {
      name: goal.slice(0, 50),
      description: goal,
      tags: agent ? [agent] : [],
      steps,
    }
  }

  private fallbackSteps(goal: string, agent?: string): RecipeStep[] {
    return [
      {
        order: 1,
        title: 'Analyze requirements',
        description: `Analyze: ${goal}`,
        mode: 'llm',
        agent,
        depends_on: [],
        params: {},
      },
      {
        order: 2,
        title: 'Execute task',
        description: goal,
        mode: agent === 'shell' ? 'shell' : 'llm',
        agent,
        depends_on: [1],
        params: {},
      },
      {
        order: 3,
        title: 'Verify results',
        description: `Verify: ${goal}`,
        mode: 'llm',
        depends_on: [2],
        params: {},
      },
    ]
  }

  validatePlan(recipe: Recipe): string[] {
    const issues: string[] = []

    if (recipe.steps.length === 0) {
      issues.push('Recipe has no steps')
    }

    const orders = recipe.steps.map((s) => s.order)
    const unique = new Set(orders)
    if (unique.size !== orders.length) {
      issues.push('Duplicate step order numbers')
    }

    for (const step of recipe.steps) {
      if (!step.title.trim()) issues.push(`Step ${step.order}: empty title`)
      for (const dep of step.depends_on) {
        if (!orders.includes(dep)) {
          issues.push(`Step ${step.order}: dependency ${dep} not found`)
        }
      }
    }

    return issues
  }
}
