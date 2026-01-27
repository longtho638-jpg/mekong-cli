/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SwarmStatusResponse } from '../models/SwarmStatusResponse';
import type { SwarmTaskResponse } from '../models/SwarmTaskResponse';
import type { TaskSubmitRequest } from '../models/TaskSubmitRequest';
import type { TaskSubmitResponse } from '../models/TaskSubmitResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class SwarmService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get Swarm Status
     * Get current status of Swarm (Agents, Metrics).
     * @returns SwarmStatusResponse Successful Response
     * @throws ApiError
     */
    public getSwarmStatusSwarmStatusGet(): CancelablePromise<SwarmStatusResponse> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/swarm/status',
        });
    }
    /**
     * Dispatch Task
     * Submit a task to the Swarm.
     * @param requestBody
     * @returns TaskSubmitResponse Successful Response
     * @throws ApiError
     */
    public dispatchTaskSwarmDispatchPost(
        requestBody: TaskSubmitRequest,
    ): CancelablePromise<TaskSubmitResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/swarm/dispatch',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Tasks
     * List active tasks in the Swarm.
     * @returns SwarmTaskResponse Successful Response
     * @throws ApiError
     */
    public listTasksSwarmTasksGet(): CancelablePromise<Array<SwarmTaskResponse>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/swarm/tasks',
        });
    }
}
