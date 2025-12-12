#!/usr/bin/env node
'use strict';

/**
 * PreCompact Hook: Write session-specific marker file when conversation is compacted
 * Supports multiple concurrent conversations by using session ID in filename
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Read JSON from stdin (PreCompact payload)
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
    try {
        const data = JSON.parse(input);
        const sessionId = data.session_id || 'unknown';

        // Use session-specific marker file: /tmp/claude-compact-markers/{sessionId}.json
        const markerDir = path.join(os.tmpdir(), 'claude-compact-markers');
        if (!fs.existsSync(markerDir)) {
            fs.mkdirSync(markerDir, { recursive: true });
        }

        const markerPath = path.join(markerDir, `${sessionId}.json`);
        const marker = {
            timestamp: Date.now(),
            trigger: data.trigger || 'unknown'
        };

        fs.writeFileSync(markerPath, JSON.stringify(marker));
    } catch (err) {
        // Silent fail - don't break the compact
    }
});
