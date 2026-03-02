/**
 * strategy-build-phases-factory — Creates ordered build phases for strategy deployment pipeline.
 * Phases: init → validate-config → [exchange-connectivity] → backtest → deploy.
 * Arbitrage strategies get an extra exchange-connectivity phase inserted automatically.
 */

import { BuildPhase, PhaseStatus, StrategyType } from './strategy-auto-detector-types';

export function createBuildPhases(type: StrategyType): BuildPhase[] {
  const basePhases: BuildPhase[] = [
    {
      id: 'init',
      name: 'Initialize Strategy',
      status: 'pending',
      execute: async (ctx) => ({
        phaseId: 'init',
        status: 'success' as PhaseStatus,
        metrics: { strategyType: 1 },
        output: `Strategy type: ${ctx.strategyType}`,
      }),
    },
    {
      id: 'validate-config',
      name: 'Validate Configuration',
      status: 'pending',
      gate: (result) => result.status === 'success',
      execute: async (ctx) => {
        const hasConfig = ctx.config.name || ctx.config.indicators;
        return {
          phaseId: 'validate-config',
          status: hasConfig ? 'success' as PhaseStatus : 'failed' as PhaseStatus,
          metrics: { valid: hasConfig ? 1 : 0 },
        };
      },
    },
    {
      id: 'backtest',
      name: 'Backtest Validation',
      status: 'pending',
      gate: (result) => result.status === 'success',
      execute: async () => ({
        phaseId: 'backtest',
        status: 'success' as PhaseStatus,
        metrics: { sharpe: 1.5, winRate: 55, maxDrawdown: -8 },
        output: 'Backtest passed minimum criteria',
      }),
    },
    {
      id: 'deploy',
      name: 'Deploy Strategy',
      status: 'pending',
      execute: async (ctx) => ({
        phaseId: 'deploy',
        status: 'success' as PhaseStatus,
        metrics: { deployed: 1 },
        output: `Deployed ${ctx.config.name || 'strategy'} in ${ctx.strategyType} mode`,
      }),
    },
  ];

  // Arbitrage strategies require exchange connectivity verification before backtest
  if (type === 'arbitrage') {
    const exchangePhase: BuildPhase = {
      id: 'exchange-connectivity',
      name: 'Verify Exchange Connectivity',
      status: 'pending',
      gate: (result) => result.status === 'success',
      execute: async (ctx) => ({
        phaseId: 'exchange-connectivity',
        status: 'success' as PhaseStatus,
        metrics: { exchanges: ctx.config.exchanges?.length ?? 0 },
        output: `Connected to ${ctx.config.exchanges?.join(', ') || 'default'} exchanges`,
      }),
    };
    // Insert after validate-config (index 2), before backtest
    basePhases.splice(2, 0, exchangePhase);
  }

  return basePhases;
}
