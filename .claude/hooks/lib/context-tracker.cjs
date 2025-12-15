#!/usr/bin/env node
'use strict';

/**
 * Context Window Tracker - Self-healing 3-layer context reset detection
 *
 * Tracks context window usage with automatic baseline reset via:
 * - Layer 1: Session ID change detection (primary)
 * - Layer 2: Token drop detection (50% threshold backup)
 * - Layer 3: Hook marker system (explicit reset signal)
 *
 * @module context-tracker
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Paths - consistent with write-compact-marker.cjs
const MARKER_DIR = path.join(os.tmpdir(), 'claude-compact-markers');
const CALIBRATION_PATH = path.join(os.tmpdir(), 'claude-compact-calibration.json');
const STATE_FILE = path.join(os.tmpdir(), 'claude-context-state.json');

// Token drop threshold for Layer 2 detection (50%)
const TOKEN_DROP_THRESHOLD = 0.5;

/**
 * Get smart default compact threshold based on context window size
 * Research-based defaults:
 * - 200k window: ~77.5% (155k) - confirmed from GitHub issues
 * - 1M window: ~33% (330k) - derived from user observations
 *
 * @param {number} contextWindowSize - Model's context window size
 * @returns {number} Estimated compact threshold in tokens
 */
function getDefaultCompactThreshold(contextWindowSize) {
  const KNOWN_THRESHOLDS = {
    200000: 155000,   // 77.5% - confirmed via /context showing 45k buffer
    1000000: 330000,  // 33% - 1M beta window
  };

  if (KNOWN_THRESHOLDS[contextWindowSize]) {
    return KNOWN_THRESHOLDS[contextWindowSize];
  }

  // Tiered defaults based on window size
  if (contextWindowSize >= 1000000) {
    return Math.floor(contextWindowSize * 0.33);
  }
  return Math.floor(contextWindowSize * 0.775);
}

/**
 * Read calibration data from file (recorded by PreCompact hook)
 * @returns {Object} Calibration data keyed by context window size
 */
function readCalibration() {
  try {
    if (fs.existsSync(CALIBRATION_PATH)) {
      return JSON.parse(fs.readFileSync(CALIBRATION_PATH, 'utf8'));
    }
  } catch (err) {
    // Silent fail - use defaults
  }
  return {};
}

/**
 * Get compact threshold, preferring calibrated value over default
 * @param {number} contextWindowSize - Model's context window size
 * @returns {number} Compact threshold in tokens
 */
function getCompactThreshold(contextWindowSize) {
  const calibration = readCalibration();
  const key = String(contextWindowSize);

  if (calibration[key] && calibration[key].threshold > 0) {
    return calibration[key].threshold;
  }
  return getDefaultCompactThreshold(contextWindowSize);
}

/**
 * Read persistent state (session_id, last token count)
 * @returns {Object} { lastSessionId, lastTokenTotal, lastTimestamp }
 */
function readState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (err) {
    // Silent fail - return empty state
  }
  return { lastSessionId: null, lastTokenTotal: 0, lastTimestamp: 0 };
}

/**
 * Write persistent state
 * @param {Object} state - State to persist
 */
function writeState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state));
  } catch (err) {
    // Silent fail - non-critical
  }
}

/**
 * Read marker file for a session
 * @param {string} sessionId - Session ID
 * @returns {Object|null} Marker data or null
 */
function readMarker(sessionId) {
  try {
    const markerPath = path.join(MARKER_DIR, `${sessionId}.json`);
    if (fs.existsSync(markerPath)) {
      return JSON.parse(fs.readFileSync(markerPath, 'utf8'));
    }
  } catch (err) {
    // Silent fail
  }
  return null;
}

/**
 * Write marker file for a session
 * @param {string} sessionId - Session ID
 * @param {Object} marker - Marker data
 */
function writeMarker(sessionId, marker) {
  try {
    if (!fs.existsSync(MARKER_DIR)) {
      fs.mkdirSync(MARKER_DIR, { recursive: true });
    }
    const markerPath = path.join(MARKER_DIR, `${sessionId}.json`);
    fs.writeFileSync(markerPath, JSON.stringify(marker));
  } catch (err) {
    // Silent fail
  }
}

/**
 * Delete marker file for a session
 * @param {string} sessionId - Session ID
 */
function deleteMarker(sessionId) {
  try {
    const markerPath = path.join(MARKER_DIR, `${sessionId}.json`);
    if (fs.existsSync(markerPath)) {
      fs.unlinkSync(markerPath);
    }
  } catch (err) {
    // Silent fail
  }
}

/**
 * Layer 1: Detect session ID change
 * @param {string} currentSessionId - Current session ID
 * @param {Object} state - Persisted state
 * @returns {boolean} True if session changed
 */
function detectSessionIdChange(currentSessionId, state) {
  if (!currentSessionId || !state.lastSessionId) {
    return false;
  }
  return currentSessionId !== state.lastSessionId;
}

/**
 * Layer 2: Detect significant token drop (50%+ reduction)
 * This catches scenarios where hooks failed or session changed silently
 * @param {number} currentTotal - Current cumulative token total
 * @param {Object} state - Persisted state
 * @returns {boolean} True if token drop detected
 */
function detectTokenDrop(currentTotal, state) {
  if (state.lastTokenTotal <= 0 || currentTotal <= 0) {
    return false;
  }

  // Token total dropped by more than 50%
  const dropRatio = currentTotal / state.lastTokenTotal;
  return dropRatio < TOKEN_DROP_THRESHOLD;
}

/**
 * Layer 3: Check for explicit reset marker from hooks
 * @param {string} sessionId - Session ID
 * @returns {{ shouldReset: boolean, trigger: string|null }}
 */
function checkResetMarker(sessionId) {
  const marker = readMarker(sessionId);

  if (!marker) {
    return { shouldReset: false, trigger: null };
  }

  // Check if marker indicates a reset (clear/compact)
  if (marker.trigger === 'clear' || marker.trigger === 'session_start_clear') {
    return { shouldReset: true, trigger: marker.trigger };
  }

  return { shouldReset: false, trigger: marker.trigger };
}

/**
 * Main context tracking function with 3-layer self-healing detection
 *
 * @param {Object} params - Tracking parameters
 * @param {string} params.sessionId - Current session ID
 * @param {number} params.contextInput - Input tokens
 * @param {number} params.contextOutput - Output tokens
 * @param {number} params.contextWindowSize - Model's context window size
 * @returns {Object} { percentage, baseline, showCompactIndicator, resetLayer }
 */
function trackContext({ sessionId, contextInput, contextOutput, contextWindowSize }) {
  const currentTotal = contextInput + contextOutput;
  const compactThreshold = getCompactThreshold(contextWindowSize);
  const effectiveSessionId = sessionId || 'default';

  // Read persisted state
  const state = readState();

  // Track which layer triggered reset (for debugging)
  let resetLayer = null;
  let baseline = 0;
  let showCompactIndicator = false;

  // --- Layer 1: Session ID change detection ---
  if (detectSessionIdChange(effectiveSessionId, state)) {
    resetLayer = 'session_id_change';
    baseline = currentTotal;
    // Clean up old session marker if any
    if (state.lastSessionId) {
      deleteMarker(state.lastSessionId);
    }
  }

  // --- Layer 2: Token drop detection (backup) ---
  if (!resetLayer && detectTokenDrop(currentTotal, state)) {
    resetLayer = 'token_drop';
    baseline = currentTotal;
  }

  // --- Layer 3: Hook marker system ---
  if (!resetLayer) {
    const { shouldReset, trigger } = checkResetMarker(effectiveSessionId);
    if (shouldReset) {
      resetLayer = `marker_${trigger}`;
      baseline = currentTotal;
      // Delete marker after processing
      deleteMarker(effectiveSessionId);
    }
  }

  // --- No reset triggered - use existing marker/baseline ---
  if (!resetLayer) {
    const marker = readMarker(effectiveSessionId);

    if (!marker) {
      // No marker exists - create fresh one
      writeMarker(effectiveSessionId, {
        baselineRecorded: true,
        baseline: currentTotal,
        sessionId: effectiveSessionId,
        trigger: 'new_session',
        timestamp: Date.now()
      });
      baseline = currentTotal;
    } else if (!marker.baselineRecorded) {
      // Marker exists but baseline not recorded yet (from PreCompact)
      marker.baselineRecorded = true;
      marker.baseline = currentTotal;
      writeMarker(effectiveSessionId, marker);
      baseline = currentTotal;
      // PreCompact triggers: "manual" (from /compact) or "auto" (from auto-compact)
      showCompactIndicator = ['compact', 'manual', 'auto'].includes(marker.trigger);
    } else {
      // Use stored baseline
      baseline = marker.baseline || 0;
    }
  } else {
    // Reset triggered - create fresh marker with new baseline
    writeMarker(effectiveSessionId, {
      baselineRecorded: true,
      baseline: currentTotal,
      sessionId: effectiveSessionId,
      trigger: resetLayer,
      timestamp: Date.now()
    });
  }

  // Calculate effective tokens (since baseline)
  let effectiveTotal = baseline > 0 ? currentTotal - baseline : currentTotal;
  if (effectiveTotal < 0) effectiveTotal = 0;

  // Calculate percentage against compact threshold (not model limit)
  const percentage = Math.min(100, Math.floor(effectiveTotal * 100 / compactThreshold));

  // Update persistent state for next call
  writeState({
    lastSessionId: effectiveSessionId,
    lastTokenTotal: currentTotal,
    lastTimestamp: Date.now()
  });

  return {
    percentage,
    baseline,
    effectiveTotal,
    compactThreshold,
    showCompactIndicator,
    resetLayer
  };
}

/**
 * Write reset marker for session (called by SessionStart hook on /clear)
 * @param {string} sessionId - Session ID
 * @param {string} trigger - Reset trigger ('clear', 'compact', etc.)
 */
function writeResetMarker(sessionId, trigger = 'clear') {
  const effectiveSessionId = sessionId || 'default';
  writeMarker(effectiveSessionId, {
    baselineRecorded: false,
    baseline: 0,
    sessionId: effectiveSessionId,
    trigger: `session_start_${trigger}`,
    timestamp: Date.now()
  });
}

/**
 * Clear all markers and state (for testing/cleanup)
 */
function clearAllState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      fs.unlinkSync(STATE_FILE);
    }
    if (fs.existsSync(MARKER_DIR)) {
      const files = fs.readdirSync(MARKER_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(MARKER_DIR, file));
      }
    }
  } catch (err) {
    // Silent fail
  }
}

module.exports = {
  trackContext,
  writeResetMarker,
  clearAllState,
  getCompactThreshold,
  // Export for testing
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
};
