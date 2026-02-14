/**
 * Agent Router - Dynamic agent loading and registration
 */

import { BaseAgent } from '../agents/base-agent';
import { RefactorPlanAgent } from '../agents/01-refactor-plan';
import { AgenticMappingAgent } from '../agents/02-agent';
import { IPOReadinessAgent } from '../agents/03-agent';
import { GapReportAgent } from '../agents/04-agent';
import { BusinessModelAgent } from '../agents/05-agent';
import { CustomerPsychologyAgent } from '../agents/06-agent';
import { BrandPositioningAgent } from '../agents/07-brand-positioning';
import { ContentPillarsAgent } from '../agents/08-agent';
import { WebsiteNarrativeAgent } from '../agents/09-agent';
import { PerformanceAdsAgent } from '../agents/10-agent';
import { StorytellingAgent } from '../agents/11-agent';
import { EmailSequencesAgent } from '../agents/12-agent';
import { SalesProcessAgent } from '../agents/13-agent';
import { GTMExperimentsAgent } from '../agents/14-agent';
import { AAARRAnalyticsAgent } from '../agents/15-agent';
import { FundraisingAgent } from '../agents/16-agent';
import { RiskScenarioAgent } from '../agents/17-agent';
import { TalentOrgAgent } from '../agents/18-agent';
import { IndustryPatternsAgent } from '../agents/19-agent';
import { DataRoomAgent } from '../agents/20-agent';
import { AgenticOKRAgent } from '../agents/21-agent';
import { GovernanceAgent } from '../agents/22-agent';
import { ESGImpactAgent } from '../agents/23-agent';
import { CrisisManagementAgent } from '../agents/24-agent';

export class AgentRouter {
    private agents: Map<string, BaseAgent>;

    constructor() {
        this.agents = new Map();
        this.registerAllAgents();
    }

    /**
     * Register all available agents
     */
    private registerAllAgents(): void {
        // Register all 24 agents (100% complete)
        this.registerAgent(new RefactorPlanAgent());
        this.registerAgent(new AgenticMappingAgent());
        this.registerAgent(new IPOReadinessAgent());
        this.registerAgent(new GapReportAgent());
        this.registerAgent(new BusinessModelAgent());
        this.registerAgent(new CustomerPsychologyAgent());
        this.registerAgent(new BrandPositioningAgent());
        this.registerAgent(new ContentPillarsAgent());
        this.registerAgent(new WebsiteNarrativeAgent());
        this.registerAgent(new PerformanceAdsAgent());
        this.registerAgent(new StorytellingAgent());
        this.registerAgent(new EmailSequencesAgent());
        this.registerAgent(new SalesProcessAgent());
        this.registerAgent(new GTMExperimentsAgent());
        this.registerAgent(new AAARRAnalyticsAgent());
        this.registerAgent(new FundraisingAgent());
        this.registerAgent(new RiskScenarioAgent());
        this.registerAgent(new TalentOrgAgent());
        this.registerAgent(new IndustryPatternsAgent());
        this.registerAgent(new DataRoomAgent());
        this.registerAgent(new AgenticOKRAgent());
        this.registerAgent(new GovernanceAgent());
        this.registerAgent(new ESGImpactAgent());
        this.registerAgent(new CrisisManagementAgent());
    }

    /**
     * Register a single agent
     */
    registerAgent(agent: BaseAgent): void {
        this.agents.set(agent.skillId, agent);
    }

    /**
     * Get agent by skill ID
     */
    getAgent(skillId: string): BaseAgent {
        const agent = this.agents.get(skillId);

        if (!agent) {
            throw new Error(`Agent ${skillId} not found. Available agents: ${this.listAgentIds().join(', ')}`);
        }

        return agent;
    }

    /**
     * Check if agent exists
     */
    hasAgent(skillId: string): boolean {
        return this.agents.has(skillId);
    }

    /**
     * List all registered agent IDs
     */
    listAgentIds(): string[] {
        return Array.from(this.agents.keys()).sort();
    }

    /**
     * List all registered agents
     */
    listAgents(): BaseAgent[] {
        return Array.from(this.agents.values());
    }

    /**
     * Get agent capabilities
     */
    getCapabilities(): Array<{ id: string; name: string; description: string; dependencies: string[] }> {
        return this.listAgents().map(agent => ({
            id: agent.skillId,
            name: agent.name,
            description: agent.description,
            dependencies: agent.dependencies
        }));
    }
}
