'use client';

import { useState, useCallback } from 'react';

/**
 * 🔄 Workflow Automation Hook
 * 
 * Inspired by Frappe Framework Workflow Engine
 * Create automated workflows with triggers and actions
 */

export type TriggerType = 'on_create' | 'on_update' | 'on_status_change' | 'on_schedule' | 'manual';
export type ActionType = 'send_email' | 'send_notification' | 'update_field' | 'create_record' | 'call_api' | 'assign_task';

export interface WorkflowTrigger {
    type: TriggerType;
    conditions?: Record<string, any>;
    schedule?: string; // cron expression
}

export interface WorkflowAction {
    id: string;
    type: ActionType;
    config: Record<string, any>;
    order: number;
}

export interface Workflow {
    id: string;
    name: string;
    description: string;
    entityType: string; // e.g., 'invoice', 'project', 'lead'
    trigger: WorkflowTrigger;
    actions: WorkflowAction[];
    isActive: boolean;
    runCount: number;
    lastRun?: string;
    createdAt: string;
    updatedAt: string;
}

export interface WorkflowRun {
    id: string;
    workflowId: string;
    workflowName: string;
    status: 'running' | 'completed' | 'failed';
    triggeredBy: string;
    startedAt: string;
    completedAt?: string;
    actionsExecuted: number;
    error?: string;
}

export function useWorkflows() {
    const [workflows, setWorkflows] = useState<Workflow[]>(getDemoWorkflows());
    const [runs, setRuns] = useState<WorkflowRun[]>([]);
    const [loading, setLoading] = useState(false);

    // Create workflow
    const createWorkflow = useCallback((
        name: string,
        entityType: string,
        trigger: WorkflowTrigger,
        description?: string
    ): Workflow => {
        const workflow: Workflow = {
            id: crypto.randomUUID(),
            name,
            description: description || '',
            entityType,
            trigger,
            actions: [],
            isActive: false,
            runCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setWorkflows(prev => [workflow, ...prev]);
        return workflow;
    }, []);

    // Add action to workflow
    const addAction = useCallback((workflowId: string, action: Omit<WorkflowAction, 'id' | 'order'>) => {
        setWorkflows(prev => prev.map(w => {
            if (w.id !== workflowId) return w;
            const newAction: WorkflowAction = {
                ...action,
                id: crypto.randomUUID(),
                order: w.actions.length + 1,
            };
            return {
                ...w,
                actions: [...w.actions, newAction],
                updatedAt: new Date().toISOString(),
            };
        }));
    }, []);

    // Toggle workflow active
    const toggleActive = useCallback((workflowId: string) => {
        setWorkflows(prev => prev.map(w =>
            w.id === workflowId
                ? { ...w, isActive: !w.isActive, updatedAt: new Date().toISOString() }
                : w
        ));
    }, []);

    // Execute workflow manually
    const executeWorkflow = useCallback(async (workflowId: string, triggeredBy: string = 'manual') => {
        const workflow = workflows.find(w => w.id === workflowId);
        if (!workflow) return null;

        const run: WorkflowRun = {
            id: crypto.randomUUID(),
            workflowId,
            workflowName: workflow.name,
            status: 'running',
            triggeredBy,
            startedAt: new Date().toISOString(),
            actionsExecuted: 0,
        };

        setRuns(prev => [run, ...prev]);

        // Simulate execution
        await new Promise(resolve => setTimeout(resolve, 500));

        // Complete the run
        setRuns(prev => prev.map(r =>
            r.id === run.id
                ? {
                    ...r,
                    status: 'completed',
                    completedAt: new Date().toISOString(),
                    actionsExecuted: workflow.actions.length,
                }
                : r
        ));

        setWorkflows(prev => prev.map(w =>
            w.id === workflowId
                ? { ...w, runCount: w.runCount + 1, lastRun: new Date().toISOString() }
                : w
        ));

        return run;
    }, [workflows]);

    // Delete workflow
    const deleteWorkflow = useCallback((workflowId: string) => {
        setWorkflows(prev => prev.filter(w => w.id !== workflowId));
    }, []);

    return {
        workflows,
        runs,
        loading,
        createWorkflow,
        addAction,
        toggleActive,
        executeWorkflow,
        deleteWorkflow,
    };
}

// Demo workflows
function getDemoWorkflows(): Workflow[] {
    return [
        {
            id: '1',
            name: 'New Invoice Notification',
            description: 'Send email when invoice is created',
            entityType: 'invoice',
            trigger: { type: 'on_create' },
            actions: [
                { id: 'a1', type: 'send_email', config: { template: 'new_invoice', to: '{{client.email}}' }, order: 1 },
                { id: 'a2', type: 'send_notification', config: { message: 'New invoice created for {{client.name}}' }, order: 2 },
            ],
            isActive: true,
            runCount: 45,
            lastRun: '2026-01-04T10:00:00Z',
            createdAt: '2025-06-01T00:00:00Z',
            updatedAt: '2025-12-01T00:00:00Z',
        },
        {
            id: '2',
            name: 'Lead Follow-up Reminder',
            description: 'Assign task when lead is inactive for 3 days',
            entityType: 'lead',
            trigger: { type: 'on_schedule', schedule: '0 9 * * *' },
            actions: [
                { id: 'a3', type: 'assign_task', config: { assignee: '{{lead.owner}}', title: 'Follow up with {{lead.name}}' }, order: 1 },
            ],
            isActive: true,
            runCount: 120,
            lastRun: '2026-01-04T09:00:00Z',
            createdAt: '2025-08-01T00:00:00Z',
            updatedAt: '2025-11-01T00:00:00Z',
        },
    ];
}

export default useWorkflows;
