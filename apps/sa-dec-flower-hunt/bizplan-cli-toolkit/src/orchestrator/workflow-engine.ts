/**
 * Workflow Engine - Plan and execute agent workflows
 */

import { Workflow, WorkflowPreset, WORKFLOW_PRESETS } from '../types/workflow.types';
import { AgentTask } from '../types/agent.types';
import { MasterInput } from '../types/master.types';
import { DependencyResolver } from '../utils/dependency-resolver';
import { logger } from '../utils/logger';

export class WorkflowEngine {
    /**
     * Plan workflow based on user input
     */
    async plan(input: MasterInput): Promise<Workflow> {
        logger.info('Planning workflow...');

        let tasks: AgentTask[] = [];

        switch (input.type) {
            case 'full_plan':
                tasks = this.getFullWorkflow();
                break;

            case 'refactor_old_plan':
                tasks = this.getRefactorWorkflow();
                break;

            case 'workflow_preset':
                tasks = this.getPresetWorkflow(input.workflowPreset!);
                break;

            case 'specific_skills':
                tasks = this.getSpecificSkills(input.skillIds || []);
                break;

            default:
                throw new Error(`Unknown workflow type: ${input.type}`);
        }

        // Resolve dependencies (topological sort)
        const sorted = DependencyResolver.topologicalSort(tasks);

        const workflow: Workflow = {
            id: `workflow_${Date.now()}`,
            name: this.getWorkflowName(input),
            description: this.getWorkflowDescription(input),
            tasks: sorted,
            estimatedDuration: this.estimateDuration(sorted),
            createdAt: new Date().toISOString()
        };

        logger.info(`Workflow planned: ${workflow.tasks.length} tasks`);
        return workflow;
    }

    /**
     * Get full workflow (all 24 agents)
     */
    private getFullWorkflow(): AgentTask[] {
        // All 24 implemented agents in dependency order
        return [
            { skillId: '01', name: 'Refactor Plan', description: 'Refactor to BP2026', input: {}, dependencies: [], priority: 1 },
            { skillId: '02', name: 'Agentic Mapping', description: 'Design AI agents', input: {}, dependencies: ['01'], priority: 2 },
            { skillId: '03', name: 'IPO Readiness', description: 'VN/SEA IPO assessment', input: {}, dependencies: ['01'], priority: 2 },
            { skillId: '04', name: 'Gap Report', description: 'Gap analysis & roadmap', input: {}, dependencies: ['01', '03'], priority: 3 },
            { skillId: '05', name: 'Business Model', description: 'Unit economics', input: {}, dependencies: ['01'], priority: 2 },
            { skillId: '06', name: 'Customer Psychology', description: 'Personas & motivations', input: {}, dependencies: ['05'], priority: 3 },
            { skillId: '07', name: 'Brand Positioning', description: 'Brand identity', input: {}, dependencies: ['05', '06'], priority: 4 },
            { skillId: '08', name: 'Content Pillars', description: 'Content strategy', input: {}, dependencies: ['06', '07'], priority: 5 },
            { skillId: '09', name: 'Website Narrative', description: 'Website copy', input: {}, dependencies: ['06', '07', '08'], priority: 6 },
            { skillId: '10', name: 'Performance Ads', description: 'Ad campaigns', input: {}, dependencies: ['06', '07', '14'], priority: 7 },
            { skillId: '11', name: 'Storytelling', description: 'Long-form content', input: {}, dependencies: ['06', '07', '08'], priority: 6 },
            { skillId: '12', name: 'Email Sequences', description: 'Lifecycle emails', input: {}, dependencies: ['06', '07', '14'], priority: 7 },
            { skillId: '13', name: 'Sales Process', description: 'Sales playbook', input: {}, dependencies: ['05', '06', '14'], priority: 7 },
            { skillId: '14', name: 'GTM Experiments', description: 'Go-to-market strategy', input: {}, dependencies: ['05', '06'], priority: 4 },
            { skillId: '15', name: 'AARRR Analytics', description: 'Analytics framework', input: {}, dependencies: ['05', '06', '14'], priority: 7 },
            { skillId: '16', name: 'Fundraising', description: 'VC narrative & pitch deck', input: {}, dependencies: ['01', '05', '06', '07'], priority: 5 },
            { skillId: '17', name: 'Risk & Scenario', description: 'Risk management', input: {}, dependencies: ['01', '05'], priority: 3 },
            { skillId: '18', name: 'Talent & Org', description: 'Org design', input: {}, dependencies: ['01', '05'], priority: 3 },
            { skillId: '19', name: 'Industry Benchmarks', description: 'Market positioning', input: {}, dependencies: ['05', '15'], priority: 7 },
            { skillId: '20', name: 'Data Room', description: 'Investor materials', input: {}, dependencies: ['01', '03', '04', '16'], priority: 8 },
            { skillId: '21', name: 'Agentic OKRs', description: 'Execution framework', input: {}, dependencies: ['02', '05'], priority: 6 },
            { skillId: '22', name: 'Board Governance', description: 'IPO governance', input: {}, dependencies: ['03', '04'], priority: 8 },
            { skillId: '23', name: 'ESG & Impact', description: 'ESG framework', input: {}, dependencies: ['01'], priority: 3 },
            { skillId: '24', name: 'Crisis Management', description: 'Crisis playbook', input: {}, dependencies: [], priority: 2 }
        ];
    }

    /**
     * Get refactor workflow (focus on plan transformation)
     */
    private getRefactorWorkflow(): AgentTask[] {
        return [
            { skillId: '01', name: 'Refactor Plan', description: 'Convert to BP2026', input: {}, dependencies: [], priority: 1 }
        ];
    }

    /**
     * Get preset workflow
     */
    private getPresetWorkflow(presetId: string): AgentTask[] {
        const preset = WORKFLOW_PRESETS.find(p => p.id === presetId);

        if (!preset) {
            throw new Error(`Workflow preset not found: ${presetId}`);
        }

        logger.info(`Using preset: ${preset.name}`);

        // Map skill IDs to tasks
        const allTasks = this.getAllTaskDefinitions();
        return preset.skillIds
            .map(id => allTasks.find(t => t.skillId === id))
            .filter(t => t !== undefined) as AgentTask[];
    }

    /**
     * Get specific skills workflow
     */
    private getSpecificSkills(skillIds: string[]): AgentTask[] {
        const allTasks = this.getAllTaskDefinitions();
        return skillIds
            .map(id => allTasks.find(t => t.skillId === id))
            .filter(t => t !== undefined) as AgentTask[];
    }

    /**
     * Get all task definitions
     */
    private getAllTaskDefinitions(): AgentTask[] {
        return this.getFullWorkflow();
    }

    /**
     * Estimate workflow duration (minutes)
     */
    private estimateDuration(tasks: AgentTask[]): number {
        // Rough estimate: 2-5 minutes per agent
        return tasks.length * 3;
    }

    /**
     * Get workflow name
     */
    private getWorkflowName(input: MasterInput): string {
        if (input.type === 'workflow_preset') {
            const preset = WORKFLOW_PRESETS.find(p => p.id === input.workflowPreset);
            return preset?.name || 'Custom Workflow';
        }

        return {
            full_plan: 'Complete Business Plan 2026',
            refactor_old_plan: 'Refactor Old Plan',
            specific_skills: 'Custom Skills Selection'
        }[input.type] || 'Workflow';
    }

    /**
     * Get workflow description
     */
    private getWorkflowDescription(input: MasterInput): string {
        if (input.type === 'workflow_preset') {
            const preset = WORKFLOW_PRESETS.find(p => p.id === input.workflowPreset);
            return preset?.description || 'Custom workflow execution';
        }

        return {
            full_plan: 'Execute all available agents for comprehensive business plan',
            refactor_old_plan: 'Transform legacy business plan to Business Plan 2026 format',
            specific_skills: 'Execute selected agents only'
        }[input.type] || 'Execute workflow';
    }
}
