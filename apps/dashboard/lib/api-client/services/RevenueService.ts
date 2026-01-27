/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RevenueStats } from '../models/RevenueStats';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class RevenueService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get Revenue Dashboard
     * Get high-level revenue metrics.
     * @returns RevenueStats Successful Response
     * @throws ApiError
     */
    public getRevenueDashboardRevenueDashboardGet(): CancelablePromise<RevenueStats> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/revenue/dashboard',
        });
    }
    /**
     * Sync Revenue
     * Trigger synchronization with payment providers.
     * @returns any Successful Response
     * @throws ApiError
     */
    public syncRevenueRevenueSyncPost(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/revenue/sync',
        });
    }
    /**
     * Get Revenue Summary
     * GET /api/revenue/summary - Overall revenue metrics.
     * @returns any Successful Response
     * @throws ApiError
     */
    public getRevenueSummaryRevenueSummaryGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/revenue/summary',
        });
    }
    /**
     * Get Revenue By Product
     * GET /api/revenue/by-product - Revenue breakdown by product.
     * @returns any Successful Response
     * @throws ApiError
     */
    public getRevenueByProductRevenueByProductGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/revenue/by-product',
        });
    }
    /**
     * Get Revenue By Period
     * GET /api/revenue/by-period?period=daily|weekly|monthly - Time-series revenue data.
     * @param period
     * @returns any Successful Response
     * @throws ApiError
     */
    public getRevenueByPeriodRevenueByPeriodGet(
        period: string = 'monthly',
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/revenue/by-period',
            query: {
                'period': period,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Revenue Affiliates
     * GET /api/revenue/affiliates - Affiliate commission summary.
     * @returns any Successful Response
     * @throws ApiError
     */
    public getRevenueAffiliatesRevenueAffiliatesGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/revenue/affiliates',
        });
    }
}
