#!/usr/bin/env ts-node
/**
 * Disk Space Monitor - Halts builds when <1GB free
 * RaaS Gateway v2.0.0 Compatible
 */
import { execSync } from 'node:child_process';

const THRESHOLD_GB = 1;
const THRESHOLD_PERCENT = 80;

function getDiskUsage(): { free: number; total: number; percent: number } {
  const output = execSync('df -k / | tail -1').toString().trim();
  const parts = output.split(/\s+/);

  const total = parseInt(parts[1]) / 1024 / 1024; // GB
  const used = parseInt(parts[2]) / 1024 / 1024;  // GB
  const free = parseInt(parts[3]) / 1024 / 1024;  // GB
  const percent = (used / total) * 100;

  return { free, total, percent };
}

function main() {
  const { free, percent } = getDiskUsage();

  console.log(`=== Disk Usage Report ===`);
  console.log(`Free: ${free.toFixed(2)} GB`);
  console.log(`Usage: ${percent.toFixed(1)}%`);

  // Critical: <1GB free
  if (free < THRESHOLD_GB) {
    console.error(`\n❌ CRITICAL: Only ${free.toFixed(2)}GB free (threshold: ${THRESHOLD_GB}GB)`);
    console.error('Build aborted to prevent disk space exhaustion.');
    process.exit(1);
  }

  // Warning: >80% usage
  if (percent > THRESHOLD_PERCENT) {
    console.warn(`\n⚠️ WARNING: Disk usage at ${percent.toFixed(1)}%`);
    console.warn('Consider cleaning up old artifacts.');
  }

  console.log('\n✅ Disk space OK for build');
  process.exit(0);
}

main();
