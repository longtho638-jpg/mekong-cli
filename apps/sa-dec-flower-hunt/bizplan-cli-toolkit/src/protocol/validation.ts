/**
 * Input/Output Validation Utilities
 */

import { AgentInput, AgentOutput, AgentMetadata } from '../types/agent.types';

export class ValidationError extends Error {
    constructor(public field: string, public reason: string) {
        super(`Validation failed for ${field}: ${reason}`);
        this.name = 'ValidationError';
    }
}

export class Validator {
    /**
     * Validate agent input
     */
    static validateAgentInput(input: AgentInput, skillId: string): void {
        if (!input || typeof input !== 'object') {
            throw new ValidationError('input', 'Input must be an object');
        }
    }

    /**
     * Validate agent output
     */
    static validateAgentOutput(output: AgentOutput, skillId: string): void {
        if (!output || typeof output !== 'object') {
            throw new ValidationError('output', 'Output must be an object');
        }

        if (!output.skillId) {
            throw new ValidationError('skillId', 'Output must include skillId');
        }

        if (!output.generatedAt) {
            throw new ValidationError('generatedAt', 'Output must include generatedAt timestamp');
        }

        if (!['success', 'partial', 'failed'].includes(output.status)) {
            throw new ValidationError('status', 'Invalid status value');
        }

        if (!output.metadata) {
            throw new ValidationError('metadata', 'Output must include metadata');
        }

        this.validateMetadata(output.metadata);
    }

    /**
     * Validate marking conventions
     */
    static validateMarking(text: string): boolean {
        const validMarkings = ['[TỪ PLAN]', '[ĐỀ XUẤT]', '[GIẢ ĐỊNH]'];
        const markings = text.match(/\[(.*?)\]/g) || [];

        return markings.every(marking => validMarkings.includes(marking));
    }

    /**
     * Validate metadata
     */
    private static validateMetadata(metadata: AgentMetadata): void {
        if (!metadata.markings) {
            throw new ValidationError('metadata.markings', 'Markings are required');
        }

        const { markings } = metadata;

        if (!Array.isArray(markings.fromPlan)) {
            throw new ValidationError('markings.fromPlan', 'Must be an array');
        }

        if (!Array.isArray(markings.suggestions)) {
            throw new ValidationError('markings.suggestions', 'Must be an array');
        }

        if (!Array.isArray(markings.assumptions)) {
            throw new ValidationError('markings.assumptions', 'Must be an array');
        }
    }

    /**
     * Validate Business Plan section
     */
    static validateBusinessPlanSection(section: any, sectionId: string): void {
        if (!section || typeof section !== 'object') {
            throw new ValidationError(sectionId, 'Section must be an object');
        }
    }

    /**
     * Sanitize user input
     */
    static sanitizeInput(input: string): string {
        return input.trim().replace(/[<>]/g, '');
    }
}
