/**
 * Dependency Resolver
 * Topological sort for task dependencies
 */

import { AgentTask } from '../types/agent.types';

export class DependencyResolver {

    /**
     * Topologically sort tasks based on dependencies
     */
    static topologicalSort(tasks: AgentTask[]): AgentTask[] {
        const sorted: AgentTask[] = [];
        const visited = new Set<string>();
        const visiting = new Set<string>();

        const taskMap = new Map<string, AgentTask>();
        tasks.forEach(t => taskMap.set(t.skillId, t));

        const visit = (task: AgentTask): void => {
            if (visited.has(task.skillId)) return;
            if (visiting.has(task.skillId)) {
                throw new Error(`Circular dependency detected involving skill ${task.skillId}`);
            }

            visiting.add(task.skillId);

            // Visit dependencies first
            task.dependencies.forEach(depId => {
                const depTask = taskMap.get(depId);
                if (depTask) {
                    visit(depTask);
                }
            });

            visiting.delete(task.skillId);
            visited.add(task.skillId);
            sorted.push(task);
        };

        tasks.forEach(task => visit(task));

        return sorted;
    }

    /**
     * Get all dependencies for a skill (transitive)
     */
    static resolveDependencies(skillId: string, allTasks: AgentTask[]): string[] {
        const deps = new Set<string>();
        const taskMap = new Map<string, AgentTask>();
        allTasks.forEach(t => taskMap.set(t.skillId, t));

        const collect = (id: string): void => {
            const task = taskMap.get(id);
            if (!task) return;

            task.dependencies.forEach(depId => {
                if (!deps.has(depId)) {
                    deps.add(depId);
                    collect(depId);
                }
            });
        };

        collect(skillId);
        return Array.from(deps);
    }
}
