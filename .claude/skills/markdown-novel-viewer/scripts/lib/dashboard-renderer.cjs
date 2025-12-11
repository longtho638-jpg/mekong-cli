/**
 * Dashboard Renderer
 * Generates HTML for the plans dashboard view
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
 * Generate SVG progress ring
 * @param {number} progress - Progress percentage (0-100)
 * @returns {string} - SVG HTML
 */
function generateProgressRing(progress) {
  const dashArray = `${progress}, 100`;
  return `
    <svg class="progress-ring" viewBox="0 0 36 36" aria-hidden="true">
      <circle class="ring-bg" cx="18" cy="18" r="15.9155" />
      <circle class="ring-progress" cx="18" cy="18" r="15.9155"
              stroke-dasharray="${dashArray}" />
      <text class="ring-text" x="18" y="20.5">${progress}%</text>
    </svg>
  `;
}

/**
 * Generate stacked progress bar
 * @param {{total: number, completed: number, inProgress: number, pending: number}} phases
 * @returns {string} - Progress bar HTML
 */
function generateProgressBar(phases) {
  const total = phases.total || 1;
  const completedPct = ((phases.completed / total) * 100).toFixed(1);
  const inProgressPct = ((phases.inProgress / total) * 100).toFixed(1);
  const pendingPct = ((phases.pending / total) * 100).toFixed(1);

  return `
    <div class="progress-bar" role="progressbar"
         aria-valuenow="${phases.completed}" aria-valuemin="0" aria-valuemax="${total}"
         aria-label="Progress: ${phases.completed} of ${total} phases completed">
      <div class="bar-segment completed" style="width: ${completedPct}%"></div>
      <div class="bar-segment in-progress" style="width: ${inProgressPct}%"></div>
      <div class="bar-segment pending" style="width: ${pendingPct}%"></div>
    </div>
  `;
}

/**
 * Generate status counts HTML
 * @param {{completed: number, inProgress: number, pending: number}} phases
 * @returns {string} - Status counts HTML
 */
function generateStatusCounts(phases) {
  return `
    <div class="status-counts">
      <span class="status-count completed" data-tooltip="Completed phases">
        <span class="visually-hidden">Completed:</span> ${phases.completed}
      </span>
      <span class="status-count in-progress" data-tooltip="In progress phases">
        <span class="visually-hidden">In Progress:</span> ${phases.inProgress}
      </span>
      <span class="status-count pending" data-tooltip="Pending phases">
        <span class="visually-hidden">Pending:</span> ${phases.pending}
      </span>
    </div>
  `;
}

/**
 * Generate HTML for a single plan card
 * @param {Object} plan - Plan metadata
 * @returns {string} - Card HTML
 */
function generatePlanCard(plan) {
  const statusClass = (plan.status || 'pending').replace(/\s+/g, '-');
  const name = escapeHtml(plan.name);
  const date = formatDate(plan.lastModified);

  return `
    <article class="plan-card" data-status="${statusClass}" data-id="${escapeHtml(plan.id)}" tabindex="0">
      <header class="card-header">
        <h2 class="plan-name">${name}</h2>
        <time class="plan-date" datetime="${plan.lastModified}">${date}</time>
      </header>
      <div class="card-body">
        <div class="progress-visual">
          ${generateProgressRing(plan.progress)}
        </div>
        ${generateProgressBar(plan.phases)}
        ${generateStatusCounts(plan.phases)}
      </div>
      <footer class="card-footer">
        <a href="/view${escapeHtml(plan.path)}" class="view-btn">View Plan</a>
      </footer>
    </article>
  `;
}

/**
 * Generate empty state HTML
 * @returns {string} - Empty state HTML
 */
function generateEmptyState() {
  return `
    <div class="empty-state" hidden>
      <span class="empty-icon" aria-hidden="true">&#128214;</span>
      <h2>No plans found</h2>
      <p>Create a plan directory with a plan.md file to get started.</p>
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

  // Generate cards
  const plansGrid = generatePlansGrid(plans);
  const planCount = plans.length;

  // Generate JSON for client-side filtering
  const plansJson = JSON.stringify(plans.map(p => ({
    id: p.id,
    name: p.name,
    status: p.status,
    progress: p.progress,
    lastModified: p.lastModified
  })));

  // Replace placeholders
  template = template
    .replace(/\{\{plans-grid\}\}/g, plansGrid)
    .replace(/\{\{plan-count\}\}/g, String(planCount))
    .replace(/\{\{plans-json\}\}/g, plansJson)
    .replace(/\{\{empty-state\}\}/g, generateEmptyState())
    .replace(/\{\{has-plans\}\}/g, plans.length > 0 ? 'plans-loaded' : '');

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
    <h1>Plans Dashboard</h1>
    <div class="header-controls">
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
  generateEmptyState,
  generatePlansGrid,
  escapeHtml,
  formatDate
};
