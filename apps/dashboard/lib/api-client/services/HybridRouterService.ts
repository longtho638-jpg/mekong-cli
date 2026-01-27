/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CommandRequest } from '../models/CommandRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class HybridRouterService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get Router Stats
     * Get Hybrid Router statistics
     * @returns any Successful Response
     * @throws ApiError
     */
    public getRouterStatsApiRouterStatsGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/router/stats',
        });
    }
    /**
     * Route Task
     * Route a task to optimal AI provider
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public routeTaskApiRouterRoutePost(
        requestBody: CommandRequest,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/router/route',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
