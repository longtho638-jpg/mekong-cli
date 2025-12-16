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
 * Normalize status string to standard format
 * @param {string} raw - Raw status text
 * @returns {string} - Normalized status (completed, in-progress, pending)
 */
function normalizeStatus(raw) {
  const s = (raw || '').toLowerCase().trim();
  // Match various completed indicators
  if (s.includes('complete') || s.includes('done') || s.includes('✓') || s.includes('✅')) {
    return 'completed';
  }
  // Match in-progress indicators
  if (s.includes('progress') || s.includes('active') || s.includes('wip') || s.includes('🔄')) {
    return 'in-progress';
  }
  return 'pending';
}

/**
 * Parse plan.md to extract phase metadata from table
 * Supports multiple table formats:
 * 1. Standard: | Phase | Name | Status | [Link](path) |
 * 2. Link-first: | [Phase X](path) | Description | Status | ... |
 * 3. Heading-based: ### Phase X: Name with - Status: XXX
 * @param {string} planFilePath - Path to plan.md
 * @returns {Array<{phase: number, name: string, status: string, file: string}>}
 */
function parsePlanTable(planFilePath) {
  const content = fs.readFileSync(planFilePath, 'utf8');
  const dir = path.dirname(planFilePath);
  const phases = [];

  // Format 1: Standard table | Phase | Name | Status | [Link](path) |
  const standardRegex = /\|\s*(\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = standardRegex.exec(content)) !== null) {
    const [, phase, name, status, linkText, linkPath] = match;
    phases.push({
      phase: parseInt(phase, 10),
      name: name.trim(),
      status: normalizeStatus(status),
      file: path.resolve(dir, linkPath),
      linkText: linkText.trim()
    });
  }

  // Format 2: Link-first table | [Phase X](path) | Description | Status | ... |
  // Matches: | [Phase 1](phase-01-xxx.md) | Description | ✓ Complete | 4h |
  if (phases.length === 0) {
    const linkFirstRegex = /\|\s*\[(?:Phase\s*)?(\d+)\]\(([^)]+)\)\s*\|\s*([^|]+)\s*\|\s*([^|]+)/g;
    while ((match = linkFirstRegex.exec(content)) !== null) {
      const [, phase, linkPath, name, status] = match;
      phases.push({
        phase: parseInt(phase, 10),
        name: name.trim(),
        status: normalizeStatus(status),
        file: path.resolve(dir, linkPath),
        linkText: `Phase ${phase}`
      });
    }
  }

  // Format 2b: Number-first with link in col 2: | 1 | [Name](path) | Status | ... |
  // Matches: | 1 | [Tab Structure](./phase-01-xxx.md) | Pending | High | 4h |
  if (phases.length === 0) {
    const numLinkRegex = /\|\s*(\d+)\s*\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|\s*([^|]+)/g;
    while ((match = numLinkRegex.exec(content)) !== null) {
      const [, phase, name, linkPath, status] = match;
      phases.push({
        phase: parseInt(phase, 10),
        name: name.trim(),
        status: normalizeStatus(status),
        file: path.resolve(dir, linkPath),
        linkText: name.trim()
      });
    }
  }

  // Format 2c: Simple table without links: | Phase | Description | Status |
  // Matches: | 01 | Backend: Install deps | Completed ✅ |
  if (phases.length === 0) {
    const simpleTblRegex = /\|\s*0?(\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g;
    while ((match = simpleTblRegex.exec(content)) !== null) {
      const [fullMatch, phase, name, status] = match;
      // Skip header rows and separator rows
      if (name.trim().toLowerCase() === 'description' || name.trim().toLowerCase() === 'name') continue;
      if (name.includes('---') || name.includes('===')) continue;
      phases.push({
        phase: parseInt(phase, 10),
        name: name.trim(),
        status: normalizeStatus(status),
        file: planFilePath,
        linkText: name.trim()
      });
    }
  }

  // Format 3: Heading-based phases (### Phase X: Name with - Status: XXX)
  if (phases.length === 0) {
    const contentLines = content.split('\n');
    let currentPhase = null;

    for (let i = 0; i < contentLines.length; i++) {
      const line = contentLines[i];
      const headingMatch = /###\s*Phase\s*(\d+)[:\s]+(.+)/i.exec(line);
      if (headingMatch) {
        if (currentPhase) phases.push(currentPhase);
        const phaseNum = parseInt(headingMatch[1], 10);
        currentPhase = {
          phase: phaseNum,
          name: headingMatch[2].trim(),
          status: 'pending',
          file: planFilePath,
          linkText: `Phase ${phaseNum}`
        };
      }
      // Look for status in subsequent lines
      if (currentPhase) {
        const statusMatch = /-\s*Status:\s*(.+)/i.exec(line);
        if (statusMatch) {
          currentPhase.status = normalizeStatus(statusMatch[1]);
        }
      }
    }
    if (currentPhase) phases.push(currentPhase);
  }

  // Format 4: Numbered list phases with checkbox status
  // Matches: 1) **Discovery** with status from - [x] Discovery: ...
  if (phases.length === 0) {
    // First pass: find numbered phases like "1) **Name**" or "1. **Name**"
    const numberedPhaseRegex = /^(\d+)[)\.]\s*\*\*([^*]+)\*\*/gm;
    const phaseMap = new Map();
    while ((match = numberedPhaseRegex.exec(content)) !== null) {
      const [, num, name] = match;
      phaseMap.set(name.trim().toLowerCase(), {
        phase: parseInt(num, 10),
        name: name.trim(),
        status: 'pending',
        file: planFilePath,
        linkText: name.trim()
      });
    }

    // Second pass: find checkbox status like "- [x] Name:" or "- [ ] Name:"
    const checkboxRegex = /^-\s*\[(x| )\]\s*([^:]+)/gmi;
    while ((match = checkboxRegex.exec(content)) !== null) {
      const [, checked, name] = match;
      const key = name.trim().toLowerCase();
      if (phaseMap.has(key)) {
        phaseMap.get(key).status = checked.toLowerCase() === 'x' ? 'completed' : 'pending';
      }
    }

    // Convert map to array sorted by phase number
    if (phaseMap.size > 0) {
      phases.push(...Array.from(phaseMap.values()).sort((a, b) => a.phase - b.phase));
    }
  }

  // Format 5: Checkbox list with bold links
  // Matches: - [ ] **[Phase 1: Name](./phase-01-xxx.md)** or - [x] **[Phase 1](path)**
  if (phases.length === 0) {
    const checkboxLinkRegex = /^-\s*\[(x| )\]\s*\*\*\[(?:Phase\s*)?(\d+)[:\s]*([^\]]*)\]\(([^)]+)\)\*\*/gmi;
    while ((match = checkboxLinkRegex.exec(content)) !== null) {
      const [, checked, phase, name, linkPath] = match;
      phases.push({
        phase: parseInt(phase, 10),
        name: name.trim() || `Phase ${phase}`,
        status: checked.toLowerCase() === 'x' ? 'completed' : 'pending',
        file: path.resolve(dir, linkPath),
        linkText: name.trim() || `Phase ${phase}`
      });
    }
  }

  // Format 6: Bullet-list phases with nested File: references
  // Matches:
  // - Phase 01: Name ✅ (date)
  //   - File: `phase-01-name.md`
  //   - Completed: date
  if (phases.length === 0) {
    const lines = content.split('\n');
    let currentPhase = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Match phase line: "- Phase 01: Name ✅" or "- Phase 01: Name (date)"
      const phaseMatch = /^-\s*Phase\s*0?(\d+)[:\s]+([^✅✓\n]+)/i.exec(line);
      if (phaseMatch) {
        // Save previous phase if exists
        if (currentPhase) phases.push(currentPhase);

        const phaseNum = parseInt(phaseMatch[1], 10);
        const name = phaseMatch[2].trim().replace(/\s*\([^)]*\)\s*$/, ''); // Remove trailing (date)
        const hasCheckmark = /[✅✓]/.test(line);

        currentPhase = {
          phase: phaseNum,
          name: name,
          status: hasCheckmark ? 'completed' : 'pending',
          file: planFilePath, // Default to plan.md, will be updated if File: found
          linkText: name
        };
        continue;
      }

      // Look for nested File: reference within current phase
      if (currentPhase) {
        const fileMatch = /^\s+-\s*File:\s*`?([^`\n]+)`?/i.exec(line);
        if (fileMatch) {
          const fileName = fileMatch[1].trim();
          currentPhase.file = path.resolve(dir, fileName);
        }

        // Check for status indicators in nested lines
        const statusMatch = /^\s+-\s*(Completed|Status):\s*(.+)/i.exec(line);
        if (statusMatch) {
          currentPhase.status = normalizeStatus(statusMatch[2]);
        }

        // End current phase when we hit another top-level item or section
        if (/^[#-]/.test(line) && !/^\s+-/.test(line) && !phaseMatch) {
          // Don't end if this is a nested item
          if (!/^\s/.test(line)) {
            phases.push(currentPhase);
            currentPhase = null;
          }
        }
      }
    }

    // Push last phase if exists
    if (currentPhase) phases.push(currentPhase);
  }

  // Enhancement: Extract file paths from "Phase Files" section if phases point to plan.md
  // This handles plans with heading-based phases + separate file links section
  if (phases.length > 0) {
    const phaseFilesSection = content.match(/##\s*Phase\s*Files[\s\S]*?(?=##|$)/i);
    if (phaseFilesSection) {
      const linkRegex = /\d+\.\s*\[([^\]]+)\]\(([^)]+\.md)\)/g;
      let linkMatch;
      while ((linkMatch = linkRegex.exec(phaseFilesSection[0])) !== null) {
        const [, linkName, linkPath] = linkMatch;
        // Extract phase number from filename (phase-01-xxx.md -> 1)
        const phaseNum = parseInt(linkName.match(/phase-0?(\d+)/i)?.[1] || '0', 10);
        // Update corresponding phase's file path
        const phase = phases.find(p => p.phase === phaseNum);
        if (phase && phase.file === planFilePath) {
          phase.file = path.resolve(dir, linkPath);
        }
      }
    }
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
    const href = `/view?file=${encodeURIComponent(phase.file)}`;

    // Check if phase file actually exists on disk
    const fileExists = fs.existsSync(phase.file);
    const unavailableClass = !fileExists ? 'unavailable' : '';

    // If file doesn't exist, render as non-clickable span with tooltip
    if (!fileExists) {
      return `
        <li class="phase-item ${unavailableClass}" data-status="${statusClass}" title="Phase planned but not yet implemented">
          <span class="phase-link-disabled">
            <span class="status-dot ${statusClass}"></span>
            <span class="phase-name">${phase.name}</span>
            <span class="unavailable-badge">Planned</span>
          </span>
        </li>
      `;
    }

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

  // Check if prev/next files exist
  const prevExists = prev && fs.existsSync(prev.file);
  const nextExists = next && fs.existsSync(next.file);

  const prevHtml = prev ? (prevExists ? `
    <a href="/view?file=${encodeURIComponent(prev.file)}" class="nav-prev">
      <span class="nav-arrow">&larr;</span>
      <span class="nav-label">${prev.name}</span>
    </a>
  ` : `
    <span class="nav-prev nav-unavailable" title="Phase planned but not yet implemented">
      <span class="nav-arrow">&larr;</span>
      <span class="nav-label">${prev.name}</span>
      <span class="nav-badge">Planned</span>
    </span>
  `) : '<span></span>';

  const nextHtml = next ? (nextExists ? `
    <a href="/view?file=${encodeURIComponent(next.file)}" class="nav-next">
      <span class="nav-label">${next.name}</span>
      <span class="nav-arrow">&rarr;</span>
    </a>
  ` : `
    <span class="nav-next nav-unavailable" title="Phase planned but not yet implemented">
      <span class="nav-label">${next.name}</span>
      <span class="nav-badge">Planned</span>
      <span class="nav-arrow">&rarr;</span>
    </span>
  `) : '<span></span>';

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
