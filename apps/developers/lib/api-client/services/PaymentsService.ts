/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Body_capture_paypal_order_api_v1_payments_paypal_capture_order_post } from '../models/Body_capture_paypal_order_api_v1_payments_paypal_capture_order_post';
import type { CreateOrderRequest } from '../models/CreateOrderRequest';
import type { CreateSubscriptionRequest } from '../models/CreateSubscriptionRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class PaymentsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get Payment Status
     * Get payment status or service status
     * @param paymentId
     * @returns any Successful Response
     * @throws ApiError
     */
    public getPaymentStatusApiV1PaymentsStatusGet(
        paymentId?: (string | null),
    ): CancelablePromise<Record<string, any>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/payments/status',
            query: {
                'payment_id': paymentId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Paypal Order
     * Create a PayPal order.
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public createPaypalOrderApiV1PaymentsPaypalCreateOrderPost(
        requestBody: CreateOrderRequest,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/payments/paypal/create-order',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Capture Paypal Order
     * Capture PayPal order
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public capturePaypalOrderApiV1PaymentsPaypalCaptureOrderPost(
        requestBody: Body_capture_paypal_order_api_v1_payments_paypal_capture_order_post,
    ): CancelablePromise<Record<string, any>> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/payments/paypal/capture-order',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Paypal Subscription
     * Create a PayPal subscription.
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public createPaypalSubscriptionApiV1PaymentsPaypalCreateSubscriptionPost(
        requestBody: CreateSubscriptionRequest,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/payments/paypal/create-subscription',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Paypal Subscription
     * Get PayPal subscription details.
     * @param subscriptionId
     * @returns any Successful Response
     * @throws ApiError
     */
    public getPaypalSubscriptionApiV1PaymentsPaypalSubscriptionSubscriptionIdGet(
        subscriptionId: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/payments/paypal/subscription/{subscription_id}',
            path: {
                'subscription_id': subscriptionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cancel Paypal Subscription
     * Cancel a PayPal subscription.
     * @param subscriptionId
     * @param reason
     * @returns any Successful Response
     * @throws ApiError
     */
    public cancelPaypalSubscriptionApiV1PaymentsPaypalSubscriptionSubscriptionIdCancelPost(
        subscriptionId: string,
        reason?: (string | null),
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/payments/paypal/subscription/{subscription_id}/cancel',
            path: {
                'subscription_id': subscriptionId,
            },
            query: {
                'reason': reason,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Stripe Checkout
     * Create a Stripe Checkout Session.
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public createStripeCheckoutApiV1PaymentsStripeCreateCheckoutPost(
        requestBody: CreateOrderRequest,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/payments/stripe/create-checkout',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
