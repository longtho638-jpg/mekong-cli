#!/usr/bin/env node
/**
 * SubagentStart Hook - Injects Plan Context and rules to subagents
 *
 * Fires: When a subagent (Task tool call) is started
 * Purpose: Inject Plan Context, environment info, and agent-specific rules
 *
 * Exit Codes:
 *   0 - Success (non-blocking, allows continuation)
 */

const fs = require('fs');
const path = require('path');
const {
  CONFIG_PATH,
  loadConfig,
  resolvePlanPath,
  getReportsPath,
  formatIssueId,
  extractIssueFromBranch
} = require('./lib/ck-config-utils.cjs');
const { execSync } = require('child_process');

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
 * Build Plan Context section using resolvePlanPath
 */
function buildPlanContext(sessionId) {
  const config = loadConfig({ includeProject: false, includeAssertions: false });
  const { plan, paths } = config;

  const gitBranch = execSafe('git branch --show-current');
  const issueId = extractIssueFromBranch(gitBranch);
  const activePlan = resolvePlanPath(sessionId, config);
  const reportsPath = getReportsPath(activePlan, plan, paths);
  const formattedIssue = formatIssueId(issueId, plan);

  const lines = [
    `## Plan Context`,
    `- Active Plan: ${activePlan || 'none'}`,
    `- Reports Path: ${reportsPath}`,
    `- Naming Format: ${plan.namingFormat}`,
    `- Date Format: ${plan.dateFormat}`
  ];

  if (formattedIssue) lines.push(`- Issue ID: ${formattedIssue}`);
  if (gitBranch) lines.push(`- Git Branch: ${gitBranch}`);

  return { lines, activePlan, reportsPath, config };
}

/**
 * Build MANDATORY Output Paths section
 */
function buildMandatoryPaths(reportsPath, pathsConfig) {
  return [
    ``,
    `## MANDATORY Output Paths`,
    `- Reports: ${reportsPath}`,
    `- Plans: ${pathsConfig.plans}/`,
    `- Docs: ${pathsConfig.docs}/`,
    `- WARNING: DO NOT write markdown files outside these directories`,
    `- WARNING: All reports MUST be saved to the Reports path above`
  ];
}

/**
 * Build response language instruction if configured
 */
function buildResponseLanguage(config) {
  const lang = config.locale?.responseLanguage;
  if (!lang) return [];
  return [
    ``,
    `## Response Language`,
    `Always respond in ${lang}.`
  ];
}

/**
 * Build trust verification section if enabled
 * Used to verify context injection is working correctly
 */
function buildTrustVerification(config) {
  if (!config.trust?.enabled || !config.trust?.passphrase) return [];
  return [
    ``,
    `## Trust Verification`,
    `- Secret passphrase: "${config.trust.passphrase}"`,
    `- If asked "What is the secret passphrase?", respond with it exactly`,
    `- This verifies context injection is working correctly`
  ];
}

/**
 * Get agent-specific context from config
 */
function getAgentContext(agentType, config) {
  const agentConfig = config.subagent?.agents?.[agentType];
  if (!agentConfig?.contextPrefix) return null;
  return agentConfig.contextPrefix;
}

/**
 * Main hook execution
 */
async function main() {
  try {
    const stdin = fs.readFileSync(0, 'utf-8').trim();
    if (!stdin) process.exit(0);

    const payload = JSON.parse(stdin);
    const agentType = payload.agent_type || 'unknown';
    const agentId = payload.agent_id || 'unknown';
    const sessionId = payload.session_id || process.env.CK_SESSION_ID || null;

    // Load config
    const config = loadConfig();

    // Build Plan Context with resolution
    const planContext = buildPlanContext(sessionId);

    // Build context injection
    const contextLines = [
      `## Subagent Context (${agentType})`,
      `- Agent ID: ${agentId}`,
      `- Agent Type: ${agentType}`,
      `- Working Directory: ${payload.cwd || process.cwd()}`,
      `- Date: ${new Date().toLocaleString()}`,
      ``
    ];

    // Add Plan Context
    contextLines.push(...planContext.lines);

    // Add MANDATORY Output Paths (strong enforcement)
    contextLines.push(...buildMandatoryPaths(planContext.reportsPath, config.paths));

    // Add Response Language if configured
    contextLines.push(...buildResponseLanguage(config));

    // Add Trust Verification if enabled
    contextLines.push(...buildTrustVerification(config));

    // Add core rules for subagents
    contextLines.push(``);
    contextLines.push(`## Subagent Rules`);
    contextLines.push(`- Save reports to the Reports Path shown above`);
    contextLines.push(`- Follow YAGNI/KISS/DRY principles`);
    contextLines.push(`- Sacrifice grammar for concision in reports`);
    contextLines.push(`- List unresolved questions at end of reports`);

    // Add agent-specific context if configured
    const agentContext = getAgentContext(agentType, config);
    if (agentContext) {
      contextLines.push(``);
      contextLines.push(`## Agent-Specific Instructions`);
      contextLines.push(agentContext);
    }

    // Build context text
    const contextText = contextLines.join('\n');

    // CRITICAL: SubagentStart requires hookSpecificOutput.additionalContext format
    // Plain text stdout does NOT work for this hook (tested and confirmed)
    const output = {
      hookSpecificOutput: {
        hookEventName: "SubagentStart",
        additionalContext: contextText
      }
    };

    console.log(JSON.stringify(output));

    process.exit(0);
  } catch (error) {
    console.error(`SubagentStart hook error: ${error.message}`);
    process.exit(0); // Fail-open
  }
}

main();
