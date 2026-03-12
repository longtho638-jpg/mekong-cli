/**
 * Phase 7 tests: SOP Template Engine
 * Covers: substituteVariables, loadTemplate, parseTemplateInfo, TemplateRegistry
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import {
  substituteVariables,
  loadTemplate,
  parseTemplateInfo,
  TemplateRegistry,
} from '../../src/sops/template-engine.js';

// ─── substituteVariables ────────────────────────────────────────────────────

describe('substituteVariables', () => {
  it('replaces a single variable', () => {
    expect(substituteVariables('hello {name}', { name: 'world' })).toBe('hello world');
  });

  it('replaces multiple variables', () => {
    const result = substituteVariables('{env} deploy {branch}', {
      env: 'production',
      branch: 'main',
    });
    expect(result).toBe('production deploy main');
  });

  it('leaves unknown variables as-is', () => {
    expect(substituteVariables('deploy {unknown_var}', {})).toBe('deploy {unknown_var}');
  });

  it('replaces same variable multiple times', () => {
    const result = substituteVariables('{x} + {x} = double {x}', { x: '5' });
    expect(result).toBe('5 + 5 = double 5');
  });

  it('handles empty variables map', () => {
    expect(substituteVariables('no vars here', {})).toBe('no vars here');
  });

  it('handles empty template string', () => {
    expect(substituteVariables('', { x: 'y' })).toBe('');
  });

  it('handles variable at start and end', () => {
    expect(substituteVariables('{a}...{b}', { a: 'start', b: 'end' })).toBe('start...end');
  });

  it('trims whitespace around variable name', () => {
    expect(substituteVariables('{ name }', { name: 'alice' })).toBe('alice');
  });

  it('does not replace partial matches without braces', () => {
    expect(substituteVariables('no_braces', { no_braces: 'replaced' })).toBe('no_braces');
  });
});

// ─── parseTemplateInfo ──────────────────────────────────────────────────────

describe('parseTemplateInfo', () => {
  const VALID_YAML = `
sop:
  name: "Test SOP"
  version: "2.0.0"
  description: "A test template"
  category: testing
  tags: [unit, test]
  inputs:
    - name: target
      type: string
      required: true
      description: "Target environment"
    - name: branch
      type: string
      required: false
      default: "main"
  steps:
    - id: run
      name: "Run"
      action: shell
      command: "echo {target}"
      on_failure: stop
`;

  it('parses valid YAML into TemplateInfo', () => {
    const result = parseTemplateInfo(VALID_YAML, 'test.yaml');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe('Test SOP');
      expect(result.value.version).toBe('2.0.0');
      expect(result.value.description).toBe('A test template');
      expect(result.value.category).toBe('testing');
      expect(result.value.tags).toEqual(['unit', 'test']);
      expect(result.value.inputs).toHaveLength(2);
      expect(result.value.filename).toBe('test.yaml');
    }
  });

  it('parses input fields correctly', () => {
    const result = parseTemplateInfo(VALID_YAML, 'test.yaml');
    expect(result.ok).toBe(true);
    if (result.ok) {
      const [req, opt] = result.value.inputs;
      expect(req.name).toBe('target');
      expect(req.required).toBe(true);
      expect(req.description).toBe('Target environment');
      expect(opt.name).toBe('branch');
      expect(opt.required).toBe(false);
      expect(opt.default).toBe('main');
    }
  });

  it('returns err for invalid YAML', () => {
    const result = parseTemplateInfo('{ invalid: [yaml: :', 'bad.yaml');
    expect(result.ok).toBe(false);
  });

  it('returns err when sop: root key is missing', () => {
    const result = parseTemplateInfo('name: test\nsteps: []', 'no-root.yaml');
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error.message).toMatch(/sop:/);
  });

  it('uses filename as name fallback when name missing', () => {
    const yaml = `
sop:
  version: "1.0.0"
  steps: []
`;
    const result = parseTemplateInfo(yaml, 'fallback.yaml');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe('fallback.yaml');
    }
  });
});

// ─── loadTemplate ────────────────────────────────────────────────────────────

describe('loadTemplate', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `sop-engine-${randomUUID()}`);
    await fs.mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  const DEPLOY_TEMPLATE = `sop:
  name: "Deploy"
  version: "1.0.0"
  inputs:
    - name: environment
      type: string
      required: true
    - name: branch
      type: string
      required: false
      default: main
  steps:
    - id: deploy
      name: "Deploy to {environment}"
      action: shell
      command: "git checkout {branch} && deploy.sh {environment}"
      on_failure: stop
`;

  it('loads template and substitutes variables', async () => {
    const filePath = join(tmpDir, 'deploy.yaml');
    await fs.writeFile(filePath, DEPLOY_TEMPLATE, 'utf-8');

    const result = await loadTemplate(filePath, { environment: 'production' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe('Deploy');
      expect(result.value.content).toContain('production');
      expect(result.value.content).toContain('main'); // default applied
      expect(result.value.variables.environment).toBe('production');
      expect(result.value.variables.branch).toBe('main');
      expect(result.value.source).toBe(filePath);
    }
  });

  it('applies default values for missing optional inputs', async () => {
    const filePath = join(tmpDir, 'defaults.yaml');
    await fs.writeFile(filePath, DEPLOY_TEMPLATE, 'utf-8');

    const result = await loadTemplate(filePath, { environment: 'staging' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.variables.branch).toBe('main');
    }
  });

  it('returns err when required input is missing', async () => {
    const filePath = join(tmpDir, 'missing-req.yaml');
    await fs.writeFile(filePath, DEPLOY_TEMPLATE, 'utf-8');

    const result = await loadTemplate(filePath, {}); // no environment
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error.message).toMatch(/environment/);
  });

  it('returns err when file does not exist', async () => {
    const result = await loadTemplate(join(tmpDir, 'nonexistent.yaml'));
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error.message).toMatch(/not found/i);
  });

  it('returns err when YAML is invalid', async () => {
    const filePath = join(tmpDir, 'invalid.yaml');
    await fs.writeFile(filePath, '{ bad: [yaml: :', 'utf-8');
    const result = await loadTemplate(filePath);
    expect(result.ok).toBe(false);
  });

  it('returns err when sop: root key is missing', async () => {
    const filePath = join(tmpDir, 'no-root.yaml');
    await fs.writeFile(filePath, 'name: test\nsteps: []', 'utf-8');
    const result = await loadTemplate(filePath);
    expect(result.ok).toBe(false);
  });

  it('content is unchanged when no variables present in template', async () => {
    const simple = `sop:\n  name: Simple\n  steps:\n    - id: run\n      name: Run\n      action: shell\n      command: echo hello\n      on_failure: stop\n`;
    const filePath = join(tmpDir, 'simple.yaml');
    await fs.writeFile(filePath, simple, 'utf-8');
    const result = await loadTemplate(filePath, {});
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.content).toContain('echo hello');
    }
  });
});

// ─── TemplateRegistry ────────────────────────────────────────────────────────

describe('TemplateRegistry', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `sop-registry-${randomUUID()}`);
    await fs.mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  async function writeTemplate(name: string, sopName: string, hasInputs = false): Promise<void> {
    const inputs = hasInputs
      ? `\n  inputs:\n    - name: env\n      type: string\n      required: true\n`
      : '';
    const cmd = hasInputs ? `deploy.sh {env}` : `echo ${sopName}`;
    const yaml = `sop:\n  name: "${sopName}"\n  version: "1.0.0"${inputs}\n  steps:\n    - id: s1\n      name: Step\n      action: shell\n      command: ${cmd}\n      on_failure: stop\n`;
    await fs.writeFile(join(tmpDir, name), yaml, 'utf-8');
  }

  it('loadAll() returns empty when directory is empty', async () => {
    const registry = new TemplateRegistry(tmpDir);
    const result = await registry.loadAll();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toHaveLength(0);
  });

  it('loadAll() returns err when directory does not exist', async () => {
    const registry = new TemplateRegistry(join(tmpDir, 'nonexistent'));
    const result = await registry.loadAll();
    expect(result.ok).toBe(false);
  });

  it('loadAll() discovers all yaml templates', async () => {
    await writeTemplate('alpha.yaml', 'Alpha');
    await writeTemplate('beta.yaml', 'Beta');
    await writeTemplate('gamma.yml', 'Gamma');
    await fs.writeFile(join(tmpDir, 'ignore.txt'), 'not yaml', 'utf-8');

    const registry = new TemplateRegistry(tmpDir);
    const result = await registry.loadAll();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(3);
      const names = result.value.map(t => t.name);
      expect(names).toContain('Alpha');
      expect(names).toContain('Beta');
      expect(names).toContain('Gamma');
    }
  });

  it('list() returns template names after loadAll()', async () => {
    await writeTemplate('t1.yaml', 'Template One');
    await writeTemplate('t2.yaml', 'Template Two');

    const registry = new TemplateRegistry(tmpDir);
    await registry.loadAll();
    const names = registry.list();
    expect(names).toContain('Template One');
    expect(names).toContain('Template Two');
  });

  it('get() returns template info by name', async () => {
    await writeTemplate('lookup.yaml', 'Lookup SOP');

    const registry = new TemplateRegistry(tmpDir);
    await registry.loadAll();
    const info = registry.get('Lookup SOP');
    expect(info).toBeDefined();
    expect(info?.version).toBe('1.0.0');
    expect(info?.filename).toBe('lookup.yaml');
  });

  it('get() returns undefined for unknown name', async () => {
    const registry = new TemplateRegistry(tmpDir);
    await registry.loadAll();
    expect(registry.get('does-not-exist')).toBeUndefined();
  });

  it('instantiate() returns err when template is not loaded', async () => {
    const registry = new TemplateRegistry(tmpDir);
    await registry.loadAll();
    const result = await registry.instantiate('missing-template');
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error.message).toMatch(/not found/i);
  });

  it('instantiate() substitutes variables in template', async () => {
    await writeTemplate('env-deploy.yaml', 'Env Deploy', true);

    const registry = new TemplateRegistry(tmpDir);
    await registry.loadAll();
    const result = await registry.instantiate('Env Deploy', { env: 'prod' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.content).toContain('prod');
    }
  });

  it('instantiate() returns err when required input is missing', async () => {
    await writeTemplate('req-input.yaml', 'Required Input', true);

    const registry = new TemplateRegistry(tmpDir);
    await registry.loadAll();
    const result = await registry.instantiate('Required Input', {});
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error.message).toMatch(/env/);
  });
});

// ─── Real templates integration ──────────────────────────────────────────────

describe('Real SOP templates (src/sops/templates)', () => {
  const REAL_TEMPLATES_DIR = join(
    import.meta.dirname ?? '',
    '../../src/sops/templates',
  );

  it('TemplateRegistry loads all real templates', async () => {
    const registry = new TemplateRegistry(REAL_TEMPLATES_DIR);
    const result = await registry.loadAll();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBeGreaterThanOrEqual(10);
    }
  });

  it('deploy template instantiates with required inputs', async () => {
    const filePath = join(REAL_TEMPLATES_DIR, 'deploy.yaml');
    const result = await loadTemplate(filePath, {
      environment: 'staging',
      branch: 'release/v1',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.content).toContain('staging');
      expect(result.value.content).toContain('release/v1');
    }
  });

  it('feature-dev template has expected inputs', async () => {
    const registry = new TemplateRegistry(REAL_TEMPLATES_DIR);
    await registry.loadAll();
    const info = registry.get('Feature Development');
    expect(info).toBeDefined();
    if (info) {
      const inputNames = info.inputs.map(i => i.name);
      expect(inputNames).toContain('feature_name');
    }
  });
});
