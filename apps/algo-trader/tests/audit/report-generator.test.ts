import * as fs from 'fs';
import { buildReport, generateHtml, saveReport, AuditReport } from '../../src/audit/report-generator';
import { SecurityFinding } from '../../src/audit/security-scanner';
import { LintSummary } from '../../src/audit/eslint-runner';
import { AuditSummary } from '../../src/audit/dependency-auditor';
import { FileMetadata } from '../../src/audit/file-crawler';

jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('report-generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  const mockFiles: FileMetadata[] = [
    { filePath: '/p/src/core/engine.ts', relativePath: 'src/core/engine.ts', size: 1024, lastModified: new Date(), lineCount: 50 },
    { filePath: '/p/src/api/routes.ts', relativePath: 'src/api/routes.ts', size: 512, lastModified: new Date(), lineCount: 30 },
  ];

  const mockSecurity: SecurityFinding[] = [
    {
      filePath: 'src/core/engine.ts', line: 10, column: 5,
      check: 'hardcodedSecrets', severity: 'critical',
      message: 'Hardcoded API key', codeSnippet: 'const key = "sk_1234"',
      suggestedFix: 'Use env var',
    },
    {
      filePath: 'src/api/routes.ts', line: 20, column: 1,
      check: 'insecureRandom', severity: 'medium',
      message: 'Math.random used', codeSnippet: 'Math.random()',
      suggestedFix: 'Use crypto.randomBytes',
    },
  ];

  const mockLint: LintSummary = {
    totalFiles: 2,
    totalErrors: 1,
    totalWarnings: 3,
    issuesByRule: { 'no-any-type': 2, 'no-console-log': 1, 'no-ts-ignore': 1 },
    results: [
      {
        filePath: 'src/core/engine.ts',
        issues: [
          { filePath: 'src/core/engine.ts', line: 5, column: 10, severity: 'warning', rule: 'no-any-type', message: 'Avoid any' },
        ],
        errorCount: 0, warningCount: 1,
      },
    ],
  };

  const mockDeps: AuditSummary = {
    totalDependencies: 50,
    vulnerabilities: { critical: 0, high: 1, moderate: 0, low: 0, info: 0, total: 1 },
    details: [
      { name: 'lodash', severity: 'high', title: 'Prototype Pollution', url: '', range: '<4.17', fixAvailable: true, patchedVersion: '4.17.21' },
    ],
    rawOutput: '{}',
  };

  describe('buildReport', () => {
    it('should aggregate summary counts correctly', () => {
      const report = buildReport(mockFiles, mockSecurity, mockLint, mockDeps);

      expect(report.totalFiles).toBe(2);
      expect(report.summary.critical).toBe(1); // 1 security critical
      expect(report.summary.high).toBeGreaterThanOrEqual(1); // dep high + lint errors
      expect(report.summary.medium).toBe(1); // 1 security medium
      expect(report.timestamp).toBeDefined();
    });

    it('should include all data sections', () => {
      const report = buildReport(mockFiles, mockSecurity, mockLint, mockDeps);

      expect(report.security).toHaveLength(2);
      expect(report.lint.totalFiles).toBe(2);
      expect(report.dependencies.totalDependencies).toBe(50);
      expect(report.files).toHaveLength(2);
    });

    it('should handle empty findings', () => {
      const emptyDeps: AuditSummary = {
        totalDependencies: 0,
        vulnerabilities: { critical: 0, high: 0, moderate: 0, low: 0, info: 0, total: 0 },
        details: [], rawOutput: '',
      };
      const emptyLint: LintSummary = {
        totalFiles: 0, totalErrors: 0, totalWarnings: 0, issuesByRule: {}, results: [],
      };

      const report = buildReport([], [], emptyLint, emptyDeps);

      expect(report.summary.total).toBe(0);
      expect(report.totalFiles).toBe(0);
    });
  });

  describe('generateHtml', () => {
    it('should produce valid HTML with all sections', () => {
      const report = buildReport(mockFiles, mockSecurity, mockLint, mockDeps);
      const html = generateHtml(report);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Security Findings');
      expect(html).toContain('Code Quality');
      expect(html).toContain('Dependency Vulnerabilities');
      expect(html).toContain('Hardcoded API key');
      expect(html).toContain('lodash');
    });

    it('should escape HTML in code snippets', () => {
      const findings: SecurityFinding[] = [{
        filePath: 'test.ts', line: 1, column: 1,
        check: 'unsafeEval', severity: 'critical',
        message: 'eval <script>alert(1)</script>',
        codeSnippet: '<script>alert(1)</script>',
        suggestedFix: 'Remove',
      }];
      const report = buildReport([], findings, mockLint, mockDeps);
      const html = generateHtml(report);

      expect(html).not.toContain('<script>alert');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should show "no issues" message for empty sections', () => {
      const emptyDeps: AuditSummary = {
        totalDependencies: 0,
        vulnerabilities: { critical: 0, high: 0, moderate: 0, low: 0, info: 0, total: 0 },
        details: [], rawOutput: '',
      };
      const emptyLint: LintSummary = {
        totalFiles: 0, totalErrors: 0, totalWarnings: 0, issuesByRule: {}, results: [],
      };

      const report = buildReport([], [], emptyLint, emptyDeps);
      const html = generateHtml(report);

      expect(html).toContain('No security vulnerabilities detected');
      expect(html).toContain('No code quality issues found');
    });
  });

  describe('saveReport', () => {
    beforeEach(() => {
      mockFs.writeFileSync.mockImplementation(() => undefined);
    });

    it('should save HTML report', () => {
      const report = buildReport(mockFiles, mockSecurity, mockLint, mockDeps);
      const saved = saveReport(report, '/output/report.html', 'html');

      expect(saved).toEqual(['/output/report.html']);
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        '/output/report.html',
        expect.stringContaining('<!DOCTYPE html>'),
        'utf-8'
      );
    });

    it('should save JSON report', () => {
      const report = buildReport(mockFiles, mockSecurity, mockLint, mockDeps);
      const saved = saveReport(report, '/output/report.html', 'json');

      expect(saved).toEqual(['/output/report.json']);
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);
    });

    it('should save both HTML and JSON', () => {
      const report = buildReport(mockFiles, mockSecurity, mockLint, mockDeps);
      const saved = saveReport(report, '/output/report.html', 'both');

      expect(saved).toHaveLength(2);
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2);
    });
  });
});
