/**
 * Phase 12 Omega — Energy Arbitrage Module.
 * Allocates trading profits to cover operational costs.
 * Tracks income/expenses, reinvests surplus.
 * Returns TreasuryReport with balance, allocations, projections.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TreasuryAllocation {
  operationalCoverage: number;  // USD: covers compute + energy costs
  reinvestment: number;         // USD: allocated back to trading capital
  reserve: number;              // USD: emergency buffer (target 10% of balance)
  miningCapex: number;          // USD: hardware/staking capital expenditure
}

export interface TreasuryReport {
  balanceUsd: number;
  totalIncomeUsd: number;
  totalExpensesUsd: number;
  netPnlUsd: number;
  allocations: TreasuryAllocation;
  reserveRatio: number;         // reserve / balance
  projectedMonthlyProfitUsd: number;
  projectedAnnualProfitUsd: number;
  periodMs: number;
  generatedAt: number;
}

export interface TreasuryManagerConfig {
  /** Starting treasury balance in USD */
  initialBalanceUsd: number;
  /** Target reserve ratio (0–1). Default 0.10 */
  targetReserveRatio: number;
  /** Fraction of surplus to reinvest (0–1). Default 0.60 */
  reinvestmentRate: number;
  /** Fraction of surplus for mining capex (0–1). Default 0.15 */
  miningCapexRate: number;
}

// ── TreasuryManager ───────────────────────────────────────────────────────────

export class TreasuryManager {
  private readonly config: TreasuryManagerConfig;
  private balanceUsd: number;
  private totalIncomeUsd = 0;
  private totalExpensesUsd = 0;
  private periodStartMs = Date.now();

  constructor(config: Partial<TreasuryManagerConfig> = {}) {
    this.config = {
      initialBalanceUsd: 100_000,
      targetReserveRatio: 0.10,
      reinvestmentRate: 0.60,
      miningCapexRate: 0.15,
      ...config,
    };
    this.balanceUsd = this.config.initialBalanceUsd;
  }

  /** Record income (trading profit, mining earnings, staking rewards). */
  recordIncome(amountUsd: number, source: string): void {
    if (amountUsd <= 0) return;
    this.balanceUsd += amountUsd;
    this.totalIncomeUsd += amountUsd;
    void source; // tagged for future ledger integration
  }

  /** Record expense (compute costs, energy bills, fees). */
  recordExpense(amountUsd: number, category: string): void {
    if (amountUsd <= 0) return;
    this.balanceUsd = Math.max(0, this.balanceUsd - amountUsd);
    this.totalExpensesUsd += amountUsd;
    void category;
  }

  /**
   * Allocate current surplus according to configured ratios.
   * Returns the allocation plan and updates internal balance if apply=true.
   */
  allocateSurplus(apply = false): TreasuryAllocation {
    const netPnl = this.totalIncomeUsd - this.totalExpensesUsd;
    const surplus = Math.max(0, netPnl);

    const targetReserve = this.balanceUsd * this.config.targetReserveRatio;
    const currentReserve = Math.min(this.balanceUsd * this.config.targetReserveRatio, surplus);
    const afterReserve = Math.max(0, surplus - currentReserve);

    const reinvestment = afterReserve * this.config.reinvestmentRate;
    const miningCapex = afterReserve * this.config.miningCapexRate;
    const operationalCoverage = afterReserve - reinvestment - miningCapex;

    const allocation: TreasuryAllocation = {
      operationalCoverage: round(Math.max(0, operationalCoverage)),
      reinvestment: round(reinvestment),
      reserve: round(currentReserve),
      miningCapex: round(miningCapex),
    };

    if (apply && surplus > 0) {
      // Deduct allocated amounts from balance (they move to sub-accounts)
      const allocated = allocation.operationalCoverage + allocation.reinvestment + allocation.miningCapex;
      this.balanceUsd = Math.max(0, this.balanceUsd - allocated);
    }

    void targetReserve; // used conceptually for reserve sizing
    return allocation;
  }

  /** Generate full treasury report for current period. */
  generateReport(): TreasuryReport {
    const now = Date.now();
    const periodMs = now - this.periodStartMs;
    const netPnlUsd = this.totalIncomeUsd - this.totalExpensesUsd;
    const allocations = this.allocateSurplus(false);
    const reserveRatio = this.balanceUsd > 0
      ? allocations.reserve / this.balanceUsd
      : 0;

    // Project forward: annualise current period's net PnL
    const periodHours = periodMs / 3_600_000 || 1;
    const hourlyRate = netPnlUsd / periodHours;
    const projectedMonthlyProfitUsd = hourlyRate * 24 * 30;
    const projectedAnnualProfitUsd = hourlyRate * 24 * 365;

    return {
      balanceUsd: round(this.balanceUsd),
      totalIncomeUsd: round(this.totalIncomeUsd),
      totalExpensesUsd: round(this.totalExpensesUsd),
      netPnlUsd: round(netPnlUsd),
      allocations,
      reserveRatio: round(reserveRatio),
      projectedMonthlyProfitUsd: round(projectedMonthlyProfitUsd),
      projectedAnnualProfitUsd: round(projectedAnnualProfitUsd),
      periodMs,
      generatedAt: now,
    };
  }

  /** Reset period counters (call at start of each accounting period). */
  resetPeriod(): void {
    this.totalIncomeUsd = 0;
    this.totalExpensesUsd = 0;
    this.periodStartMs = Date.now();
  }

  getBalance(): number { return this.balanceUsd; }
  getConfig(): TreasuryManagerConfig { return { ...this.config }; }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export default TreasuryManager;
