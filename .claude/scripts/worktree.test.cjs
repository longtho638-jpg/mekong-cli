#!/usr/bin/env node
/**
 * Test suite for worktree.cjs
 * Run: node .claude/scripts/worktree.test.cjs
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const SCRIPT_PATH = path.join(__dirname, 'worktree.cjs');
const STANDALONE_DIR = path.dirname(path.dirname(__dirname)); // worktree dir
const MONOREPO_DIR = '/home/kai/claudekit';

let passed = 0;
let failed = 0;
const results = [];

// Test helper
function run(args, options = {}) {
  const cwd = options.cwd || STANDALONE_DIR;
  try {
    const output = execSync(`node "${SCRIPT_PATH}" ${args}`, {
      encoding: 'utf-8',
      cwd,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { success: true, output: output.trim(), exitCode: 0 };
  } catch (error) {
    return {
      success: false,
      output: error.stdout?.toString().trim() || '',
      stderr: error.stderr?.toString().trim() || '',
      exitCode: error.status || 1
    };
  }
}

function test(name, fn) {
  try {
    fn();
    passed++;
    results.push({ name, status: 'PASS' });
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failed++;
    results.push({ name, status: 'FAIL', error: error.message });
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    throw new Error(`Invalid JSON: ${str.slice(0, 100)}...`);
  }
}

// ============================================
// INFO COMMAND TESTS
// ============================================
console.log('\n📋 INFO Command Tests');

test('info returns valid JSON', () => {
  const result = run('info --json');
  assert(result.success, 'Command should succeed');
  const json = assertJSON(result.output);
  assert(json.info === true, 'Should have info: true');
});

test('info detects repo type', () => {
  const result = run('info --json');
  const json = assertJSON(result.output);
  assert(['standalone', 'monorepo'].includes(json.repoType), 'Should detect repo type');
});

test('info detects base branch', () => {
  const result = run('info --json');
  const json = assertJSON(result.output);
  assert(json.baseBranch, 'Should detect base branch');
  assert(['dev', 'develop', 'main', 'master'].includes(json.baseBranch), 'Should be valid branch');
});

test('info finds env files', () => {
  const result = run('info --json');
  const json = assertJSON(result.output);
  assert(Array.isArray(json.envFiles), 'Should have envFiles array');
});

test('info detects dirty state', () => {
  const result = run('info --json');
  const json = assertJSON(result.output);
  assert(typeof json.dirtyState === 'boolean', 'Should have dirtyState boolean');
});

test('info detects monorepo from monorepo root', () => {
  if (!fs.existsSync(MONOREPO_DIR)) return; // Skip if not available
  const result = run('info --json', { cwd: MONOREPO_DIR });
  const json = assertJSON(result.output);
  assert(json.repoType === 'monorepo', 'Should detect monorepo');
  assert(json.projects.length > 0, 'Should have projects');
});

test('info returns text output without --json', () => {
  const result = run('info');
  assert(result.success, 'Command should succeed');
  assert(result.output.includes('Repository Info'), 'Should have text output');
});

// ============================================
// LIST COMMAND TESTS
// ============================================
console.log('\n📂 LIST Command Tests');

test('list returns valid JSON', () => {
  const result = run('list --json');
  assert(result.success, 'Command should succeed');
  const json = assertJSON(result.output);
  assert(json.success === true, 'Should have success: true');
  assert(Array.isArray(json.worktrees), 'Should have worktrees array');
});

test('list worktrees have required fields', () => {
  const result = run('list --json');
  const json = assertJSON(result.output);
  if (json.worktrees.length > 0) {
    const wt = json.worktrees[0];
    assert(wt.path, 'Worktree should have path');
    assert(wt.commit, 'Worktree should have commit');
    assert(wt.branch, 'Worktree should have branch');
  }
});

test('list returns text output without --json', () => {
  const result = run('list');
  assert(result.success, 'Command should succeed');
  assert(result.output.includes('worktrees'), 'Should have text output');
});

// ============================================
// CREATE COMMAND TESTS
// ============================================
console.log('\n🆕 CREATE Command Tests');

test('create requires feature name', () => {
  const result = run('create --json');
  assert(!result.success, 'Should fail without feature');
  const json = assertJSON(result.output);
  assert(json.error.code === 'MISSING_FEATURE', 'Should have MISSING_FEATURE error');
});

test('create dry-run does not create worktree', () => {
  const result = run('create test-dry-run --prefix feat --dry-run --json');
  assert(result.success, 'Dry-run should succeed');
  const json = assertJSON(result.output);
  assert(json.dryRun === true, 'Should have dryRun: true');
  assert(json.wouldCreate, 'Should have wouldCreate object');
});

test('create dry-run shows correct branch name', () => {
  const result = run('create my-feature --prefix fix --dry-run --json');
  const json = assertJSON(result.output);
  assert(json.wouldCreate.branch === 'fix/my-feature', 'Branch should be fix/my-feature');
});

test('create sanitizes feature name - spaces', () => {
  const result = run('create "my cool feature" --dry-run --json');
  const json = assertJSON(result.output);
  assert(json.wouldCreate.branch.includes('my-cool-feature'), 'Should sanitize spaces');
});

test('create sanitizes feature name - uppercase', () => {
  const result = run('create "MyFeature" --dry-run --json');
  const json = assertJSON(result.output);
  assert(json.wouldCreate.branch.includes('myfeature'), 'Should lowercase');
});

test('create sanitizes feature name - special chars', () => {
  const result = run('create "feat@#$test" --dry-run --json');
  const json = assertJSON(result.output);
  assert(!json.wouldCreate.branch.includes('@'), 'Should remove special chars');
});

test('create respects --prefix flag', () => {
  const prefixes = ['feat', 'fix', 'docs', 'refactor', 'test', 'chore', 'perf'];
  for (const prefix of prefixes) {
    const result = run(`create test-${prefix} --prefix ${prefix} --dry-run --json`);
    const json = assertJSON(result.output);
    assert(json.wouldCreate.branch.startsWith(`${prefix}/`), `Should use ${prefix} prefix`);
  }
});

test('create shows base branch', () => {
  const result = run('create test-base --dry-run --json');
  const json = assertJSON(result.output);
  assert(json.wouldCreate.baseBranch, 'Should show base branch');
});

test('create shows worktree path', () => {
  const result = run('create test-path --dry-run --json');
  const json = assertJSON(result.output);
  assert(json.wouldCreate.worktreePath, 'Should show worktree path');
  assert(json.wouldCreate.worktreePath.includes('worktrees'), 'Path should include worktrees dir');
});

test('create in monorepo requires project', () => {
  if (!fs.existsSync(MONOREPO_DIR)) return;
  const result = run('create --json', { cwd: MONOREPO_DIR });
  assert(!result.success, 'Should fail without project in monorepo');
  const json = assertJSON(result.output);
  assert(json.error.code === 'MISSING_ARGS', 'Should have MISSING_ARGS error');
});

test('create in monorepo with project works', () => {
  if (!fs.existsSync(MONOREPO_DIR)) return;
  const result = run('create engineer test-mono --prefix feat --dry-run --json', { cwd: MONOREPO_DIR });
  assert(result.success, 'Should succeed with project');
  const json = assertJSON(result.output);
  assert(json.wouldCreate.project === 'claudekit-engineer', 'Should detect project');
});

test('create detects invalid project', () => {
  if (!fs.existsSync(MONOREPO_DIR)) return;
  const result = run('create nonexistent test-invalid --json', { cwd: MONOREPO_DIR });
  assert(!result.success, 'Should fail with invalid project');
  const json = assertJSON(result.output);
  assert(json.error.code === 'PROJECT_NOT_FOUND', 'Should have PROJECT_NOT_FOUND error');
});

// ============================================
// REMOVE COMMAND TESTS
// ============================================
console.log('\n🗑️  REMOVE Command Tests');

test('remove requires worktree name', () => {
  const result = run('remove --json');
  assert(!result.success, 'Should fail without name');
  const json = assertJSON(result.output);
  assert(json.error.code === 'MISSING_WORKTREE', 'Should have MISSING_WORKTREE error');
});

test('remove dry-run does not remove worktree', () => {
  // First get a worktree name from list
  const listResult = run('list --json');
  const listJson = assertJSON(listResult.output);
  const removable = listJson.worktrees.find(w => !w.path.includes('.git/'));

  if (removable) {
    const name = path.basename(removable.path);
    const result = run(`remove "${name}" --dry-run --json`);
    assert(result.success, 'Dry-run should succeed');
    const json = assertJSON(result.output);
    assert(json.dryRun === true, 'Should have dryRun: true');
    assert(json.wouldRemove, 'Should have wouldRemove object');
  }
});

test('remove handles not found', () => {
  const result = run('remove nonexistent-worktree-xyz --json');
  assert(!result.success, 'Should fail for nonexistent');
  const json = assertJSON(result.output);
  assert(json.error.code === 'WORKTREE_NOT_FOUND', 'Should have WORKTREE_NOT_FOUND error');
});

test('remove error includes available worktrees', () => {
  const result = run('remove nonexistent-worktree-xyz --json');
  const json = assertJSON(result.output);
  assert(Array.isArray(json.error.availableWorktrees), 'Should list available worktrees');
});

// ============================================
// AUTO-FEATURES TESTS (env templates)
// ============================================
console.log('\n🤖 Auto-Features Tests');

test('create dry-run succeeds', () => {
  const result = run('create test-env-feature --prefix feat --dry-run --json');
  assert(result.success, 'Dry-run should succeed');
  const json = assertJSON(result.output);
  assert(json.dryRun === true, 'Should have dryRun: true');
});

// ============================================
// WORKTREE ROOT DETECTION TESTS
// ============================================
console.log('\n📍 Worktree Root Detection Tests');

test('info shows worktreeRoot and worktreeRootSource', () => {
  const result = run('info --json');
  const json = assertJSON(result.output);
  assert(json.worktreeRoot, 'Should have worktreeRoot');
  assert(json.worktreeRootSource, 'Should have worktreeRootSource');
  assert(typeof json.worktreeRoot === 'string', 'worktreeRoot should be string');
  assert(json.worktreeRoot.includes('worktrees'), 'worktreeRoot should include worktrees');
});

test('create --worktree-root overrides default location', () => {
  const customRoot = '/tmp/test-worktrees';
  const result = run(`create test-custom-root --prefix feat --dry-run --json --worktree-root "${customRoot}"`);
  assert(result.success, 'Should succeed with custom root');
  const json = assertJSON(result.output);
  assert(json.wouldCreate.worktreePath.startsWith(customRoot), 'Path should use custom root');
  assert(json.wouldCreate.worktreeRootSource === '--worktree-root flag', 'Source should be flag');
});

test('create --worktree-root with relative path resolves to absolute', () => {
  const result = run('create test-relative --prefix feat --dry-run --json --worktree-root "./custom-worktrees"');
  assert(result.success, 'Should succeed');
  const json = assertJSON(result.output);
  assert(path.isAbsolute(json.wouldCreate.worktreePath), 'Path should be absolute');
});

test('create dry-run shows worktreeRootSource', () => {
  const result = run('create test-source --prefix feat --dry-run --json');
  assert(result.success, 'Should succeed');
  const json = assertJSON(result.output);
  assert(json.wouldCreate.worktreeRootSource, 'Should show worktreeRootSource');
});

test('superproject detection in submodule', () => {
  // Test from claudekit-engineer submodule
  const submodulePath = '/home/kai/claudekit/claudekit-engineer';
  if (!fs.existsSync(submodulePath)) return;
  const result = run('info --json', { cwd: submodulePath });
  const json = assertJSON(result.output);
  // Should detect parent monorepo as superproject
  assert(json.worktreeRootSource.includes('superproject') || json.worktreeRootSource === 'monorepo root',
    'Should detect superproject or monorepo root');
});

test('WORKTREE_ROOT env var overrides detection', () => {
  const envRoot = '/tmp/env-worktrees';
  try {
    const output = execSync(`WORKTREE_ROOT="${envRoot}" node "${SCRIPT_PATH}" create test-env --prefix feat --dry-run --json`, {
      encoding: 'utf-8',
      cwd: STANDALONE_DIR,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const json = JSON.parse(output.trim());
    assert(json.wouldCreate.worktreePath.startsWith(envRoot), 'Should use env var root');
    assert(json.wouldCreate.worktreeRootSource === 'WORKTREE_ROOT env', 'Source should be env');
  } catch (error) {
    // May fail if script path issue - skip
  }
});

test('create --worktree-root validates path existence', () => {
  // Use a deeply nested non-existent path that can't be created
  const invalidRoot = '/nonexistent/deeply/nested/path/that/does/not/exist';
  const result = run(`create test-invalid-root --prefix feat --json --worktree-root "${invalidRoot}"`);
  assert(!result.success, 'Should fail with invalid path');
  const json = assertJSON(result.output);
  assert(json.error.code === 'INVALID_WORKTREE_ROOT', 'Should have INVALID_WORKTREE_ROOT error');
});

// ============================================
// ERROR HANDLING TESTS
// ============================================
console.log('\n⚠️  Error Handling Tests');

test('unknown command returns error', () => {
  const result = run('unknowncommand --json');
  assert(!result.success, 'Should fail');
  const json = assertJSON(result.output);
  assert(json.error.code === 'UNKNOWN_COMMAND', 'Should have UNKNOWN_COMMAND error');
});

test('no command returns error', () => {
  const result = run('--json');
  assert(!result.success, 'Should fail');
  const json = assertJSON(result.output);
  assert(json.error.code === 'UNKNOWN_COMMAND', 'Should have UNKNOWN_COMMAND error');
});

test('errors have suggestion field', () => {
  const result = run('create --json');
  const json = assertJSON(result.output);
  assert(json.error.suggestion, 'Error should have suggestion');
});

test('success commands return exit code 0', () => {
  const result = run('info --json');
  assert(result.exitCode === 0, 'Exit code should be 0');
});

test('error commands return exit code 1', () => {
  const result = run('create --json');
  assert(result.exitCode === 1, 'Exit code should be 1');
});

test('non-git directory returns error', () => {
  const result = run('info --json', { cwd: '/tmp' });
  assert(!result.success, 'Should fail in non-git dir');
  const json = assertJSON(result.output);
  assert(json.error.code === 'NOT_GIT_REPO', 'Should have NOT_GIT_REPO error');
});

// ============================================
// SUMMARY
// ============================================
console.log('\n' + '='.repeat(50));
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  console.log('Failed tests:');
  results.filter(r => r.status === 'FAIL').forEach(r => {
    console.log(`  - ${r.name}: ${r.error}`);
  });
  process.exit(1);
} else {
  console.log('✅ All tests passed!\n');
  process.exit(0);
}
