/**
 * Audit Module - Orchestrates the full code review and security audit pipeline.
 * Scans TypeScript files, runs quality checks, security scans, and dependency audit.
 * Produces HTML + JSON reports.
 */
import * as fs from 'fs';
import * as path from 'path';
import { crawlFiles, CrawlOptions, FileMetadata } from './file-crawler';
import { lintFiles, LintSummary } from './eslint-runner';
import { scanFiles, SecurityFinding, CheckType } from './security-scanner';
import { runDependencyAudit, AuditSummary } from './dependency-auditor';
import { buildReport, saveReport, AuditReport } from './report-generator';

export interface AuditConfig {
  scanPaths: string[];
  excludePaths: string[];
  securityChecks: CheckType[];
  dependencyAudit: boolean;
  outputFormat: 'html' | 'json' | 'both';
  outputPath: string;
}

/**
 * Load audit config from config.audit.json.
 */
export function loadConfig(configPath?: string): AuditConfig {
  const cfgPath = configPath || path.resolve(process.cwd(), 'config.audit.json');

  if (!fs.existsSync(cfgPath)) {
    return {
      scanPaths: ['src/arbitrage', 'src/core', 'src/execution', 'src/api'],
      excludePaths: ['node_modules', 'dist', 'coverage'],
      securityChecks: ['hardcodedSecrets', 'unsafeEval', 'insecureRandom', 'inputValidation', 'sqlInjection'],
      dependencyAudit: true,
      outputFormat: 'html',
      outputPath: 'audit_report.html',
    };
  }

  const raw = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
  return {
    scanPaths: raw.scanPaths || ['src/arbitrage'],
    excludePaths: raw.excludePaths || ['node_modules', 'dist'],
    securityChecks: raw.securityChecks || ['hardcodedSecrets', 'unsafeEval'],
    dependencyAudit: raw.dependencyAudit !== false,
    outputFormat: raw.outputFormat || 'html',
    outputPath: raw.outputPath || 'audit_report.html',
  };
}

/**
 * Run the complete audit pipeline.
 */
export function runAudit(config: AuditConfig, rootDir?: string): AuditReport {
  const projectRoot = rootDir || process.cwd();

  // Step 1: Crawl files
  const crawlOpts: CrawlOptions = {
    scanPaths: config.scanPaths,
    excludePaths: config.excludePaths,
    rootDir: projectRoot,
  };
  const files: FileMetadata[] = crawlFiles(crawlOpts);

  // Step 2: Read file contents for scanning
  const fileContents = files.map((f) => ({
    filePath: f.relativePath,
    content: fs.readFileSync(f.filePath, 'utf-8'),
  }));

  // Step 3: Lint check
  const lintSummary: LintSummary = lintFiles(fileContents);

  // Step 4: Security scan
  const securityFindings: SecurityFinding[] = scanFiles(
    fileContents,
    config.securityChecks
  );

  // Step 5: Dependency audit
  let depAudit: AuditSummary = {
    totalDependencies: 0,
    vulnerabilities: { critical: 0, high: 0, moderate: 0, low: 0, info: 0, total: 0 },
    details: [],
    rawOutput: 'Skipped',
  };
  if (config.dependencyAudit) {
    depAudit = runDependencyAudit(projectRoot);
  }

  // Step 6: Build report
  const report = buildReport(files, securityFindings, lintSummary, depAudit);

  // Step 7: Save report
  const outputPath = path.resolve(projectRoot, config.outputPath);
  saveReport(report, outputPath, config.outputFormat);

  return report;
}

// CLI entry point
if (require.main === module) {
  const config = loadConfig();
  console.log('🔍 Starting Algo Trader Code Audit...');
  console.log(`📂 Scanning: ${config.scanPaths.join(', ')}`);

  const report = runAudit(config);

  console.log('\n📊 Audit Complete:');
  console.log(`  Files scanned: ${report.totalFiles}`);
  console.log(`  Critical: ${report.summary.critical}`);
  console.log(`  High: ${report.summary.high}`);
  console.log(`  Medium: ${report.summary.medium}`);
  console.log(`  Low: ${report.summary.low}`);
  console.log(`  Total issues: ${report.summary.total}`);
  console.log(`\n📄 Report saved to: ${config.outputPath}`);
}

export type { FileMetadata, SecurityFinding, LintSummary, AuditSummary, AuditReport };
