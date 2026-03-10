import { CollectorRegistry, ICollector } from './CollectorRegistry';
import { SignalMesh } from './SignalMesh';

jest.mock('./SignalMesh', () => {
    return {
        SignalMesh: jest.fn().mockImplementation(() => {
            return {
                publish: jest.fn(),
                subscribe: jest.fn(),
            };
        })
    };
});

describe('CollectorRegistry', () => {
    let registry: CollectorRegistry;
    let mockSignalMesh: any; // eslint-disable-line @typescript-eslint/no-explicit-any -- jest mock

    beforeEach(() => {
        mockSignalMesh = new SignalMesh();
        registry = new CollectorRegistry(mockSignalMesh);
    });

    it('should register collectors', () => {
        const mockCollector: ICollector = {
            start: jest.fn(),
            stop: jest.fn(),
            getStatus: jest.fn().mockReturnValue('idle')
        };

        registry.register('c1', mockCollector);
        expect(registry.getCollector('c1')).toBe(mockCollector);
    });

    it('should not allow duplicate IDs', () => {
        const mockCollector: ICollector = {
            start: jest.fn(),
            stop: jest.fn(),
            getStatus: jest.fn()
        };

        registry.register('c1', mockCollector);
        expect(() => registry.register('c1', mockCollector)).toThrow();
    });

    it('should start and stop all collectors', async () => {
        const c1: ICollector = {
            start: jest.fn().mockResolvedValue(undefined),
            stop: jest.fn().mockResolvedValue(undefined),
            getStatus: jest.fn().mockReturnValue('running')
        };
        const c2: ICollector = {
            start: jest.fn().mockResolvedValue(undefined),
            stop: jest.fn().mockResolvedValue(undefined),
            getStatus: jest.fn().mockReturnValue('running')
        };

        registry.register('c1', c1);
        registry.register('c2', c2);

        await registry.startAll();
        expect(c1.start).toHaveBeenCalled();
        expect(c2.start).toHaveBeenCalled();
        expect(mockSignalMesh.publish).toHaveBeenCalledWith('collector:started', { id: 'c1' }, 'collector-registry');

        await registry.stopAll();
        expect(c1.stop).toHaveBeenCalled();
        expect(c2.stop).toHaveBeenCalled();
    });
});
