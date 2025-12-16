/**
 * Dashboard Controls
 * Client-side sorting, filtering, and search for plans dashboard
 */
(function() {
  'use strict';

  // State
  const state = {
    sort: 'date-desc',
    filter: 'all',
    search: ''
  };

  // Elements
  let allPlans = [];
  let grid = null;
  let resultCount = null;
  let emptyState = null;
  let srAnnounce = null;

  /**
   * Initialize dashboard
   */
  function init() {
    allPlans = window.__plans || [];
    grid = document.querySelector('.plans-grid');
    resultCount = document.querySelector('.result-count');
    emptyState = document.querySelector('.empty-state');
    srAnnounce = document.getElementById('sr-announce');

    // Mark as loaded
    document.body.classList.add('plans-loaded');

    // Show empty state if no plans
    if (!allPlans.length) {
      if (emptyState) emptyState.hidden = false;
      return;
    }

    // Parse URL state
    parseURL();

    // Bind events
    bindEvents();

    // Initial render
    applyFiltersAndSort();

    // Setup keyboard navigation
    setupKeyboardNav();

    // Setup theme toggle
    setupThemeToggle();
  }

  /**
   * Bind event listeners
   */
  function bindEvents() {
    // Search input with debounce
    const searchInput = document.getElementById('plan-search');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          state.search = e.target.value.toLowerCase().trim();
          applyFiltersAndSort();
        }, 300);
      });

      // Clear search on Escape
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          searchInput.value = '';
          state.search = '';
          applyFiltersAndSort();
        }
      });
    }

    // Sort select
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sort = e.target.value;
        applyFiltersAndSort();
      });
    }

    // Filter pills
    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        // Update active state
        document.querySelectorAll('.filter-pill').forEach(p => {
          p.classList.remove('active');
          p.setAttribute('aria-pressed', 'false');
        });
        pill.classList.add('active');
        pill.setAttribute('aria-pressed', 'true');

        state.filter = pill.dataset.filter;
        applyFiltersAndSort();
      });
    });

    // Card click to navigate
    grid?.addEventListener('click', (e) => {
      const card = e.target.closest('.plan-card');
      if (card && !e.target.closest('.view-btn')) {
        const link = card.querySelector('.view-btn');
        if (link) link.click();
      }
    });
  }

  /**
   * Apply filters and sorting
   */
  function applyFiltersAndSort() {
    let filtered = allPlans.slice();

    // Filter by status
    if (state.filter !== 'all') {
      filtered = filtered.filter(p => p.status === state.filter);
    }

    // Filter by search
    if (state.search) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(state.search) ||
        p.id.toLowerCase().includes(state.search)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (state.sort) {
        case 'date-desc':
          return new Date(b.lastModified) - new Date(a.lastModified);
        case 'date-asc':
          return new Date(a.lastModified) - new Date(b.lastModified);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'progress-desc':
          return b.progress - a.progress;
        case 'progress-asc':
          return a.progress - b.progress;
        default:
          return 0;
      }
    });

    renderGrid(filtered);
    updateURL();
    announce(`Showing ${filtered.length} plan${filtered.length !== 1 ? 's' : ''}`);
  }

  /**
   * Render grid with filtered plans
   */
  function renderGrid(plans) {
    const visibleIds = new Set(plans.map(p => p.id));

    // Hide/show cards and set order
    document.querySelectorAll('.plan-card').forEach(card => {
      const id = card.dataset.id;
      const isVisible = visibleIds.has(id);
      card.style.display = isVisible ? '' : 'none';

      if (isVisible) {
        const index = plans.findIndex(p => p.id === id);
        card.style.order = index;
      }
    });

    // Update count
    if (resultCount) {
      resultCount.innerHTML = `Showing <strong>${plans.length}</strong> plan${plans.length !== 1 ? 's' : ''}`;
    }

    // Show/hide empty state
    if (emptyState) {
      emptyState.hidden = plans.length > 0;
    }
  }

  /**
   * Parse URL parameters
   */
  function parseURL() {
    const params = new URLSearchParams(window.location.search);

    if (params.has('sort')) {
      state.sort = params.get('sort');
    }
    if (params.has('filter')) {
      state.filter = params.get('filter');
    }
    if (params.has('q')) {
      state.search = params.get('q');
    }

    // Update controls to match state
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = state.sort;

    const searchInput = document.getElementById('plan-search');
    if (searchInput) searchInput.value = state.search;

    document.querySelectorAll('.filter-pill').forEach(p => {
      const isActive = p.dataset.filter === state.filter;
      p.classList.toggle('active', isActive);
      p.setAttribute('aria-pressed', String(isActive));
    });
  }

  /**
   * Update URL with current state
   */
  function updateURL() {
    const params = new URLSearchParams();

    if (state.sort !== 'date-desc') params.set('sort', state.sort);
    if (state.filter !== 'all') params.set('filter', state.filter);
    if (state.search) params.set('q', state.search);

    const url = params.toString()
      ? `${window.location.pathname}?${params}`
      : window.location.pathname;

    history.replaceState(null, '', url);
  }

  /**
   * Announce message to screen readers
   */
  function announce(message) {
    if (!srAnnounce) return;
    srAnnounce.textContent = '';
    // Force reflow
    void srAnnounce.offsetHeight;
    srAnnounce.textContent = message;
  }

  /**
   * Setup keyboard navigation for cards
   */
  function setupKeyboardNav() {
    grid?.addEventListener('keydown', (e) => {
      const cards = [...document.querySelectorAll('.plan-card:not([style*="display: none"])')];
      const current = document.activeElement;
      const index = cards.indexOf(current);

      if (index === -1) return;

      let next;
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          next = cards[index + 1] || cards[0];
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          next = cards[index - 1] || cards[cards.length - 1];
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          const link = current.querySelector('.view-btn');
          if (link) link.click();
          break;
        case 'Home':
          e.preventDefault();
          next = cards[0];
          break;
        case 'End':
          e.preventDefault();
          next = cards[cards.length - 1];
          break;
      }

      if (next) next.focus();
    });
  }

  /**
   * Setup theme toggle
   */
  function setupThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    // Check saved preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', initialTheme);

    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      announce(`Theme changed to ${next} mode`);
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
