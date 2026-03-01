/**
 * A2UI Trade Audit Logger — Structured audit trail with undo support.
 * Every intent, decision, execution, and result is logged.
 */

import { AgentEventType, TradeAuditEvent } from './types';
import { AgentEventBus } from './agent-event-bus';

export interface AuditEntry {
  id: string;
  action: string;
  detail: string;
  undoable: boolean;
  timestamp: number;
  undone: boolean;
  metadata?: Record<string, unknown>;
}

export class TradeAuditLogger {
  private eventBus: AgentEventBus;
  private entries: AuditEntry[] = [];
  private maxEntries: number;
  private idCounter = 0;

  constructor(eventBus: AgentEventBus, maxEntries = 1000) {
    this.eventBus = eventBus;
    this.maxEntries = maxEntries;
  }

  /** Log an audit entry */
  log(action: string, detail: string, undoable = false, metadata?: Record<string, unknown>): string {
    const id = `audit-${++this.idCounter}-${Date.now()}`;
    const entry: AuditEntry = {
      id,
      action,
      detail,
      undoable,
      timestamp: Date.now(),
      undone: false,
      metadata,
    };

    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    const event: TradeAuditEvent = {
      type: AgentEventType.TRADE_AUDIT,
      tenantId: 'default',
      timestamp: entry.timestamp,
      entryId: id,
      action,
      detail,
      undoable,
    };
    this.eventBus.emit(event);

    return id;
  }

  /** Mark an entry as undone */
  undo(entryId: string): boolean {
    const entry = this.entries.find(e => e.id === entryId);
    if (!entry || !entry.undoable || entry.undone) return false;

    entry.undone = true;
    this.log('UNDO', `Undid action: ${entry.action} (${entryId})`);
    return true;
  }

  /** Get recent entries */
  getRecent(limit = 50): AuditEntry[] {
    return this.entries.slice(-limit);
  }

  /** Get entries by action type */
  getByAction(action: string): AuditEntry[] {
    return this.entries.filter(e => e.action === action);
  }

  /** Get all undoable entries (not yet undone) */
  getUndoable(): AuditEntry[] {
    return this.entries.filter(e => e.undoable && !e.undone);
  }

  /** Export full audit log as JSON */
  exportLog(): string {
    return JSON.stringify(this.entries, null, 2);
  }

  /** Get total entry count */
  get size(): number {
    return this.entries.length;
  }

  /** Clear all entries */
  reset(): void {
    this.entries = [];
    this.idCounter = 0;
  }
}
