/**
 * AgentReport - AgencyOS Report Component
 * 
 * Renders agent-generated reports including plans,
 * walkthroughs, tasks, and summaries.
 */

import React from 'react';

export interface AgentReportProps {
    type: 'task' | 'plan' | 'walkthrough' | 'report';
    title: string;
    content?: string;
    steps?: Array<{
        id: string;
        text: string;
        completed: boolean;
    }>;
    summary?: string;
    createdAt?: Date;
    status?: 'draft' | 'in-progress' | 'completed';
    className?: string;
}

const typeConfig = {
    task: { icon: '📋', color: '#4CAF50', label: 'Task' },
    plan: { icon: '📝', color: '#2196F3', label: 'Plan' },
    walkthrough: { icon: '🎯', color: '#9C27B0', label: 'Walkthrough' },
    report: { icon: '📊', color: '#FF9800', label: 'Report' },
};

export const AgentReport: React.FC<AgentReportProps> = ({
    type,
    title,
    content,
    steps,
    summary,
    createdAt,
    status = 'in-progress',
    className = '',
}) => {
    const config = typeConfig[type];

    return (
        <div
            className={`agent-report agent-report--${type} ${className}`}
            style={{
                border: `2px solid ${config.color}`,
                borderRadius: '12px',
                padding: '20px',
                backgroundColor: '#1a1a2e',
                color: '#fff',
                fontFamily: 'Inter, system-ui, sans-serif',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: `1px solid ${config.color}40`,
                }}
            >
                <span style={{ fontSize: '24px' }}>{config.icon}</span>
                <div style={{ flex: 1 }}>
                    <div
                        style={{
                            fontSize: '12px',
                            color: config.color,
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            marginBottom: '4px',
                        }}
                    >
                        {config.label}
                    </div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                        {title}
                    </h3>
                </div>
                {status && (
                    <span
                        style={{
                            padding: '4px 12px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            backgroundColor:
                                status === 'completed'
                                    ? '#4CAF50'
                                    : status === 'in-progress'
                                        ? '#2196F3'
                                        : '#666',
                        }}
                    >
                        {status}
                    </span>
                )}
            </div>

            {/* Summary */}
            {summary && (
                <p
                    style={{
                        color: '#aaa',
                        fontSize: '14px',
                        marginBottom: '16px',
                        lineHeight: 1.6,
                    }}
                >
                    {summary}
                </p>
            )}

            {/* Steps */}
            {steps && steps.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {steps.map((step) => (
                        <li
                            key={step.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '8px 0',
                                borderBottom: '1px solid #333',
                            }}
                        >
                            <span
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    backgroundColor: step.completed ? '#4CAF50' : '#333',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                }}
                            >
                                {step.completed ? '✓' : '○'}
                            </span>
                            <span
                                style={{
                                    textDecoration: step.completed ? 'line-through' : 'none',
                                    color: step.completed ? '#666' : '#fff',
                                }}
                            >
                                {step.text}
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            {/* Content */}
            {content && (
                <div
                    style={{
                        marginTop: '16px',
                        padding: '12px',
                        backgroundColor: '#0f0f1e',
                        borderRadius: '8px',
                        fontSize: '14px',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                    }}
                >
                    {content}
                </div>
            )}

            {/* Footer */}
            {createdAt && (
                <div
                    style={{
                        marginTop: '16px',
                        fontSize: '12px',
                        color: '#666',
                        textAlign: 'right',
                    }}
                >
                    Created: {createdAt.toLocaleString()}
                </div>
            )}
        </div>
    );
};

export default AgentReport;
