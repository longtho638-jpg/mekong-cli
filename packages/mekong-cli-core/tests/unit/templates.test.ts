import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseSopYaml } from '../../src/sops/parser.js';
import { describe, it, expect } from 'vitest';

const TEMPLATES_DIR = join(__dirname, '../../src/sops/templates');

const templates = ['deploy', 'code-review', 'feature-dev', 'content-pipeline', 'incident-response'];

describe('SOP Templates', () => {
  for (const name of templates) {
    it(`${name}.yaml parses and validates`, () => {
      const content = readFileSync(join(TEMPLATES_DIR, `${name}.yaml`), 'utf-8');
      const result = parseSopYaml(content);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.sop.name).toBeTruthy();
        expect(result.value.sop.steps.length).toBeGreaterThan(0);
      }
    });
  }
});
