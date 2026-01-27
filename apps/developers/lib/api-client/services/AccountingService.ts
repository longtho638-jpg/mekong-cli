/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LedgerEntry } from '../models/LedgerEntry';
import type { Transaction } from '../models/Transaction';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AccountingService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get Ledger
     * Get accounting ledger
     * @returns LedgerEntry Successful Response
     * @throws ApiError
     */
    public getLedgerApiV1AccountingLedgerGet(): CancelablePromise<Array<LedgerEntry>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/accounting/ledger',
        });
    }
    /**
     * Create Transaction
     * Create accounting transaction
     * @param requestBody
     * @returns Transaction Successful Response
     * @throws ApiError
     */
    public createTransactionApiV1AccountingTransactionsPost(
        requestBody: Transaction,
    ): CancelablePromise<Transaction> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/accounting/transactions',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
