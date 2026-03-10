/**
 * @file Vibe Factory Cooldown Tests
 * Tests for dynamic cooldown mechanism in vibe-factory-monitor.js
 */

import { describe, it, beforeEach, expect } from 'vitest';

const SIMPLE_COOLDOWN_MS = 60000;
const COMPLEX_COOLDOWN_MS = 180000;

class CooldownManager {
    constructor() {
        this.lastInjection = {};
        this.now = Date.now();
    }
    setNow(ts) { this.now = ts; }
    getCooldownForTask(taskCmd) {
        return /\/(bootstrap|plan:hard|plan:parallel|review:codebase)/.test(taskCmd) 
            ? COMPLEX_COOLDOWN_MS : SIMPLE_COOLDOWN_MS;
    }
    isInCooldown(paneIdx) {
        const last = this.lastInjection[paneIdx];
        if (!last) return { inCooldown: false, remaining: 0, type: null };
        const elapsed = this.now - last.ts;
        const cooldownMs = last.type === 'complex' ? COMPLEX_COOLDOWN_MS : SIMPLE_COOLDOWN_MS;
        return elapsed < cooldownMs 
            ? { inCooldown: true, remaining: cooldownMs - elapsed, type: last.type }
            : { inCooldown: false, remaining: 0, type: null };
    }
    recordInjection(paneIdx, taskCmd) {
        const type = /\/(bootstrap|plan:hard|plan:parallel|review:codebase)/.test(taskCmd) ? 'complex' : 'simple';
        this.lastInjection[paneIdx] = { ts: this.now, type };
        return type;
    }
}

describe('Dynamic Cooldown', () => {
    let cm;
    beforeEach(() => { cm = new CooldownManager(); cm.setNow(1000000); });

    describe('Task Classification', () => {
        it('simple: /cook, /fix, /test, /debug', () => {
            expect(cm.getCooldownForTask('/cook "x"')).toBe(SIMPLE_COOLDOWN_MS);
            expect(cm.getCooldownForTask('/fix "x"')).toBe(SIMPLE_COOLDOWN_MS);
            expect(cm.getCooldownForTask('/test')).toBe(SIMPLE_COOLDOWN_MS);
            expect(cm.getCooldownForTask('/debug "x"')).toBe(SIMPLE_COOLDOWN_MS);
        });
        it('complex: /bootstrap, /plan:hard, /plan:parallel', () => {
            expect(cm.getCooldownForTask('/bootstrap:auto "x"')).toBe(COMPLEX_COOLDOWN_MS);
            expect(cm.getCooldownForTask('/plan:hard "x"')).toBe(COMPLEX_COOLDOWN_MS);
            expect(cm.getCooldownForTask('/plan:parallel "x"')).toBe(COMPLEX_COOLDOWN_MS);
        });
    });

    describe('Cooldown Timing', () => {
        it('blocks during cooldown', () => {
            cm.recordInjection(0, '/cook "t1"');
            expect(cm.isInCooldown(0).inCooldown).toBe(true);
        });
        it('allows after simple cooldown (61s)', () => {
            cm.recordInjection(0, '/cook "t1"');
            cm.setNow(1000000 + 61000);
            expect(cm.isInCooldown(0).inCooldown).toBe(false);
        });
        it('allows after complex cooldown (181s)', () => {
            cm.recordInjection(0, '/bootstrap "t1"');
            cm.setNow(1000000 + 181000);
            expect(cm.isInCooldown(0).inCooldown).toBe(false);
        });
        it('complex overrides simple', () => {
            cm.recordInjection(0, '/cook "s"');
            cm.setNow(1000000 + 1000);
            cm.recordInjection(0, '/bootstrap "c"');
            expect(cm.isInCooldown(0).type).toBe('complex');
        });
    });

    describe('Race Conditions', () => {
        it('handles rapid injections', () => {
            for (let i = 0; i < 5; i++) cm.recordInjection(0, `/cook "t${i}"`);
            expect(cm.isInCooldown(0).inCooldown).toBe(true);
        });
        it('independent per pane', () => {
            cm.recordInjection(0, '/cook "p0"');
            expect(cm.isInCooldown(0).inCooldown).toBe(true);
            expect(cm.isInCooldown(1).inCooldown).toBe(false);
        });
    });
});
