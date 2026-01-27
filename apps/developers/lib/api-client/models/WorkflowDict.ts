/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkflowNodeDict } from './WorkflowNodeDict';
export type WorkflowDict = {
    id: string;
    name: string;
    trigger: string;
    trigger_config: Record<string, any>;
    nodes: Array<WorkflowNodeDict>;
    active: boolean;
};

