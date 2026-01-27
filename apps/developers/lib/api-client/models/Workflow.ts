/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkflowNode } from './WorkflowNode';
export type Workflow = {
    id: string;
    name: string;
    trigger: string;
    trigger_config: Record<string, any>;
    nodes: Array<WorkflowNode>;
    active: boolean;
};

