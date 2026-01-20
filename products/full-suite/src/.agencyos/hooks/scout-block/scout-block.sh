#!/bin/bash
# scout-block.sh - Bash implementation for blocking heavy directories
# Reads patterns from .ckignore file (defaults: node_modules, __pycache__, .git, dist, build)
#
# Blocking Rules:
# - File paths: Blocks any file_path/path/pattern containing blocked directories
# - Bash commands: Blocks directory access (cd, ls, cat, etc.) but ALLOWS build commands
#   - Blocked: cd node_modules, ls build/, cat dist/file.js
#   - Allowed: npm build, pnpm build, yarn build, npm run build

# 1. Read Input
# -----------------------------------------------------------------------------
INPUT=$(cat)

if [ -z "$INPUT" ]; then
  echo "ERROR: Empty input" >&2
  exit 2
fi

# 2. Configuration Setup
# -----------------------------------------------------------------------------
# Determine script directory to find .ckignore relative to this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Look for .ckignore in .agencyos/ folder (2 levels up)
CLAUDE_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
CKIGNORE_FILE="$CLAUDE_DIR/.ckignore"

# 3. Execution (Embedded Node.js Script)
# -----------------------------------------------------------------------------
# We use Node.js for robust JSON parsing and regex handling, which is brittle in pure Bash.
# The script outputs "ALLOWED" or "BLOCKED:<patterns>" to stdout.

CHECK_RESULT=$(echo "$INPUT" | CKIGNORE_FILE="$CKIGNORE_FILE" node -e "
const fs = require('fs');

// --- Helper Functions ---

function getBlockedPatterns() {
  const defaults = ['node_modules', '__pycache__', '.git', 'dist', 'build'];
  const ckignorePath = process.env.CKIGNORE_FILE;

  if (ckignorePath && fs.existsSync(ckignorePath)) {
    try {
      const content = fs.readFileSync(ckignorePath, 'utf-8');
      const patterns = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
      
      if (patterns.length > 0) return patterns;
    } catch (e) {
      // Ignore read errors, fallback to defaults
    }
  }
  return defaults;
}

function parseInput() {
  try {
    const input = fs.readFileSync(0, 'utf-8');
    const data = JSON.parse(input);
    
    // Basic validation
    if (!data.tool_input || typeof data.tool_input !== 'object') {
      return null; 
    }
    return data.tool_input;
  } catch (e) {
    return null;
  }
}

// --- Main Logic ---

try {
  const toolInput = parseInput();
  
  // If JSON is invalid, fail-open (allow operation) to prevent blocking due to tool errors
  if (!toolInput) {
    console.error('WARN: Invalid JSON structure, allowing operation');
    console.log('ALLOWED');
    process.exit(0);
  }

  const blockedPatterns = getBlockedPatterns();
  
  // Build Regex Patterns
  const escapeRegex = (str) => str.replace(/[.*+?^${{}}()|[\\]/g, '\\$&');
  const patternGroup = blockedPatterns.map(escapeRegex).join('|');

  // 1. Directory Path Pattern (strict blocking for file arguments)
  // Matches: /pattern/, ^pattern/, /pattern$
  const blockedDirPattern = new RegExp('(^|/|\\s)(' + patternGroup + ')(/|$|\\s)');

  // 2. Command Pattern (selective blocking)
  // Blocks: cd node_modules, ls build/
  // Allows: npm build, npm run build
  const blockedBashPattern = new RegExp(
    '(cd\\s+|ls\\s+|cat\\s+|rm\\s+|cp\\s+|mv\\s+|find\\s+)(' + patternGroup + ')(/|$|\\s)|' + 
    '(\\s|^|/)(' + patternGroup + ')/'
  );

  // Check File Parameters
  const fileParams = [
    toolInput.file_path,
    toolInput.path,
    toolInput.pattern
  ];

  for (const param of fileParams) {
    if (param && typeof param === 'string' && blockedDirPattern.test(param)) {
      console.log('BLOCKED:' + blockedPatterns.join(','));
      process.exit(0);
    }
  }

  // Check Command Parameter
  if (toolInput.command && typeof toolInput.command === 'string') {
    if (blockedBashPattern.test(toolInput.command)) {
      console.log('BLOCKED:' + blockedPatterns.join(','));
      process.exit(0);
    }
  }

  console.log('ALLOWED');

} catch (error) {
  // Fail-open on unexpected script errors
  console.error('WARN: Internal script error, allowing operation -', error.message);
  console.log('ALLOWED');
  process.exit(0);
}
")

# 4. Result Handling
# -----------------------------------------------------------------------------

# Check if Node execution failed
if [ $? -ne 0 ]; then
  echo "ERROR: Internal hook error" >&2
  exit 2
fi

# Parse result
if [[ "$CHECK_RESULT" == BLOCKED:* ]]; then
  PATTERNS="${CHECK_RESULT#BLOCKED:}"
  echo "ERROR: Blocked directory pattern ($PATTERNS)" >&2
  exit 2
fi

# Explicitly allowed
exit 0
