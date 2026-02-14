/**
 * Agent Protocol - Communication standard between Master and Agents
 */

import { AgentInput, AgentOutput } from '../types/agent.types';

export const PROTOCOL_VERSION = '1.0.0';

export interface ProtocolMessage<T = any> {
    version: string;
    messageId: string;
    timestamp: string;
    type: MessageType;
    payload: T;
}

export enum MessageType {
    TaskRequest = 'TASK_REQUEST',
    TaskResponse = 'TASK_RESPONSE',
    StatusUpdate = 'STATUS_UPDATE',
    ErrorMessage = 'ERROR_MESSAGE',
    HealthCheck = 'HEALTH_CHECK'
}

export interface TaskRequest {
    skillId: string;
    input: AgentInput;
    timeout?: number;
    retryPolicy?: RetryPolicy;
}

export interface TaskResponse {
    skillId: string;
    output: AgentOutput;
    executionTime: number;
}

export interface StatusUpdate {
    skillId: string;
    progress: number;
    message: string;
}

export interface ErrorMessage {
    skillId: string;
    code: ErrorCode;
    message: string;
    details?: any;
    recoverable: boolean;
}

export enum ErrorCode {
    InvalidInput = 'INVALID_INPUT',
    MissingDependency = 'MISSING_DEPENDENCY',
    ExecutionFailed = 'EXECUTION_FAILED',
    Timeout = 'TIMEOUT',
    InternalError = 'INTERNAL_ERROR'
}

export interface RetryPolicy {
    maxRetries: number;
    retryDelay: number;
    exponentialBackoff: boolean;
}

export class AgentProtocol {
    static createRequest(skillId: string, input: AgentInput): ProtocolMessage<TaskRequest> {
        return {
            version: PROTOCOL_VERSION,
            messageId: this.generateMessageId(),
            timestamp: new Date().toISOString(),
            type: MessageType.TaskRequest,
            payload: { skillId, input }
        };
    }

    static createResponse(skillId: string, output: AgentOutput, executionTime: number): ProtocolMessage<TaskResponse> {
        return {
            version: PROTOCOL_VERSION,
            messageId: this.generateMessageId(),
            timestamp: new Date().toISOString(),
            type: MessageType.TaskResponse,
            payload: { skillId, output, executionTime }
        };
    }

    static createError(skillId: string, code: ErrorCode, message: string, recoverable: boolean): ProtocolMessage<ErrorMessage> {
        return {
            version: PROTOCOL_VERSION,
            messageId: this.generateMessageId(),
            timestamp: new Date().toISOString(),
            type: MessageType.ErrorMessage,
            payload: { skillId, code, message, recoverable }
        };
    }

    private static generateMessageId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    static validateMessage(message: ProtocolMessage): boolean {
        return message.version === PROTOCOL_VERSION &&
            !!message.messageId &&
            !!message.timestamp &&
            !!message.type &&
            !!message.payload;
    }
}
