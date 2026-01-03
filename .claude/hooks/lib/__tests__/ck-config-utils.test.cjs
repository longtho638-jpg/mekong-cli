/**
 * Tests for ck-config-utils edge case handling
 * Run: node .claude/hooks/lib/__tests__/ck-config-utils.test.cjs
 */

const path = require('path');
const os = require('os');
const fs = require('fs');
const { execSync } = require('child_process');
const {
  normalizePath,
  isAbsolutePath,
  sanitizePath,
  sanitizeSlug,
  sanitizeConfig,
  validateNamingPattern,
  getGitRoot,
  getGitBranch,
  getReportsPath,
  escapeShellValue
} = require('../ck-config-utils.cjs');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${e.message}`);
    failed++;
  }
}

function assertEquals(actual, expected, msg = '') {
  if (actual !== expected) {
    throw new Error(`${msg}\n  Expected: ${JSON.stringify(expected)}\n  Actual: ${JSON.stringify(actual)}`);
  }
}

console.log('\n=== normalizePath tests ===\n');

test('trailing slashes: "plans///" → "plans"', () => {
  assertEquals(normalizePath('plans///'), 'plans');
});

test('trailing slashes: "my-plans///" → "my-plans"', () => {
  assertEquals(normalizePath('my-plans///'), 'my-plans');
});

test('empty paths: "   " → null', () => {
  assertEquals(normalizePath('   '), null);
});

test('empty string → null', () => {
  assertEquals(normalizePath(''), null);
});

test('null → null', () => {
  assertEquals(normalizePath(null), null);
});

test('undefined → null', () => {
  assertEquals(normalizePath(undefined), null);
});

test('whitespace around path trimmed', () => {
  assertEquals(normalizePath('  plans  '), 'plans');
});

console.log('\n=== isAbsolutePath tests ===\n');

test('absolute path: "/tmp/all-plans" → true', () => {
  assertEquals(isAbsolutePath('/tmp/all-plans'), true);
});

test('relative path: "plans" → false', () => {
  assertEquals(isAbsolutePath('plans'), false);
});

test('relative path: "./plans" → false', () => {
  assertEquals(isAbsolutePath('./plans'), false);
});

test('Windows absolute: "C:\\Users" → true (Linux: false)', () => {
  // On Linux, Windows paths aren't recognized as absolute - expected behavior
  const expected = process.platform === 'win32';
  assertEquals(isAbsolutePath('C:\\Users'), expected);
});

test('empty → false', () => {
  assertEquals(isAbsolutePath(''), false);
});

console.log('\n=== sanitizePath tests ===\n');

// sanitizePath needs projectRoot as second param
const projectRoot = '/home/user/project';

test('path traversal: "../../../tmp" → null (blocked)', () => {
  assertEquals(sanitizePath('../../../tmp', projectRoot), null);
});

test('absolute path respected: "/tmp/all-plans"', () => {
  const result = sanitizePath('/tmp/all-plans', projectRoot);
  assertEquals(result, '/tmp/all-plans');
});

test('relative path within project returns normalized relative', () => {
  // sanitizePath returns normalized path, not joined (joining done by caller)
  const result = sanitizePath('plans', projectRoot);
  assertEquals(result, 'plans');
});

test('null byte injection blocked', () => {
  assertEquals(sanitizePath('plans\x00evil', projectRoot), null);
});

console.log('\n=== sanitizeSlug tests ===\n');

test('invalid filename chars removed: <, >, :, ", etc.', () => {
  const result = sanitizeSlug('test<>:"/\\|?*slug');
  assertEquals(result, 'testslug');
});

test('control chars removed', () => {
  const result = sanitizeSlug('test\x00\x1fslug');
  assertEquals(result, 'testslug');
});

test('length limited to 100 chars', () => {
  const longSlug = 'a'.repeat(150);
  const result = sanitizeSlug(longSlug);
  assertEquals(result.length, 100);
});

test('empty slug returns empty (caller handles fallback)', () => {
  // sanitizeSlug returns empty, caller decides fallback
  const result = sanitizeSlug('');
  assertEquals(result, '');
});

console.log('\n=== validateNamingPattern tests ===\n');

test('valid pattern with {slug}', () => {
  const result = validateNamingPattern('251217-{slug}');
  assertEquals(result.valid, true);
});

test('pattern without {slug} → invalid', () => {
  const result = validateNamingPattern('251217-feature');
  assertEquals(result.valid, false);
  assertEquals(result.error, 'Pattern must contain {slug} placeholder');
});

test('empty pattern → invalid', () => {
  const result = validateNamingPattern('');
  assertEquals(result.valid, false);
});

test('unresolved placeholder → invalid', () => {
  const result = validateNamingPattern('{date}-{slug}');
  assertEquals(result.valid, false);
});

console.log('\n=== getGitRoot tests (Issue #291) ===\n');

test('getGitRoot returns path when in git repo', () => {
  const result = getGitRoot();
  // We're running from within a git repo, so should return a path
  if (result === null) {
    throw new Error('Expected git root path but got null');
  }
  if (!path.isAbsolute(result)) {
    throw new Error(`Expected absolute path but got: ${result}`);
  }
});

console.log('\n=== getReportsPath with baseDir tests (Issue #291) ===\n');

test('getReportsPath returns absolute path when baseDir provided', () => {
  const planConfig = { reportsDir: 'reports' };
  const pathsConfig = { plans: 'plans' };
  const baseDir = '/home/user/project';

  const result = getReportsPath(null, null, planConfig, pathsConfig, baseDir);
  assertEquals(result, '/home/user/project/plans/reports');
});

test('getReportsPath returns relative path when no baseDir', () => {
  const planConfig = { reportsDir: 'reports' };
  const pathsConfig = { plans: 'plans' };

  const result = getReportsPath(null, null, planConfig, pathsConfig);
  assertEquals(result, 'plans/reports/');
});

test('getReportsPath uses plan path for session-resolved plans', () => {
  const planConfig = { reportsDir: 'reports' };
  const pathsConfig = { plans: 'plans' };
  const baseDir = '/home/user/project';

  const result = getReportsPath('plans/my-plan', 'session', planConfig, pathsConfig, baseDir);
  assertEquals(result, '/home/user/project/plans/my-plan/reports');
});

test('getReportsPath ignores plan path for branch-resolved plans', () => {
  const planConfig = { reportsDir: 'reports' };
  const pathsConfig = { plans: 'plans' };
  const baseDir = '/home/user/project';

  const result = getReportsPath('plans/my-plan', 'branch', planConfig, pathsConfig, baseDir);
  assertEquals(result, '/home/user/project/plans/reports');
});

console.log('\n=== getGitRoot/getGitBranch with cwd parameter (Issue #291) ===\n');

test('getGitRoot accepts cwd parameter', () => {
  const gitRoot = getGitRoot();
  if (!gitRoot) {
    console.log('  → Skipped: not in git repo');
    return;
  }
  // Should work with explicit cwd
  const result = getGitRoot(gitRoot);
  assertEquals(result, gitRoot);
});

test('getGitRoot with subdirectory cwd returns same root', () => {
  const gitRoot = getGitRoot();
  if (!gitRoot) {
    console.log('  → Skipped: not in git repo');
    return;
  }
  // Run from .claude/hooks subdirectory
  const subdirPath = path.join(gitRoot, '.claude', 'hooks');
  if (!fs.existsSync(subdirPath)) {
    console.log('  → Skipped: subdirectory does not exist');
    return;
  }
  const result = getGitRoot(subdirPath);
  assertEquals(result, gitRoot);
});

test('getGitRoot returns null for non-git directory', () => {
  const tempDir = path.join(os.tmpdir(), 'ck-test-no-git-' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });
  try {
    const result = getGitRoot(tempDir);
    assertEquals(result, null);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('getGitBranch accepts cwd parameter', () => {
  const gitRoot = getGitRoot();
  if (!gitRoot) {
    console.log('  → Skipped: not in git repo');
    return;
  }
  const branch1 = getGitBranch();
  const branch2 = getGitBranch(gitRoot);
  assertEquals(branch1, branch2);
});

console.log('\n=== escapeShellValue tests (Security) ===\n');

test('escapeShellValue escapes backslashes', () => {
  const result = escapeShellValue('path\\with\\backslash');
  assertEquals(result, 'path\\\\with\\\\backslash');
});

test('escapeShellValue escapes double quotes', () => {
  const result = escapeShellValue('path"with"quotes');
  assertEquals(result, 'path\\"with\\"quotes');
});

test('escapeShellValue escapes dollar signs', () => {
  const result = escapeShellValue('path$with$dollar');
  assertEquals(result, 'path\\$with\\$dollar');
});

test('escapeShellValue escapes backticks (Issue #291)', () => {
  const result = escapeShellValue('path`with`backticks');
  assertEquals(result, 'path\\`with\\`backticks');
});

test('escapeShellValue handles mixed special chars', () => {
  const result = escapeShellValue('test\\$`"mixed');
  assertEquals(result, 'test\\\\\\$\\`\\"mixed');
});

test('escapeShellValue returns non-string as-is', () => {
  assertEquals(escapeShellValue(123), 123);
  assertEquals(escapeShellValue(null), null);
  assertEquals(escapeShellValue(undefined), undefined);
});

console.log('\n=== getReportsPath edge cases ===\n');

test('getReportsPath with empty reportsDir falls back to "reports"', () => {
  const planConfig = { reportsDir: '' };
  const pathsConfig = { plans: 'plans' };
  const baseDir = '/home/user/project';

  const result = getReportsPath(null, null, planConfig, pathsConfig, baseDir);
  assertEquals(result, '/home/user/project/plans/reports');
});

test('getReportsPath with null reportsDir falls back to "reports"', () => {
  const planConfig = { reportsDir: null };
  const pathsConfig = { plans: 'plans' };
  const baseDir = '/home/user/project';

  const result = getReportsPath(null, null, planConfig, pathsConfig, baseDir);
  assertEquals(result, '/home/user/project/plans/reports');
});

test('getReportsPath with empty plansDir falls back to "plans"', () => {
  const planConfig = { reportsDir: 'reports' };
  const pathsConfig = { plans: '' };
  const baseDir = '/home/user/project';

  const result = getReportsPath(null, null, planConfig, pathsConfig, baseDir);
  assertEquals(result, '/home/user/project/plans/reports');
});

test('getReportsPath with null plansDir falls back to "plans"', () => {
  const planConfig = { reportsDir: 'reports' };
  const pathsConfig = { plans: null };
  const baseDir = '/home/user/project';

  const result = getReportsPath(null, null, planConfig, pathsConfig, baseDir);
  assertEquals(result, '/home/user/project/plans/reports');
});

console.log('\n=== sanitizeConfig tests ===\n');

test('absolute path in config preserved through sanitization', () => {
  const config = {
    plan: { reportsDir: 'reports' },
    paths: { docs: 'docs', plans: '/tmp/all-plans' }
  };
  const result = sanitizeConfig(config, '/home/user/project');
  assertEquals(result.paths.plans, '/tmp/all-plans');
});

test('mixed absolute/relative paths preserved independently', () => {
  const config = {
    plan: { reportsDir: 'reports' },
    paths: { docs: 'docs', plans: '/tmp/all-plans' }
  };
  const result = sanitizeConfig(config, '/home/user/project');
  assertEquals(result.paths.docs, 'docs');
  assertEquals(result.paths.plans, '/tmp/all-plans');
});

console.log('\n=== isAbsolutePath edge cases ===\n');

test('UNC path on Windows: "\\\\\\\\server\\\\share" (platform-conditional)', () => {
  const expected = process.platform === 'win32';
  assertEquals(isAbsolutePath('\\\\server\\share'), expected);
});

test('path.join concatenates paths (does NOT discard baseDir)', () => {
  // Document Node.js behavior: path.join concatenates, path.resolve would discard
  // path.join('/base', '/absolute') = '/base/absolute' (concatenates, strips leading /)
  // path.resolve('/base', '/absolute') = '/absolute' (absolute overrides)
  const result = path.join('/home/user/project', '/tmp/all-plans');
  assertEquals(result, '/home/user/project/tmp/all-plans');
});

// Summary
console.log('\n=== Summary ===\n');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
