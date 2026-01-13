/**
 * useTaskTracker - AgencyOS Task Progress Tracking Hook
 * 
 * Tracks task progress with real-time updates,
 * step-by-step execution, and completion status.
 */

import { useState, useCallback, useMemo } from 'react';

export interface TaskStep {
    id: string;
    name: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    startedAt?: Date;
    completedAt?: Date;
}

export interface TaskTrackerState {
    taskId: string;
    taskName: string;
    status: 'idle' | 'running' | 'completed' | 'failed';
    currentStep: number;
    steps: TaskStep[];
    startedAt?: Date;
    completedAt?: Date;
}

export interface UseTaskTrackerOptions {
    taskId?: string;
    onStepComplete?: (step: TaskStep) => void;
    onTaskComplete?: (state: TaskTrackerState) => void;
}

export interface UseTaskTrackerReturn {
    state: TaskTrackerState;
    progress: number;
    currentStepName: string;
    initTask: (taskName: string, steps: string[]) => void;
    startStep: (stepId: string) => void;
    completeStep: (stepId: string) => void;
    failStep: (stepId: string) => void;
    completeTask: () => void;
    failTask: () => void;
    reset: () => void;
}

const initialState: TaskTrackerState = {
    taskId: '',
    taskName: '',
    status: 'idle',
    currentStep: 0,
    steps: [],
};

export function useTaskTracker(options: UseTaskTrackerOptions = {}): UseTaskTrackerReturn {
    const { taskId, onStepComplete, onTaskComplete } = options;
    const [state, setState] = useState<TaskTrackerState>({
        ...initialState,
        taskId: taskId || `task_${Date.now()}`,
    });

    const progress = useMemo(() => {
        if (state.steps.length === 0) return 0;
        const completed = state.steps.filter(s => s.status === 'completed').length;
        return Math.round((completed / state.steps.length) * 100);
    }, [state.steps]);

    const currentStepName = useMemo(() => {
        const step = state.steps.find(s => s.status === 'in-progress');
        return step?.name || '';
    }, [state.steps]);

    const initTask = useCallback((taskName: string, stepNames: string[]) => {
        const steps: TaskStep[] = stepNames.map((name, index) => ({
            id: `step_${index}`,
            name,
            status: 'pending',
        }));
        setState(prev => ({
            ...prev,
            taskName,
            status: 'running',
            currentStep: 0,
            steps,
            startedAt: new Date(),
        }));
    }, []);

    const startStep = useCallback((stepId: string) => {
        setState(prev => ({
            ...prev,
            steps: prev.steps.map(step =>
                step.id === stepId
                    ? { ...step, status: 'in-progress', startedAt: new Date() }
                    : step
            ),
        }));
    }, []);

    const completeStep = useCallback((stepId: string) => {
        setState(prev => {
            const updatedSteps = prev.steps.map(step =>
                step.id === stepId
                    ? { ...step, status: 'completed' as const, completedAt: new Date() }
                    : step
            );
            const completedStep = updatedSteps.find(s => s.id === stepId);
            if (completedStep) {
                onStepComplete?.(completedStep);
            }
            return {
                ...prev,
                steps: updatedSteps,
                currentStep: prev.currentStep + 1,
            };
        });
    }, [onStepComplete]);

    const failStep = useCallback((stepId: string) => {
        setState(prev => ({
            ...prev,
            steps: prev.steps.map(step =>
                step.id === stepId
                    ? { ...step, status: 'failed', completedAt: new Date() }
                    : step
            ),
            status: 'failed',
        }));
    }, []);

    const completeTask = useCallback(() => {
        setState(prev => {
            const completed = {
                ...prev,
                status: 'completed' as const,
                completedAt: new Date(),
            };
            onTaskComplete?.(completed);
            return completed;
        });
    }, [onTaskComplete]);

    const failTask = useCallback(() => {
        setState(prev => ({
            ...prev,
            status: 'failed',
            completedAt: new Date(),
        }));
    }, []);

    const reset = useCallback(() => {
        setState({
            ...initialState,
            taskId: `task_${Date.now()}`,
        });
    }, []);

    return {
        state,
        progress,
        currentStepName,
        initTask,
        startStep,
        completeStep,
        failStep,
        completeTask,
        failTask,
        reset,
    };
}

export default useTaskTracker;
