import * as fs from 'fs';
import * as path from 'path';
import { loadConfig, runAudit, AuditConfig } from '../../src/audit/index';

jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('audit/index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadConfig', () => {
    it('should return defaults when config file missing', () => {
      mockFs.existsSync.mockReturnValue(false);

      const config = loadConfig('/nonexistent/config.audit.json');

      expect(config.scanPaths).toContain('src/arbitrage');
      expect(config.securityChecks).toContain('hardcodedSecrets');
      expect(config.dependencyAudit).toBe(true);
      expect(config.outputFormat).toBe('html');
    });

    it('should parse config file when present', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        scanPaths: ['src/custom'],
        excludePaths: ['dist'],
        securityChecks: ['unsafeEval'],
        dependencyAudit: false,
        outputFormat: 'json',
        outputPath: 'custom_report.json',
      }));

      const config = loadConfig('/project/config.audit.json');

      expect(config.scanPaths).toEqual(['src/custom']);
      expect(config.securityChecks).toEqual(['unsafeEval']);
      expect(config.dependencyAudit).toBe(false);
      expect(config.outputFormat).toBe('json');
    });

    it('should use defaults for missing fields in config', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        scanPaths: ['src/api'],
      }));

      const config = loadConfig('/project/config.audit.json');

      expect(config.scanPaths).toEqual(['src/api']);
      expect(config.excludePaths).toEqual(['node_modules', 'dist']);
      expect(config.dependencyAudit).toBe(true);
    });
  });

  describe('runAudit', () => {
    it('should run full pipeline with empty scan paths', () => {
      // Mock crawlFiles to find nothing (directories don't exist)
      mockFs.existsSync.mockReturnValue(false);
      mockFs.writeFileSync.mockImplementation(() => undefined);

      const config: AuditConfig = {
        scanPaths: ['src/nonexistent'],
        excludePaths: ['node_modules'],
        securityChecks: ['hardcodedSecrets'],
        dependencyAudit: false,
        outputFormat: 'html',
        outputPath: 'test_report.html',
      };

      const report = runAudit(config, '/fake/root');

      expect(report.totalFiles).toBe(0);
      expect(report.summary.total).toBe(0);
      expect(report.timestamp).toBeDefined();
    });

    it('should scan files and detect issues', () => {
      // Mock directory exists
      mockFs.existsSync.mockReturnValue(true);
      // Mock directory listing
      mockFs.readdirSync.mockReturnValue([
        { name: 'bad-code.ts', isDirectory: () => false, isFile: () => true },
      ] as unknown as fs.Dirent[]);
      // Mock file stat
      mockFs.statSync.mockReturnValue({
        size: 100, mtime: new Date(),
      } as fs.Stats);
      // Mock file content with security issue
      mockFs.readFileSync.mockReturnValue(
        'const apiKey = "sk_live_1234567890abcdef12345";\nconsole.log(apiKey);'
      );
      mockFs.writeFileSync.mockImplementation(() => undefined);

      const config: AuditConfig = {
        scanPaths: ['src/test'],
        excludePaths: [],
        securityChecks: ['hardcodedSecrets'],
        dependencyAudit: false,
        outputFormat: 'html',
        outputPath: 'out.html',
      };

      const report = runAudit(config, '/project');

      expect(report.totalFiles).toBe(1);
      // Should detect hardcoded secret and/or console.log
      expect(report.summary.total).toBeGreaterThan(0);
    });

    it('should skip dependency audit when disabled', () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.writeFileSync.mockImplementation(() => undefined);

      const config: AuditConfig = {
        scanPaths: [],
        excludePaths: [],
        securityChecks: [],
        dependencyAudit: false,
        outputFormat: 'html',
        outputPath: 'out.html',
      };

      const report = runAudit(config, '/project');

      expect(report.dependencies.rawOutput).toBe('Skipped');
    });

    it('should save report to specified path', () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.writeFileSync.mockImplementation(() => undefined);

      const config: AuditConfig = {
        scanPaths: [],
        excludePaths: [],
        securityChecks: [],
        dependencyAudit: false,
        outputFormat: 'both',
        outputPath: 'my_report.html',
      };

      runAudit(config, '/project');

      // Should write both HTML and JSON
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2);
    });
  });
});
