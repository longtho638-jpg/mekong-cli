/**
 * SOP Template Engine — loads and instantiates SOP templates.
 *
 * Supports:
 *  - Variable substitution: {var_name} syntax
 *  - Template registry: discover templates from directory
 *  - Input validation: checks required inputs are provided
 *  - Template listing: enumerate available templates
 */
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { ok, err } from '../types/common.js';
import type { Result } from '../types/common.js';

/** Raw template metadata (subset parsed from YAML) */
export interface TemplateInfo {
  name: string;
  version: string;
  description: string;
  category?: string;
  tags?: string[];
  inputs: TemplateInput[];
  filename: string;
}

export interface TemplateInput {
  name: string;
  type: string;
  required: boolean;
  default?: unknown;
  description?: string;
}

/** Result of instantiating a template with variables */
export interface TemplateInstance {
  name: string;
  source: string;
  content: string;
  variables: Record<string, string>;
}

/**
 * Substitute {variable} placeholders in a string.
 * Unknown variables are left as-is.
 */
export function substituteVariables(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(/\{([^}]+)\}/g, (match, key: string) => {
    const trimmed = key.trim();
    return Object.prototype.hasOwnProperty.call(variables, trimmed)
      ? String(variables[trimmed])
      : match;
  });
}

/**
 * Load a single SOP template from disk and instantiate with variables.
 */
export async function loadTemplate(
  templatePath: string,
  variables: Record<string, string> = {},
): Promise<Result<TemplateInstance>> {
  let raw: string;
  try {
    raw = await readFile(templatePath, 'utf-8');
  } catch {
    return err(new Error(`Template file not found: ${templatePath}`));
  }

  // Parse to extract input requirements
  let parsed: Record<string, unknown>;
  try {
    parsed = parseYaml(raw) as Record<string, unknown>;
  } catch (e) {
    return err(new Error(`Invalid YAML in template ${templatePath}: ${e}`));
  }

  // Extract inputs from the template
  const sopNode = parsed['sop'] as Record<string, unknown> | undefined;
  if (!sopNode) {
    return err(new Error(`Template missing 'sop:' root key: ${templatePath}`));
  }

  const inputs = (sopNode['inputs'] as TemplateInput[] | undefined) ?? [];
  const missingRequired: string[] = [];

  for (const input of inputs) {
    if (input.required !== false && input.default === undefined) {
      if (!Object.prototype.hasOwnProperty.call(variables, input.name)) {
        missingRequired.push(input.name);
      }
    }
  }

  if (missingRequired.length > 0) {
    return err(new Error(`Missing required inputs: ${missingRequired.join(', ')}`));
  }

  // Apply defaults for missing optional variables
  const mergedVars: Record<string, string> = { ...variables };
  for (const input of inputs) {
    if (
      !Object.prototype.hasOwnProperty.call(mergedVars, input.name) &&
      input.default !== undefined
    ) {
      mergedVars[input.name] = String(input.default);
    }
  }

  const content = substituteVariables(raw, mergedVars);
  const name = typeof sopNode['name'] === 'string' ? sopNode['name'] : 'unknown';

  return ok({
    name,
    source: templatePath,
    content,
    variables: mergedVars,
  });
}

/**
 * Parse template metadata (name, inputs) without variable substitution.
 */
export function parseTemplateInfo(content: string, filename: string): Result<TemplateInfo> {
  let parsed: Record<string, unknown>;
  try {
    parsed = parseYaml(content) as Record<string, unknown>;
  } catch (e) {
    return err(new Error(`YAML parse error in ${filename}: ${e}`));
  }

  const sop = parsed['sop'] as Record<string, unknown> | undefined;
  if (!sop) {
    return err(new Error(`Template missing 'sop:' root key: ${filename}`));
  }

  const rawInputs = (sop['inputs'] as Array<Record<string, unknown>> | undefined) ?? [];
  const inputs: TemplateInput[] = rawInputs.map(i => ({
    name: String(i['name'] ?? ''),
    type: String(i['type'] ?? 'string'),
    required: i['required'] !== false,
    default: i['default'],
    description: i['description'] != null ? String(i['description']) : undefined,
  }));

  return ok({
    name: String(sop['name'] ?? filename),
    version: String(sop['version'] ?? '1.0.0'),
    description: String(sop['description'] ?? ''),
    category: sop['category'] != null ? String(sop['category']) : undefined,
    tags: Array.isArray(sop['tags']) ? sop['tags'].map(String) : [],
    inputs,
    filename,
  });
}

/**
 * Template registry — discovers and indexes templates from a directory.
 */
export class TemplateRegistry {
  private dir: string;
  private cache: Map<string, TemplateInfo> = new Map();

  constructor(dir: string) {
    this.dir = dir;
  }

  /** Scan directory and populate cache */
  async loadAll(): Promise<Result<TemplateInfo[]>> {
    let entries: string[];
    try {
      entries = await readdir(this.dir);
    } catch {
      return err(new Error(`Template directory not found: ${this.dir}`));
    }

    const yamlFiles = entries.filter(
      e => e.endsWith('.yaml') || e.endsWith('.yml'),
    );

    const infos: TemplateInfo[] = [];
    const errors: string[] = [];

    for (const filename of yamlFiles) {
      const filePath = join(this.dir, filename);
      try {
        const content = await readFile(filePath, 'utf-8');
        const result = parseTemplateInfo(content, filename);
        if (result.ok) {
          this.cache.set(result.value.name, result.value);
          infos.push(result.value);
        } else {
          errors.push(`${filename}: ${result.error.message}`);
        }
      } catch (e) {
        errors.push(`${filename}: ${e}`);
      }
    }

    if (errors.length > 0 && infos.length === 0) {
      return err(new Error(`All templates failed to load:\n${errors.join('\n')}`));
    }

    return ok(infos);
  }

  /** Get template info by name (requires loadAll called first) */
  get(name: string): TemplateInfo | undefined {
    return this.cache.get(name);
  }

  /** List all cached template names */
  list(): string[] {
    return Array.from(this.cache.keys());
  }

  /** Instantiate a template by name with variables */
  async instantiate(
    name: string,
    variables: Record<string, string> = {},
  ): Promise<Result<TemplateInstance>> {
    const info = this.cache.get(name);
    if (!info) {
      return err(new Error(`Template not found: ${name}. Run loadAll() first.`));
    }
    const filePath = join(this.dir, info.filename);
    return loadTemplate(filePath, variables);
  }
}
