#!/usr/bin/env node
'use strict';

/**
 * PreCompact Hook: Write session-specific marker file when conversation is compacted
 * Also records calibration data for accurate compact threshold estimation
 *
 * Features:
 * - Session-specific markers for concurrent conversation support
 * - Calibration recording for self-improving threshold accuracy
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Paths
const MARKER_DIR = path.join(os.tmpdir(), 'claude-compact-markers');
const CALIBRATION_PATH = path.join(os.tmpdir(), 'claude-compact-calibration.json');

/**
 * Read existing calibration data
 * @returns {Object} Calibration data keyed by context window size
 */
function readCalibration() {
    try {
        if (fs.existsSync(CALIBRATION_PATH)) {
            return JSON.parse(fs.readFileSync(CALIBRATION_PATH, 'utf8'));
        }
    } catch (err) {
        // Silent fail - start fresh
    }
    return {};
}

/**
 * Write calibration data
 * @param {Object} data - Calibration data to save
 */
function writeCalibration(data) {
    try {
        fs.writeFileSync(CALIBRATION_PATH, JSON.stringify(data, null, 2));
    } catch (err) {
        // Silent fail - calibration is optional
    }
}

/**
 * Update calibration with new compact observation
 * Uses exponential moving average to smooth out variations
 *
 * @param {number} contextWindowSize - Model's context window size
 * @param {number} tokensAtCompact - Total tokens when compact triggered
 */
function updateCalibration(contextWindowSize, tokensAtCompact) {
    if (!contextWindowSize || !tokensAtCompact || tokensAtCompact <= 0) {
        return;
    }

    const calibration = readCalibration();
    const key = String(contextWindowSize);

    if (calibration[key]) {
        // Exponential moving average (EMA) with alpha=0.3 for smooth updates
        const alpha = 0.3;
        const oldThreshold = calibration[key].threshold;
        const newThreshold = Math.floor(alpha * tokensAtCompact + (1 - alpha) * oldThreshold);

        calibration[key] = {
            threshold: newThreshold,
            samples: calibration[key].samples + 1,
            lastUpdated: Date.now(),
            lastObserved: tokensAtCompact
        };
    } else {
        // First observation for this window size
        calibration[key] = {
            threshold: tokensAtCompact,
            samples: 1,
            lastUpdated: Date.now(),
            lastObserved: tokensAtCompact
        };
    }

    writeCalibration(calibration);
}

// Debug log directory
const DEBUG_DIR = path.join(os.tmpdir(), 'claude-compact-debug');

/**
 * Append debug info to session-specific log file
 */
function debugLog(sessionId, message) {
    try {
        if (!fs.existsSync(DEBUG_DIR)) {
            fs.mkdirSync(DEBUG_DIR, { recursive: true });
        }
        const logPath = path.join(DEBUG_DIR, `${sessionId}.log`);
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
    } catch (err) {
        // Silent fail
    }
}

// Read JSON from stdin (PreCompact payload)
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
    try {
        const data = JSON.parse(input);

        // Use 'default' as fallback (must match statusline.cjs)
        const sessionId = data.session_id || 'default';

        // Log received payload for debugging
        debugLog(sessionId, `PreCompact payload: ${JSON.stringify(data)}`);

        // Ensure marker directory exists
        if (!fs.existsSync(MARKER_DIR)) {
            fs.mkdirSync(MARKER_DIR, { recursive: true });
        }

        // Write session-specific marker for statusline detection
        // baselineRecorded: false means statusline should record cumulative baseline on first read
        const markerPath = path.join(MARKER_DIR, `${sessionId}.json`);
        const marker = {
            timestamp: Date.now(),
            trigger: data.trigger || 'unknown',
            session_id: sessionId,
            baselineRecorded: false,  // Statusline will record cumulative total as baseline
            baseline: 0               // Will be set by statusline on first read
        };
        fs.writeFileSync(markerPath, JSON.stringify(marker));

        // Also write a global "last compact" marker as fallback
        // This helps when session_id isn't consistently available
        const globalMarkerPath = path.join(MARKER_DIR, '_last_compact.json');
        fs.writeFileSync(globalMarkerPath, JSON.stringify({
            ...marker,
            originalSessionId: data.session_id || null
        }));

        debugLog(sessionId, `Baseline marker created - will be set by statusline on first read`);

        debugLog(sessionId, `Wrote markers: ${markerPath}, ${globalMarkerPath}`);

        // Record calibration data for threshold learning
        const contextInput = data.context_window?.total_input_tokens || 0;
        const contextOutput = data.context_window?.total_output_tokens || 0;
        const contextSize = data.context_window?.context_window_size || 0;

        if (contextSize > 0) {
            const tokensAtCompact = contextInput + contextOutput;
            updateCalibration(contextSize, tokensAtCompact);
            debugLog(sessionId, `Calibration updated: ${contextSize} -> ${tokensAtCompact}`);
        } else {
            debugLog(sessionId, `No context_window data in payload`);
        }

    } catch (err) {
        debugLog('error', `Error: ${err.message}`);
        // Silent fail - don't break the compact
    }
});
