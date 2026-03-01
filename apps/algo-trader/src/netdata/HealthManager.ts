/**
 * HealthManager — Real-time metrics monitoring and self-healing.
 * Inspired by Netdata health checks.
 */

import { logger } from '../utils/logger';
import { SignalMesh } from './SignalMesh';
import { MarketEventType, RiskEvent } from '../interfaces/IMarketEvent';

export interface HealthMetric {
    name: string;
    value: number;
    threshold: number;
    status: 'ok' | 'warning' | 'critical';
    tenantId: string;
}

export class HealthManager {
    private metrics = new Map<string, HealthMetric>();
    private eventBus: SignalMesh;
    private checkInterval: NodeJS.Timeout | null = null;

    constructor(eventBus: SignalMesh) {
        this.eventBus = eventBus;
    }

    updateMetric(tenantId: string, name: string, value: number, threshold: number): void {
        let status: 'ok' | 'warning' | 'critical' = 'ok';
        if (value >= threshold) {
            status = 'critical';
        } else if (value >= threshold * 0.8) {
            status = 'warning';
        }

        const metric: HealthMetric = { name, value, threshold, status, tenantId };
        const oldMetric = this.metrics.get(`${tenantId}:${name}`);
        this.metrics.set(`${tenantId}:${name}`, metric);

        if (status !== 'ok' && (!oldMetric || oldMetric.status === 'ok')) {
            this.eventBus.emit({
                type: MarketEventType.RISK_EVENT,
                tenantId,
                symbol: 'SYSTEM',
                timestamp: Date.now(),
                source: 'health-manager',
                level: status,
                message: `Health Alert: ${name} is ${status}`,
                metric: name,
                value,
                threshold,
            } as RiskEvent);
            logger.warn(`HealthManager [${tenantId}]: ALERT - ${name} is ${status} (${value}/${threshold})`);
        } else if (status === 'ok' && oldMetric && oldMetric.status !== 'ok') {
            this.eventBus.emit({
                type: MarketEventType.RISK_EVENT,
                tenantId,
                symbol: 'SYSTEM',
                timestamp: Date.now(),
                source: 'health-manager',
                level: 'info',
                message: `Health Resolved: ${name} is back to ok`,
                metric: name,
                value,
                threshold,
            } as RiskEvent);
            logger.info(`HealthManager [${tenantId}]: RESOLVED - ${name} is back to ok`);
        }
    }

    startMonitoring(intervalMs = 5000): void {
        this.checkInterval = setInterval(() => {
            this.performSelfHealing();
        }, intervalMs);
        logger.info('HealthManager: Monitoring started');
    }

    stopMonitoring(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    private performSelfHealing(): void {
        for (const metric of this.metrics.values()) {
            if (metric.status === 'critical') {
                this.eventBus.publish('health:healing', { metric: metric.name }, 'health-manager');
                // Implementation of self-healing logic would go here
                // e.g. restarting a collector, adjusting risk limits, etc.
            }
        }
    }

    getHealthStatus() {
        return Array.from(this.metrics.values());
    }
}
