/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request to execute an AgentOps action
 */
export type OpsExecuteRequest = {
    /**
     * Target category
     */
    category: string;
    /**
     * Action to execute
     */
    action: string;
    /**
     * Action parameters
     */
    params?: Record<string, any>;
};

