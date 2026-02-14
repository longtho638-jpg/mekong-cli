/**
 * Base Agent Class
 * All 24 skill agents extend this
 */

import { AgentInput, AgentOutput, AgentMetadata } from '../types/agent.types';
import { Validator } from '../protocol/validation';
import { logger } from '../utils/logger';

export abstract class BaseAgent {
    abstract skillId: string;
    abstract name: string;
    abstract dependencies: string[];
    abstract description: string;

    /**
     * Main execution method - must be implemented by each agent
     */
    abstract execute(input: AgentInput): Promise<AgentOutput>;

    /**
     * Validate input before execution
     */
    protected validateInput(input: AgentInput): void {
        Validator.validateAgentInput(input, this.skillId);
    }

    /**
     * Get context from previous agents
     */
    protected getContext<T>(key: string, input: AgentInput): T | null {
        if (!input.context || !input.context.previousOutputs) {
            return null;
        }
        return input.context.previousOutputs.get(key) || null;
    }

    /**
     * Log progress
     */
    protected log(message: string): void {
        logger.info(`[${this.skillId}] ${message}`);
    }

    /**
     * Mark text as from plan
     */
    protected markFromPlan(item: string): string {
        return `${item} [TỪ PLAN]`;
    }

    /**
     * Mark text as suggestion
     */
    protected markSuggestion(item: string): string {
        return `${item} [ĐỀ XUẤT]`;
    }

    /**
     * Mark text as assumption
     */
    protected markAssumption(item: string): string {
        return `${item} [GIẢ ĐỊNH]`;
    }

    /**
     * Load Agent Configuration from Neural Config System (agent_config.json)
     */
    protected getAgentConfig(): any {
        try {
            const fs = require('fs');
            const path = require('path');
            // Assuming we are running from project root or dist/
            // We search for agent_config.json in likely locations
            const pathsToCheck = [
                path.resolve(process.cwd(), 'agent_config.json'),
                path.resolve(process.cwd(), '../../agent_config.json'), // If in src/agents
                path.resolve(__dirname, '../../../agent_config.json')  // If in dist/agents
            ];

            let config = null;
            for (const p of pathsToCheck) {
                if (fs.existsSync(p)) {
                    config = JSON.parse(fs.readFileSync(p, 'utf-8'));
                    break;
                }
            }

            if (config && config.agents) {
                // Approximate matching strategies since ID might be "01" but configKey is "01_product"
                const keys = Object.keys(config.agents);
                const match = keys.find(k => k.startsWith(this.skillId));

                if (match) {
                    const msg = `🧠 Neural Config Loaded: ${match} (T=${config.agents[match].temperature})`;
                    this.log(msg);
                    return config.agents[match];
                }
            }
        } catch (e) {
            // Silently fail and use defaults
            // console.warn("Failed to load neural config", e);
        }
        return { temperature: 0.7 }; // Default
    }

    /**
     * Create standardized output
     */
    protected createOutput(data: any, metadata: Partial<AgentMetadata> = {}): AgentOutput {
        return {
            skillId: this.skillId,
            skillName: this.name,
            generatedAt: new Date().toISOString(),
            status: 'success',
            data,
            metadata: {
                markings: {
                    fromPlan: metadata.markings?.fromPlan || [],
                    suggestions: metadata.markings?.suggestions || [],
                    assumptions: metadata.markings?.assumptions || []
                },
                dependenciesUsed: metadata.dependenciesUsed || [],
                executionTime: metadata.executionTime || 0,
                dataQuality: metadata.dataQuality || 'high',
                // Add the config snapshot to metadata for provenance
                configSnapshot: this.getAgentConfig()
            }
        };
    }
}
