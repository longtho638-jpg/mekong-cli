/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateOrderRequest = {
    amount?: (number | null);
    currency?: string;
    description?: (string | null);
    provider?: CreateOrderRequest.provider;
    price_id?: (string | null);
    success_url?: (string | null);
    cancel_url?: (string | null);
    customer_email?: (string | null);
    tenant_id?: (string | null);
};
export namespace CreateOrderRequest {
    export enum provider {
        PAYPAL = 'paypal',
        STRIPE = 'stripe',
    }
}

