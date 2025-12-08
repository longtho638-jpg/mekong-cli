#!/usr/bin/env node
/**
 * Development Rules Reminder - UserPromptSubmit Hook
 *
 * Injects environment info, rules, modularization reminders, and Plan Context.
 * Uses transcript checking to inject only once per ~50 messages for token efficiency.
 *
 * Exit Codes:
 *   0 - Success (non-blocking, allows continuation)
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const {
  CONFIG_PATH,
  loadConfig,
  resolvePlanPath,
  getReportsPath,
  formatIssueId,
  extractIssueFromBranch
} = require('./lib/ck-config-utils.cjs');

/**
 * Safely execute shell command
 */
function execSafe(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    return null;
  }
}

/**
 * Resolve workflow file path - checks local first, then global
 * @param {string} filename - The workflow filename (e.g., 'development-rules.md')
 * @returns {{ path: string, scope: string } | null} - Resolved path and scope, or null if not found
 */
function resolveWorkflowPath(filename) {
  const localPath = path.join(process.cwd(), '.claude', 'workflows', filename);
  const globalPath = path.join(os.homedir(), '.claude', 'workflows', filename);

  if (fs.existsSync(localPath)) {
    return { path: `.claude/workflows/${filename}`, scope: 'project' };
  }
  if (fs.existsSync(globalPath)) {
    return { path: `~/.claude/workflows/${filename}`, scope: 'global' };
  }
  return null;
}

/**
 * Get git remote URL
 */
function getGitRemoteUrl() {
  try {
    const url = execSync('git config --get remote.origin.url', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    return url || 'Not available';
  } catch (error) {
    return 'Not available';
  }
}

/**
 * Get Python version
 */
function getPythonVersion() {
  const commands = ['python3 --version', 'python --version'];
  for (const cmd of commands) {
    try {
      const output = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim();
      if (output) return output;
    } catch (error) {
      // Try next command
    }
  }
  return 'Not available';
}

/**
 * Build Plan Context section using resolvePlanPath with differentiated injection
 *
 * Resolution semantics:
 * - 'session': Explicitly active → directive language, plan-specific reports path
 * - 'branch': Suggested only → soft hint, default reports path
 * - null: No plan → default reports path
 */
function buildPlanContext(sessionId) {
  const config = loadConfig({ includeProject: false, includeAssertions: false });
  const { plan, paths } = config;

  const gitBranch = execSafe('git branch --show-current');
  const issueId = extractIssueFromBranch(gitBranch);

  // resolvePlanPath now returns { path, resolvedBy }
  const resolved = resolvePlanPath(sessionId, config);
  const reportsPath = getReportsPath(resolved.path, resolved.resolvedBy, plan, paths);
  const formattedIssue = formatIssueId(issueId, plan);

  const lines = [
    `## Plan Context`,
    `- Plan Config: ${CONFIG_PATH}`
  ];

  // DIFFERENTIATED INJECTION based on resolution method
  if (resolved.resolvedBy === 'session') {
    // Explicit active plan - directive language
    lines.push(`- Active Plan: ${resolved.path}`);
    lines.push(`- Reports Path: ${reportsPath}`);
  } else if (resolved.resolvedBy === 'branch') {
    // Branch-matched - soft hint, NOT directive
    lines.push(`- Active Plan: none`);
    lines.push(`- Suggested Plan: ${resolved.path} (matched from branch, not active)`);
    lines.push(`- To activate: use \`set-active-plan.cjs\` or run \`/plan\``);
    lines.push(`- Reports Path: ${reportsPath}`);
  } else {
    // No plan at all
    lines.push(`- Active Plan: none (create with planner agent)`);
    lines.push(`- Reports Path: ${reportsPath}`);
  }

  lines.push(`- Naming Format: ${plan.namingFormat}`);
  lines.push(`- Date Format: ${plan.dateFormat}`);

  if (formattedIssue) lines.push(`- Issue ID: ${formattedIssue}`);
  if (gitBranch) lines.push(`- Git Branch: ${gitBranch}`);
  lines.push(`- IMPORTANT: When spawning subagents, include Plan Context in the prompt.`);

  return { lines, resolved, reportsPath };
}

/**
 * Build response language instruction (placed at start of output)
 */
function buildResponseLanguage() {
  const config = loadConfig({ includeProject: false, includeAssertions: false, includeLocale: true });
  const lang = config.locale?.responseLanguage;
  if (!lang) return [];
  return [
    `## Response Language`,
    `Always respond in ${lang}.`,
    ``
  ];
}

/**
 * Build MANDATORY Output Paths section
 */
function buildMandatoryPaths(reportsPath, pathsConfig) {
  return [
    ``,
    `## MANDATORY Output Paths`,
    `- Reports: ${reportsPath}`,
    `- Plans: ${pathsConfig?.plans || 'plans'}/`,
    `- Docs: ${pathsConfig?.docs || 'docs'}/`,
    `- WARNING: DO NOT write markdown files outside these directories`,
    ``
  ];
}

/**
 * Check if reminder was recently injected by scanning transcript
 */
function wasRecentlyInjected(transcriptPath) {
  try {
    if (!transcriptPath || !fs.existsSync(transcriptPath)) return false;
    const transcript = fs.readFileSync(transcriptPath, 'utf-8');
    const recentLines = transcript.split('\n').slice(-50);
    return recentLines.some(line => line.includes('**[IMPORTANT]** Consider Modularization'));
  } catch (e) {
    return false;
  }
}

/**
 * Main hook execution
 */
async function main() {
  try {
    const stdin = fs.readFileSync(0, 'utf-8').trim();
    if (!stdin) process.exit(0);

    const payload = JSON.parse(stdin);
    if (wasRecentlyInjected(payload.transcript_path)) process.exit(0);

    const sessionId = process.env.CK_SESSION_ID || null;
    const config = loadConfig();

    const memUsed = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    const memTotal = Math.round(os.totalmem() / 1024 / 1024);
    const memPercent = Math.round((memUsed / memTotal) * 100);
    const cpuUsage = Math.round((process.cpuUsage().user / 1000000) * 100);
    const cpuSystem = Math.round((process.cpuUsage().system / 1000000) * 100);

    const currentUser =
      process.env.USERNAME || process.env.USER || process.env.LOGNAME || os.userInfo().username;
    const gitRemoteUrl = getGitRemoteUrl();
    const pythonVersion = getPythonVersion();
    const nodeVersion = process.version || 'Not available';

    // Build Plan Context with resolution
    const planContext = buildPlanContext(sessionId);

    // Resolve workflow paths once (local first, then global)
    const devRulesPath = resolveWorkflowPath('development-rules.md');
    const docMgmtPath = resolveWorkflowPath('documentation-management.md');

    // Build reminder array
    const reminderParts = [
      // Response language FIRST (prefix strategy)
      ...buildResponseLanguage(),

      `## Current environment`,
      `- Date time: ${new Date().toLocaleString()}`,
      `- Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
      `- Claude Code settings directory: ${path.resolve(__dirname, "..")}`,
      `- Working directory: ${process.cwd()}`,
      `- Git: ${gitRemoteUrl}`,
      `- Node: ${nodeVersion}`,
      `- Python: ${pythonVersion}`,
      `- OS: ${process.platform}`,
      `- User: ${currentUser}`,
      `- Locale: ${process.env.LANG}`,
      `- Memory usage: ${memUsed}MB/${memTotal}MB (${memPercent}%)`,
      `- CPU usage: ${cpuUsage}% user / ${cpuSystem}% system`,
      `- IMPORTANT: Include these environment information when prompting subagents to perform tasks.`,
      ``,
      `## Rules`,
      // Include workflow rules only if files exist (local or global)
      ...(devRulesPath
        ? [`- Read and follow development rules in ${devRulesPath.scope} directory: "${devRulesPath.path}"`]
        : []),
      ...(docMgmtPath
        ? [`- Read and follow documentation management in ${docMgmtPath.scope} directory: "${docMgmtPath.path}"`]
        : []),
      `- Markdown files are organized in: Plans → "plans/" directory, Docs → "docs/" directory`,
      `- Report markdown files in the same directory as the plan file in project directory`,
      `- **IMPORTANT:** DO NOT create markdown files out of "plans/" or "docs/" directories UNLESS the user explicitly requests it.`,
      `- Activate skills (auto detect user-scope or project-scope): Run \`python .claude/scripts/generate_catalogs.py --skills\` to generate a skills catalog and analyze it, then activate the relevant skills that are needed for the task during the process.`,
      `- Execute commands (auto detect user-scope or project-scope): Run \`python .claude/scripts/generate_catalogs.py --commands\` to generate a commands catalog and analyze it, then execute the relevant SlashCommands that are needed for the task during the process.`,
      `- When skills' scripts are failed to execute, always fix them and run again, repeat until success.`,
      `- Follow **YAGNI (You Aren't Gonna Need It) - KISS (Keep It Simple, Stupid) - DRY (Don't Repeat Yourself)** principles`,
      `- Sacrifice grammar for the sake of concision when writing reports.`,
      `- In reports, list any unresolved questions at the end, if any.`,
      `- IMPORTANT: Ensure token consumption efficiency while maintaining high quality.`,
      `- IMPORTANT: Include these rules when prompting subagents to perform tasks.`,
      ``,
      `## **[IMPORTANT] Consider Modularization:**`,
      `- Check existing modules before creating new`,
      `- Analyze logical separation boundaries (functions, classes, concerns)`,
      `- Use kebab-case naming with descriptive names, it's fine if the file name is long because this ensures file names are self-documenting for LLM tools (Grep, Glob, Search)`,
      `- Write descriptive code comments`,
      `- After modularization, continue with main task`,
      `- When not to modularize: Markdown files, plain text files, bash scripts, configuration files, environment variables files, etc.`,
      `- IMPORTANT: Include these considerations when prompting subagents to perform tasks.`,

      // MANDATORY Output Paths
      ...buildMandatoryPaths(planContext.reportsPath, config.paths),

      // Plan Context
      ...planContext.lines,
    ];

    console.log(reminderParts.join('\n'));
    process.exit(0);
  } catch (error) {
    console.error(`Dev rules hook error: ${error.message}`);
    process.exit(0);
  }
}

main();
