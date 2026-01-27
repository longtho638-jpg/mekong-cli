/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class GumroadWebhooksService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Handle Webhook
     * Unified Gumroad webhook handler with signature verification.
     *
     * Gumroad sends data as application/x-www-form-urlencoded.
     * Signature is verified via HMAC-SHA256 before processing.
     *
     * Security:
     * - X-Gumroad-Signature header required
     * - HMAC-SHA256 signature verification
     * - All verification attempts logged
     * - Invalid signatures rejected with 401
     * @returns any Successful Response
     * @throws ApiError
     */
    public handleWebhookWebhooksGumroadPost(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/webhooks/gumroad/',
        });
    }
}
