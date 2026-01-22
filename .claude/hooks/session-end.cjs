#!/usr/bin/env node
/**
 * Stop Hook - Session end quality gate with beads sync
 *
 * Fires: When Claude completes a response (Stop event)
 * Purpose: Auto-sync beads state if available, warn on failures
 *
 * Exit Codes:
 *   0 - Success (non-blocking, allows continuation)
 *   2 - Block + send stderr to Claude (used for critical warnings)
 *
 * Based on: claude-code-mastery Stop hook pattern
 */

const fs = require('fs');
const { detectBeadsProject, syncBeads } = require('./lib/beads-utils.cjs');
const { loadConfig } = require('./lib/ck-config-utils.cjs');

/**
 * Main hook execution
 */
function main() {
  try {
    const stdin = fs.readFileSync(0, 'utf-8').trim();
    const data = stdin ? JSON.parse(stdin) : {};

    // Stop hook receives: stop_hook_active, transcript_path, etc.
    // We only care about beads sync at session boundaries

    const config = loadConfig({ includeProject: false, includeAssertions: false });

    // Beads must be explicitly enabled in config - true opt-in
    const beadsEnabled = config.beads?.enabled === true || config.beads?.enabled === 'auto';
    if (!beadsEnabled) {
      process.exit(0);
    }

    // Check if auto-sync is enabled (default: true when beads enabled)
    const autoSync = config.beads?.autoSync !== false;
    if (!autoSync) {
      process.exit(0);
    }

    // Detect beads project
    const beadsStatus = detectBeadsProject(process.cwd());

    // No beads or not initialized - nothing to do
    if (!beadsStatus.available || !beadsStatus.initialized) {
      process.exit(0);
    }

    // Attempt sync
    const result = syncBeads({ cwd: process.cwd() });

    if (!result.success) {
      // Non-blocking warning (exit 0) - don't interrupt user
      // Could use exit 2 to block and force manual sync
      console.error(`\n[beads] Sync warning: ${result.error || 'Unknown error'}`);
      console.error(`[beads] Run 'bd sync' manually to persist task state.`);
    }

    // Always allow continuation (non-blocking)
    process.exit(0);
  } catch (error) {
    // Fail-open: don't block session on hook errors
    if (process.env.CK_DEBUG) {
      console.error(`[session-end] Hook error: ${error.message}`);
    }
    process.exit(0);
  }
}

main();
