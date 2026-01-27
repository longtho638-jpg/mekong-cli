/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class CampaignsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List Campaigns
     * List active marketing campaigns.
     * @returns any Successful Response
     * @throws ApiError
     */
    public listCampaignsCampaignsGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/campaigns/',
        });
    }
}
