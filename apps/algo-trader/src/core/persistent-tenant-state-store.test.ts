/**
 * Tests for persistent-tenant-state-store: save/load roundtrip, atomic writes, autoSaver.
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { load, save, createAutoSaver, type AutoSaver } from './persistent-tenant-state-store';

function tmpFile(suffix = '.json'): string {
  return path.join(os.tmpdir(), `algo-trader-test-${Date.now()}-${Math.random().toString(36).slice(2)}${suffix}`);
}

describe('persistent-tenant-state-store', () => {
  const files: string[] = [];
  const autoSavers: AutoSaver[] = [];

  function tracked(suffix?: string): string {
    const f = tmpFile(suffix);
    files.push(f);
    files.push(`${f}.tmp`);
    return f;
  }

  afterEach(() => {
    // Stop all auto-savers first to clear timers
    autoSavers.forEach(s => s.stop());
    autoSavers.length = 0;

    // Clear all timers
    jest.clearAllTimers();

    // Cleanup files
    for (const f of files) {
      try { fs.unlinkSync(f); } catch { /* ignore */ }
    }
    files.length = 0;
  });

  describe('load', () => {
    it('returns empty Map when file does not exist', () => {
      const result = load('/nonexistent/path/state.json');
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it('returns empty Map for malformed JSON', () => {
      const f = tracked();
      fs.writeFileSync(f, 'not-json', 'utf-8');
      expect(load(f).size).toBe(0);
    });

    it('returns empty Map for non-object JSON (array)', () => {
      const f = tracked();
      fs.writeFileSync(f, JSON.stringify([1, 2, 3]), 'utf-8');
      expect(load(f).size).toBe(0);
    });
  });

  describe('save + load roundtrip', () => {
    it('persists and restores tenant state', () => {
      const f = tracked();
      const data = new Map<string, unknown>([
        ['tenant-a', { balance: 1000, openPosition: true }],
        ['tenant-b', { balance: 500, openPosition: false }],
      ]);
      save(f, data);
      const restored = load(f);
      expect(restored.size).toBe(2);
      expect(restored.get('tenant-a')).toEqual({ balance: 1000, openPosition: true });
      expect(restored.get('tenant-b')).toEqual({ balance: 500, openPosition: false });
    });

    it('overwrites existing file on subsequent save', () => {
      const f = tracked();
      save(f, new Map([['t1', { v: 1 }]]));
      save(f, new Map([['t2', { v: 2 }]]));
      const result = load(f);
      expect(result.has('t1')).toBe(false);
      expect(result.get('t2')).toEqual({ v: 2 });
    });
  });

  describe('atomic write', () => {
    it('leaves no .tmp file after successful save', () => {
      const f = tracked();
      save(f, new Map([['t1', { ok: true }]]));
      expect(fs.existsSync(`${f}.tmp`)).toBe(false);
      expect(fs.existsSync(f)).toBe(true);
    });
  });

  describe('createAutoSaver', () => {
    it('saves state periodically and stops cleanly', async () => {
      const f = tracked();
      const state = new Map<string, unknown>([['tenant-x', { tick: 0 }]]);
      const saver = createAutoSaver(f, () => state, 50);
      autoSavers.push(saver); // Track for cleanup

      await new Promise((r) => setTimeout(r, 130));
      saver.stop();

      // File should exist after interval fired
      expect(fs.existsSync(f)).toBe(true);
      const loaded = load(f);
      expect(loaded.get('tenant-x')).toEqual({ tick: 0 });
    });

    it('stop() prevents further saves', async () => {
      const f = tracked();
      let callCount = 0;
      const saver = createAutoSaver(
        f,
        () => { callCount++; return new Map(); },
        30,
      );
      autoSavers.push(saver); // Track for cleanup

      await new Promise((r) => setTimeout(r, 50));
      saver.stop();
      const countAtStop = callCount;
      await new Promise((r) => setTimeout(r, 80));
      expect(callCount).toBe(countAtStop);
    });
  });
});
