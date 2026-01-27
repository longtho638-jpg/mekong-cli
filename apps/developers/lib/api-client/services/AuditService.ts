/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuditLogEntry } from '../models/AuditLogEntry';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AuditService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get Audit Logs
     * Retrieve audit logs (Mock implementation reading from file).
     * @returns AuditLogEntry Successful Response
     * @throws ApiError
     */
    public getAuditLogsAuditLogsGet(): CancelablePromise<Array<AuditLogEntry>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/audit/logs',
        });
    }
}
