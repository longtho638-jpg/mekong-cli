/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class PayPalWebhooksService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Handle Webhook
     * Unified PayPal webhook handler.
     * @param paypalTransmissionId
     * @param paypalTransmissionTime
     * @param paypalCertUrl
     * @param paypalAuthAlgo
     * @param paypalTransmissionSig
     * @returns any Successful Response
     * @throws ApiError
     */
    public handleWebhookWebhooksPaypalPost(
        paypalTransmissionId?: (string | null),
        paypalTransmissionTime?: (string | null),
        paypalCertUrl?: (string | null),
        paypalAuthAlgo?: (string | null),
        paypalTransmissionSig?: (string | null),
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/webhooks/paypal/',
            headers: {
                'PAYPAL-TRANSMISSION-ID': paypalTransmissionId,
                'PAYPAL-TRANSMISSION-TIME': paypalTransmissionTime,
                'PAYPAL-CERT-URL': paypalCertUrl,
                'PAYPAL-AUTH-ALGO': paypalAuthAlgo,
                'PAYPAL-TRANSMISSION-SIG': paypalTransmissionSig,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Webhook Status
     * Check webhook handler status.
     * @returns any Successful Response
     * @throws ApiError
     */
    public webhookStatusWebhooksPaypalStatusGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/webhooks/paypal/status',
        });
    }
}
