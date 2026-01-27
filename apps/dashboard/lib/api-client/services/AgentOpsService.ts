/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OpsExecuteRequest } from '../models/OpsExecuteRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AgentOpsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List All Ops
     * 📊 List all AgentOps modules via AgentOpsController
     * Returns status of all 50 ops aligned with agencyos.network
     * @returns any Successful Response
     * @throws ApiError
     */
    public listAllOpsApiAgentopsGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/agentops/',
        });
    }
    /**
     * Health Check
     * 🏥 Health check for AgentOps system via AgentOpsController
     * @returns any Successful Response
     * @throws ApiError
     */
    public healthCheckApiAgentopsHealthGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/agentops/health',
        });
    }
    /**
     * Get Ops Status
     * 📈 Get status of specific AgentOps category via AgentOpsController
     * @param category
     * @returns any Successful Response
     * @throws ApiError
     */
    public getOpsStatusApiAgentopsCategoryGet(
        category: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/agentops/{category}',
            path: {
                'category': category,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Execute Ops
     * ⚡ Execute an AgentOps action via AgentOpsController
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public executeOpsApiAgentopsExecutePost(
        requestBody: OpsExecuteRequest,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/agentops/execute',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Categories Summary
     * 📊 Summary by department category via AgentOpsController
     * @returns any Successful Response
     * @throws ApiError
     */
    public getCategoriesSummaryApiAgentopsCategoriesSummaryGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/agentops/categories/summary',
        });
    }
    /**
     * Get Binh Phap Chapters
     * 🏯 Binh Pháp 13 Chapters - Strategic Layer via AgentOpsController
     * Integrated within AgentOps DNA
     * @returns any Successful Response
     * @throws ApiError
     */
    public getBinhPhapChaptersApiAgentopsBinhPhapChaptersGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/agentops/binh-phap/chapters',
        });
    }
}
