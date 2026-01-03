#!/usr/bin/env node
/**
 * Split large markdown docs by H2 sections.
 *
 * Usage:
 *   node .claude/scripts/split-large-docs.cjs <file.md> [--max-loc N] [--dry-run]
 *
 * Reads docs.maxLoc from .claude/.ck.json (default: 800).
 * Splits by ## headers, creates {filename}/index.md + part files.
 */

const fs = require('fs');
const path = require('path');

/**
 * Load .ck.json config, searching up directory tree.
 */
function loadConfig(startPath) {
  let current = path.resolve(startPath);
  while (current !== path.dirname(current)) {
    const configPath = path.join(current, '.claude', '.ck.json');
    if (fs.existsSync(configPath)) {
      try {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch {
        return {};
      }
    }
    current = path.dirname(current);
  }
  return {};
}

/**
 * Get max LOC from override, config, or default.
 */
function getMaxLoc(config, override) {
  if (override) return override;
  return config?.docs?.maxLoc ?? 800;
}

/**
 * Extract YAML frontmatter and body from markdown.
 */
function parseFrontmatter(content) {
  if (content.startsWith('---')) {
    const end = content.indexOf('---', 3);
    if (end !== -1) {
      const frontmatter = content.slice(0, end + 3);
      const body = content.slice(end + 3).replace(/^\n+/, '');
      return { frontmatter, body };
    }
  }
  return { frontmatter: '', body: content };
}

/**
 * Split markdown body by H2 headers.
 * Returns array of {title, content} objects.
 */
function splitByH2(body) {
  const lines = body.split('\n');
  const sections = [];
  let currentTitle = null;  // No title for preamble
  let currentContent = [];

  for (const line of lines) {
    const match = line.match(/^## (.+)$/);
    if (match) {
      // Save previous section if it has meaningful content (not just whitespace)
      if (currentContent.length && currentContent.some(l => l.trim())) {
        // Only add preamble if it has actual content
        if (currentTitle !== null) {
          sections.push({ title: currentTitle, content: currentContent.join('\n') });
        } else {
          // Preamble - include as "preamble" only if has real content beyond just # title
          const realContent = currentContent.filter(l => !l.match(/^#\s/) && l.trim());
          if (realContent.length) {
            sections.push({ title: 'Preamble', content: currentContent.join('\n') });
          }
        }
      }
      currentTitle = match[1].trim();
      currentContent = [line];
    } else {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentContent.length && currentTitle !== null) {
    sections.push({ title: currentTitle, content: currentContent.join('\n') });
  }

  return sections;
}

/**
 * Convert title to kebab-case slug.
 */
function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Create index.md with links to parts.
 */
function createIndex(originalName, sections, frontmatter) {
  const lines = [];
  if (frontmatter) {
    lines.push(frontmatter, '');
  }
  lines.push(`# ${originalName}`, '');
  lines.push('This document has been split into sections:', '');

  for (const { title } of sections) {
    const slug = slugify(title);
    lines.push(`- [${title}](./${slug}.md)`);
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Split a markdown file if it exceeds max_loc.
 * Returns { wasSplit, message }.
 */
function splitFile(filepath, maxLoc, dryRun = false) {
  if (!fs.existsSync(filepath)) {
    return { wasSplit: false, message: `File not found: ${filepath}` };
  }

  const content = fs.readFileSync(filepath, 'utf8');
  const loc = content.split('\n').length;

  if (loc <= maxLoc) {
    return { wasSplit: false, message: `${path.basename(filepath)}: ${loc} LOC (under ${maxLoc} limit)` };
  }

  const { frontmatter, body } = parseFrontmatter(content);
  const sections = splitByH2(body);

  if (sections.length < 2) {
    return { wasSplit: false, message: `${path.basename(filepath)}: ${loc} LOC but no H2 sections to split` };
  }

  const stem = path.basename(filepath, path.extname(filepath));
  const outputDir = path.join(path.dirname(filepath), stem);

  if (dryRun) {
    console.log(`\n[DRY RUN] Would create: ${outputDir}/`);
    const indexContent = createIndex(stem, sections, frontmatter);
    console.log(`  - index.md (${indexContent.split('\n').length} lines)`);
    for (const { title, content: sectionContent } of sections) {
      const slug = slugify(title);
      console.log(`  - ${slug}.md (${sectionContent.split('\n').length} lines)`);
    }
    return { wasSplit: true, message: `${path.basename(filepath)}: Would split into ${sections.length} parts` };
  }

  // Create output directory
  fs.mkdirSync(outputDir, { recursive: true });

  // Write index
  const indexContent = createIndex(stem, sections, frontmatter);
  fs.writeFileSync(path.join(outputDir, 'index.md'), indexContent, 'utf8');

  // Write sections
  for (const { title, content: sectionContent } of sections) {
    const slug = slugify(title);
    let partContent = sectionContent;
    if (frontmatter) {
      partContent = `---\ntitle: "${title}"\n---\n\n${sectionContent}`;
    }
    fs.writeFileSync(path.join(outputDir, `${slug}.md`), partContent, 'utf8');
  }

  return { wasSplit: true, message: `${path.basename(filepath)}: Split into ${sections.length} parts in ${outputDir}/` };
}

/**
 * Parse CLI arguments.
 */
function parseArgs(args) {
  const result = { file: null, maxLoc: null, dryRun: false };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--max-loc' && args[i + 1]) {
      result.maxLoc = parseInt(args[++i], 10);
    } else if (arg === '--dry-run') {
      result.dryRun = true;
    } else if (!arg.startsWith('-')) {
      result.file = arg;
    }
  }

  return result;
}

// Main
const args = parseArgs(process.argv.slice(2));

if (!args.file) {
  console.log('Usage: node split-large-docs.cjs <file.md> [--max-loc N] [--dry-run]');
  console.log('');
  console.log('Options:');
  console.log('  --max-loc N   Maximum lines of code (default: from config or 800)');
  console.log('  --dry-run     Show what would be done without writing');
  process.exit(1);
}

const filepath = path.resolve(args.file);
const config = loadConfig(filepath);
const maxLoc = getMaxLoc(config, args.maxLoc);

const { wasSplit, message } = splitFile(filepath, maxLoc, args.dryRun);
console.log(message);

process.exit(wasSplit ? 0 : 1);
