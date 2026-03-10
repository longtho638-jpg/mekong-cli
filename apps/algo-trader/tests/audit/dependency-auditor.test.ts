import { parseNpmAuditOutput, AuditSummary } from '../../src/audit/dependency-auditor';

describe('dependency-auditor', () => {
  describe('parseNpmAuditOutput', () => {
    it('should parse npm audit v2 format with vulnerabilities', () => {
      const auditJson = JSON.stringify({
        vulnerabilities: {
          lodash: {
            severity: 'high',
            title: 'Prototype Pollution',
            url: 'https://github.com/advisories/GHSA-1234',
            range: '<4.17.21',
            fixAvailable: { version: '4.17.21' },
          },
          axios: {
            severity: 'critical',
            title: 'SSRF vulnerability',
            url: 'https://github.com/advisories/GHSA-5678',
            range: '<1.6.0',
            fixAvailable: false,
          },
        },
        metadata: { totalDependencies: 150 },
      });

      const result = parseNpmAuditOutput(auditJson);

      expect(result.totalDependencies).toBe(150);
      expect(result.vulnerabilities.critical).toBe(1);
      expect(result.vulnerabilities.high).toBe(1);
      expect(result.vulnerabilities.total).toBe(2);
      expect(result.details).toHaveLength(2);
      // Sorted by severity: critical first
      expect(result.details[0].name).toBe('axios');
      expect(result.details[0].fixAvailable).toBe(false);
      expect(result.details[1].name).toBe('lodash');
      expect(result.details[1].patchedVersion).toBe('4.17.21');
    });

    it('should handle clean audit (no vulnerabilities)', () => {
      const auditJson = JSON.stringify({
        vulnerabilities: {},
        metadata: { totalDependencies: 100 },
      });

      const result = parseNpmAuditOutput(auditJson);

      expect(result.totalDependencies).toBe(100);
      expect(result.vulnerabilities.total).toBe(0);
      expect(result.details).toHaveLength(0);
    });

    it('should handle malformed JSON gracefully', () => {
      const result = parseNpmAuditOutput('not valid json');

      expect(result.totalDependencies).toBe(0);
      expect(result.vulnerabilities.total).toBe(0);
      expect(result.details).toHaveLength(0);
      expect(result.rawOutput).toBe('not valid json');
    });

    it('should handle missing metadata', () => {
      const auditJson = JSON.stringify({
        vulnerabilities: {
          pkg: { severity: 'low', fixAvailable: true },
        },
      });

      const result = parseNpmAuditOutput(auditJson);

      expect(result.totalDependencies).toBe(0);
      expect(result.vulnerabilities.low).toBe(1);
    });

    it('should handle empty string input', () => {
      const result = parseNpmAuditOutput('');

      expect(result.totalDependencies).toBe(0);
      expect(result.details).toHaveLength(0);
    });

    it('should sort details by severity', () => {
      const auditJson = JSON.stringify({
        vulnerabilities: {
          low_pkg: { severity: 'low' },
          critical_pkg: { severity: 'critical' },
          moderate_pkg: { severity: 'moderate' },
        },
      });

      const result = parseNpmAuditOutput(auditJson);

      expect(result.details[0].severity).toBe('critical');
      expect(result.details[1].severity).toBe('moderate');
      expect(result.details[2].severity).toBe('low');
    });
  });
});
