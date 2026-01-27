/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Employee } from '../models/Employee';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class HrService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List Employees
     * List all employees
     * @returns Employee Successful Response
     * @throws ApiError
     */
    public listEmployeesApiV1HrEmployeesGet(): CancelablePromise<Array<Employee>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/hr/employees',
        });
    }
    /**
     * Create Employee
     * Create new employee
     * @param requestBody
     * @returns Employee Successful Response
     * @throws ApiError
     */
    public createEmployeeApiV1HrEmployeesPost(
        requestBody: Employee,
    ): CancelablePromise<Employee> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/hr/employees',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
