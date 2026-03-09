import { HardwareAccelerationManager } from '../../../src/expansion/hardware-accel';
import type { HardwareAccelerationConfig } from '../../../src/expansion/expansion-config-types';

describe('HardwareAccelerationManager', () => {
  it('initialize returns status object with all fields', async () => {
    const config: HardwareAccelerationConfig = { enabled: true, fpgaEnabled: true, ebpfEnabled: true };
    const manager = new HardwareAccelerationManager(config);
    const status = await manager.initialize();
    expect(typeof status.fpgaAvailable).toBe('boolean');
    expect(typeof status.ebpfLoaded).toBe('boolean');
    expect(status.swLatencyUs).toBeGreaterThan(0);
    expect(status.hwLatencyUs).toBeGreaterThan(0);
    expect(status.improvementFactor).toBeGreaterThan(1);
  });

  it('fpgaAvailable is true when fpgaEnabled and device found', async () => {
    const config: HardwareAccelerationConfig = { enabled: true, fpgaEnabled: true, ebpfEnabled: false };
    const manager = new HardwareAccelerationManager(config);
    const status = await manager.initialize();
    expect(status.fpgaAvailable).toBe(true);
  });

  it('fpgaAvailable is false when fpgaEnabled is false', async () => {
    const config: HardwareAccelerationConfig = { enabled: true, fpgaEnabled: false, ebpfEnabled: false };
    const manager = new HardwareAccelerationManager(config);
    const status = await manager.initialize();
    expect(status.fpgaAvailable).toBe(false);
  });

  it('ebpfLoaded is true when ebpfEnabled', async () => {
    const config: HardwareAccelerationConfig = { enabled: true, fpgaEnabled: false, ebpfEnabled: true };
    const manager = new HardwareAccelerationManager(config);
    const status = await manager.initialize();
    expect(status.ebpfLoaded).toBe(true);
  });

  it('ebpfLoaded is false when ebpfEnabled is false', async () => {
    const config: HardwareAccelerationConfig = { enabled: true, fpgaEnabled: false, ebpfEnabled: false };
    const manager = new HardwareAccelerationManager(config);
    const status = await manager.initialize();
    expect(status.ebpfLoaded).toBe(false);
  });

  it('emits initialized event', async () => {
    const config: HardwareAccelerationConfig = { enabled: true, fpgaEnabled: false, ebpfEnabled: false };
    const manager = new HardwareAccelerationManager(config);
    const events: unknown[] = [];
    manager.on('initialized', (s) => events.push(s));
    await manager.initialize();
    expect(events).toHaveLength(1);
  });

  it('exposes sub-components via getters', async () => {
    const config: HardwareAccelerationConfig = { enabled: true, fpgaEnabled: false, ebpfEnabled: false };
    const manager = new HardwareAccelerationManager(config);
    await manager.initialize();
    expect(manager.getFpgaDetector()).toBeDefined();
    expect(manager.getEbpfOptimizer()).toBeDefined();
    expect(manager.getBenchmark()).toBeDefined();
  });
});
