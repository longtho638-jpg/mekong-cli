/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class StripeWebhooksService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Handle Webhook
     * Unified Stripe webhook handler with signature verification.
     *
     * Security:
     * - Stripe-Signature header required
     * - Signature verified using Stripe SDK
     * - Timestamp validation prevents replay attacks
     * - All verification attempts logged
     * - Invalid signatures rejected with 401
     * @returns any Successful Response
     * @throws ApiError
     */
    public handleWebhookWebhooksStripePost(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/webhooks/stripe/',
        });
    }
}
