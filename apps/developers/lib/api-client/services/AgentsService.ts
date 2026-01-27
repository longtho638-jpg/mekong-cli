/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgentTask } from '../models/AgentTask';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AgentsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get Agents
     * List all available agents and their status
     * @returns any Successful Response
     * @throws ApiError
     */
    public getAgentsApiAgentsGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/agents',
        });
    }
    /**
     * Run Agent
     * Run a specific agent with a task
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public runAgentApiAgentsRunPost(
        requestBody: AgentTask,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/agents/run',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
