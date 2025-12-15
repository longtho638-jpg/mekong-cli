#!/usr/bin/env node
'use strict';

/**
 * Tests for context-tracker.cjs 3-layer self-healing detection
 */

const {
  trackContext,
  writeResetMarker,
  clearAllState,
  detectSessionIdChange,
  detectTokenDrop,
  checkResetMarker,
  readState,
  writeState,
  readMarker,
  writeMarker,
  deleteMarker,
  TOKEN_DROP_THRESHOLD,
  MARKER_DIR,
  STATE_FILE
} = require('../lib/context-tracker.cjs');

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${err.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, msg = '') {
  if (actual !== expected) {
    throw new Error(`${msg} Expected ${expected}, got ${actual}`);
  }
}

function assertTrue(condition, msg = '') {
  if (!condition) {
    throw new Error(msg || 'Assertion failed');
  }
}

// Clean up before tests
clearAllState();

console.log('\n=== Layer 1: Session ID Change Detection ===\n');

test('detects session ID change', () => {
  const state = { lastSessionId: 'old-session', lastTokenTotal: 1000 };
  const changed = detectSessionIdChange('new-session', state);
  assertTrue(changed, 'Should detect session change');
});

test('no change when same session ID', () => {
  const state = { lastSessionId: 'same-session', lastTokenTotal: 1000 };
  const changed = detectSessionIdChange('same-session', state);
  assertTrue(!changed, 'Should not detect change for same session');
});

test('no change when lastSessionId is null', () => {
  const state = { lastSessionId: null, lastTokenTotal: 1000 };
  const changed = detectSessionIdChange('new-session', state);
  assertTrue(!changed, 'Should not detect change when no previous session');
});

console.log('\n=== Layer 2: Token Drop Detection ===\n');

test('detects 50%+ token drop', () => {
  const state = { lastSessionId: 'test', lastTokenTotal: 10000 };
  const dropped = detectTokenDrop(4000, state); // 40% of original = drop
  assertTrue(dropped, 'Should detect token drop below 50%');
});

test('no drop when tokens within threshold', () => {
  const state = { lastSessionId: 'test', lastTokenTotal: 10000 };
  const dropped = detectTokenDrop(6000, state); // 60% of original = no drop
  assertTrue(!dropped, 'Should not detect drop above 50%');
});

test('no drop when previous was 0', () => {
  const state = { lastSessionId: 'test', lastTokenTotal: 0 };
  const dropped = detectTokenDrop(5000, state);
  assertTrue(!dropped, 'Should not detect drop with no baseline');
});

console.log('\n=== Layer 3: Hook Marker System ===\n');

test('writeResetMarker creates marker with correct trigger', () => {
  writeResetMarker('marker-test', 'clear');
  const marker = readMarker('marker-test');
  assertTrue(marker !== null, 'Marker should exist');
  assertEqual(marker.trigger, 'session_start_clear', 'Trigger should be session_start_clear');
  assertEqual(marker.baselineRecorded, false, 'Baseline should not be recorded yet');
  deleteMarker('marker-test');
});

test('checkResetMarker detects clear trigger', () => {
  writeMarker('reset-check', {
    trigger: 'session_start_clear',
    baselineRecorded: false,
    timestamp: Date.now()
  });
  const { shouldReset, trigger } = checkResetMarker('reset-check');
  assertTrue(shouldReset, 'Should detect reset');
  assertEqual(trigger, 'session_start_clear', 'Trigger should match');
  deleteMarker('reset-check');
});

test('checkResetMarker ignores non-clear triggers', () => {
  writeMarker('no-reset', {
    trigger: 'new_session',
    baselineRecorded: true,
    baseline: 1000,
    timestamp: Date.now()
  });
  const { shouldReset } = checkResetMarker('no-reset');
  assertTrue(!shouldReset, 'Should not trigger reset for new_session');
  deleteMarker('no-reset');
});

console.log('\n=== Full Integration: trackContext ===\n');

// Reset state for integration tests
clearAllState();

test('fresh session creates marker and tracks from 0%', () => {
  const result = trackContext({
    sessionId: 'fresh-session',
    contextInput: 5000,
    contextOutput: 5000,
    contextWindowSize: 200000
  });

  // Baseline should be set to current total (10000)
  // Effective total = 10000 - 10000 = 0
  // Percentage should be ~0%
  assertEqual(result.percentage, 0, 'Percentage should be 0% for fresh session');
});

test('second call shows accumulated tokens', () => {
  const result = trackContext({
    sessionId: 'fresh-session',
    contextInput: 10000,
    contextOutput: 10000,
    contextWindowSize: 200000
  });

  // Baseline was 10000, current is 20000
  // Effective = 20000 - 10000 = 10000
  // Threshold ~155000 for 200k window
  // ~6% expected
  assertTrue(result.percentage > 0, 'Percentage should increase');
  assertTrue(result.percentage < 20, 'Percentage should be reasonable');
});

test('session change resets to 0%', () => {
  // First: simulate existing session
  trackContext({
    sessionId: 'old-session',
    contextInput: 75000,
    contextOutput: 75000, // 150k total = ~97%
    contextWindowSize: 200000
  });

  // Now: new session with same token count should reset
  const result = trackContext({
    sessionId: 'new-session-change',
    contextInput: 5000,
    contextOutput: 5000,
    contextWindowSize: 200000
  });

  // Layer 1 should trigger reset
  assertEqual(result.resetLayer, 'session_id_change', 'Should detect session change');
  assertEqual(result.percentage, 0, 'Percentage should reset to 0%');
});

test('token drop detection triggers reset', () => {
  // Setup: track high token count
  trackContext({
    sessionId: 'drop-test',
    contextInput: 50000,
    contextOutput: 50000,
    contextWindowSize: 200000
  });

  // Simulate: dramatic token drop (post-compaction scenario)
  const result = trackContext({
    sessionId: 'drop-test',
    contextInput: 10000,
    contextOutput: 10000, // 20k vs previous 100k = 20% = drop
    contextWindowSize: 200000
  });

  assertEqual(result.resetLayer, 'token_drop', 'Should detect token drop');
  assertEqual(result.percentage, 0, 'Percentage should reset to 0%');
});

test('explicit reset marker triggers reset', () => {
  // Setup existing session with moderate tokens
  trackContext({
    sessionId: 'marker-reset-test',
    contextInput: 10000,
    contextOutput: 10000,
    contextWindowSize: 200000
  });

  // Write reset marker (simulating SessionStart with source=clear)
  writeResetMarker('marker-reset-test', 'clear');

  // Next track call should detect and reset
  // Use similar token count to avoid triggering Layer 2 (token drop)
  const result = trackContext({
    sessionId: 'marker-reset-test',
    contextInput: 15000,
    contextOutput: 15000, // 30k vs 20k = 150% = no drop
    contextWindowSize: 200000
  });

  assertTrue(result.resetLayer && result.resetLayer.includes('marker'), 'Should detect marker reset');
  assertEqual(result.percentage, 0, 'Percentage should reset to 0%');
});

// Cleanup
clearAllState();

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
