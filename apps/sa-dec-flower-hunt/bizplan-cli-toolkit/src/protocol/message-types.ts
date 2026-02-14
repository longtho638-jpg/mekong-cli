/**
 * Protocol Message Type Definitions
 */

export interface BaseMessage {
    id: string;
    timestamp: string;
    version: string;
}

export interface RequestMessage extends BaseMessage {
    skillId: string;
    action: 'execute' | 'validate' | 'describe';
    input: any;
    options?: RequestOptions;
}

export interface ResponseMessage extends BaseMessage {
    skillId: string;
    success: boolean;
    output?: any;
    error?: ErrorDetail;
}

export interface RequestOptions {
    timeout?: number;
    priority?: 'low' | 'normal' | 'high';
    metadata?: Record<string, any>;
}

export interface ErrorDetail {
    code: string;
    message: string;
    stackTrace?: string;
    context?: any;
}

export interface ProgressMessage extends BaseMessage {
    skillId: string;
    stage: string;
    progress: number;
    eta?: number;
}
