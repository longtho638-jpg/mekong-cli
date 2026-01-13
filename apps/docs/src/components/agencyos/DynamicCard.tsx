/**
 * DynamicCard - AgencyOS Dynamic Card Component
 * 
 * Renders agent-generated dynamic cards with
 * customizable content, actions, and animations.
 */

import React from 'react';

export interface DynamicCardAction {
    id: string;
    label: string;
    icon?: string;
    variant?: 'primary' | 'secondary' | 'danger';
    onClick?: () => void;
}

export interface DynamicCardProps {
    title: string;
    subtitle?: string;
    icon?: string;
    content?: React.ReactNode;
    metrics?: Array<{
        label: string;
        value: string | number;
        change?: number;
    }>;
    actions?: DynamicCardAction[];
    status?: 'active' | 'pending' | 'completed' | 'error';
    animated?: boolean;
    glowing?: boolean;
    className?: string;
}

const statusColors = {
    active: '#4CAF50',
    pending: '#FF9800',
    completed: '#2196F3',
    error: '#f44336',
};

export const DynamicCard: React.FC<DynamicCardProps> = ({
    title,
    subtitle,
    icon,
    content,
    metrics,
    actions,
    status = 'active',
    animated = true,
    glowing = false,
    className = '',
}) => {
    const statusColor = statusColors[status];

    return (
        <div
            className={`dynamic-card ${className}`}
            style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                borderRadius: '16px',
                padding: '24px',
                border: `1px solid ${statusColor}40`,
                boxShadow: glowing
                    ? `0 0 20px ${statusColor}40, 0 4px 20px rgba(0,0,0,0.3)`
                    : '0 4px 20px rgba(0,0,0,0.3)',
                fontFamily: 'Inter, system-ui, sans-serif',
                color: '#fff',
                animation: animated ? 'cardEntrance 0.3s ease-out' : 'none',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    marginBottom: '20px',
                }}
            >
                {icon && (
                    <span
                        style={{
                            fontSize: '32px',
                            width: '48px',
                            height: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: `${statusColor}20`,
                            borderRadius: '12px',
                        }}
                    >
                        {icon}
                    </span>
                )}
                <div style={{ flex: 1 }}>
                    <h3
                        style={{
                            margin: 0,
                            fontSize: '18px',
                            fontWeight: 600,
                            marginBottom: '4px',
                        }}
                    >
                        {title}
                    </h3>
                    {subtitle && (
                        <p
                            style={{
                                margin: 0,
                                fontSize: '14px',
                                color: '#888',
                            }}
                        >
                            {subtitle}
                        </p>
                    )}
                </div>
                <span
                    style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: statusColor,
                        boxShadow: `0 0 8px ${statusColor}`,
                    }}
                />
            </div>

            {/* Metrics */}
            {metrics && metrics.length > 0 && (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${Math.min(metrics.length, 3)}, 1fr)`,
                        gap: '16px',
                        marginBottom: '20px',
                    }}
                >
                    {metrics.map((metric, index) => (
                        <div
                            key={index}
                            style={{
                                backgroundColor: '#0f0f1e',
                                padding: '12px',
                                borderRadius: '8px',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '12px',
                                    color: '#888',
                                    marginBottom: '4px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}
                            >
                                {metric.label}
                            </div>
                            <div
                                style={{
                                    fontSize: '20px',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                {metric.value}
                                {metric.change !== undefined && (
                                    <span
                                        style={{
                                            fontSize: '12px',
                                            color: metric.change >= 0 ? '#4CAF50' : '#f44336',
                                        }}
                                    >
                                        {metric.change >= 0 ? '↑' : '↓'}
                                        {Math.abs(metric.change)}%
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Content */}
            {content && <div style={{ marginBottom: '20px' }}>{content}</div>}

            {/* Actions */}
            {actions && actions.length > 0 && (
                <div
                    style={{
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap',
                    }}
                >
                    {actions.map((action) => (
                        <button
                            key={action.id}
                            onClick={action.onClick}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 500,
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                backgroundColor:
                                    action.variant === 'primary'
                                        ? statusColor
                                        : action.variant === 'danger'
                                            ? '#f44336'
                                            : '#333',
                                color: '#fff',
                                transition: 'transform 0.2s, opacity 0.2s',
                            }}
                            onMouseOver={(e) => {
                                (e.target as HTMLButtonElement).style.opacity = '0.9';
                                (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
                            }}
                            onMouseOut={(e) => {
                                (e.target as HTMLButtonElement).style.opacity = '1';
                                (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                            }}
                        >
                            {action.icon && <span>{action.icon}</span>}
                            {action.label}
                        </button>
                    ))}
                </div>
            )}

            <style>{`
        @keyframes cardEntrance {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </div>
    );
};

export default DynamicCard;
