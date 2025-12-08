#!/usr/bin/env node
/**
 * SessionStart Hook - Initializes session environment with project detection
 *
 * Fires: Once per session (startup, resume, clear, compact)
 * Purpose: Load config, detect project info, persist to env vars, output context
 *
 * Exit Codes:
 *   0 - Success (non-blocking, allows continuation)
 */

const fs = require('fs');
const {
  loadConfig,
  writeEnv,
  writeSessionState,
  resolvePlanPath,
  getReportsPath
} = require('./lib/ck-config-utils.cjs');

/**
 * Detect project type based on workspace indicators
 */
function detectProjectType(configOverride) {
  if (configOverride && configOverride !== 'auto') return configOverride;

  if (fs.existsSync('pnpm-workspace.yaml')) return 'monorepo';
  if (fs.existsSync('lerna.json')) return 'monorepo';

  if (fs.existsSync('package.json')) {
    try {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      if (pkg.workspaces) return 'monorepo';
      if (pkg.main || pkg.exports) return 'library';
    } catch (e) { /* ignore */ }
  }

  return 'single-repo';
}

/**
 * Detect package manager from lock files
 */
function detectPackageManager(configOverride) {
  if (configOverride && configOverride !== 'auto') return configOverride;

  if (fs.existsSync('bun.lockb')) return 'bun';
  if (fs.existsSync('pnpm-lock.yaml')) return 'pnpm';
  if (fs.existsSync('yarn.lock')) return 'yarn';
  if (fs.existsSync('package-lock.json')) return 'npm';

  return null;
}

/**
 * Detect framework from package.json dependencies
 */
function detectFramework(configOverride) {
  if (configOverride && configOverride !== 'auto') return configOverride;
  if (!fs.existsSync('package.json')) return null;

  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (deps['next']) return 'next';
    if (deps['nuxt']) return 'nuxt';
    if (deps['astro']) return 'astro';
    if (deps['@remix-run/node'] || deps['@remix-run/react']) return 'remix';
    if (deps['svelte'] || deps['@sveltejs/kit']) return 'svelte';
    if (deps['vue']) return 'vue';
    if (deps['react']) return 'react';
    if (deps['express']) return 'express';
    if (deps['fastify']) return 'fastify';
    if (deps['hono']) return 'hono';
    if (deps['elysia']) return 'elysia';

    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Build context summary for output
 * @param {Object} config - Loaded config
 * @param {Object} detections - Project detections
 * @param {{ path: string|null, resolvedBy: string|null }} resolved - Plan resolution result
 */
function buildContextOutput(config, detections, resolved) {
  const lines = [`Project: ${detections.type || 'unknown'}`];
  if (detections.pm) lines.push(`PM: ${detections.pm}`);
  if (detections.framework) lines.push(`Framework: ${detections.framework}`);
  lines.push(`Plan naming: ${config.plan.namingFormat}`);

  // Show plan status with resolution context
  if (resolved.path) {
    if (resolved.resolvedBy === 'session') {
      lines.push(`Plan: ${resolved.path}`);
    } else {
      lines.push(`Suggested: ${resolved.path}`);
    }
  }

  if (config.assertions?.length > 0) {
    lines.push(`Assertions: ${config.assertions.length} rules`);
  }
  return lines.join(' | ');
}

/**
 * Main hook execution
 */
async function main() {
  try {
    const stdin = fs.readFileSync(0, 'utf-8').trim();
    const data = stdin ? JSON.parse(stdin) : {};
    const envFile = process.env.CLAUDE_ENV_FILE;
    const source = data.source || 'unknown';
    const sessionId = data.session_id || null;

    const config = loadConfig();

    const detections = {
      type: detectProjectType(config.project?.type),
      pm: detectPackageManager(config.project?.packageManager),
      framework: detectFramework(config.project?.framework)
    };

    // Resolve plan - now returns { path, resolvedBy }
    const resolved = resolvePlanPath(null, config);

    // CRITICAL FIX: Only persist explicitly-set plans to session state
    // Branch-matched plans are "suggested" - stored separately, not as activePlan
    // This prevents stale plan pollution on fresh sessions
    if (sessionId) {
      writeSessionState(sessionId, {
        sessionOrigin: process.cwd(),
        // Only session-resolved plans are truly "active"
        activePlan: resolved.resolvedBy === 'session' ? resolved.path : null,
        // Track suggested plan separately (for UI hints, not for report paths)
        suggestedPlan: resolved.resolvedBy === 'branch' ? resolved.path : null,
        timestamp: Date.now(),
        source
      });
    }

    // Reports path only uses active plans, not suggested ones
    const reportsPath = getReportsPath(resolved.path, resolved.resolvedBy, config.plan, config.paths);

    if (envFile) {
      writeEnv(envFile, 'CK_SESSION_ID', sessionId || '');
      writeEnv(envFile, 'CK_PLAN_NAMING_FORMAT', config.plan.namingFormat);
      writeEnv(envFile, 'CK_PLAN_DATE_FORMAT', config.plan.dateFormat);
      writeEnv(envFile, 'CK_PLAN_ISSUE_PREFIX', config.plan.issuePrefix || '');
      writeEnv(envFile, 'CK_PLAN_REPORTS_DIR', config.plan.reportsDir);
      // Only set CK_ACTIVE_PLAN for explicitly active plans
      writeEnv(envFile, 'CK_ACTIVE_PLAN', resolved.resolvedBy === 'session' ? resolved.path : '');
      // Add suggested plan as separate env var (for UI hints)
      writeEnv(envFile, 'CK_SUGGESTED_PLAN', resolved.resolvedBy === 'branch' ? resolved.path : '');
      writeEnv(envFile, 'CK_REPORTS_PATH', reportsPath);
      writeEnv(envFile, 'CK_DOCS_PATH', config.paths.docs);
      writeEnv(envFile, 'CK_PLANS_PATH', config.paths.plans);
      writeEnv(envFile, 'CK_PROJECT_ROOT', process.cwd());
      writeEnv(envFile, 'CK_PROJECT_TYPE', detections.type || '');
      writeEnv(envFile, 'CK_PACKAGE_MANAGER', detections.pm || '');
      writeEnv(envFile, 'CK_FRAMEWORK', detections.framework || '');
      if (config.locale?.responseLanguage) {
        writeEnv(envFile, 'CK_RESPONSE_LANGUAGE', config.locale.responseLanguage);
      }
    }

    console.log(`Session ${source}. ${buildContextOutput(config, detections, resolved)}`);

    if (config.assertions?.length > 0) {
      console.log(`\nUser Assertions:`);
      config.assertions.forEach((assertion, i) => {
        console.log(`  ${i + 1}. ${assertion}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error(`SessionStart hook error: ${error.message}`);
    process.exit(0);
  }
}

main();
