/**
 * 🟣 Saturn - VIBE Agents Registry
 */
import { AgentDefinition } from './types';

export const AGENT_REGISTRY: AgentDefinition[] = [
    { id: 'project-manager', name: 'Project Manager', description: 'Planning', phase: 'plan', capabilities: ['spec-generation'], successKpis: ['completion'] },
    { id: 'fullstack-developer', name: 'Fullstack Developer', description: 'Coding', phase: 'code', capabilities: ['multi-file-edit'], successKpis: ['velocity'] },
    { id: 'devops-engineer', name: 'DevOps Engineer', description: 'Shipping', phase: 'ship', capabilities: ['deployment'], successKpis: ['uptime'] },
    { id: 'security-auditor', name: 'Security Auditor', description: 'Security Check', phase: 'ship', capabilities: ['security'], successKpis: ['vuln_count'] },
    { id: 'qa-engineer', name: 'QA Engineer', description: 'Testing', phase: 'code', capabilities: ['testing'], successKpis: ['test_coverage'] },
    { id: 'growth-hacker', name: 'Growth Hacker', description: 'Marketing', phase: 'plan', capabilities: ['seo'], successKpis: ['leads'] },
];
