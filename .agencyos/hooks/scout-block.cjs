#!/usr/bin/env node

/**
 * scout-block.js - Cross-platform hook dispatcher
 *
 * Blocks access to directories listed in .claude/.ckignore
 * (defaults: node_modules, __pycache__, .git, dist, build)
 *
 * Blocking Rules:
 * - File paths: Blocks any file_path/path/pattern containing blocked directories
 * - Bash commands: Blocks directory access (cd, ls, cat, etc.) but ALLOWS build commands
 *   - Blocked: cd node_modules, ls build/, cat dist/file.js
 *   - Allowed: npm build, pnpm build, yarn build, npm run build
 *
 * Configuration:
 * - Edit .claude/.ckignore to customize blocked patterns (one per line, # for comments)
 *
 * Platform Detection:
 * - Windows (win32): Uses PowerShell via scout-block.ps1
 * - Unix (linux/darwin): Uses Bash via scout-block.sh
 * - WSL: Automatically detects and uses bash implementation
 *
 * Exit Codes:
 * - 0: Command allowed
 * - 2: Command blocked or error occurred
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// --- Helper Functions ---

function exitWithError(message, status = 2) {
  if (message) {
    console.error(`ERROR: ${message}`);
  }
  process.exit(status);
}

function validateInput(input) {
  if (!input || input.trim().length === 0) {
    throw new Error('Empty input');
  }

  try {
    const data = JSON.parse(input);
    if (!data.tool_input || typeof data.tool_input !== 'object') {
      throw new Error('Invalid JSON structure');
    }
    return data;
  } catch (error) {
    throw new Error(`JSON parse failed: ${error.message}`);
  }
}

function getScriptPath(scriptDir, platform) {
  if (platform === 'win32') {
    return path.join(scriptDir, 'scout-block', 'scout-block.ps1');
  }
  return path.join(scriptDir, 'scout-block', 'scout-block.sh');
}

function executeScript(scriptPath, input, platform) {
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Script not found: ${scriptPath}`);
  }

  const options = {
    input: input,
    stdio: ['pipe', 'inherit', 'inherit'],
    encoding: 'utf-8'
  };

  let command;
  if (platform === 'win32') {
    // Windows: Use PowerShell implementation
    command = `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`;
  } else {
    // Unix (Linux, macOS, WSL): Use bash implementation
    command = `bash "${scriptPath}"`;
  }

  execSync(command, options);
}

// --- Main Execution ---

try {
  // Read stdin synchronously
  const hookInput = fs.readFileSync(0, 'utf-8');

  // Validate input
  validateInput(hookInput);

  // Determine platform and script path
  const platform = process.platform;
  const scriptDir = __dirname;
  const scriptPath = getScriptPath(scriptDir, platform);

  // Execute the platform-specific script
  executeScript(scriptPath, hookInput, platform);

} catch (error) {
  // Exit with error code from child process, or 2 if undefined (our error)
  exitWithError(error.message, error.status || 2);
}