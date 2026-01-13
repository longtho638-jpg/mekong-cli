/**
 * TaskTrackerWidget - AgencyOS Task Progress Widget
 * 
 * Displays real-time task progress with steps,
 * status indicators, and completion percentage.
 */

import React from 'react';

export interface TaskStep {
    id: string;
    name: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

export interface TaskTrackerWidgetProps {
    taskName: string;
    taskStatus: 'idle' | 'running' | 'completed' | 'failed';
    steps: TaskStep[];
    progress: number;
    currentStep?: string;
    startedAt?: Date;
    className?: string;
}

const statusConfig = {
    idle: { color: '#666', icon: '○', label: 'Idle' },
    running: { color: '#2196F3', icon: '◉', label: 'Running' },
    completed: { color: '#4CAF50', icon: '✓', label: 'Completed' },
    failed: { color: '#f44336', icon: '✕', label: 'Failed' },
};

export const TaskTrackerWidget: React.FC<TaskTrackerWidgetProps> = ({
    taskName,
    taskStatus,
    steps,
    progress,
    currentStep,
    startedAt,
    className = '',
}) => {
    const config = statusConfig[taskStatus];

    return (
        <div
            className={`task-tracker-widget ${className}`}
            style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                borderRadius: '16px',
                padding: '20px',
                border: `1px solid ${config.color}40`,
                fontFamily: 'Inter, system-ui, sans-serif',
                color: '#fff',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>🎯</span>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                            {taskName || 'No Active Task'}
                        </h3>
                        {currentStep && (
                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#888' }}>
                                {currentStep}
                            </p>
                        )}
                    </div>
                </div>
                <span
                    style={{
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        backgroundColor: `${config.color}20`,
                        color: config.color,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                    }}
                >
                    <span>{config.icon}</span>
                    {config.label}
                </span>
            </div>

            {/* Progress Bar */}
            <div
                style={{
                    backgroundColor: '#0f0f1e',
                    borderRadius: '8px',
                    height: '8px',
                    marginBottom: '16px',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        height: '100%',
                        width: `${progress}%`,
                        backgroundColor: config.color,
                        transition: 'width 0.3s ease',
                        borderRadius: '8px',
                    }}
                />
            </div>

            {/* Progress Text */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#888',
                    marginBottom: '16px',
                }}
            >
                <span>{progress}% Complete</span>
                {startedAt && (
                    <span>Started: {startedAt.toLocaleTimeString()}</span>
                )}
            </div>

            {/* Steps List */}
            {steps.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {steps.map((step) => {
                        const stepConfig = {
                            pending: { color: '#666', icon: '○' },
                            'in-progress': { color: '#2196F3', icon: '◉' },
                            completed: { color: '#4CAF50', icon: '✓' },
                            failed: { color: '#f44336', icon: '✕' },
                        }[step.status];

                        return (
                            <div
                                key={step.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '8px 12px',
                                    backgroundColor:
                                        step.status === 'in-progress' ? `${stepConfig.color}10` : 'transparent',
                                    borderRadius: '8px',
                                    transition: 'background-color 0.2s',
                                }}
                            >
                                <span style={{ color: stepConfig.color, fontSize: '14px' }}>
                                    {stepConfig.icon}
                                </span>
                                <span
                                    style={{
                                        fontSize: '14px',
                                        color: step.status === 'completed' ? '#666' : '#fff',
                                        textDecoration:
                                            step.status === 'completed' ? 'line-through' : 'none',
                                    }}
                                >
                                    {step.name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TaskTrackerWidget;
