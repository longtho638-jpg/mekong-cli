#!/usr/bin/env node
/**
 * beads-utils.cjs - Beads CLI integration utilities
 *
 * Centralized module for beads project detection and CLI operations.
 * Provides programmatic interface to bd (beads) commands with proper error handling.
 *
 * @module beads-utils
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

// Timeout constants
const TIMEOUT_SHORT = 2000;  // Quick commands (version check)
const TIMEOUT_DEFAULT = 5000; // Standard commands (create, update)
const TIMEOUT_LONG = 10000;  // Slow commands (sync, ready with large datasets)

// ═══════════════════════════════════════════════════════════════════════════
// SAFE EXECUTION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Execute bd command with arguments (no shell interpolation)
 * @param {string[]} args - Arguments array
 * @param {Object} [options] - Execution options
 * @param {number} [options.timeoutMs=5000] - Timeout in milliseconds
 * @param {string} [options.cwd] - Working directory
 * @returns {{ success: boolean, data: any|null, error: string|null, stdout: string|null }}
 */
function execBdCommand(args, options = {}) {
  const { timeoutMs = 5000, cwd = process.cwd() } = options;

  try {
    const result = spawnSync('bd', args, {
      encoding: 'utf8',
      timeout: timeoutMs,
      cwd,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    if (result.error) {
      // bd command not found or spawn failed
      return {
        success: false,
        data: null,
        error: result.error.message,
        stdout: null
      };
    }

    if (result.status !== 0) {
      // bd command failed
      return {
        success: false,
        data: null,
        error: result.stderr?.trim() || `bd exited with code ${result.status}`,
        stdout: result.stdout?.trim() || null
      };
    }

    // Success - try to parse JSON if output looks like JSON
    const stdout = result.stdout?.trim() || '';
    let data = null;

    if (stdout.startsWith('{') || stdout.startsWith('[')) {
      try {
        data = JSON.parse(stdout);
      } catch (e) {
        // Not valid JSON, return raw stdout
        data = stdout;
      }
    } else {
      data = stdout;
    }

    return {
      success: true,
      data,
      error: null,
      stdout
    };
  } catch (e) {
    return {
      success: false,
      data: null,
      error: e.message,
      stdout: null
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PROJECT DETECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Detect if current directory is a beads project
 * Uses fast directory check, only validates CLI if needed
 *
 * @param {string} [cwd=process.cwd()] - Directory to check
 * @returns {{ available: boolean, version: string|null, initialized: boolean }}
 */
function detectBeadsProject(cwd = process.cwd()) {
  // Check cache first (session-level)
  const cacheKey = `CK_BEADS_AVAILABLE_${cwd.replace(/[^a-zA-Z0-9]/g, '_')}`;
  if (process.env[cacheKey]) {
    try {
      return JSON.parse(process.env[cacheKey]);
    } catch (e) {
      // Invalid cache, continue
    }
  }

  const beadsDir = path.join(cwd, '.beads');

  // Fast check: .beads directory exists
  const initialized = fs.existsSync(beadsDir) && fs.statSync(beadsDir).isDirectory();

  if (!initialized) {
    const result = { available: false, version: null, initialized: false };
    process.env[cacheKey] = JSON.stringify(result);
    return result;
  }

  // Validate CLI is available
  const versionResult = execBdCommand(['--version'], { timeoutMs: 2000, cwd });

  if (!versionResult.success) {
    const result = { available: false, version: null, initialized: true };
    process.env[cacheKey] = JSON.stringify(result);
    return result;
  }

  // Extract version from output (format: "bd version X.Y.Z")
  const version = versionResult.stdout?.match(/(\d+\.\d+\.\d+)/)?.[1] || null;

  const result = { available: true, version, initialized: true };
  process.env[cacheKey] = JSON.stringify(result);
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// ISSUE CREATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate issue ID format (bd-XXXXXXXX)
 * @param {string} id - Issue ID to validate
 * @returns {boolean}
 */
function isValidIssueId(id) {
  if (typeof id !== 'string') return false;
  // beads IDs: bd- followed by 4-8 lowercase hex chars (short hash)
  return /^bd-[a-f0-9]{4,8}$/.test(id);
}

/**
 * Create an epic issue
 * @param {string} title - Epic title
 * @param {Object} [metadata={}] - Additional metadata
 * @param {string} [metadata.description] - Epic description
 * @param {string} [metadata.priority] - Priority level
 * @param {string} [options.cwd] - Working directory
 * @returns {{ success: boolean, issueId: string|null, error: string|null }}
 */
function createEpic(title, metadata = {}, options = {}) {
  const args = ['create', '-t', 'epic', '-m', title];

  if (metadata.description) {
    args.push('--description', metadata.description);
  }

  if (metadata.priority) {
    args.push('--priority', metadata.priority);
  }

  const result = execBdCommand(args, options);

  if (!result.success) {
    return { success: false, issueId: null, error: result.error };
  }

  // Extract issue ID from output (format varies, look for bd-XXXXXXXX)
  const issueId = result.stdout?.match(/bd-[a-z0-9]+/)?.[0] || null;

  return {
    success: true,
    issueId,
    error: null
  };
}

/**
 * Create a subtask under a parent issue
 * @param {string} parentId - Parent issue ID
 * @param {string} title - Subtask title
 * @param {Object} [metadata={}] - Additional metadata
 * @param {string} [options.cwd] - Working directory
 * @returns {{ success: boolean, issueId: string|null, error: string|null }}
 */
function createSubtask(parentId, title, metadata = {}, options = {}) {
  if (!isValidIssueId(parentId)) {
    return { success: false, issueId: null, error: 'Invalid parent ID format' };
  }

  const args = ['create', '-t', 'task', '-m', title];

  if (metadata.description) {
    args.push('--description', metadata.description);
  }

  if (metadata.priority) {
    args.push('--priority', metadata.priority);
  }

  const createResult = execBdCommand(args, options);

  if (!createResult.success) {
    return { success: false, issueId: null, error: createResult.error };
  }

  const issueId = createResult.stdout?.match(/bd-[a-z0-9]+/)?.[0] || null;

  if (!issueId) {
    return { success: false, issueId: null, error: 'Failed to extract issue ID' };
  }

  // Add dependency to parent
  const depResult = addDependency(issueId, parentId, 'subtask-of', options);

  if (!depResult.success) {
    // Warn but don't fail - issue was created
    return {
      success: true,
      issueId,
      error: `Created but failed to link to parent: ${depResult.error}`
    };
  }

  return { success: true, issueId, error: null };
}

// ═══════════════════════════════════════════════════════════════════════════
// DEPENDENCY MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Add dependency relationship between issues
 * @param {string} childId - Child issue ID
 * @param {string} parentId - Parent issue ID
 * @param {string} [type='subtask-of'] - Dependency type
 * @param {string} [options.cwd] - Working directory
 * @returns {{ success: boolean, error: string|null }}
 */
function addDependency(childId, parentId, type = 'subtask-of', options = {}) {
  if (!isValidIssueId(childId)) {
    return { success: false, error: 'Invalid child ID format' };
  }

  if (!isValidIssueId(parentId)) {
    return { success: false, error: 'Invalid parent ID format' };
  }

  const args = ['dep', 'add', childId, parentId];

  if (type !== 'subtask-of') {
    args.push('--type', type);
  }

  const result = execBdCommand(args, options);

  return {
    success: result.success,
    error: result.error
  };
}

/**
 * File discovered work as a new issue
 * @param {string} title - Issue title
 * @param {string} [parentId] - Parent epic/issue ID
 * @param {string} [priority='medium'] - Priority level
 * @param {string} [options.cwd] - Working directory
 * @returns {{ success: boolean, issueId: string|null, error: string|null }}
 */
function fileDiscoveredWork(title, parentId = null, priority = 'medium', options = {}) {
  const args = ['create', '-t', 'task', '-m', title, '--priority', priority];

  const createResult = execBdCommand(args, options);

  if (!createResult.success) {
    return { success: false, issueId: null, error: createResult.error };
  }

  const issueId = createResult.stdout?.match(/bd-[a-z0-9]+/)?.[0] || null;

  if (!issueId) {
    return { success: false, issueId: null, error: 'Failed to extract issue ID' };
  }

  // If parent provided, add as discovered-from dependency
  if (parentId && isValidIssueId(parentId)) {
    const depResult = addDependency(issueId, parentId, 'discovered-from', options);

    if (!depResult.success) {
      return {
        success: true,
        issueId,
        error: `Created but failed to link to parent: ${depResult.error}`
      };
    }
  }

  return { success: true, issueId, error: null };
}

// ═══════════════════════════════════════════════════════════════════════════
// ISSUE QUERIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get ready-to-work issues
 * @param {number} [limit=10] - Maximum number of issues to return
 * @param {string} [options.cwd] - Working directory
 * @returns {{ success: boolean, issues: Array|null, error: string|null }}
 */
function getReadyWork(limit = 10, options = {}) {
  const args = ['ready', '--json', '--limit', limit.toString()];

  const result = execBdCommand(args, options);

  if (!result.success) {
    return { success: false, issues: null, error: result.error };
  }

  // Parse JSON output
  const issues = Array.isArray(result.data) ? result.data : [];

  return {
    success: true,
    issues,
    error: null
  };
}

/**
 * Close an issue with optional reason
 * @param {string} id - Issue ID to close
 * @param {string} [reason='completed'] - Close reason
 * @param {string} [options.cwd] - Working directory
 * @returns {{ success: boolean, error: string|null }}
 */
function closeIssue(id, reason = 'completed', options = {}) {
  if (!isValidIssueId(id)) {
    return { success: false, error: 'Invalid issue ID format' };
  }

  const args = ['close', id];

  if (reason && reason !== 'completed') {
    args.push('--reason', reason);
  }

  const result = execBdCommand(args, options);

  return {
    success: result.success,
    error: result.error
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SYNC OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sync beads issues (useful at session end)
 * @param {string} [options.cwd] - Working directory
 * @returns {{ success: boolean, error: string|null }}
 */
function syncBeads(options = {}) {
  const args = ['sync'];

  const result = execBdCommand(args, { ...options, timeoutMs: 10000 });

  return {
    success: result.success,
    error: result.error
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // Core execution
  execBdCommand,

  // Detection
  detectBeadsProject,

  // Issue creation
  createEpic,
  createSubtask,
  fileDiscoveredWork,

  // Dependencies
  addDependency,

  // Queries
  getReadyWork,
  closeIssue,

  // Sync
  syncBeads,

  // Validation helpers
  isValidIssueId
};
