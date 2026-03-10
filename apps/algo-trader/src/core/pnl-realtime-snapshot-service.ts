/**
 * PnlSnapshotService — computes real-time P&L from TenantArbPositionTracker and persists snapshots.
 * Uses a pluggable PnlStore interface (in-memory for tests, Prisma for production).
 */

import { TenantArbPositionTracker } from './tenant-arbitrage-position-tracker';

export interface PnlSummary {
  tenantId: string;
  totalPnl: number;
  realizedPnl: number;
  unrealizedPnl: number;
  openPositions: number;
  equity: number;
  computedAt: string;
}

export interface PnlSnapshotData {
  id?: string | number;
  tenantId: string;
  totalPnl: number;
  realizedPnl: number;
  unrealizedPnl: number;
  openPositions: number;
  equity: number;
  snapshotAt: Date;
}

export interface PnlQueryOpts {
  from?: Date;
  to?: Date;
  limit?: number;
}

export interface PnlStore {
  save(snapshot: PnlSnapshotData): Promise<void>;
  query(tenantId: string, opts: PnlQueryOpts): Promise<PnlSnapshotData[]>;
}

export class InMemoryPnlStore implements PnlStore {
  private records: PnlSnapshotData[] = [];
  private seq = 0;

  async save(snapshot: PnlSnapshotData): Promise<void> {
    this.seq += 1;
    this.records.push({ ...snapshot, id: this.seq });
  }

  async query(tenantId: string, opts: PnlQueryOpts): Promise<PnlSnapshotData[]> {
    let results = this.records.filter(r => r.tenantId === tenantId);
    if (opts.from) results = results.filter(r => r.snapshotAt >= opts.from!);
    if (opts.to) results = results.filter(r => r.snapshotAt <= opts.to!);
    results = results.sort((a, b) => b.snapshotAt.getTime() - a.snapshotAt.getTime());
    const limit = opts.limit ?? 100;
    return results.slice(0, limit);
  }

  _clear(): void { this.records = []; }
}

export class PrismaBackedPnlStore implements PnlStore {
  async save(snapshot: PnlSnapshotData): Promise<void> {
    const { getPrisma } = await import('../db/client');
    const prisma = getPrisma();
    await prisma.pnlSnapshot.create({
      data: {
        tenantId: snapshot.tenantId,
        totalPnl: snapshot.totalPnl,
        realizedPnl: snapshot.realizedPnl,
        unrealizedPnl: snapshot.unrealizedPnl,
        openPositions: snapshot.openPositions,
        equity: snapshot.equity,
        snapshotAt: snapshot.snapshotAt,
      },
    });
  }

  async query(tenantId: string, opts: PnlQueryOpts): Promise<PnlSnapshotData[]> {
    const { getPrisma } = await import('../db/client');
    const prisma = getPrisma();
    const rows = await prisma.pnlSnapshot.findMany({
      where: {
        tenantId,
        snapshotAt: {
          ...(opts.from ? { gte: opts.from } : {}),
          ...(opts.to ? { lte: opts.to } : {}),
        },
      },
      orderBy: { snapshotAt: 'desc' },
      take: opts.limit ?? 100,
    });
    return rows.map((r) => ({
      id: r.id.toString(),
      tenantId: r.tenantId,
      totalPnl: Number(r.totalPnl),
      realizedPnl: Number(r.realizedPnl),
      unrealizedPnl: Number(r.unrealizedPnl),
      openPositions: r.openPositions,
      equity: Number(r.equity),
      snapshotAt: r.snapshotAt,
    }));
  }
}

export class PnlSnapshotService {
  private readonly tracker: TenantArbPositionTracker;
  private readonly store: PnlStore;
  private readonly initialCapital: number;

  constructor(
    tracker: TenantArbPositionTracker,
    store: PnlStore = new InMemoryPnlStore(),
    initialCapital = 10_000,
  ) {
    this.tracker = tracker;
    this.store = store;
    this.initialCapital = initialCapital;
  }

  getCurrentPnl(tenantId: string): PnlSummary {
    const stats = this.tracker.getStats(tenantId);
    const openPositions = this.tracker.getPositions(tenantId);
    const unrealizedPnl = openPositions.reduce((sum, p) => sum + p.pnl, 0);
    const realizedPnl = stats.totalPnl;
    const totalPnl = realizedPnl + unrealizedPnl;
    const equity = this.initialCapital + totalPnl;

    return {
      tenantId,
      totalPnl,
      realizedPnl,
      unrealizedPnl,
      openPositions: openPositions.length,
      equity,
      computedAt: new Date().toISOString(),
    };
  }

  async takeSnapshot(tenantId: string): Promise<PnlSnapshotData> {
    const summary = this.getCurrentPnl(tenantId);
    const snapshot: PnlSnapshotData = {
      tenantId,
      totalPnl: summary.totalPnl,
      realizedPnl: summary.realizedPnl,
      unrealizedPnl: summary.unrealizedPnl,
      openPositions: summary.openPositions,
      equity: summary.equity,
      snapshotAt: new Date(),
    };
    await this.store.save(snapshot);
    return snapshot;
  }

  async getSnapshots(tenantId: string, opts: PnlQueryOpts = {}): Promise<PnlSnapshotData[]> {
    return this.store.query(tenantId, opts);
  }
}
