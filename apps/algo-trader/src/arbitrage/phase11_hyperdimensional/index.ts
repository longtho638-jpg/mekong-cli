/**
 * Phase 11: Hyperdimensional Nexus — barrel exports.
 *
 * Three modules:
 * 1. RWA Oracle & Arbitrage (rwaArbitrage) — Real-world asset price arbitrage
 * 2. Brain-Computer Interface (bciInterface) — Neural signal trading integration
 * 3. Quantum Internet Communication (quantumComm) — QKD-secured order relay
 *
 * All modules default to disabled + dry-run mode.
 */

// Module 1: RWA Arbitrage
export * from './rwaArbitrage/index';

// Module 2: BCI Interface
export * from './bciInterface/index';

// Module 3: Quantum Communication
export * from './quantumComm/index';

/** Phase 11 unified config shape (mirrors config.phase11.json). */
export interface Phase11Config {
  rwaArbitrage: {
    enabled: boolean;
    oracleAddresses: Record<string, string>;
    minSpreadBps: number;
    pollIntervalMs: number;
  };
  bciInterface: {
    enabled: boolean;
    eegSimulation: boolean;
    decoderModelPath: string;
    deadManSeconds: number;
  };
  quantumComm: {
    enabled: boolean;
    qkdSimulation: boolean;
    keyLengthBits: number;
    remoteEndpoint: string;
  };
}

export const DEFAULT_PHASE11_CONFIG: Phase11Config = {
  rwaArbitrage: {
    enabled: false,
    oracleAddresses: { 'REALTOKEN-1234': '0xMockOracleAddress' },
    minSpreadBps: 10,
    pollIntervalMs: 5000,
  },
  bciInterface: {
    enabled: false,
    eegSimulation: true,
    decoderModelPath: './models/eeg_classifier.json',
    deadManSeconds: 60,
  },
  quantumComm: {
    enabled: false,
    qkdSimulation: true,
    keyLengthBits: 256,
    remoteEndpoint: 'tcp://remote.data.center:9000',
  },
};
