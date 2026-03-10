/**
 * Tests: Phase 10 Module 2 — Decentralized Auto-DAO Governance.
 * Covers: TokenIssuer, DarkPoolCreator, LiquidityManager,
 *         GovernanceProposer, AutoExecutor, initDaoGovernance.
 */

import { TokenIssuer } from '../../../src/arbitrage/phase10_cosmic/daoGovernance/token-issuer';
import { DarkPoolCreator } from '../../../src/arbitrage/phase10_cosmic/daoGovernance/dark-pool-creator';
import { LiquidityManager } from '../../../src/arbitrage/phase10_cosmic/daoGovernance/liquidity-manager';
import { GovernanceProposer } from '../../../src/arbitrage/phase10_cosmic/daoGovernance/governance-proposer';
import { AutoExecutor } from '../../../src/arbitrage/phase10_cosmic/daoGovernance/auto-executor';
import { initDaoGovernance } from '../../../src/arbitrage/phase10_cosmic/daoGovernance/index';

// ── TokenIssuer ───────────────────────────────────────────────────────────────

describe('TokenIssuer — deploy', () => {
  it('returns token info with correct name and symbol', () => {
    const issuer = new TokenIssuer({ name: 'AlphaGov', symbol: 'AGOV', dryRun: false });
    const info = issuer.deploy();
    expect(info.name).toBe('AlphaGov');
    expect(info.symbol).toBe('AGOV');
    expect(info.decimals).toBe(18);
    expect(info.contractAddress).toMatch(/^0x[0-9a-f]{40}$/);
  });

  it('two deploys produce different contract addresses', () => {
    const issuer = new TokenIssuer({ dryRun: false });
    const a = issuer.deploy();
    const b = issuer.deploy();
    expect(a.contractAddress).not.toBe(b.contractAddress);
  });

  it('getTokenInfo is null before deploy', () => {
    const issuer = new TokenIssuer({ dryRun: false });
    expect(issuer.getTokenInfo()).toBeNull();
  });

  it('getTokenInfo returns deployed info after deploy', () => {
    const issuer = new TokenIssuer({ dryRun: false });
    issuer.deploy();
    expect(issuer.getTokenInfo()).not.toBeNull();
  });
});

describe('TokenIssuer — mint/burn/balance', () => {
  let issuer: TokenIssuer;

  beforeEach(() => {
    issuer = new TokenIssuer({ dryRun: false });
    issuer.deploy();
  });

  it('mint increases balance and totalSupply', () => {
    issuer.mint('0xAlice', 1000);
    expect(issuer.balanceOf('0xAlice')).toBe(1000);
    expect(issuer.totalSupply()).toBe(1000);
  });

  it('mint to multiple addresses accumulates totalSupply', () => {
    issuer.mint('0xAlice', 500);
    issuer.mint('0xBob', 300);
    expect(issuer.totalSupply()).toBe(800);
  });

  it('burn reduces balance and totalSupply', () => {
    issuer.mint('0xAlice', 1000);
    issuer.burn('0xAlice', 400);
    expect(issuer.balanceOf('0xAlice')).toBe(600);
    expect(issuer.totalSupply()).toBe(600);
  });

  it('burn throws on insufficient balance', () => {
    issuer.mint('0xAlice', 100);
    expect(() => issuer.burn('0xAlice', 200)).toThrow('insufficient balance');
  });

  it('balanceOf returns 0 for unknown address', () => {
    expect(issuer.balanceOf('0xUnknown')).toBe(0);
  });

  it('mint throws for empty address', () => {
    expect(() => issuer.mint('', 100)).toThrow('address required');
  });

  it('mint throws for non-positive amount', () => {
    expect(() => issuer.mint('0xAlice', 0)).toThrow('positive');
  });

  it('burn throws for empty address', () => {
    expect(() => issuer.burn('', 100)).toThrow('address required');
  });

  it('burn throws for non-positive amount', () => {
    expect(() => issuer.burn('0xAlice', -1)).toThrow('positive');
  });

  it('respects maxSupply cap', () => {
    const capped = new TokenIssuer({ maxSupply: 1000, dryRun: false });
    capped.deploy();
    capped.mint('0xAlice', 800);
    expect(() => capped.mint('0xAlice', 300)).toThrow('maxSupply');
  });

  it('dryRun skips state changes', () => {
    const dry = new TokenIssuer({ dryRun: true });
    dry.deploy();
    dry.mint('0xAlice', 500);
    expect(dry.balanceOf('0xAlice')).toBe(0);
    expect(dry.totalSupply()).toBe(0);
  });

  it('isDryRun reflects config', () => {
    expect(new TokenIssuer({ dryRun: true }).isDryRun()).toBe(true);
    expect(new TokenIssuer({ dryRun: false }).isDryRun()).toBe(false);
  });
});

// ── DarkPoolCreator ───────────────────────────────────────────────────────────

describe('DarkPoolCreator — deploy', () => {
  it('returns a valid mock contract address', () => {
    const pool = new DarkPoolCreator({ dryRun: false });
    const addr = pool.deploy();
    expect(addr).toMatch(/^0x[0-9a-f]{40}$/);
    expect(pool.getContractAddress()).toBe(addr);
  });

  it('redeploy resets state', () => {
    const pool = new DarkPoolCreator({ dryRun: false });
    pool.deploy();
    pool.submitOrder('0xT', 'buy', 'BTC', 1, 50000);
    pool.deploy();
    expect(pool.getOpenOrderCount()).toBe(0);
  });
});

describe('DarkPoolCreator — submitOrder', () => {
  let pool: DarkPoolCreator;

  beforeEach(() => {
    pool = new DarkPoolCreator({ dryRun: false });
    pool.deploy();
  });

  it('returns a string orderId', () => {
    const id = pool.submitOrder('0xTrader', 'buy', 'ETH', 5, 3000);
    expect(typeof id).toBe('string');
    expect(id).toMatch(/^ord-/);
  });

  it('increments open order count', () => {
    pool.submitOrder('0xT', 'buy', 'ETH', 1, 3000);
    pool.submitOrder('0xT', 'sell', 'ETH', 1, 2900);
    expect(pool.getOpenOrderCount()).toBe(2);
  });

  it('throws for empty trader', () => {
    expect(() => pool.submitOrder('', 'buy', 'ETH', 1, 3000)).toThrow('trader address required');
  });

  it('throws for quantity below minOrderSize', () => {
    const p = new DarkPoolCreator({ minOrderSize: 5, dryRun: false });
    p.deploy();
    expect(() => p.submitOrder('0xT', 'buy', 'ETH', 2, 3000)).toThrow('minOrderSize');
  });

  it('throws for non-positive limitPrice', () => {
    expect(() => pool.submitOrder('0xT', 'buy', 'ETH', 1, 0)).toThrow('positive');
  });

  it('throws when pool at maxOrders capacity', () => {
    const p = new DarkPoolCreator({ maxOrders: 1, dryRun: false });
    p.deploy();
    p.submitOrder('0xT', 'buy', 'ETH', 1, 3000);
    expect(() => p.submitOrder('0xT', 'buy', 'ETH', 1, 3000)).toThrow('maxOrders');
  });

  it('dryRun returns orderId but does not store order', () => {
    const dry = new DarkPoolCreator({ dryRun: true });
    dry.deploy();
    const id = dry.submitOrder('0xT', 'buy', 'ETH', 1, 3000);
    expect(typeof id).toBe('string');
    expect(dry.getOpenOrderCount()).toBe(0);
  });
});

describe('DarkPoolCreator — matchOrders', () => {
  let pool: DarkPoolCreator;

  beforeEach(() => {
    pool = new DarkPoolCreator({ dryRun: false });
    pool.deploy();
  });

  it('matches one buy and one sell when prices cross', () => {
    pool.submitOrder('0xBuyer', 'buy', 'BTC', 1, 50000);
    pool.submitOrder('0xSeller', 'sell', 'BTC', 1, 48000);
    const matched = pool.matchOrders('BTC');
    expect(matched).toBe(1);
    expect(pool.getMatchedTrades()).toHaveLength(1);
    expect(pool.getOpenOrderCount()).toBe(0);
  });

  it('does not match when buy price < sell price', () => {
    pool.submitOrder('0xBuyer', 'buy', 'BTC', 1, 40000);
    pool.submitOrder('0xSeller', 'sell', 'BTC', 1, 50000);
    const matched = pool.matchOrders('BTC');
    expect(matched).toBe(0);
    expect(pool.getMatchedTrades()).toHaveLength(0);
  });

  it('execution price is midpoint of bid and ask', () => {
    pool.submitOrder('0xBuyer', 'buy', 'ETH', 1, 3000);
    pool.submitOrder('0xSeller', 'sell', 'ETH', 1, 2800);
    pool.matchOrders('ETH');
    const [trade] = pool.getMatchedTrades();
    expect(trade.executionPrice).toBe(2900);
  });

  it('getMatchedTrades filters by asset', () => {
    pool.submitOrder('0xB', 'buy', 'BTC', 1, 50000);
    pool.submitOrder('0xS', 'sell', 'BTC', 1, 48000);
    pool.submitOrder('0xB', 'buy', 'ETH', 1, 3000);
    pool.submitOrder('0xS', 'sell', 'ETH', 1, 2800);
    pool.matchOrders('BTC');
    pool.matchOrders('ETH');
    expect(pool.getMatchedTrades('BTC')).toHaveLength(1);
    expect(pool.getMatchedTrades('ETH')).toHaveLength(1);
    expect(pool.getMatchedTrades()).toHaveLength(2);
  });

  it('matched trade has required fields', () => {
    pool.submitOrder('0xB', 'buy', 'BTC', 2, 50000);
    pool.submitOrder('0xS', 'sell', 'BTC', 2, 48000);
    pool.matchOrders('BTC');
    const [trade] = pool.getMatchedTrades();
    expect(trade).toHaveProperty('tradeId');
    expect(trade).toHaveProperty('buyOrderId');
    expect(trade).toHaveProperty('sellOrderId');
    expect(trade.quantity).toBe(2);
  });

  it('dryRun matchOrders returns 0 and produces no trades', () => {
    const dry = new DarkPoolCreator({ dryRun: true });
    dry.deploy();
    expect(dry.matchOrders('BTC')).toBe(0);
    expect(dry.getMatchedTrades()).toHaveLength(0);
  });
});

// ── LiquidityManager ─────────────────────────────────────────────────────────

describe('LiquidityManager — deposit/withdraw/balance', () => {
  let mgr: LiquidityManager;

  beforeEach(() => {
    mgr = new LiquidityManager({ dryRun: false });
  });

  it('deposit increases balance', () => {
    mgr.deposit('USDC', 10000);
    expect(mgr.getBalance('USDC')).toBe(10000);
  });

  it('withdraw decreases balance', () => {
    mgr.deposit('USDT', 5000);
    mgr.withdraw('USDT', 2000);
    expect(mgr.getBalance('USDT')).toBe(3000);
  });

  it('withdraw throws on insufficient balance', () => {
    mgr.deposit('DAI', 100);
    expect(() => mgr.withdraw('DAI', 500)).toThrow('insufficient balance');
  });

  it('getBalance returns 0 for untouched asset', () => {
    expect(mgr.getBalance('USDC')).toBe(0);
  });

  it('throws for unsupported asset on deposit', () => {
    expect(() => mgr.deposit('SHIB', 100)).toThrow('not supported');
  });

  it('throws for unsupported asset on withdraw', () => {
    expect(() => mgr.withdraw('PEPE', 100)).toThrow('not supported');
  });

  it('throws for unsupported asset on getBalance', () => {
    expect(() => mgr.getBalance('DOGE')).toThrow('not supported');
  });

  it('deposit throws for non-positive amount', () => {
    expect(() => mgr.deposit('USDC', 0)).toThrow('positive');
  });

  it('withdraw throws for non-positive amount', () => {
    expect(() => mgr.withdraw('USDC', -1)).toThrow('positive');
  });

  it('dryRun skips state changes', () => {
    const dry = new LiquidityManager({ dryRun: true });
    dry.deposit('USDC', 10000);
    expect(dry.getBalance('USDC')).toBe(0);
  });
});

describe('LiquidityManager — provideLiquidity / yield', () => {
  let mgr: LiquidityManager;

  beforeEach(() => {
    mgr = new LiquidityManager({ dryRun: false });
    mgr.deposit('USDC', 10000);
  });

  it('provideLiquidity returns a position ID', () => {
    const id = mgr.provideLiquidity('USDC', 5000);
    expect(id).toMatch(/^lp-/);
  });

  it('provideLiquidity deducts from spot balance', () => {
    mgr.provideLiquidity('USDC', 4000);
    expect(mgr.getBalance('USDC')).toBe(6000);
  });

  it('provideLiquidity throws for insufficient balance', () => {
    expect(() => mgr.provideLiquidity('USDC', 20000)).toThrow('insufficient balance');
  });

  it('provideLiquidity throws for non-positive amount', () => {
    expect(() => mgr.provideLiquidity('USDC', 0)).toThrow('positive');
  });

  it('getYieldEarned returns 0 for unknown position', () => {
    expect(mgr.getYieldEarned('unknown-pos')).toBe(0);
  });

  it('getYieldEarned returns non-negative number for valid position', () => {
    const id = mgr.provideLiquidity('USDC', 1000);
    expect(mgr.getYieldEarned(id)).toBeGreaterThanOrEqual(0);
  });

  it('getLpPositions lists open positions', () => {
    mgr.provideLiquidity('USDC', 1000);
    mgr.provideLiquidity('USDC', 2000);
    expect(mgr.getLpPositions()).toHaveLength(2);
  });

  it('getTreasurySnapshot covers all supported assets', () => {
    const snap = mgr.getTreasurySnapshot();
    expect(snap.map((s) => s.asset)).toEqual(expect.arrayContaining(['USDC', 'USDT', 'DAI']));
  });

  it('snapshot lpBalance reflects provided liquidity', () => {
    mgr.provideLiquidity('USDC', 3000);
    const snap = mgr.getTreasurySnapshot().find((s) => s.asset === 'USDC')!;
    expect(snap.lpBalance).toBe(3000);
  });

  it('isDryRun reflects config', () => {
    expect(new LiquidityManager({ dryRun: true }).isDryRun()).toBe(true);
  });
});

// ── GovernanceProposer ────────────────────────────────────────────────────────

describe('GovernanceProposer — createProposal', () => {
  let gp: GovernanceProposer;

  beforeEach(() => {
    gp = new GovernanceProposer({ dryRun: false, votingPeriodSec: 3600 });
  });

  it('returns a proposal ID string', () => {
    const id = gp.createProposal('0xP', 'Increase fees', 'desc', 'payload-A');
    expect(id).toMatch(/^prop-/);
  });

  it('newly created proposal has active status', () => {
    const id = gp.createProposal('0xP', 'Test', 'desc', 'p');
    expect(gp.getProposal(id)?.status).toBe('active');
  });

  it('throws for empty proposer', () => {
    expect(() => gp.createProposal('', 'Title', 'desc', 'p')).toThrow('proposer required');
  });

  it('throws for empty title', () => {
    expect(() => gp.createProposal('0xP', '  ', 'desc', 'p')).toThrow('title required');
  });

  it('dryRun returns ID but stores nothing', () => {
    const dry = new GovernanceProposer({ dryRun: true });
    const id = dry.createProposal('0xP', 'T', 'd', 'p');
    expect(typeof id).toBe('string');
    expect(dry.getProposal(id)).toBeUndefined();
  });
});

describe('GovernanceProposer — vote', () => {
  let gp: GovernanceProposer;
  let pid: string;

  beforeEach(() => {
    gp = new GovernanceProposer({ dryRun: false, votingPeriodSec: 3600 });
    pid = gp.createProposal('0xP', 'Title', 'desc', 'payload');
  });

  it('vote for increases votesFor', () => {
    gp.vote(pid, '0xVoter1', true, 100);
    expect(gp.getProposal(pid)?.votesFor).toBe(100);
  });

  it('vote against increases votesAgainst', () => {
    gp.vote(pid, '0xVoter1', false, 50);
    expect(gp.getProposal(pid)?.votesAgainst).toBe(50);
  });

  it('multiple voters accumulate correctly', () => {
    gp.vote(pid, '0xV1', true, 200);
    gp.vote(pid, '0xV2', true, 300);
    gp.vote(pid, '0xV3', false, 100);
    expect(gp.getProposal(pid)?.votesFor).toBe(500);
    expect(gp.getProposal(pid)?.votesAgainst).toBe(100);
  });

  it('duplicate vote throws', () => {
    gp.vote(pid, '0xVoter1', true, 100);
    expect(() => gp.vote(pid, '0xVoter1', false, 100)).toThrow('already voted');
  });

  it('vote throws for unknown proposal', () => {
    expect(() => gp.vote('bad-id', '0xV', true, 100)).toThrow('not found');
  });

  it('vote throws for non-positive weight', () => {
    expect(() => gp.vote(pid, '0xV', true, 0)).toThrow('positive');
  });

  it('getVotes returns cast votes', () => {
    gp.vote(pid, '0xV1', true, 100);
    gp.vote(pid, '0xV2', false, 50);
    expect(gp.getVotes(pid)).toHaveLength(2);
  });
});

describe('GovernanceProposer — finalise', () => {
  let gp: GovernanceProposer;

  beforeEach(() => {
    gp = new GovernanceProposer({ dryRun: false, quorumFraction: 0.1, votingPeriodSec: 3600 });
  });

  it('passes when for > against and quorum met', () => {
    const pid = gp.createProposal('0xP', 'T', 'd', 'p');
    gp.vote(pid, '0xV1', true, 600);
    gp.vote(pid, '0xV2', false, 200);
    const status = gp.finalise(pid, 1000);
    expect(status).toBe('passed');
  });

  it('rejects when against >= for', () => {
    const pid = gp.createProposal('0xP', 'T', 'd', 'p');
    gp.vote(pid, '0xV1', false, 600);
    gp.vote(pid, '0xV2', true, 200);
    const status = gp.finalise(pid, 1000);
    expect(status).toBe('rejected');
  });

  it('rejects when quorum not met', () => {
    const pid = gp.createProposal('0xP', 'T', 'd', 'p');
    gp.vote(pid, '0xV1', true, 5); // 5/1000 = 0.5% < 10% quorum
    const status = gp.finalise(pid, 1000);
    expect(status).toBe('rejected');
  });

  it('throws for unknown proposal', () => {
    expect(() => gp.finalise('bad', 1000)).toThrow('not found');
  });

  it('listActiveProposals returns only active ones', () => {
    const id1 = gp.createProposal('0xP', 'A', 'd', 'p');
    gp.createProposal('0xP', 'B', 'd', 'p');
    gp.vote(id1, '0xV1', false, 200);
    gp.finalise(id1, 1000); // becomes rejected
    expect(gp.listActiveProposals()).toHaveLength(1);
  });

  it('dryRun finalise returns pending', () => {
    const dry = new GovernanceProposer({ dryRun: true });
    expect(dry.finalise('any', 1000)).toBe('pending');
  });
});

// ── AutoExecutor ──────────────────────────────────────────────────────────────

describe('AutoExecutor — lifecycle', () => {
  it('isRunning is false initially', () => {
    expect(new AutoExecutor().isRunning()).toBe(false);
  });

  it('start sets isRunning to true', () => {
    const exec = new AutoExecutor({ dryRun: true });
    exec.start();
    expect(exec.isRunning()).toBe(true);
    exec.stop();
  });

  it('stop sets isRunning to false', () => {
    const exec = new AutoExecutor({ dryRun: true });
    exec.start();
    exec.stop();
    expect(exec.isRunning()).toBe(false);
  });

  it('double start is idempotent', () => {
    const exec = new AutoExecutor({ dryRun: true });
    exec.start();
    exec.start();
    expect(exec.isRunning()).toBe(true);
    exec.stop();
  });
});

describe('AutoExecutor — executeProposal (dryRun)', () => {
  it('dry-run returns success record without proposer', () => {
    const exec = new AutoExecutor({ dryRun: true });
    const rec = exec.executeProposal('prop-123');
    expect(rec.success).toBe(true);
    expect(rec.payload).toBe('dry-run');
    expect(rec.proposalId).toBe('prop-123');
  });

  it('execution record has required fields', () => {
    const exec = new AutoExecutor({ dryRun: true });
    const rec = exec.executeProposal('prop-abc');
    expect(rec).toHaveProperty('executionId');
    expect(rec).toHaveProperty('proposalId', 'prop-abc');
    expect(rec).toHaveProperty('success');
    expect(rec).toHaveProperty('executedAt');
  });

  it('executionId has exec- prefix', () => {
    const exec = new AutoExecutor({ dryRun: true });
    const rec = exec.executeProposal('p');
    expect(rec.executionId).toMatch(/^exec-/);
  });
});

describe('AutoExecutor — executeProposal (live)', () => {
  it('fails gracefully when no proposer attached', () => {
    const exec = new AutoExecutor({ dryRun: false });
    const rec = exec.executeProposal('prop-x');
    expect(rec.success).toBe(false);
    expect(rec.error).toContain('no proposer');
  });

  it('fails for unknown proposal ID', () => {
    const exec = new AutoExecutor({ dryRun: false });
    const gp = new GovernanceProposer({ dryRun: false });
    exec.attachProposer(gp);
    const rec = exec.executeProposal('nonexistent');
    expect(rec.success).toBe(false);
    expect(rec.error).toContain('not found');
  });

  it('fails for proposal not in passed status', () => {
    const exec = new AutoExecutor({ dryRun: false });
    const gp = new GovernanceProposer({ dryRun: false });
    exec.attachProposer(gp);
    const pid = gp.createProposal('0xP', 'T', 'd', 'payload');
    const rec = exec.executeProposal(pid);
    expect(rec.success).toBe(false);
    expect(rec.error).toContain('active');
  });

  it('succeeds for a passed proposal', () => {
    const exec = new AutoExecutor({ dryRun: false });
    const gp = new GovernanceProposer({ dryRun: false, quorumFraction: 0.1 });
    exec.attachProposer(gp);
    const pid = gp.createProposal('0xP', 'Execute fund transfer', 'd', 'transfer(100,USDC)');
    gp.vote(pid, '0xV1', true, 900);
    gp.finalise(pid, 1000);
    const rec = exec.executeProposal(pid);
    expect(rec.success).toBe(true);
    expect(rec.payload).toBe('transfer(100,USDC)');
  });
});

describe('AutoExecutor — getExecutionLog', () => {
  it('log is empty initially', () => {
    expect(new AutoExecutor().getExecutionLog()).toHaveLength(0);
  });

  it('each executeProposal appends to log', () => {
    const exec = new AutoExecutor({ dryRun: true });
    exec.executeProposal('p1');
    exec.executeProposal('p2');
    expect(exec.getExecutionLog()).toHaveLength(2);
  });

  it('log is returned most-recent first', () => {
    const exec = new AutoExecutor({ dryRun: true });
    exec.executeProposal('p1');
    exec.executeProposal('p2');
    const log = exec.getExecutionLog();
    expect(log[0].proposalId).toBe('p2');
    expect(log[1].proposalId).toBe('p1');
  });

  it('log rotates at maxLogSize', () => {
    const exec = new AutoExecutor({ dryRun: true, maxLogSize: 3 });
    for (let i = 0; i < 5; i++) exec.executeProposal(`p${i}`);
    expect(exec.getExecutionLog()).toHaveLength(3);
  });

  it('isDryRun reflects config', () => {
    expect(new AutoExecutor({ dryRun: false }).isDryRun()).toBe(false);
  });
});

// ── initDaoGovernance ─────────────────────────────────────────────────────────

describe('initDaoGovernance', () => {
  it('returns all component instances', () => {
    const dao = initDaoGovernance();
    expect(dao.tokenIssuer).toBeInstanceOf(TokenIssuer);
    expect(dao.darkPool).toBeInstanceOf(DarkPoolCreator);
    expect(dao.liquidityManager).toBeInstanceOf(LiquidityManager);
    expect(dao.proposer).toBeInstanceOf(GovernanceProposer);
    expect(dao.executor).toBeInstanceOf(AutoExecutor);
  });

  it('default config has enabled=false', () => {
    const dao = initDaoGovernance();
    expect(dao.config.enabled).toBe(false);
  });

  it('all components default to dryRun=true when enabled=false', () => {
    const dao = initDaoGovernance({ enabled: false });
    expect(dao.tokenIssuer.isDryRun()).toBe(true);
    expect(dao.darkPool.isDryRun()).toBe(true);
    expect(dao.liquidityManager.isDryRun()).toBe(true);
    expect(dao.proposer.isDryRun()).toBe(true);
    expect(dao.executor.isDryRun()).toBe(true);
  });

  it('enabled=true sets dryRun=false on main components', () => {
    const dao = initDaoGovernance({ enabled: true });
    expect(dao.tokenIssuer.isDryRun()).toBe(false);
    expect(dao.liquidityManager.isDryRun()).toBe(false);
    expect(dao.proposer.isDryRun()).toBe(false);
    expect(dao.executor.isDryRun()).toBe(false);
  });

  it('respects tokenName and tokenSymbol', () => {
    const dao = initDaoGovernance({ tokenName: 'AlphaDAO', tokenSymbol: 'ADAO' });
    expect(dao.config.tokenName).toBe('AlphaDAO');
    expect(dao.config.tokenSymbol).toBe('ADAO');
  });

  it('darkPool dryRun=true when darkPoolEnabled=false even if enabled=true', () => {
    const dao = initDaoGovernance({ enabled: true, darkPoolEnabled: false });
    expect(dao.darkPool.isDryRun()).toBe(true);
  });

  it('darkPool dryRun=false when both enabled and darkPoolEnabled=true', () => {
    const dao = initDaoGovernance({ enabled: true, darkPoolEnabled: true });
    expect(dao.darkPool.isDryRun()).toBe(false);
  });

  it('respects votingPeriodSec override', () => {
    const dao = initDaoGovernance({ votingPeriodSec: 7200 });
    expect(dao.config.votingPeriodSec).toBe(7200);
  });

  it('executor has proposer attached (live execution works)', () => {
    const dao = initDaoGovernance({ enabled: true });
    // No proposer error means it was attached
    const rec = dao.executor.executeProposal('nonexistent');
    expect(rec.error).toContain('not found');
  });

  it('two init calls produce independent instances', () => {
    const d1 = initDaoGovernance();
    const d2 = initDaoGovernance();
    expect(d1.tokenIssuer).not.toBe(d2.tokenIssuer);
    expect(d1.proposer).not.toBe(d2.proposer);
  });
});
