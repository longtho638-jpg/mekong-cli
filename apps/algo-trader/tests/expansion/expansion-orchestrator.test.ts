import { ExpansionOrchestrator, DEFAULT_EXPANSION_CONFIG } from '../../src/expansion';
import type { ExpansionConfig } from '../../src/expansion';

describe('ExpansionOrchestrator', () => {
  it('start with all disabled returns all-false status', async () => {
    const orchestrator = new ExpansionOrchestrator();
    const status = await orchestrator.start();
    expect(status.assetUniverse).toBe(false);
    expect(status.crossChainRWA).toBe(false);
    expect(status.hardwareAcceleration).toBe(false);
    expect(status.daoGovernance).toBe(false);
    expect(status.geneticPromotion).toBe(false);
  });

  it('start with assetUniverse enabled returns assetUniverse=true', async () => {
    const config: Partial<ExpansionConfig> = {
      assetUniverse: { ...DEFAULT_EXPANSION_CONFIG.assetUniverse, enabled: true },
    };
    const orchestrator = new ExpansionOrchestrator(config);
    const status = await orchestrator.start();
    expect(status.assetUniverse).toBe(true);
    orchestrator.stop();
  });

  it('start with daoGovernance enabled returns daoGovernance=true', async () => {
    const config: Partial<ExpansionConfig> = {
      daoGovernance: { ...DEFAULT_EXPANSION_CONFIG.daoGovernance, enabled: true },
    };
    const orchestrator = new ExpansionOrchestrator(config);
    const status = await orchestrator.start();
    expect(status.daoGovernance).toBe(true);
  });

  it('start with hardwareAcceleration enabled returns hardwareAcceleration=true', async () => {
    const config: Partial<ExpansionConfig> = {
      hardwareAcceleration: { ...DEFAULT_EXPANSION_CONFIG.hardwareAcceleration, enabled: true },
    };
    const orchestrator = new ExpansionOrchestrator(config);
    const status = await orchestrator.start();
    expect(status.hardwareAcceleration).toBe(true);
  });

  it('start with geneticPromotion enabled returns geneticPromotion=true', async () => {
    const config: Partial<ExpansionConfig> = {
      geneticPromotion: { ...DEFAULT_EXPANSION_CONFIG.geneticPromotion, enabled: true },
    };
    const orchestrator = new ExpansionOrchestrator(config);
    const status = await orchestrator.start();
    expect(status.geneticPromotion).toBe(true);
    orchestrator.stop();
  });

  it('getters return null when module not started', async () => {
    const orchestrator = new ExpansionOrchestrator();
    await orchestrator.start();
    expect(orchestrator.getAssetUniverse()).toBeNull();
    expect(orchestrator.getCrossChainRwa()).toBeNull();
    expect(orchestrator.getHardwareAccel()).toBeNull();
    expect(orchestrator.getDaoGovernance()).toBeNull();
    expect(orchestrator.getGeneticPromotion()).toBeNull();
  });

  it('getters return instances when module is enabled', async () => {
    const config: Partial<ExpansionConfig> = {
      assetUniverse: { ...DEFAULT_EXPANSION_CONFIG.assetUniverse, enabled: true },
      daoGovernance: { ...DEFAULT_EXPANSION_CONFIG.daoGovernance, enabled: true },
    };
    const orchestrator = new ExpansionOrchestrator(config);
    await orchestrator.start();
    expect(orchestrator.getAssetUniverse()).not.toBeNull();
    expect(orchestrator.getDaoGovernance()).not.toBeNull();
    orchestrator.stop();
  });

  it('emits started event with status', async () => {
    const orchestrator = new ExpansionOrchestrator();
    const events: unknown[] = [];
    orchestrator.on('started', (s) => events.push(s));
    await orchestrator.start();
    expect(events).toHaveLength(1);
  });

  it('stop emits stopped event', async () => {
    const orchestrator = new ExpansionOrchestrator();
    await orchestrator.start();
    const events: unknown[] = [];
    orchestrator.on('stopped', () => events.push(1));
    orchestrator.stop();
    expect(events).toHaveLength(1);
  });
});
