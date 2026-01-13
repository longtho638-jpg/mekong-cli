/**
 * useAgentOS - AgencyOS Native Agent Hook
 * 
 * Connects agents to the UI with real-time status updates,
 * progress tracking, and human-in-the-loop capabilities.
 */

import { useState, useCallback, useEffect } from 'react';

export interface AgentState {
    isActive: boolean;
    taskName: string;
    taskStatus: string;
    progress: number;
    mode: 'planning' | 'execution' | 'verification';
    artifacts: AgentArtifact[];
}

export interface AgentArtifact {
    type: 'task' | 'plan' | 'walkthrough' | 'report';
    path: string;
    summary: string;
    createdAt: Date;
}

export interface UseAgentOSOptions {
    agentName: string;
    onStateChange?: (state: AgentState) => void;
    onArtifactCreated?: (artifact: AgentArtifact) => void;
}

export interface UseAgentOSReturn {
    state: AgentState;
    startTask: (taskName: string) => void;
    updateStatus: (status: string) => void;
    updateProgress: (progress: number) => void;
    setMode: (mode: AgentState['mode']) => void;
    addArtifact: (artifact: Omit<AgentArtifact, 'createdAt'>) => void;
    completeTask: () => void;
    reset: () => void;
}

const initialState: AgentState = {
    isActive: false,
    taskName: '',
    taskStatus: '',
    progress: 0,
    mode: 'planning',
    artifacts: [],
};

export function useAgentOS(options: UseAgentOSOptions): UseAgentOSReturn {
    const { agentName, onStateChange, onArtifactCreated } = options;
    const [state, setState] = useState<AgentState>(initialState);

    // Notify on state changes
    useEffect(() => {
        onStateChange?.(state);
    }, [state, onStateChange]);

    const startTask = useCallback((taskName: string) => {
        setState(prev => ({
            ...prev,
            isActive: true,
            taskName,
            taskStatus: 'Starting...',
            progress: 0,
            mode: 'planning',
        }));
        console.log(`[AgentOS:${agentName}] Task started: ${taskName}`);
    }, [agentName]);

    const updateStatus = useCallback((status: string) => {
        setState(prev => ({
            ...prev,
            taskStatus: status,
        }));
    }, []);

    const updateProgress = useCallback((progress: number) => {
        setState(prev => ({
            ...prev,
            progress: Math.min(100, Math.max(0, progress)),
        }));
    }, []);

    const setMode = useCallback((mode: AgentState['mode']) => {
        setState(prev => ({
            ...prev,
            mode,
        }));
        console.log(`[AgentOS:${agentName}] Mode changed: ${mode}`);
    }, [agentName]);

    const addArtifact = useCallback((artifact: Omit<AgentArtifact, 'createdAt'>) => {
        const newArtifact: AgentArtifact = {
            ...artifact,
            createdAt: new Date(),
        };
        setState(prev => ({
            ...prev,
            artifacts: [...prev.artifacts, newArtifact],
        }));
        onArtifactCreated?.(newArtifact);
        console.log(`[AgentOS:${agentName}] Artifact created: ${artifact.type}`);
    }, [agentName, onArtifactCreated]);

    const completeTask = useCallback(() => {
        setState(prev => ({
            ...prev,
            isActive: false,
            taskStatus: 'Completed',
            progress: 100,
        }));
        console.log(`[AgentOS:${agentName}] Task completed: ${state.taskName}`);
    }, [agentName, state.taskName]);

    const reset = useCallback(() => {
        setState(initialState);
    }, []);

    return {
        state,
        startTask,
        updateStatus,
        updateProgress,
        setMode,
        addArtifact,
        completeTask,
        reset,
    };
}

export default useAgentOS;
