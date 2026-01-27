/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Product } from '../models/Product';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class InventoryService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List Products
     * List inventory products
     * @returns Product Successful Response
     * @throws ApiError
     */
    public listProductsApiV1InventoryProductsGet(): CancelablePromise<Array<Product>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/inventory/products',
        });
    }
    /**
     * Create Product
     * Add product to inventory
     * @param requestBody
     * @returns Product Successful Response
     * @throws ApiError
     */
    public createProductApiV1InventoryProductsPost(
        requestBody: Product,
    ): CancelablePromise<Product> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/inventory/products',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
