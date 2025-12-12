/**
 * Dashboard Renderer
 * Generates HTML for the enhanced plans dashboard view with glassmorphism design
 *
 * @module dashboard-renderer
 */

const fs = require('fs');
const path = require('path');

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format date for display
 * @param {string} isoDate - ISO date string
 * @returns {string} - Formatted date
 */
function formatDate(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format relative time (e.g., "2 days ago")
 * @param {string} isoDate - ISO date string
 * @returns {string} - Relative time string
 */
function formatRelativeTime(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Get human-readable status label
 * @param {string} status - Status code
 * @returns {string} - Human-readable label
 */
function getStatusLabel(status) {
  const labels = {
    'completed': 'Completed',
    'complete': 'Completed',
    'in-progress': 'In Progress',
    'pending': 'Pending'
  };
  return labels[status] || 'Pending';
}

/**
 * Generate SVG progress ring (kept for backward compatibility but hidden in new design)
 * @param {number} progress - Progress percentage (0-100)
 * @returns {string} - SVG HTML
 */
function generateProgressRing(progress) {
  // Hidden in new minimal design - kept for compatibility
  return '';
}

/**
 * Generate simple progress bar (monochrome design)
 * @param {{total: number, completed: number, inProgress: number, pending: number}} phases
 * @returns {string} - Progress bar HTML
 */
function generateProgressBar(phases) {
  const total = phases.total || 1;
  const completedPct = ((phases.completed / total) * 100).toFixed(1);
  const inProgressPct = ((phases.inProgress / total) * 100).toFixed(1);

  return `
    <div class="progress-bar" role="progressbar"
         aria-valuenow="${phases.completed}" aria-valuemin="0" aria-valuemax="${total}"
         aria-label="Progress: ${phases.completed} of ${total} phases completed">
      <div class="bar-segment completed" style="width: ${completedPct}%"></div>
      <div class="bar-segment in-progress" style="width: ${inProgressPct}%"></div>
    </div>
    <div class="phase-count"><strong>${phases.completed}</strong> of ${total} phases</div>
  `;
}

/**
 * Generate status counts HTML (hidden in minimal design)
 * @param {{completed: number, inProgress: number, pending: number}} phases
 * @returns {string} - Status counts HTML
 */
function generateStatusCounts(phases) {
  // Hidden in minimal design
  return '';
}

/**
 * Generate status badge HTML (simplified for monochrome design)
 * @param {string} status - Status string
 * @returns {string} - Status badge HTML
 */
function generateStatusBadge(status) {
  const statusClass = (status || 'pending').replace(/\s+/g, '-');
  // Simplified labels for minimal design
  const labels = {
    'completed': 'Done',
    'complete': 'Done',
    'in-progress': 'Active',
    'pending': 'Pending'
  };
  const label = labels[statusClass] || 'Pending';
  return `<span class="status-badge ${statusClass}">${label}</span>`;
}

/**
 * Generate HTML for a single plan card (minimal design)
 * @param {Object} plan - Plan metadata
 * @returns {string} - Card HTML
 */
function generatePlanCard(plan) {
  const statusClass = (plan.status || 'pending').replace(/\s+/g, '-');
  const name = escapeHtml(plan.name);
  const relativeTime = formatRelativeTime(plan.lastModified);

  return `
    <article class="plan-card" data-status="${statusClass}" data-id="${escapeHtml(plan.id)}" tabindex="0">
      <header class="card-header">
        <div class="card-header-content">
          <h2 class="plan-name">${name}</h2>
          <div class="plan-date">
            <time datetime="${plan.lastModified}">${relativeTime}</time>
          </div>
        </div>
        ${generateStatusBadge(statusClass)}
      </header>
      <div class="card-body">
        ${generateProgressBar(plan.phases)}
      </div>
      <footer class="card-footer">
        <div class="phases-summary">${plan.phases.total} phases total</div>
        <a href="/view${escapeHtml(plan.path)}" class="view-btn">
          View
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
      </footer>
    </article>
  `;
}

/**
 * Generate empty state HTML with animated icon
 * @returns {string} - Empty state HTML
 */
function generateEmptyState() {
  return `
    <div class="empty-state" hidden>
      <div class="empty-icon" aria-hidden="true">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      </div>
      <h2>No plans found</h2>
      <p>Create a plan directory with a plan.md file to get started with tracking your projects.</p>
    </div>
  `;
}

/**
 * Generate plans grid HTML
 * @param {Array} plans - Array of plan metadata objects
 * @returns {string} - Grid HTML
 */
function generatePlansGrid(plans) {
  if (!plans || plans.length === 0) {
    return '';
  }

  return plans.map(generatePlanCard).join('\n');
}

/**
 * Calculate statistics from plans array
 * @param {Array} plans - Array of plan metadata objects
 * @returns {Object} - Statistics object
 */
function calculateStats(plans) {
  const stats = {
    total: plans.length,
    completed: 0,
    inProgress: 0,
    pending: 0
  };

  plans.forEach(plan => {
    const status = (plan.status || 'pending').replace(/\s+/g, '-');
    if (status === 'completed' || status === 'complete') {
      stats.completed++;
    } else if (status === 'in-progress') {
      stats.inProgress++;
    } else {
      stats.pending++;
    }
  });

  return stats;
}

/**
 * Render complete dashboard HTML
 * @param {Array} plans - Array of plan metadata objects
 * @param {Object} options - Render options
 * @param {string} options.assetsDir - Assets directory path
 * @param {string} options.plansDir - Plans directory path
 * @returns {string} - Complete HTML page
 */
function renderDashboard(plans, options = {}) {
  const { assetsDir } = options;

  // Load template
  const templatePath = path.join(assetsDir, 'dashboard-template.html');
  let template;

  try {
    template = fs.readFileSync(templatePath, 'utf8');
  } catch (err) {
    // Fallback inline template if file not found
    template = getInlineTemplate();
  }

  // Calculate statistics
  const stats = calculateStats(plans);

  // Generate cards
  const plansGrid = generatePlansGrid(plans);
  const planCount = plans.length;

  // Generate JSON for client-side filtering
  const plansJson = JSON.stringify(plans.map(p => ({
    id: p.id,
    name: p.name,
    status: p.status,
    progress: p.progress,
    lastModified: p.lastModified,
    phasesTotal: p.phases.total
  })));

  // Replace placeholders
  template = template
    .replace(/\{\{plans-grid\}\}/g, plansGrid)
    .replace(/\{\{plan-count\}\}/g, String(planCount))
    .replace(/\{\{plans-json\}\}/g, plansJson)
    .replace(/\{\{empty-state\}\}/g, generateEmptyState())
    .replace(/\{\{has-plans\}\}/g, plans.length > 0 ? 'plans-loaded' : '')
    .replace(/\{\{stat-total\}\}/g, String(stats.total))
    .replace(/\{\{stat-completed\}\}/g, String(stats.completed))
    .replace(/\{\{stat-in-progress\}\}/g, String(stats.inProgress))
    .replace(/\{\{stat-pending\}\}/g, String(stats.pending));

  return template;
}

/**
 * Get inline fallback template
 * @returns {string} - Inline HTML template
 */
function getInlineTemplate() {
  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plans Dashboard</title>
  <link rel="stylesheet" href="/assets/novel-theme.css">
  <link rel="stylesheet" href="/assets/dashboard.css">
</head>
<body class="dashboard-view {{has-plans}}">
  <header class="dashboard-header">
    <div class="header-left">
      <h1>Plans Dashboard</h1>
    </div>
    <div class="header-right">
      <button id="theme-toggle" class="icon-btn" aria-label="Toggle theme">
        <svg class="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
        <svg class="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </button>
    </div>
  </header>

  <main role="main" aria-label="Plans Dashboard">
    <section class="stats-hero" aria-label="Plan statistics">
      <div class="stat-card total">
        <div class="stat-icon">📋</div>
        <div class="stat-value">{{stat-total}}</div>
        <div class="stat-label">Total Plans</div>
      </div>
      <div class="stat-card completed">
        <div class="stat-icon">✅</div>
        <div class="stat-value">{{stat-completed}}</div>
        <div class="stat-label">Completed</div>
      </div>
      <div class="stat-card in-progress">
        <div class="stat-icon">🔄</div>
        <div class="stat-value">{{stat-in-progress}}</div>
        <div class="stat-label">In Progress</div>
      </div>
      <div class="stat-card pending">
        <div class="stat-icon">⏳</div>
        <div class="stat-value">{{stat-pending}}</div>
        <div class="stat-label">Pending</div>
      </div>
    </section>

    <div class="dashboard-controls">
      <div class="search-box">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input type="search" id="plan-search" placeholder="Search plans..." aria-label="Search plans">
      </div>

      <select id="sort-select" aria-label="Sort plans by">
        <option value="date-desc">Newest First</option>
        <option value="date-asc">Oldest First</option>
        <option value="name-asc">Name A-Z</option>
        <option value="name-desc">Name Z-A</option>
        <option value="progress-desc">Most Progress</option>
        <option value="progress-asc">Least Progress</option>
      </select>

      <div class="filter-pills" role="group" aria-label="Filter by status">
        <button class="filter-pill active" data-filter="all" aria-pressed="true">All</button>
        <button class="filter-pill" data-filter="completed" aria-pressed="false">Completed</button>
        <button class="filter-pill" data-filter="in-progress" aria-pressed="false">In Progress</button>
        <button class="filter-pill" data-filter="pending" aria-pressed="false">Pending</button>
      </div>

      <div role="status" aria-live="polite" class="result-count">
        Showing <strong>{{plan-count}}</strong> plans
      </div>
    </div>

    <section class="plans-grid" aria-label="Plans list">
      {{plans-grid}}
    </section>

    {{empty-state}}
  </main>

  <script>window.__plans = {{plans-json}};</script>
  <script src="/assets/dashboard.js"></script>
</body>
</html>`;
}

module.exports = {
  renderDashboard,
  generatePlanCard,
  generateProgressRing,
  generateProgressBar,
  generateStatusCounts,
  generateStatusBadge,
  generateEmptyState,
  generatePlansGrid,
  calculateStats,
  escapeHtml,
  formatDate,
  formatRelativeTime,
  getStatusLabel
};
