/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgentDefinition } from '../models/AgentDefinition';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AgentsCreatorService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List Available Skills
     * List available skills from catalog.
     * @returns any Successful Response
     * @throws ApiError
     */
    public listAvailableSkillsAgentsCreatorSkillsGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/agents-creator/skills',
        });
    }
    /**
     * Create Agent
     * Create a new custom agent.
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public createAgentAgentsCreatorCreatePost(
        requestBody: AgentDefinition,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/agents-creator/create',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
