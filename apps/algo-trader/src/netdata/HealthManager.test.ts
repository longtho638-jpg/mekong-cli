import { HealthManager } from './HealthManager';

describe('HealthManager', () => {
    let healthManager: HealthManager;
    let mockSignalMesh: { emit: jest.Mock; publish: jest.Mock };

    beforeEach(() => {
        jest.useFakeTimers();
        mockSignalMesh = {
            emit: jest.fn(),
            publish: jest.fn(),
        };
        healthManager = new HealthManager(mockSignalMesh as any);
    });

    afterEach(() => {
        healthManager.stopMonitoring();
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    it('should update metrics and trigger alert on transition from ok to non-ok', () => {
        // ok status — no alert
        healthManager.updateMetric('tenant-1', 'latency', 5, 10);
        expect(healthManager.getHealthStatus()[0].status).toBe('ok');
        expect(mockSignalMesh.emit).not.toHaveBeenCalled();

        // transition to warning — triggers alert
        healthManager.updateMetric('tenant-1', 'latency', 9, 10);
        expect(healthManager.getHealthStatus()[0].status).toBe('warning');
        expect(mockSignalMesh.emit).toHaveBeenCalledTimes(1);
        expect(mockSignalMesh.emit).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'RISK_EVENT', level: 'warning' })
        );
    });

    it('should trigger alert on direct ok to critical transition', () => {
        healthManager.updateMetric('tenant-1', 'cpu', 11, 10);
        expect(healthManager.getHealthStatus()[0].status).toBe('critical');
        expect(mockSignalMesh.emit).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'RISK_EVENT', level: 'critical' })
        );
    });

    it('should trigger resolution when status returns to ok', () => {
        healthManager.updateMetric('tenant-1', 'latency', 15, 10);
        expect(mockSignalMesh.emit).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'RISK_EVENT', level: 'critical' })
        );

        mockSignalMesh.emit.mockClear();
        healthManager.updateMetric('tenant-1', 'latency', 5, 10);
        expect(mockSignalMesh.emit).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'RISK_EVENT', level: 'info' })
        );
    });
});
