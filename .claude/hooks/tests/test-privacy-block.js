#!/usr/bin/env node
/**
 * test-privacy-block.js - Unit tests for privacy-block hook
 */

const { spawn } = require('child_process');
const path = require('path');

const HOOK_PATH = path.join(__dirname, '..', 'privacy-block.cjs');

async function runHook(hookData) {
  return new Promise((resolve) => {
    const proc = spawn('node', [HOOK_PATH]);
    let stderr = '';

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ code, stderr });
    });

    proc.stdin.write(JSON.stringify(hookData));
    proc.stdin.end();
  });
}

// Test cases - blocking without APPROVED: prefix
const blockTests = [
  {
    name: '.env file - should block',
    input: { tool_input: { file_path: '.env' } },
    expectBlock: true,
    expectContains: 'PRIVACY BLOCK'
  },
  {
    name: '.env.local - should block',
    input: { tool_input: { file_path: '.env.local' } },
    expectBlock: true,
    expectContains: 'APPROVED:'
  },
  {
    name: 'credentials.json - should block',
    input: { tool_input: { file_path: 'config/credentials.json' } },
    expectBlock: true
  },
  {
    name: 'id_rsa - should block',
    input: { tool_input: { file_path: '~/.ssh/id_rsa' } },
    expectBlock: true
  },
  {
    name: '.env in bash command - should block',
    input: { tool_input: { command: 'cat .env' } },
    expectBlock: true
  },
  {
    name: 'secrets.yaml - should block',
    input: { tool_input: { file_path: 'secrets.yaml' } },
    expectBlock: true
  },
  {
    name: 'private.key - should block',
    input: { tool_input: { file_path: 'certs/private.key' } },
    expectBlock: true
  }
];

// Test cases - allowing with APPROVED: prefix
const allowTests = [
  {
    name: 'APPROVED:.env - should allow',
    input: { tool_input: { file_path: 'APPROVED:.env' } },
    expectBlock: false,
    expectContains: 'User-approved'
  },
  {
    name: 'APPROVED:.env.local - should allow',
    input: { tool_input: { file_path: 'APPROVED:.env.local' } },
    expectBlock: false
  },
  {
    name: 'APPROVED:credentials.json - should allow',
    input: { tool_input: { file_path: 'APPROVED:config/credentials.json' } },
    expectBlock: false
  },
  {
    name: 'APPROVED in bash command - should allow',
    input: { tool_input: { command: 'cat APPROVED:.env' } },
    expectBlock: false
  }
];

// Test cases - non-sensitive files (always allowed)
const safeTests = [
  {
    name: 'regular file - should allow',
    input: { tool_input: { file_path: 'src/index.ts' } },
    expectBlock: false
  },
  {
    name: 'package.json - should allow',
    input: { tool_input: { file_path: 'package.json' } },
    expectBlock: false
  },
  {
    name: 'README.md - should allow',
    input: { tool_input: { file_path: 'README.md' } },
    expectBlock: false
  }
];

async function main() {
  console.log('Testing privacy-block hook...\n');

  let passed = 0;
  let failed = 0;

  console.log('\x1b[1m--- Block Tests (no APPROVED: prefix) ---\x1b[0m');
  for (const test of blockTests) {
    const result = await runHook(test.input);
    const blocked = result.code === 2;
    const success = blocked === test.expectBlock;
    const containsOk = !test.expectContains || result.stderr.includes(test.expectContains);

    if (success && containsOk) {
      console.log(`\x1b[32m✓\x1b[0m ${test.name}`);
      passed++;
    } else {
      console.log(`\x1b[31m✗\x1b[0m ${test.name}: expected BLOCK, got ${blocked ? 'BLOCK' : 'ALLOW'}`);
      failed++;
    }
  }

  console.log('\n\x1b[1m--- Allow Tests (with APPROVED: prefix) ---\x1b[0m');
  for (const test of allowTests) {
    const result = await runHook(test.input);
    const blocked = result.code === 2;
    const success = blocked === test.expectBlock;
    const containsOk = !test.expectContains || result.stderr.includes(test.expectContains);

    if (success && containsOk) {
      console.log(`\x1b[32m✓\x1b[0m ${test.name}`);
      passed++;
    } else {
      console.log(`\x1b[31m✗\x1b[0m ${test.name}: expected ALLOW, got ${blocked ? 'BLOCK' : 'ALLOW'}`);
      failed++;
    }
  }

  console.log('\n\x1b[1m--- Safe Files (always allowed) ---\x1b[0m');
  for (const test of safeTests) {
    const result = await runHook(test.input);
    const blocked = result.code === 2;
    const success = blocked === test.expectBlock;

    if (success) {
      console.log(`\x1b[32m✓\x1b[0m ${test.name}`);
      passed++;
    } else {
      console.log(`\x1b[31m✗\x1b[0m ${test.name}: expected ALLOW, got ${blocked ? 'BLOCK' : 'ALLOW'}`);
      failed++;
    }
  }

  console.log(`\n\x1b[1mResults:\x1b[0m ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
