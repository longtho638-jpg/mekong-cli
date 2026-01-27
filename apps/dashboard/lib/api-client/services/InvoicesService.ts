/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Invoice } from '../models/Invoice';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class InvoicesService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get Invoice
     * Get invoice by ID
     * @param invoiceId
     * @returns Invoice Successful Response
     * @throws ApiError
     */
    public getInvoiceApiV1InvoicesInvoiceIdGet(
        invoiceId: string,
    ): CancelablePromise<Invoice> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/invoices/{invoice_id}',
            path: {
                'invoice_id': invoiceId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Invoices
     * List all invoices
     * @returns Invoice Successful Response
     * @throws ApiError
     */
    public listInvoicesApiV1InvoicesGet(): CancelablePromise<Array<Invoice>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/invoices/',
        });
    }
}
