/**
 * 🟣 Saturn - VIBE Agents Registry
 */
import { AgentDefinition } from './types';

export const AGENT_REGISTRY: AgentDefinition[] = [
    { id: 'project-manager', name: 'Project Manager', description: 'Planning', phase: 'plan', capabilities: ['planning'], successKpis: ['completion'] },
    { id: 'fullstack-developer', name: 'Fullstack Developer', description: 'Coding', phase: 'code', capabilities: ['coding'], successKpis: ['velocity'] },
];
