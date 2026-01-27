/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SwarmAgentStatus } from './SwarmAgentStatus';
import type { SwarmMetrics } from './SwarmMetrics';
export type SwarmStatusResponse = {
    running: boolean;
    agents: Array<SwarmAgentStatus>;
    metrics: SwarmMetrics;
};

