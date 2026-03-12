/**
 * Skill Evolution — auto-generate new skills from recurring patterns.
 * User approval gate (Jidoka) before activating any learned skill.
 */
import type { LearnedSkill, ExecutionRecord } from './types.js';
import type { LlmRouter } from '../llm/router.js';
import type { Result } from '../types/common.js';

export class SkillEvolution {
  private readonly skillsPath: string;

  constructor(dataDir: string, private readonly llm: LlmRouter) {
    this.skillsPath = `${dataDir}/learned-skills.json`;
  }

  /** Detect recurring patterns that could become skills */
  async detectCandidates(_executions: ExecutionRecord[], _minOccurrences: number): Promise<LearnedSkill[]> {
    throw new Error('Not implemented');
  }

  /** Generate SOP YAML from a recurring tool-call pattern */
  async generateSop(_pattern: {
    toolSequence: string[];
    commonInputs: Record<string, unknown>;
    description: string;
  }): Promise<Result<string>> {
    throw new Error('Not implemented');
  }

  /** Approve and save a learned skill */
  async approve(_skill: LearnedSkill): Promise<Result<void>> {
    throw new Error('Not implemented');
  }

  /** Get active learned skills */
  async getActiveSkills(): Promise<LearnedSkill[]> {
    throw new Error('Not implemented');
  }

  /** Suggest relevant learned skill for current task */
  async suggestSkill(_taskDescription: string): Promise<LearnedSkill | null> {
    throw new Error('Not implemented');
  }
}
