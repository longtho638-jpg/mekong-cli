/**
 * 📡 SIGNAL BUS — 奇正相生 (CHÍNH + KỲ Signal System)
 * 
 * Ch.5 兵勢: "以正合，以奇勝" — Dùng CHÍNH giao chiến, dùng KỲ để thắng
 * 
 * CHÍNH (Orthodox): Task files in tasks/ — persistent, recoverable
 * KỲ (Unorthodox):  EventEmitter signals — fast, real-time IPC
 * 
 * Daemons emit BOTH:
 *   1. Write task file (CHÍNH) → persisted for recovery
 *   2. Emit signal (KỲ)       → instant notification to listeners
 * 
 * Signal Flow from DOANH_TRAI.md:
 *   Hunter ──BUG_REPORT──→ Builder ──CLEANUP_DONE──→ Reviewer
 *   Dispatcher ──MISSION_READY──→ Brain-Tmux
 *   Operator ──HEALTH_ALERT──→ ALL (broadcast)
 *   Scribe ──MEMORY_UPDATED──→ Sage
 *   Merchant ──REVENUE_ALERT──→ Scribe
 *   Diplomat ──DOCS_OUTDATED──→ Builder
 *   Architect ──ARCH_ISSUE──→ Builder
 *   Artist ──UI_ISSUE──→ Builder
 *   Sage ──INTEL──→ Antigravity
 * 
 * Usage:
 *   const { bus, SIGNALS, emit } = require('./signal-bus');
 *   emit(SIGNALS.BUG_REPORT, { project: 'sophia', file: 'api.ts', line: 42 });
 *   bus.on(SIGNALS.BUG_REPORT, (payload) => { ... });
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════
// Signal Types (from DOANH_TRAI.md Signal Flow)
// ═══════════════════════════════════════════════════════════════

const SIGNALS = Object.freeze({
    // ⚔️ Tiền Đội signals
    BUG_REPORT: 'BUG_REPORT',      // Hunter → Builder
    MISSION_READY: 'MISSION_READY',   // Dispatcher → Brain-Tmux
    HEALTH_ALERT: 'HEALTH_ALERT',    // Operator → ALL (broadcast)

    // 🔨 Trung Quân signals
    CLEANUP_DONE: 'CLEANUP_DONE',    // Builder → Reviewer
    REVIEW_REQUEST: 'REVIEW_REQUEST',  // Reviewer → Builder

    // 🎓 Hậu Cần signals
    DOCS_OUTDATED: 'DOCS_OUTDATED',   // Diplomat → Builder
    REVENUE_ALERT: 'REVENUE_ALERT',   // Merchant → Scribe
    UI_ISSUE: 'UI_ISSUE',        // Artist → Builder

    // 📚 Tham Mưu signals
    ARCH_ISSUE: 'ARCH_ISSUE',      // Architect → Builder
    MEMORY_UPDATED: 'MEMORY_UPDATED',  // Scribe → Sage
    INTEL: 'INTEL',           // Sage → Antigravity
});

// ═══════════════════════════════════════════════════════════════
// Signal Bus (Singleton)
// ═══════════════════════════════════════════════════════════════

class SignalBus extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(20); // 11 daemons + margin
        this._history = [];       // Last N signals for debugging
        this._maxHistory = 50;
    }

    /**
     * Emit a signal with structured payload
     * @param {string} signal - Signal type from SIGNALS
     * @param {Object} payload - Signal data
     * @param {string} payload.source - Daemon name that emitted
     * @param {string} [payload.project] - Project name
     * @param {string} [payload.detail] - Human-readable detail
     */
    signal(signalType, payload = {}) {
        const enriched = {
            ...payload,
            signal: signalType,
            timestamp: Date.now(),
            iso: new Date().toISOString(),
        };

        // Record history
        this._history.push(enriched);
        if (this._history.length > this._maxHistory) {
            this._history.shift();
        }

        // KỲ: Emit real-time event
        this.emit(signalType, enriched);

        // Log to stderr for observability
        const src = payload.source || '?';
        const det = payload.detail || '';
        process.stderr.write(`[📡 ${signalType}] ${src}: ${det}\n`);

        return enriched;
    }

    /**
     * Get recent signal history for debugging
     * @param {number} count - Number of recent signals
     * @returns {Array}
     */
    getHistory(count = 10) {
        return this._history.slice(-count);
    }

    /**
     * Save signal log to disk (for post-mortem analysis)
     * @param {string} logDir - Directory to save log
     */
    saveLog(logDir) {
        try {
            const logFile = path.join(logDir, 'signal-bus.log');
            const data = this._history.map(s => JSON.stringify(s)).join('\n') + '\n';
            fs.appendFileSync(logFile, data);
        } catch (e) {
            // Silent fail — logging should never crash the system
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// Singleton + Convenience
// ═══════════════════════════════════════════════════════════════

const bus = new SignalBus();

/**
 * Convenience emit function
 * @param {string} signalType - From SIGNALS enum
 * @param {Object} payload - Signal data
 */
function emit(signalType, payload) {
    return bus.signal(signalType, payload);
}

module.exports = { bus, SIGNALS, emit, SignalBus };
