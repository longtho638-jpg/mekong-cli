/**
 * Skill Evolution — auto-generate new skills from recurring patterns.
 * ROI: Engineering ROI — turns repeated workflows into reusable SOPs.
 * User approval gate (Jidoka) before activating any learned skill.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { LearnedSkill, ExecutionRecord } from './types.js';
import type { LlmRouter } from '../llm/router.js';
import { ok, err } from '../types/common.js';
import type { Result } from '../types/common.js';

export class SkillEvolution {
  private readonly skillsPath: string;

  constructor(dataDir: string, private readonly llm: LlmRouter) {
    this.skillsPath = `${dataDir}/learned-skills.json`;
  }

  /** Detect recurring tool-call sequences that could become skills */
  async detectCandidates(executions: ExecutionRecord[], minOccurrences: number): Promise<LearnedSkill[]> {
    // Extract tool sequences from each execution
    const sequences = executions.map(e => ({
      tools: e.toolsCalled.map(t => t.tool),
      taskType: e.taskType,
      input: e.input,
    }));

    // Find sequences appearing >= minOccurrences times
    const seqCounts = new Map<string, { count: number; taskType: string; inputs: string[] }>();
    for (const seq of sequences) {
      const key = seq.tools.join(' → ');
      if (!key) continue;
      const entry = seqCounts.get(key) ?? { count: 0, taskType: seq.taskType, inputs: [] };
      entry.count++;
      entry.inputs.push(seq.input);
      seqCounts.set(key, entry);
    }

    const now = new Date().toISOString();
    const candidates: LearnedSkill[] = [];

    for (const [seqKey, data] of seqCounts) {
      if (data.count < minOccurrences) continue;
      candidates.push({
        id: `sk-${Date.now()}-${candidates.length}`,
        name: `auto-${data.taskType}-workflow`,
        description: `Automates: ${seqKey} (seen ${data.count} times)`,
        trigger: data.taskType,
        implementation: { type: 'sop', definition: seqKey },
        source: 'skill-evolution',
        usageCount: 0,
        successRate: 0,
        status: 'proposed',
        createdAt: now,
      });
    }

    return candidates;
  }

  /** Generate SOP YAML from a recurring tool-call pattern */
  async generateSop(pattern: {
    toolSequence: string[];
    commonInputs: Record<string, unknown>;
    description: string;
  }): Promise<Result<string>> {
    try {
      const prompt = `Generate a mekong SOP YAML for this workflow:
Description: ${pattern.description}
Tool sequence: ${pattern.toolSequence.join(' → ')}
Common inputs: ${JSON.stringify(pattern.commonInputs)}

Format: standard mekong SOP YAML with steps, inputs, outputs.`;

      const response = await this.llm.chat({
        messages: [{ role: 'user', content: prompt }],
        model: 'default',
      });
      return ok(response.content);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /** Approve and save a learned skill */
  async approve(skill: LearnedSkill): Promise<Result<void>> {
    try {
      const skills = await this.loadSkills();
      const updated = { ...skill, status: 'active' as const };
      const idx = skills.findIndex(s => s.id === skill.id);
      if (idx >= 0) skills[idx] = updated;
      else skills.push(updated);
      await this.saveSkills(skills);
      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /** Get active learned skills */
  async getActiveSkills(): Promise<LearnedSkill[]> {
    const skills = await this.loadSkills();
    return skills.filter(s => s.status === 'active');
  }

  /** Suggest relevant learned skill for current task */
  async suggestSkill(taskDescription: string): Promise<LearnedSkill | null> {
    const active = await this.getActiveSkills();
    if (active.length === 0) return null;
    const lower = taskDescription.toLowerCase();
    // Simple trigger matching — find skill whose trigger appears in task description
    return active.find(s => lower.includes(s.trigger.toLowerCase())) ?? null;
  }

  private async loadSkills(): Promise<LearnedSkill[]> {
    try {
      const content = await readFile(this.skillsPath, 'utf-8');
      return JSON.parse(content) as LearnedSkill[];
    } catch {
      return [];
    }
  }

  private async saveSkills(skills: LearnedSkill[]): Promise<void> {
    await mkdir(dirname(this.skillsPath), { recursive: true });
    await writeFile(this.skillsPath, JSON.stringify(skills, null, 2));
  }
}
