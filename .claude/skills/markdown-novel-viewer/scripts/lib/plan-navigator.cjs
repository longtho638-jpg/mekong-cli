/**
 * Plan navigation system - detects plan structure and generates navigation
 * Enables sidebar navigation for multi-phase plans
 */

const fs = require('fs');
const path = require('path');

/**
 * Detect if a file is part of a plan directory
 * @param {string} filePath - Path to markdown file
 * @returns {{isPlan: boolean, planDir: string, planFile: string, phases: Array}}
 */
function detectPlan(filePath) {
  const dir = path.dirname(filePath);
  const planFile = path.join(dir, 'plan.md');

  if (!fs.existsSync(planFile)) {
    return { isPlan: false };
  }

  // Find all phase files
  const files = fs.readdirSync(dir);
  const phases = files
    .filter(f => f.startsWith('phase-') && f.endsWith('.md'))
    .sort((a, b) => {
      // Sort by phase number
      const numA = parseInt(a.match(/phase-(\d+)/)?.[1] || '0', 10);
      const numB = parseInt(b.match(/phase-(\d+)/)?.[1] || '0', 10);
      return numA - numB;
    });

  return {
    isPlan: true,
    planDir: dir,
    planFile,
    phases: phases.map(f => path.join(dir, f))
  };
}

/**
 * Parse plan.md to extract phase metadata from table
 * @param {string} planFilePath - Path to plan.md
 * @returns {Array<{phase: number, name: string, status: string, file: string}>}
 */
function parsePlanTable(planFilePath) {
  const content = fs.readFileSync(planFilePath, 'utf8');
  const phases = [];

  // Match table rows: | Phase | Name | Status | Link |
  const tableRegex = /\|\s*(\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*\[([^\]]+)\]\(([^)]+)\)/g;

  let match;
  while ((match = tableRegex.exec(content)) !== null) {
    const [, phase, name, status, linkText, linkPath] = match;
    const dir = path.dirname(planFilePath);
    const absolutePath = path.resolve(dir, linkPath);

    phases.push({
      phase: parseInt(phase, 10),
      name: name.trim(),
      status: status.trim().toLowerCase(),
      file: absolutePath,
      linkText: linkText.trim()
    });
  }

  return phases;
}

/**
 * Get navigation context for a file
 * @param {string} filePath - Current file path
 * @returns {{planInfo: Object, currentIndex: number, prev: Object, next: Object, allPhases: Array}}
 */
function getNavigationContext(filePath) {
  const planInfo = detectPlan(filePath);

  if (!planInfo.isPlan) {
    return { planInfo, currentIndex: -1, prev: null, next: null, allPhases: [] };
  }

  // Parse plan table for metadata
  const phaseMeta = parsePlanTable(planInfo.planFile);

  // Build all phases list including plan.md
  const allPhases = [
    {
      phase: 0,
      name: 'Plan Overview',
      status: 'overview',
      file: planInfo.planFile
    },
    ...phaseMeta
  ];

  // Find current file index
  const normalizedPath = path.normalize(filePath);
  const currentIndex = allPhases.findIndex(p => path.normalize(p.file) === normalizedPath);

  // Get prev/next
  const prev = currentIndex > 0 ? allPhases[currentIndex - 1] : null;
  const next = currentIndex < allPhases.length - 1 && currentIndex >= 0
    ? allPhases[currentIndex + 1]
    : null;

  return {
    planInfo,
    currentIndex,
    prev,
    next,
    allPhases
  };
}

/**
 * Generate navigation sidebar HTML
 * @param {string} filePath - Current file path
 * @returns {string} - HTML navigation sidebar
 */
function generateNavSidebar(filePath) {
  const { planInfo, currentIndex, allPhases } = getNavigationContext(filePath);

  if (!planInfo.isPlan) {
    return '';
  }

  const planName = path.basename(planInfo.planDir);

  const items = allPhases.map((phase, index) => {
    const isActive = index === currentIndex;
    const statusClass = phase.status.replace(/\s+/g, '-');
    const href = `/view${phase.file}`;

    return `
      <li class="phase-item ${isActive ? 'active' : ''}" data-status="${statusClass}">
        <a href="${href}">
          <span class="status-dot ${statusClass}"></span>
          <span class="phase-name">${phase.name}</span>
        </a>
      </li>
    `;
  }).join('');

  return `
    <nav class="plan-nav">
      <div class="plan-title">
        <span class="plan-icon">&#128214;</span>
        <span>${planName}</span>
      </div>
      <ul class="phase-list">
        ${items}
      </ul>
    </nav>
  `;
}

/**
 * Generate prev/next navigation footer
 * @param {string} filePath - Current file path
 * @returns {string} - HTML navigation footer
 */
function generateNavFooter(filePath) {
  const { prev, next } = getNavigationContext(filePath);

  if (!prev && !next) {
    return '';
  }

  const prevHtml = prev ? `
    <a href="/view${prev.file}" class="nav-prev">
      <span class="nav-arrow">&larr;</span>
      <span class="nav-label">${prev.name}</span>
    </a>
  ` : '<span></span>';

  const nextHtml = next ? `
    <a href="/view${next.file}" class="nav-next">
      <span class="nav-label">${next.name}</span>
      <span class="nav-arrow">&rarr;</span>
    </a>
  ` : '<span></span>';

  return `
    <footer class="nav-footer">
      ${prevHtml}
      ${nextHtml}
    </footer>
  `;
}

module.exports = {
  detectPlan,
  parsePlanTable,
  getNavigationContext,
  generateNavSidebar,
  generateNavFooter
};
