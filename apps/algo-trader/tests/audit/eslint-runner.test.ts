import { lintFile, lintFiles, LintResult } from '../../src/audit/eslint-runner';

describe('eslint-runner', () => {
  describe('lintFile', () => {
    it('should detect any types', () => {
      const content = `const x: any = "hello";`;
      const result = lintFile('test.ts', content);

      expect(result.issues.some((i) => i.rule === 'no-any-type')).toBe(true);
      expect(result.warningCount).toBeGreaterThan(0);
    });

    it('should detect @ts-ignore', () => {
      const content = `// @ts-ignore\nconst x = badCode();`;
      const result = lintFile('test.ts', content);

      // @ts-ignore is on a comment line — but our rule matches it
      const tsIgnoreIssues = result.issues.filter((i) => i.rule === 'no-ts-ignore');
      expect(tsIgnoreIssues.length).toBeGreaterThan(0);
      expect(tsIgnoreIssues[0].severity).toBe('error');
    });

    it('should detect console.log statements', () => {
      const content = `console.log("debug info");`;
      const result = lintFile('test.ts', content);

      expect(result.issues.some((i) => i.rule === 'no-console-log')).toBe(true);
    });

    it('should detect TODO/FIXME comments', () => {
      const content = `// TODO: fix this later\n// FIXME: broken logic`;
      const result = lintFile('test.ts', content);

      const todoIssues = result.issues.filter((i) => i.rule === 'no-todo-fixme');
      expect(todoIssues.length).toBe(2);
    });

    it('should detect empty catch blocks', () => {
      const content = `try { doSomething(); } catch (e) {}`;
      const result = lintFile('test.ts', content);

      expect(result.issues.some((i) => i.rule === 'no-empty-catch')).toBe(true);
      expect(result.errorCount).toBeGreaterThan(0);
    });

    it('should return clean result for good code', () => {
      const content = `export function add(a: number, b: number): number {\n  return a + b;\n}`;
      const result = lintFile('test.ts', content);

      expect(result.errorCount).toBe(0);
      // May have some warnings from magic number rule, but no errors
    });

    it('should include correct file path', () => {
      const result = lintFile('src/core/engine.ts', 'const x: any = 1;');
      expect(result.filePath).toBe('src/core/engine.ts');
    });

    it('should report correct line numbers', () => {
      const content = `line1\nline2\nconst x: any = 1;`;
      const result = lintFile('test.ts', content);

      const anyIssue = result.issues.find((i) => i.rule === 'no-any-type');
      expect(anyIssue?.line).toBe(3);
    });

    it('should skip any detection in comment lines', () => {
      const content = `// Note: any type here is documented\nconst x: any = 1;`;
      const result = lintFile('test.ts', content);

      // Should only detect on line 2, not the comment
      const anyIssues = result.issues.filter((i) => i.rule === 'no-any-type');
      expect(anyIssues).toHaveLength(1);
      expect(anyIssues[0].line).toBe(2);
    });
  });

  describe('lintFiles', () => {
    it('should lint multiple files and aggregate results', () => {
      const files = [
        { filePath: 'a.ts', content: 'const x: any = 1;' },
        { filePath: 'b.ts', content: 'console.log("hi");' },
      ];
      const summary = lintFiles(files);

      expect(summary.totalFiles).toBe(2);
      expect(summary.totalWarnings).toBeGreaterThan(0);
    });

    it('should track issues by rule', () => {
      const files = [
        { filePath: 'a.ts', content: 'const x: any = 1;' },
        { filePath: 'b.ts', content: 'const y: any = 2;' },
      ];
      const summary = lintFiles(files);

      expect(summary.issuesByRule['no-any-type']).toBe(2);
    });

    it('should handle empty file list', () => {
      const summary = lintFiles([]);

      expect(summary.totalFiles).toBe(0);
      expect(summary.totalErrors).toBe(0);
      expect(summary.totalWarnings).toBe(0);
    });
  });
});
