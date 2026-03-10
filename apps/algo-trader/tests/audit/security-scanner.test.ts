import { scanFile, scanFiles, SecurityFinding, CheckType } from '../../src/audit/security-scanner';

describe('security-scanner', () => {
  const allChecks: CheckType[] = [
    'hardcodedSecrets', 'unsafeEval', 'insecureRandom', 'inputValidation', 'sqlInjection',
  ];

  describe('scanFile', () => {
    it('should detect hardcoded API keys', () => {
      const content = `const config = { api_key: "sk_live_1234567890abcdef" };`;
      const findings = scanFile('test.ts', content, ['hardcodedSecrets']);

      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].check).toBe('hardcodedSecrets');
      expect(findings[0].severity).toBe('critical');
    });

    it('should detect hardcoded passwords', () => {
      const content = `const password = "mySecretPassword123";`;
      const findings = scanFile('test.ts', content, ['hardcodedSecrets']);

      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].message).toContain('password');
    });

    it('should detect blockchain addresses', () => {
      const content = `const wallet = 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD45;`;
      const findings = scanFile('test.ts', content, ['hardcodedSecrets']);

      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].severity).toBe('high');
    });

    it('should detect eval() usage', () => {
      const content = `const result = eval("2 + 2");`;
      const findings = scanFile('test.ts', content, ['unsafeEval']);

      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe('critical');
      expect(findings[0].message).toContain('eval');
    });

    it('should detect new Function() usage', () => {
      const content = `const fn = new Function("return 42");`;
      const findings = scanFile('test.ts', content, ['unsafeEval']);

      expect(findings).toHaveLength(1);
      expect(findings[0].message).toContain('Function');
    });

    it('should detect Math.random()', () => {
      const content = `const nonce = Math.random().toString(36);`;
      const findings = scanFile('test.ts', content, ['insecureRandom']);

      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe('medium');
    });

    it('should detect SQL injection via template literals', () => {
      const content = 'const q = `SELECT * FROM users WHERE id = ${userId}`;';
      const findings = scanFile('test.ts', content, ['sqlInjection']);

      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe('critical');
    });

    it('should detect unvalidated request data access', () => {
      const content = `const name = req.body.name;`;
      const findings = scanFile('test.ts', content, ['inputValidation']);

      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe('medium');
    });

    it('should skip comments', () => {
      const content = `// eval("dangerous code");\n  * eval("in block comment")`;
      const findings = scanFile('test.ts', content, ['unsafeEval']);

      expect(findings).toHaveLength(0);
    });

    it('should return empty for clean code', () => {
      const content = `export function add(a: number, b: number): number { return a + b; }`;
      const findings = scanFile('test.ts', content, allChecks);

      expect(findings).toHaveLength(0);
    });

    it('should only run enabled checks', () => {
      const content = `const result = eval("1+1"); const r = Math.random();`;
      const findings = scanFile('test.ts', content, ['unsafeEval']);

      // Should only find eval, not Math.random
      expect(findings).toHaveLength(1);
      expect(findings[0].check).toBe('unsafeEval');
    });

    it('should include correct line and column numbers', () => {
      const content = `line1\nline2\nconst x = eval("test");`;
      const findings = scanFile('test.ts', content, ['unsafeEval']);

      expect(findings[0].line).toBe(3);
      expect(findings[0].column).toBeGreaterThan(0);
    });

    it('should include code snippet', () => {
      const content = `line1\nconst x = eval("test");\nline3`;
      const findings = scanFile('test.ts', content, ['unsafeEval']);

      expect(findings[0].codeSnippet).toContain('eval');
    });
  });

  describe('scanFiles', () => {
    it('should scan multiple files', () => {
      const files = [
        { filePath: 'a.ts', content: `eval("1")` },
        { filePath: 'b.ts', content: `const r = Math.random();` },
      ];
      const findings = scanFiles(files, allChecks);

      expect(findings.length).toBeGreaterThanOrEqual(2);
    });

    it('should sort by severity (critical first)', () => {
      const files = [
        { filePath: 'a.ts', content: `const r = Math.random();` },
        { filePath: 'b.ts', content: `eval("1")` },
      ];
      const findings = scanFiles(files, allChecks);

      // eval is critical, Math.random is medium
      expect(findings[0].severity).toBe('critical');
    });

    it('should return empty array for clean files', () => {
      const files = [
        { filePath: 'a.ts', content: 'export const x = 1;' },
      ];
      const findings = scanFiles(files, allChecks);

      expect(findings).toHaveLength(0);
    });
  });
});
