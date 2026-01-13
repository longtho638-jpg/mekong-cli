/**
 * ApprovalDialog - AgencyOS Human Approval Dialog
 * 
 * Modal dialog for human-in-the-loop approval flows.
 * Used for critical actions like deployments, commits, etc.
 */

import React from 'react';

export interface ApprovalDialogProps {
    isOpen: boolean;
    action: string;
    description: string;
    details?: Record<string, unknown>;
    onApprove: () => void;
    onReject: () => void;
    className?: string;
}

export const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
    isOpen,
    action,
    description,
    details,
    onApprove,
    onReject,
    className = '',
}) => {
    if (!isOpen) return null;

    return (
        <div
            className={`approval-dialog-overlay ${className}`}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                fontFamily: 'Inter, system-ui, sans-serif',
            }}
        >
            <div
                style={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    borderRadius: '16px',
                    padding: '28px',
                    maxWidth: '480px',
                    width: '90%',
                    border: '1px solid #FF9800',
                    boxShadow: '0 0 40px rgba(255, 152, 0, 0.2)',
                    animation: 'dialogEntrance 0.2s ease-out',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '20px',
                    }}
                >
                    <span
                        style={{
                            fontSize: '32px',
                            width: '48px',
                            height: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#FF980020',
                            borderRadius: '12px',
                        }}
                    >
                        ⚠️
                    </span>
                    <div>
                        <h3
                            style={{
                                margin: 0,
                                fontSize: '18px',
                                fontWeight: 600,
                                color: '#fff',
                            }}
                        >
                            Approval Required
                        </h3>
                        <p
                            style={{
                                margin: '4px 0 0',
                                fontSize: '14px',
                                color: '#FF9800',
                            }}
                        >
                            {action}
                        </p>
                    </div>
                </div>

                {/* Description */}
                <p
                    style={{
                        color: '#ccc',
                        fontSize: '15px',
                        lineHeight: 1.6,
                        marginBottom: '20px',
                    }}
                >
                    {description}
                </p>

                {/* Details */}
                {details && Object.keys(details).length > 0 && (
                    <div
                        style={{
                            backgroundColor: '#0f0f1e',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '20px',
                            fontSize: '13px',
                        }}
                    >
                        {Object.entries(details).map(([key, value]) => (
                            <div
                                key={key}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '6px 0',
                                    borderBottom: '1px solid #222',
                                }}
                            >
                                <span style={{ color: '#888' }}>{key}</span>
                                <span style={{ color: '#fff' }}>
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div
                    style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'flex-end',
                    }}
                >
                    <button
                        onClick={onReject}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '8px',
                            border: '1px solid #666',
                            backgroundColor: 'transparent',
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseOver={(e) => {
                            (e.target as HTMLButtonElement).style.borderColor = '#f44336';
                            (e.target as HTMLButtonElement).style.color = '#f44336';
                        }}
                        onMouseOut={(e) => {
                            (e.target as HTMLButtonElement).style.borderColor = '#666';
                            (e.target as HTMLButtonElement).style.color = '#fff';
                        }}
                    >
                        Reject
                    </button>
                    <button
                        onClick={onApprove}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#4CAF50',
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
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
                        ✓ Approve
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes dialogEntrance {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
        </div>
    );
};

export default ApprovalDialog;
