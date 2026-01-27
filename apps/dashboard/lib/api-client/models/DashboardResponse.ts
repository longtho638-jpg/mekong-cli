/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Anomaly } from './Anomaly';
import type { SystemStatus } from './SystemStatus';
export type DashboardResponse = {
    timestamp: string;
    systems: Record<string, SystemStatus>;
    anomalies: Array<Anomaly>;
    summary: string;
};

