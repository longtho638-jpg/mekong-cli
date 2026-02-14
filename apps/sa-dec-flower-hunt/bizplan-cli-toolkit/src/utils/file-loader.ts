/**
 * File Loader Utilities
 * Load MASTER config, SKILL definitions, context files, research documents
 */

import * as fs from 'fs';
import * as path from 'path';
import { MasterConfig } from '../types/master.types';

export class FileLoader {

    /**
     * Load 00_MASTER configuration
     */
    static loadMasterConfig(): MasterConfig {
        const masterPath = path.join(process.cwd(), 'templates', '00_MASTER-Agentic-BizPlan-OS.json');

        if (!fs.existsSync(masterPath)) {
            throw new Error(`Master config not found at: ${masterPath}`);
        }

        const content = fs.readFileSync(masterPath, 'utf-8');
        const data = JSON.parse(content);

        return {
            id: data.id,
            version: data.version,
            title: data.title,
            businessPlanFrame: data.business_plan_frame,
            agenticLayers: data.agentic_layers,
            ipoLifecycle: data.ipo_lifecycle
        };
    }

    /**
     * Load SKILL definition by ID
     */
    static loadSkillDefinition(skillId: string): any {
        const paddedId = skillId.padStart(2, '0');
        const pattern = `${paddedId}_SKILL-*.json`;

        const templatesDir = path.join(process.cwd(), 'templates');
        const files = fs.readdirSync(templatesDir);

        const skillFile = files.find(f => f.startsWith(paddedId) && f.endsWith('.json'));

        if (!skillFile) {
            throw new Error(`Skill definition not found for ID: ${skillId}`);
        }

        const skillPath = path.join(templatesDir, skillFile);
        const content = fs.readFileSync(skillPath, 'utf-8');
        return JSON.parse(content);
    }

    /**
     * Load context from previous agent output
     */
    static loadContext(filepath: string): any {
        if (!fs.existsSync(filepath)) {
            throw new Error(`Context file not found: ${filepath}`);
        }

        const content = fs.readFileSync(filepath, 'utf-8');
        return JSON.parse(content);
    }

    /**
     * Load multiple context files by pattern
     */
    static loadMultipleContext(pattern: string): Map<string, any> {
        const results = new Map<string, any>();
        const outputsDir = path.join(process.cwd(), 'outputs');

        if (!fs.existsSync(outputsDir)) {
            return results;
        }

        const files = fs.readdirSync(outputsDir);
        const regex = new RegExp(pattern.replace('*', '.*'));

        files
            .filter(f => regex.test(f))
            .forEach(f => {
                const filepath = path.join(outputsDir, f);
                const content = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
                results.set(f, content);
            });

        return results;
    }

    /**
     * Load research file
     */
    static loadResearchFile(filepath: string): string {
        if (!fs.existsSync(filepath)) {
            throw new Error(`Research file not found: ${filepath}`);
        }

        return fs.readFileSync(filepath, 'utf-8');
    }

    /**
     * Validate JSON file
     */
    static validateJsonFile(filepath: string): boolean {
        try {
            const content = fs.readFileSync(filepath, 'utf-8');
            JSON.parse(content);
            return true;
        } catch (e) {
            return false;
        }
    }
}
