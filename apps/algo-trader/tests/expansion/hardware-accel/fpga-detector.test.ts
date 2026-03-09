import { FpgaDetector } from '../../../src/expansion/hardware-accel/fpga-detector';

describe('FpgaDetector', () => {
  it('scan returns mock device list', async () => {
    const detector = new FpgaDetector();
    const devices = await detector.scan();
    expect(devices.length).toBeGreaterThan(0);
  });

  it('getAvailableDevices returns only available devices after scan', async () => {
    const detector = new FpgaDetector();
    await detector.scan();
    const available = detector.getAvailableDevices();
    available.forEach((d) => expect(d.available).toBe(true));
  });

  it('hasAvailableDevice returns true when available device exists', async () => {
    const detector = new FpgaDetector();
    await detector.scan();
    expect(detector.hasAvailableDevice()).toBe(true);
  });

  it('emits scan-complete with all devices', async () => {
    const detector = new FpgaDetector();
    const events: unknown[] = [];
    detector.on('scan-complete', (d) => events.push(d));
    await detector.scan();
    expect(events).toHaveLength(1);
  });

  it('emits devices-found when available devices exist', async () => {
    const detector = new FpgaDetector();
    const events: unknown[] = [];
    detector.on('devices-found', (d) => events.push(d));
    await detector.scan();
    expect(events).toHaveLength(1);
  });

  it('getAvailableDevices returns empty before scan', () => {
    const detector = new FpgaDetector();
    expect(detector.getAvailableDevices()).toHaveLength(0);
  });

  it('hasAvailableDevice returns false before scan', () => {
    const detector = new FpgaDetector();
    expect(detector.hasAvailableDevice()).toBe(false);
  });
});
