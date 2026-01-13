/**
 * AgentActivityFeed - AgencyOS Agent Activity Feed
 * 
 * Real-time feed showing agent activities, status updates,
 * and notifications in a timeline format.
 */

import React from 'react';

export interface AgentActivity {
    id: string;
    agentName: string;
    action: string;
    details?: string;
    timestamp: Date;
    type: 'info' | 'success' | 'warning' | 'error' | 'action';
}

export interface AgentActivityFeedProps {
    activities: AgentActivity[];
    maxItems?: number;
    showTimestamp?: boolean;
    className?: string;
}

const typeConfig = {
    info: { color: '#2196F3', icon: 'ℹ️' },
    success: { color: '#4CAF50', icon: '✅' },
    warning: { color: '#FF9800', icon: '⚠️' },
    error: { color: '#f44336', icon: '❌' },
    action: { color: '#9C27B0', icon: '⚡' },
};

const agentIcons: Record<string, string> = {
    planner: '📝',
    scout: '🔍',
    debugger: '🐛',
    tester: '🧪',
    'code-reviewer': '👁️',
    'git-manager': '📦',
    'docs-manager': '📚',
    'project-manager': '📊',
    default: '🤖',
};

export const AgentActivityFeed: React.FC<AgentActivityFeedProps> = ({
    activities,
    maxItems = 10,
    showTimestamp = true,
    className = '',
}) => {
    const displayActivities = activities.slice(-maxItems).reverse();

    return (
        <div
            className={`agent-activity-feed ${className}`}
            style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                borderRadius: '16px',
                padding: '20px',
                fontFamily: 'Inter, system-ui, sans-serif',
                color: '#fff',
                maxHeight: '400px',
                overflowY: 'auto',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #333',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>📡</span>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                        Agent Activity
                    </h3>
                </div>
                <span
                    style={{
                        fontSize: '12px',
                        color: '#4CAF50',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                    }}
                >
                    <span
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#4CAF50',
                            animation: 'pulse 2s infinite',
                        }}
                    />
                    Live
                </span>
            </div>

            {/* Activity List */}
            {displayActivities.length === 0 ? (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '40px 0',
                        color: '#666',
                    }}
                >
                    No recent activity
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {displayActivities.map((activity) => {
                        const config = typeConfig[activity.type];
                        const agentIcon =
                            agentIcons[activity.agentName] || agentIcons.default;

                        return (
                            <div
                                key={activity.id}
                                style={{
                                    display: 'flex',
                                    gap: '12px',
                                    padding: '12px',
                                    backgroundColor: '#0f0f1e',
                                    borderRadius: '8px',
                                    borderLeft: `3px solid ${config.color}`,
                                }}
                            >
                                <span style={{ fontSize: '20px' }}>{agentIcon}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            marginBottom: '4px',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                color: config.color,
                                            }}
                                        >
                                            {activity.agentName}
                                        </span>
                                        {showTimestamp && (
                                            <span style={{ fontSize: '11px', color: '#666' }}>
                                                {activity.timestamp.toLocaleTimeString()}
                                            </span>
                                        )}
                                    </div>
                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: '14px',
                                            color: '#fff',
                                        }}
                                    >
                                        {activity.action}
                                    </p>
                                    {activity.details && (
                                        <p
                                            style={{
                                                margin: '4px 0 0',
                                                fontSize: '12px',
                                                color: '#888',
                                            }}
                                        >
                                            {activity.details}
                                        </p>
                                    )}
                                </div>
                                <span style={{ fontSize: '14px' }}>{config.icon}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
        </div>
    );
};

export default AgentActivityFeed;
