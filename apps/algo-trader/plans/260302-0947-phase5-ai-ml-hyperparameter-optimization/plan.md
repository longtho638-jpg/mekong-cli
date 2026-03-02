---
title: "Phase 5 AI/ML — Hyperparameter Tuning & Strategy Optimization"
description: "Grid search optimizer, strategy ranker, BullMQ optimization job worker, API endpoint, và tests — không dùng external ML lib"
status: pending
priority: P2
effort: 4h
branch: master
tags: [backtest, optimization, bullmq, hyperparameter, typescript]
created: 2026-03-02
---

# Phase 5 AI/ML — Hyperparameter Tuning & Strategy Optimization

## Tổng quan

`BacktestOptimizer` đã tồn tại (`src/backtest/BacktestOptimizer.ts`, 135 lines, grid search + Sharpe rank). Phase 5 chỉ bổ sung lớp BullMQ integration, strategy ranker multi-metric, API endpoint, và tests. **Không tạo lại những gì đã có.**

---

## Files cần tạo/sửa (5 files mới, 1 file sửa)

| # | File | Action | Mục đích |
|---|------|--------|---------|
| 1 | `src/jobs/workers/bullmq-optimization-worker-runs-grid-search-and-ranks-results.ts` | TẠO MỚI | BullMQ Worker chạy BacktestOptimizer trong background |
| 2 | `src/jobs/bullmq-job-payload-types-and-zod-schemas.ts` | SỬA | Thêm `OptimizationJobDataSchema` + `OptimizationJobResult` |
| 3 | `src/backtest/strategy-performance-ranker-multi-metric-sharpe-sortino-drawdown.ts` | TẠO MỚI | Ranker tổng hợp Sharpe, Sortino, MaxDrawdown → composite score |
| 4 | `src/api/routes/hyperparameter-optimization-job-routes.ts` | TẠO MỚI | POST /optimize, GET /optimize/:jobId |
| 5 | `tests/jobs/bullmq-optimization-worker.test.ts` | TẠO MỚI | Unit tests cho optimization worker |
| 6 | `tests/backtest/strategy-performance-ranker.test.ts` | TẠO MỚI | Unit tests cho ranker |

---

## Bước thực hiện

### Bước 1 — Mở rộng BullMQ schemas (sửa file hiện có)

File: `src/jobs/bullmq-job-payload-types-and-zod-schemas.ts`

Thêm vào cuối file:
```typescript
// ─── Optimization Job ──────────────────────────────────────────────────────
export const OptimizationJobDataSchema = z.object({
  tenantId: z.string().min(1),
  strategyName: z.string().min(1),  // phải map đến STRATEGY_REGISTRY
  pair: z.string().min(1),
  timeframe: z.string().default('1m'),
  days: z.number().int().positive().max(90).default(30),
  initialBalance: z.number().positive().default(10000),
  paramRanges: z.array(z.object({
    name: z.string(),
    values: z.array(z.number()),
  })).min(1).max(10),
  metric: z.enum(['sharpe', 'sortino', 'composite']).default('composite'),
});
export type OptimizationJobData = z.infer<typeof OptimizationJobDataSchema>;

export interface OptimizationJobResult {
  tenantId: string;
  strategyName: string;
  totalCombinations: number;
  bestParams: Record<string, number>;
  bestScore: number;
  topResults: Array<{ params: Record<string, number>; score: number; sharpe: number; maxDrawdown: number }>;
  completedAt: number;
}
```

Cũng thêm `'optimization'` vào `bullmq-named-queue-registry-backtest-scan-webhook.ts` (queue name: `algo-trader:optimization`).

---

### Bước 2 — Strategy Performance Ranker

File: `src/backtest/strategy-performance-ranker-multi-metric-sharpe-sortino-drawdown.ts`
**< 120 lines**

```typescript
// Input: OptimizationResult[] từ BacktestOptimizer
// Output: sorted array với composite score

export interface RankerWeights {
  sharpe: number;      // default 0.4
  sortino: number;     // default 0.3
  maxDrawdown: number; // default 0.2 (inverted, lower is better)
  winRate: number;     // default 0.1
}

export class StrategyPerformanceRanker {
  rank(results: OptimizationResult[], weights?: Partial<RankerWeights>): RankedResult[]
  private computeSortino(result: BacktestResult): number  // Sortino = return/downside_std
  private normalize(values: number[]): number[]           // min-max normalization
}
```

Logic:
- Sortino tính từ `BacktestResult.trades` (chỉ negative returns làm downside_std)
- Composite = w1*sharpe_norm + w2*sortino_norm - w3*drawdown_norm + w4*winrate_norm
- Chuẩn hóa min-max từng metric trước khi weight

---

### Bước 3 — BullMQ Optimization Worker

File: `src/jobs/workers/bullmq-optimization-worker-runs-grid-search-and-ranks-results.ts`
**< 180 lines**

```typescript
import { Worker, Job } from 'bullmq';
import { BacktestOptimizer } from '../../backtest/BacktestOptimizer';
import { StrategyPerformanceRanker } from '../../backtest/strategy-performance-ranker-multi-metric-sharpe-sortino-drawdown';
import { STRATEGY_REGISTRY } from '../../strategies'; // factory map đã có
import { OptimizationJobData, OptimizationJobResult } from '../bullmq-job-payload-types-and-zod-schemas';

// Worker logic:
// 1. Validate payload với OptimizationJobDataSchema.parse()
// 2. Lookup strategyFactory từ STRATEGY_REGISTRY[strategyName]
// 3. Khởi tạo BacktestOptimizer với SimulatedDataProvider (đã có)
// 4. Gọi optimizer.optimize(factory, paramRanges)
// 5. Nếu metric === 'composite': dùng StrategyPerformanceRanker.rank()
// 6. Trả về top 5 results dưới dạng OptimizationJobResult
// 7. Publish kết quả vào Redis Pub/Sub channel: `optimization:${tenantId}:done`
```

Concurrency: 1 job/time (CPU-bound, tránh OOM).

---

### Bước 4 — API Routes

File: `src/api/routes/hyperparameter-optimization-job-routes.ts`
**< 100 lines**

Endpoints:
```
POST /api/v1/optimization
  Body: OptimizationJobData
  → validate, enqueue vào BullMQ queue 'algo-trader:optimization'
  → trả về { jobId, status: 'queued' }

GET /api/v1/optimization/:jobId
  → query BullMQ job state (waiting/active/completed/failed)
  → nếu completed: trả về OptimizationJobResult từ job.returnvalue
  → nếu failed: trả về { error }
```

Auth: dùng middleware tenant đã có (`tenantAuthMiddleware`).

---

### Bước 5 — Tests

**`tests/jobs/bullmq-optimization-worker.test.ts`** (~80 lines):
- Mock `BacktestOptimizer.optimize()` → return fixture results
- Test: valid payload → enqueue → job runs → correct OptimizationJobResult shape
- Test: invalid strategy name → throw JobError
- Test: paramRanges rỗng → Zod error

**`tests/backtest/strategy-performance-ranker.test.ts`** (~60 lines):
- Test: rank() với 3 results → trả về đúng thứ tự
- Test: Sortino computation với negative trades
- Test: composite score range [0, 1]
- Test: ties handled (stable sort)

---

## Tích hợp Queue Registry

Sửa `src/jobs/bullmq-named-queue-registry-backtest-scan-webhook.ts`:
- Thêm `optimizationQueue = new Queue('algo-trader:optimization', { connection })`
- Export `getOptimizationQueue()`

---

## Không cần implement (YAGNI)

- Bayesian optimization / genetic algorithm
- Real-time WebSocket streaming kết quả
- Result persistence vào DB (chỉ lưu trong BullMQ job result)
- Strategy marketplace auto-publishing

---

## Thứ tự implement

1. Sửa `bullmq-job-payload-types-and-zod-schemas.ts` (schema mới)
2. Sửa `bullmq-named-queue-registry-backtest-scan-webhook.ts` (queue mới)
3. Tạo `strategy-performance-ranker-multi-metric-sharpe-sortino-drawdown.ts`
4. Tạo `bullmq-optimization-worker-runs-grid-search-and-ranks-results.ts`
5. Tạo `hyperparameter-optimization-job-routes.ts` + đăng ký trong `src/index.ts`
6. Viết tests

---

## Unresolved Questions

1. `STRATEGY_REGISTRY` export path — cần xác nhận import từ `src/strategies/index.ts` hay `src/strategies/`
2. `SimulatedDataProvider` đã có sẵn chưa? Nếu chưa, optimization worker cần mock data provider riêng
3. Concurrency limit: 1 job có đủ throughput cho tenant multi-user không? (cân nhắc 2-3 nếu RAM cho phép)
4. BullMQ job TTL cho optimization results (mặc định BullMQ xóa sau 24h — có cần persist DB không?)
