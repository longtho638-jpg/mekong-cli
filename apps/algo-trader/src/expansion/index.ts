/**
 * ExpansionOrchestrator — facade that conditionally starts each submodule
 * based on the provided ExpansionConfig.
 */

import { EventEmitter } from 'events';
import { AssetUniverseManager } from './asset-universe';
import { CrossChainRwaHub } from './cross-chain-rwa';
import { HardwareAccelerationManager } from './hardware-accel';
import { DaoGovernanceEngine } from './dao-governance';
import { GeneticSynthesizerPromoter } from './genetic-promotion';
import {
  DEFAULT_EXPANSION_CONFIG,
  type ExpansionConfig,
} from './expansion-config-types';

export { AssetUniverseManager } from './asset-universe';
export { CrossChainRwaHub } from './cross-chain-rwa';
export { HardwareAccelerationManager } from './hardware-accel';
export { DaoGovernanceEngine } from './dao-governance';
export { GeneticSynthesizerPromoter } from './genetic-promotion';
export { DEFAULT_EXPANSION_CONFIG } from './expansion-config-types';
export type { ExpansionConfig } from './expansion-config-types';

export interface ExpansionStatus {
  assetUniverse: boolean;
  crossChainRWA: boolean;
  hardwareAcceleration: boolean;
  daoGovernance: boolean;
  geneticPromotion: boolean;
}

export class ExpansionOrchestrator extends EventEmitter {
  private readonly config: ExpansionConfig;
  private assetUniverse: AssetUniverseManager | null = null;
  private crossChainRwa: CrossChainRwaHub | null = null;
  private hardwareAccel: HardwareAccelerationManager | null = null;
  private daoGovernance: DaoGovernanceEngine | null = null;
  private geneticPromotion: GeneticSynthesizerPromoter | null = null;

  constructor(config: Partial<ExpansionConfig> = {}) {
    super();
    this.config = { ...DEFAULT_EXPANSION_CONFIG, ...config };
  }

  /** Start all enabled submodules. */
  async start(): Promise<ExpansionStatus> {
    const status: ExpansionStatus = {
      assetUniverse: false,
      crossChainRWA: false,
      hardwareAcceleration: false,
      daoGovernance: false,
      geneticPromotion: false,
    };

    if (this.config.assetUniverse.enabled) {
      this.assetUniverse = new AssetUniverseManager(this.config.assetUniverse);
      this.assetUniverse.start();
      status.assetUniverse = true;
      this.emit('module-started', 'assetUniverse');
    }

    if (this.config.crossChainRWA.enabled) {
      this.crossChainRwa = new CrossChainRwaHub(this.config.crossChainRWA);
      await this.crossChainRwa.initialize();
      status.crossChainRWA = true;
      this.emit('module-started', 'crossChainRWA');
    }

    if (this.config.hardwareAcceleration.enabled) {
      this.hardwareAccel = new HardwareAccelerationManager(this.config.hardwareAcceleration);
      await this.hardwareAccel.initialize();
      status.hardwareAcceleration = true;
      this.emit('module-started', 'hardwareAcceleration');
    }

    if (this.config.daoGovernance.enabled) {
      this.daoGovernance = new DaoGovernanceEngine(this.config.daoGovernance);
      await this.daoGovernance.start();
      status.daoGovernance = true;
      this.emit('module-started', 'daoGovernance');
    }

    if (this.config.geneticPromotion.enabled) {
      this.geneticPromotion = new GeneticSynthesizerPromoter(this.config.geneticPromotion);
      this.geneticPromotion.start();
      status.geneticPromotion = true;
      this.emit('module-started', 'geneticPromotion');
    }

    this.emit('started', status);
    return status;
  }

  /** Stop all running submodules. */
  stop(): void {
    this.assetUniverse?.stop();
    this.geneticPromotion?.stop();
    this.emit('stopped');
  }

  getAssetUniverse(): AssetUniverseManager | null { return this.assetUniverse; }
  getCrossChainRwa(): CrossChainRwaHub | null { return this.crossChainRwa; }
  getHardwareAccel(): HardwareAccelerationManager | null { return this.hardwareAccel; }
  getDaoGovernance(): DaoGovernanceEngine | null { return this.daoGovernance; }
  getGeneticPromotion(): GeneticSynthesizerPromoter | null { return this.geneticPromotion; }
}
