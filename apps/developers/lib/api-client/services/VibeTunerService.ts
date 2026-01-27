/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { VibeRequest } from '../models/VibeRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class VibeTunerService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get Vibes
     * List all available vibes
     * @returns any Successful Response
     * @throws ApiError
     */
    public getVibesApiVibesGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/vibes',
        });
    }
    /**
     * Set Vibe
     * Set active vibe by region or location
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public setVibeApiVibesSetPost(
        requestBody: VibeRequest,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/vibes/set',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Vibe Prompt
     * Get system prompt for current vibe
     * @param context
     * @returns any Successful Response
     * @throws ApiError
     */
    public getVibePromptApiVibesPromptGet(
        context: string = '',
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/vibes/prompt',
            query: {
                'context': context,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
