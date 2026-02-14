/**
 * State Manager - Track execution progress and results
 */

import { ExecutionState } from '../types/workflow.types';
import { AgentOutput } from '../types/agent.types';
import * as fs from 'fs';
import * as path from 'path';

export class StateManager {
    private state: ExecutionState;
    private stateFile: string;

    constructor(workflowId: string) {
        this.stateFile = path.join(process.cwd(), 'outputs', `state-${workflowId}.json`);

        this.state = {
            workflowId,
            status: 'pending',
            startedAt: new Date().toISOString(),
            currentTask: undefined,
            completedTasks: new Set<string>(),
            results: new Map<string, AgentOutput>(),
            errors: [],
            progress: {
                completed: 0,
                total: 0,
                percentage: 0
            }
        };
    }

    /**
     * Start execution
     */
    start(totalTasks: number): void {
        this.state.status = 'running';
        this.state.progress.total = totalTasks;
        this.saveState();
    }

    /**
     * Mark task as current
     */
    setCurrentTask(skillId: string): void {
        this.state.currentTask = skillId;
        this.saveState();
    }

    /**
     * Save agent result
     */
    saveResult(skillId: string, result: AgentOutput): void {
        this.state.results.set(skillId, result);
        this.state.completedTasks.add(skillId);
        this.state.progress.completed = this.state.completedTasks.size;
        this.state.progress.percentage = Math.round(
            (this.state.progress.completed / this.state.progress.total) * 100
        );
        this.saveState();
    }

    /**
     * Get result from specific agent
     */
    getResult(skillId: string): AgentOutput | null {
        return this.state.results.get(skillId) || null;
    }

    /**
     * Get context for agent (results from dependencies)
     */
    getContext(dependencies: string[]): Map<string, any> {
        const context = new Map<string, any>();

        dependencies.forEach(depId => {
            const result = this.state.results.get(depId);
            if (result) {
                context.set(depId, result.data);
            }
        });

        return context;
    }

    /**
     * Record error
     */
    recordError(skillId: string, error: Error): void {
        this.state.errors.push({
            taskId: skillId,
            skillId: skillId,
            message: error.message,
            timestamp: new Date().toISOString(),
            recoverable: false
        });
        this.saveState();
    }

    /**
     * Complete execution
     */
    complete(): void {
        this.state.status = 'completed';
        this.state.completedAt = new Date().toISOString();
        this.saveState();
    }

    /**
     * Fail execution
     */
    fail(): void {
        this.state.status = 'failed';
        this.state.completedAt = new Date().toISOString();
        this.saveState();
    }

    /**
     * Get current progress
     */
    getProgress(): { completed: number; total: number; percentage: number } {
        return this.state.progress;
    }

    /**
     * Get all results
     */
    getAllResults(): Map<string, AgentOutput> {
        return this.state.results;
    }

    /**
     * Persist state to disk
     */
    private saveState(): void {
        const outputDir = path.dirname(this.stateFile);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Convert Map and Set to arrays for JSON serialization
        const serializable = {
            ...this.state,
            completedTasks: Array.from(this.state.completedTasks),
            results: Object.fromEntries(this.state.results)
        };

        fs.writeFileSync(this.stateFile, JSON.stringify(serializable, null, 2));
    }

    /**
     * Load state from disk
     */
    static loadState(workflowId: string): StateManager | null {
        const stateFile = path.join(process.cwd(), 'outputs', `state-${workflowId}.json`);

        if (!fs.existsSync(stateFile)) {
            return null;
        }

        const manager = new StateManager(workflowId);
        const data = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));

        manager.state = {
            ...data,
            completedTasks: new Set(data.completedTasks),
            results: new Map(Object.entries(data.results))
        };

        return manager;
    }
}
