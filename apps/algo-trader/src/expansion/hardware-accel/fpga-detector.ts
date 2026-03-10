/**
 * Mock FPGA device detection via simulated PCIe scan.
 * No real hardware interaction — all results are simulated.
 */

import { EventEmitter } from 'events';

export interface FpgaDevice {
  deviceId: string;
  vendor: string;
  model: string;
  pcieSlot: string;
  available: boolean;
}

const MOCK_DEVICES: FpgaDevice[] = [
  { deviceId: 'fpga-0', vendor: 'Xilinx', model: 'Alveo U250', pcieSlot: '0000:03:00.0', available: true },
  { deviceId: 'fpga-1', vendor: 'Intel', model: 'Agilex 7', pcieSlot: '0000:04:00.0', available: false },
];

export class FpgaDetector extends EventEmitter {
  private detected: FpgaDevice[] = [];

  constructor() {
    super();
  }

  /** Simulate PCIe scan for FPGA devices. */
  async scan(): Promise<FpgaDevice[]> {
    // Simulate scan delay
    await Promise.resolve();
    this.detected = [...MOCK_DEVICES];
    const available = this.detected.filter((d) => d.available);
    this.emit('scan-complete', this.detected);
    if (available.length > 0) {
      this.emit('devices-found', available);
    }
    return this.detected;
  }

  /** Returns only devices that are available for use. */
  getAvailableDevices(): FpgaDevice[] {
    return this.detected.filter((d) => d.available);
  }

  /** Returns true if at least one FPGA is available. */
  hasAvailableDevice(): boolean {
    return this.detected.some((d) => d.available);
  }
}
