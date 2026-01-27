/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Workflow } from '../models/Workflow';
import type { WorkflowDict } from '../models/WorkflowDict';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class WorkflowService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List Workflows
     * List all workflows.
     * @returns WorkflowDict Successful Response
     * @throws ApiError
     */
    public listWorkflowsWorkflowListGet(): CancelablePromise<Array<WorkflowDict>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/workflow/list',
        });
    }
    /**
     * Create Workflow
     * Create a new workflow.
     * @param name
     * @param triggerType
     * @returns any Successful Response
     * @throws ApiError
     */
    public createWorkflowWorkflowCreatePost(
        name: string,
        triggerType: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/workflow/create',
            query: {
                'name': name,
                'trigger_type': triggerType,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Save Workflow
     * Save a workflow definition.
     * @param workflowId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public saveWorkflowWorkflowWorkflowIdSavePost(
        workflowId: string,
        requestBody: Workflow,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/workflow/{workflow_id}/save',
            path: {
                'workflow_id': workflowId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Execute Workflow
     * Execute a workflow manually.
     * @param workflowId
     * @returns any Successful Response
     * @throws ApiError
     */
    public executeWorkflowWorkflowWorkflowIdExecutePost(
        workflowId: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/workflow/{workflow_id}/execute',
            path: {
                'workflow_id': workflowId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
