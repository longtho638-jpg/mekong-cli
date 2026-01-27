/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DashboardResponse } from '../models/DashboardResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class MonitorService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get Status
     * Get real-time system status from Commander Engine.
     * @returns DashboardResponse Successful Response
     * @throws ApiError
     */
    public getStatusMonitorStatusGet(): CancelablePromise<DashboardResponse> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/monitor/status',
        });
    }
}
