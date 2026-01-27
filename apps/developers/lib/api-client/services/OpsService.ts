/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuotaStatus } from '../models/QuotaStatus';
import type { ServiceHealth } from '../models/ServiceHealth';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class OpsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get Ops Status
     * Get health status of all monitored services.
     * @returns ServiceHealth Successful Response
     * @throws ApiError
     */
    public getOpsStatusOpsStatusGet(): CancelablePromise<Array<ServiceHealth>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/ops/status',
        });
    }
    /**
     * Get Quota
     * Get current quota usage.
     * @returns QuotaStatus Successful Response
     * @throws ApiError
     */
    public getQuotaOpsQuotaGet(): CancelablePromise<QuotaStatus> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/ops/quota',
        });
    }
}
