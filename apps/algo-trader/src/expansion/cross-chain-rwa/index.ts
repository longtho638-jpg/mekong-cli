/**
 * CrossChainRwaHub — coordinates chain connections, RWA price feeds,
 * arb path discovery, and compliance gating.
 */

import { EventEmitter } from 'events';
import { ChainConnector } from './chain-connector';
import { RwaOracleManager } from './rwa-oracle-manager';
import { ArbitrageEnabler } from './arbitrage-enabler';
import { ComplianceChecker } from './compliance-checker';
import type { CrossChainRwaConfig, ArbPath } from '../expansion-config-types';

export { ChainConnector } from './chain-connector';
export { RwaOracleManager } from './rwa-oracle-manager';
export { ArbitrageEnabler } from './arbitrage-enabler';
export { ComplianceChecker } from './compliance-checker';

export class CrossChainRwaHub extends EventEmitter {
  private readonly connector: ChainConnector;
  private readonly oracle: RwaOracleManager;
  private readonly enabler: ArbitrageEnabler;
  private readonly compliance: ComplianceChecker;
  private readonly config: CrossChainRwaConfig;

  constructor(config: CrossChainRwaConfig) {
    super();
    this.config = config;
    this.connector = new ChainConnector(config.chains);
    this.oracle = new RwaOracleManager(config.rwaAssets);
    this.enabler = new ArbitrageEnabler({ minProfitBps: config.minArbProfitBps });
    this.compliance = new ComplianceChecker();
  }

  /** Bootstrap: connect chains and start price feeds. */
  async initialize(): Promise<void> {
    const statuses = await this.connector.connectAll();
    this.emit('chains-connected', statuses);
  }

  /**
   * Run one arb discovery cycle:
   * fetch prices → compliance filter → scan arb paths.
   */
  async runArbCycle(): Promise<ArbPath[]> {
    const prices = await this.oracle.fetchPrices();
    const connectedChains = this.connector.getConnectedChains();

    // Filter to compliant assets only
    const compliantPrices = prices.filter((p) => {
      const result = this.compliance.check(p.asset);
      return result.allowed;
    });

    const paths = this.enabler.scanPaths(compliantPrices, connectedChains);
    this.emit('arb-cycle-complete', paths);
    return paths;
  }

  getConnectedChains(): string[] {
    return this.connector.getConnectedChains();
  }
}
