/**
 * Markdown rendering engine with syntax highlighting and image resolution
 * Converts markdown to styled HTML for novel-reader UI
 */

const fs = require('fs');
const path = require('path');

// Lazy load dependencies
let marked = null;
let hljs = null;
let matter = null;

/**
 * Initialize markdown dependencies
 */
function initDependencies() {
  if (!marked) {
    const { Marked } = require('marked');
    hljs = require('highlight.js');

    marked = new Marked({
      gfm: true,
      breaks: true
    });

    // Configure highlight.js renderer
    marked.setOptions({
      highlight: (code, lang) => {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, { language: lang }).value;
          } catch {
            return code;
          }
        }
        return hljs.highlightAuto(code).value;
      }
    });

    matter = require('gray-matter');
  }
}

/**
 * Resolve relative image paths to /file/ routes
 * @param {string} markdown - Markdown content
 * @param {string} basePath - Base directory path
 * @returns {string} - Markdown with resolved image paths
 */
function resolveImages(markdown, basePath) {
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;

  return markdown.replace(imgRegex, (match, alt, src) => {
    // Skip absolute URLs
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return match;
    }

    // Resolve relative path
    const absolutePath = path.resolve(basePath, src);
    return `![${alt}](/file${absolutePath})`;
  });
}

/**
 * Generate table of contents from headings
 * @param {string} html - Rendered HTML
 * @returns {Array<{level: number, id: string, text: string}>} - TOC items
 */
function generateTOC(html) {
  const headings = [];
  // Match h1-h3 with id attribute
  const regex = /<h([1-3])[^>]*id="([^"]+)"[^>]*>([^<]+)<\/h\1>/gi;

  let match;
  while ((match = regex.exec(html)) !== null) {
    headings.push({
      level: parseInt(match[1], 10),
      id: match[2],
      text: match[3].trim()
    });
  }

  return headings;
}

/**
 * Generate a slug from text for use as anchor ID (matches plan-navigator.cjs)
 * @param {string} text - Text to slugify
 * @returns {string} - URL-safe slug
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Add IDs to headings for anchor links
 * Also adds phase-specific IDs for inline phases in plan.md
 * @param {string} html - Rendered HTML
 * @returns {string} - HTML with heading IDs
 */
function addHeadingIds(html) {
  const usedIds = new Set();

  return html.replace(/<h([1-6])>([^<]+)<\/h\1>/gi, (match, level, text) => {
    // Check if this is a phase heading (e.g., "Phase 01: Name" or contains phase table row content)
    const phaseMatch = text.match(/^Phase\s*(\d+)[:\s]+(.+)/i);

    let id;
    if (phaseMatch) {
      // Generate phase-specific anchor ID that matches plan-navigator.cjs format
      const phaseNum = parseInt(phaseMatch[1], 10);
      const phaseName = phaseMatch[2].trim();
      id = `phase-${String(phaseNum).padStart(2, '0')}-${slugify(phaseName)}`;
    } else {
      // Standard heading ID generation
      id = slugify(text);
    }

    // Handle duplicate IDs
    let uniqueId = id;
    let counter = 1;
    while (usedIds.has(uniqueId)) {
      uniqueId = `${id}-${counter}`;
      counter++;
    }
    usedIds.add(uniqueId);

    return `<h${level} id="${uniqueId}">${text}</h${level}>`;
  });
}

/**
 * Add anchor IDs to phase table rows
 * Matches table rows with phase numbers: | 01 | Description | Status |
 * @param {string} html - Rendered HTML
 * @returns {string} - HTML with phase anchor IDs in table rows
 */
function addPhaseTableAnchors(html) {
  const usedIds = new Set();

  // Match table rows with phase pattern: <tr><td>01</td><td>Description</td>...
  // This handles the "Phase Summary" table format
  return html.replace(/<tr>\s*<td>(\d{2})<\/td>\s*<td>([^<]+)<\/td>/gi, (match, phaseNum, description) => {
    const num = parseInt(phaseNum, 10);
    const slug = slugify(description.trim());
    const id = `phase-${String(num).padStart(2, '0')}-${slug}`;

    // Handle duplicates
    let uniqueId = id;
    let counter = 1;
    while (usedIds.has(uniqueId)) {
      uniqueId = `${id}-${counter}`;
      counter++;
    }
    usedIds.add(uniqueId);

    // Add anchor span at the start of the row
    return `<tr id="${uniqueId}"><td>${phaseNum}</td><td>${description}</td>`;
  });
}

/**
 * Parse frontmatter from markdown
 * @param {string} content - Raw markdown content
 * @returns {{data: Object, content: string}} - Parsed frontmatter and content
 */
function parseFrontmatter(content) {
  initDependencies();
  return matter(content);
}

/**
 * Render markdown file to HTML
 * @param {string} filePath - Path to markdown file
 * @param {Object} options - Render options
 * @returns {{html: string, toc: Array, frontmatter: Object, title: string}}
 */
function renderMarkdownFile(filePath, options = {}) {
  initDependencies();

  const rawContent = fs.readFileSync(filePath, 'utf8');
  const basePath = path.dirname(filePath);

  // Parse frontmatter
  const { data: frontmatter, content } = parseFrontmatter(rawContent);

  // Resolve image paths
  const resolvedContent = resolveImages(content, basePath);

  // Render markdown to HTML
  let html = marked.parse(resolvedContent);

  // Add IDs to headings
  html = addHeadingIds(html);

  // Add anchor IDs to phase table rows (for inline phases in plan.md)
  html = addPhaseTableAnchors(html);

  // Generate TOC
  const toc = generateTOC(html);

  // Extract title from frontmatter or first h1
  let title = frontmatter.title;
  if (!title) {
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    title = h1Match ? h1Match[1] : path.basename(filePath, '.md');
  }

  return {
    html,
    toc,
    frontmatter,
    title
  };
}

/**
 * Render TOC as HTML sidebar
 * @param {Array} toc - TOC items
 * @returns {string} - HTML string
 */
function renderTOCHtml(toc) {
  if (!toc.length) return '';

  const items = toc.map(({ level, id, text }) => {
    const indent = (level - 1) * 12;
    return `<li style="padding-left: ${indent}px"><a href="#${id}">${text}</a></li>`;
  }).join('\n');

  return `<ul class="toc-list">${items}</ul>`;
}

module.exports = {
  renderMarkdownFile,
  resolveImages,
  generateTOC,
  addHeadingIds,
  addPhaseTableAnchors,
  parseFrontmatter,
  renderTOCHtml,
  initDependencies
};
