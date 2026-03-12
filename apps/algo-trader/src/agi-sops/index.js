/**
 * AGI SOPs Integration for AlgoTrader
 * Execute trading SOPs using Cloudflare Workers AI
 *
 * Production: Uses CF AI binding ( Workers runtime)
 * Local: Uses CF REST API with API token
 */

import Orchestrator from './orchestrator.js';
import { registerAction } from './actions/registry.js';

// Register AlgoTrader-specific actions
registerAction('trading:scan', async (params) => {
  const { pairs = ['BTC/USDT'], exchanges = ['binance'] } = params;
  return { opportunities: [], scanned: pairs };
});

registerAction('trading:execute', async (params) => {
  const { symbol, side, amount } = params;
  return { orderId: `mock-${Date.now()}`, status: 'pending' };
});

registerAction('trading:risk-check', async (params) => {
  const { position, portfolio } = params;
  return { approved: true, riskLevel: 'low' };
});

registerAction('backtest:run', async (params) => {
  const { strategy, timeframe, days } = params;
  return { result: { totalReturn: 0.15, sharpe: 1.2 } };
});

// Production: CF Workers AI with AI binding
// Local: CF REST API with credentials
const createOrchestrator = (options = {}) => {
  return new Orchestrator({
    model: options.model || '@cf/meta/llama-3-8b-instruct',
    accountId: process.env.CF_ACCOUNT_ID,
    apiToken: process.env.CF_API_TOKEN,
    ai: options.ai // Workers binding
  });
};

export { createOrchestrator };
export default createOrchestrator();
