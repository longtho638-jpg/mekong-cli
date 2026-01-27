/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { InvoiceStatus } from './InvoiceStatus';
export type Invoice = {
    /**
     * UUID
     */
    id: string;
    invoice_number: string;
    amount: number;
    tax: number;
    total: number;
    currency: string;
    status: InvoiceStatus;
    service_type?: (string | null);
    stripe_invoice_id?: (string | null);
};

