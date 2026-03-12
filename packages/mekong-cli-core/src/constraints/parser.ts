/**
 * Parse constraints from mekong.md project file.
 * Extracts budget limits, tool permissions, boundaries.
 */
import { readFileContent } from '../utils/file.js';
import { ok, err, type Result } from '../types/common.js';

export interface ProjectConstraints {
  budget?: {
    maxCostPerTask?: number;
    maxTokensPerTask?: number;
  };
  tools?: {
    blocked?: string[];
    autoApproveLevel?: string;
  };
  boundaries?: string[];
}

/** Parse project constraints from mekong.md */
export async function parseProjectConstraints(filePath: string): Promise<Result<ProjectConstraints>> {
  const fileResult = await readFileContent(filePath);
  if (!fileResult.ok) {
    return ok({}); // No constraints file = no constraints
  }

  try {
    const constraints = extractConstraints(fileResult.value);
    return ok(constraints);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

/** Extract constraints from markdown content */
function extractConstraints(content: string): ProjectConstraints {
  const result: ProjectConstraints = {};

  // Extract budget section
  const budgetMatch = content.match(/##\s*Budget[^#]*?((?:[-*]\s+.+\n?)+)/im);
  if (budgetMatch) {
    result.budget = {};
    const costMatch = budgetMatch[1].match(/max[_\s]*cost[^:]*:\s*\$?([\d.]+)/i);
    if (costMatch) result.budget.maxCostPerTask = parseFloat(costMatch[1]);
    const tokenMatch = budgetMatch[1].match(/max[_\s]*tokens[^:]*:\s*([\d,]+)/i);
    if (tokenMatch) result.budget.maxTokensPerTask = parseInt(tokenMatch[1].replace(/,/g, ''), 10);
  }

  // Extract boundaries
  const boundaryMatch = content.match(/##\s*Boundaries[^#]*?((?:[-*]\s+.+\n?)+)/im);
  if (boundaryMatch) {
    result.boundaries = boundaryMatch[1]
      .split('\n')
      .filter(l => l.match(/^[-*]\s+/))
      .map(l => l.replace(/^[-*]\s+/, '').trim())
      .filter(Boolean);
  }

  return result;
}
