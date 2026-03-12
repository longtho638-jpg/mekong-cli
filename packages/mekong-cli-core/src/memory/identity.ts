/**
 * Identity parser — reads SOUL.md to extract agent personality,
 * boundaries, and constraints.
 */
import { readFileContent } from '../utils/file.js';
import { ok, err, type Result } from '../types/common.js';

export interface ScopeControls {
  wipLimit: number;
  maxTaskDepth: number;
  maxTokensPerTurn: number;
  timeLimit: number;
}

export interface ParsedIdentityConfig {
  name: string;
  personality: string;
  boundaries: string[];
  scopeControls: ScopeControls;
  qualityGates: string[];
  escalationProtocol: Record<string, string>;
  communicationStyle: string[];
}

/** Parse a SOUL.md or identity markdown file */
export async function loadIdentity(filePath: string): Promise<Result<ParsedIdentityConfig>> {
  const fileResult = await readFileContent(filePath);
  if (!fileResult.ok) {
    return err(fileResult.error);
  }

  try {
    const config = parseIdentityMarkdown(fileResult.value);
    return ok(config);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

/** Parse markdown sections into ParsedIdentityConfig */
export function parseIdentityMarkdown(content: string): ParsedIdentityConfig {
  const sections = parseSections(content);

  return {
    name: extractField(sections, 'who am i') ?? 'mekong',
    personality: sections['personality'] ?? '',
    boundaries: extractList(sections['boundaries'] ?? sections['boundaries — never cross'] ?? ''),
    scopeControls: {
      wipLimit: 3,
      maxTaskDepth: 5,
      maxTokensPerTurn: 4096,
      timeLimit: 300,
    },
    qualityGates: extractList(sections['quality standards'] ?? ''),
    escalationProtocol: extractKeyValues(sections['when confused'] ?? ''),
    communicationStyle: extractList(sections['personality'] ?? ''),
  };
}

/** Split markdown into sections by ## headings */
function parseSections(content: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = content.split('\n');
  let currentSection = '';
  let currentContent: string[] = [];

  for (const line of lines) {
    const heading = line.match(/^#{1,3}\s+(.+)/);
    if (heading) {
      if (currentSection) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      currentSection = heading[1].toLowerCase().trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  if (currentSection) {
    sections[currentSection] = currentContent.join('\n').trim();
  }
  return sections;
}

/** Extract a field like "I am X" from a section */
function extractField(sections: Record<string, string>, section: string): string | undefined {
  const content = sections[section];
  if (!content) return undefined;
  const match = content.match(/I am (\w+)/i);
  return match?.[1];
}

/** Extract bullet points as array */
function extractList(content: string): string[] {
  return content
    .split('\n')
    .filter(line => line.match(/^[-*]\s+/))
    .map(line => line.replace(/^[-*]\s+/, '').trim())
    .filter(Boolean);
}

/** Extract numbered list as key-value pairs */
function extractKeyValues(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split('\n').filter(line => line.match(/^\d+\.\s+/));
  for (const line of lines) {
    const match = line.match(/^\d+\.\s+(.+)/);
    if (match) {
      const text = match[1].trim();
      result[`step_${Object.keys(result).length + 1}`] = text;
    }
  }
  return result;
}
