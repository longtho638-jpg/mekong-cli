/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class WebsocketService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get Websocket Status
     * Get WebSocket server status and active connections.
     * @returns any Successful Response
     * @throws ApiError
     */
    public getWebsocketStatusWsStatusGet(): CancelablePromise<Record<string, any>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/ws/status',
        });
    }
    /**
     * Broadcast Message
     * Broadcast a message to all connected clients.
     *
     * Body:
     * {
         * "type": "custom_event",
         * "data": {...}
         * }
         * @param requestBody
         * @returns string Successful Response
         * @throws ApiError
         */
        public broadcastMessageWsBroadcastPost(
            requestBody: Record<string, any>,
        ): CancelablePromise<Record<string, string>> {
            return this.httpRequest.request({
                method: 'POST',
                url: '/ws/broadcast',
                body: requestBody,
                mediaType: 'application/json',
                errors: {
                    422: `Validation Error`,
                },
            });
        }
        /**
         * Trigger Event
         * Trigger a specific event type for testing.
         *
         * Available events:
         * - lead_added
         * - invoice_paid
         * - vc_score_updated
         * - data_refresh
         * @param eventType
         * @param requestBody
         * @returns string Successful Response
         * @throws ApiError
         */
        public triggerEventWsTriggerEventTypePost(
            eventType: string,
            requestBody?: Record<string, any>,
        ): CancelablePromise<Record<string, string>> {
            return this.httpRequest.request({
                method: 'POST',
                url: '/ws/trigger/{event_type}',
                path: {
                    'event_type': eventType,
                },
                body: requestBody,
                mediaType: 'application/json',
                errors: {
                    422: `Validation Error`,
                },
            });
        }
    }
