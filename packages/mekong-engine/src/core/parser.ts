/**
 * Recipe Parser — Markdown → Recipe object.
 * Mirrors Python: src/core/parser.py
 */

import type { Recipe, RecipeStep } from '../types/recipe'

const STEP_HEADER = /^##\s+Step\s+(\d+):\s*(.+)$/gm
const FRONTMATTER = /^---\n([\s\S]*?)\n---/

export function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(FRONTMATTER)
  if (!match) return {}

  const meta: Record<string, string> = {}
  for (const line of (match[1] ?? '').split('\n')) {
    const idx = line.indexOf(':')
    if (idx > 0) {
      meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
    }
  }
  return meta
}

export function parseSteps(content: string): RecipeStep[] {
  const steps: RecipeStep[] = []
  const parts = content.split(STEP_HEADER)

  // parts layout: [before, num1, title1, body1, num2, title2, body2, ...]
  for (let i = 1; i + 2 < parts.length; i += 3) {
    const num = parts[i]
    const ttl = parts[i + 1]
    const desc = parts[i + 2]
    if (num === undefined || ttl === undefined || desc === undefined) continue
    steps.push({
      order: parseInt(num, 10),
      title: ttl.trim(),
      description: desc.trim(),
      mode: 'shell',
      depends_on: [],
      params: {},
    })
  }
  return steps
}

export function parseRecipe(content: string, name = 'inline'): Recipe {
  const meta = parseFrontmatter(content)
  const clean = content.replace(FRONTMATTER, '').trim()

  // Extract title from first H1
  const titleMatch = clean.match(/^#\s+(.+)$/m)
  const title = titleMatch?.[1] ?? name

  // Extract description (between title and first ## Step)
  const descMatch = clean.match(/^#\s+[^\n]+\n+([\s\S]*?)(?=^##|\Z)/m)
  const description = descMatch?.[1]?.trim() ?? ''

  const steps = parseSteps(clean)

  return {
    name: meta.name ?? title,
    description,
    tags: meta.tags ? meta.tags.split(',').map((t) => t.trim()) : [],
    steps,
  }
}
