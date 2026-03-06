---
title: "Phase 4: UI Templates"
description: "Jinja2 templates với lightweight-charts cho dashboard"
status: completed
priority: P2
effort: 2h
---

# Phase 4: UI Templates

## Overview

Dashboard frontend với HTML/CSS/JS, sử dụng lightweight-charts cho visualization.

## Requirements

1. Dashboard layout với metrics cards
2. API call volume chart (line/bar)
3. Active licenses table
4. Top endpoints table
5. Export buttons (CSV/JSON)
6. Auto-refresh (30s interval)

## Files to Create

- `src/api/dashboard/templates/dashboard.html` (new)
- `src/api/dashboard/static/css/dashboard.css` (new)
- `src/api/dashboard/static/js/dashboard.js` (new)

## Implementation Steps

### 4.1 Dashboard HTML Template

```html
<!-- src/api/dashboard/templates/dashboard.html -->
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mekong Analytics Dashboard</title>
    <link rel="stylesheet" href="/static/css/dashboard.css">
    <script src="https://unpkg.com/lightweight-charts@4.1.0/dist/lightweight-charts.standalone.production.js"></script>
</head>
<body>
    <div class="dashboard">
        <header class="header">
            <h1>🐉 Mekong Analytics Dashboard</h1>
            <div class="controls">
                <select id="rangeSelect">
                    <option value="7">7 ngày</option>
                    <option value="30" selected>30 ngày</option>
                    <option value="90">90 ngày</option>
                </select>
                <button onclick="exportData('json')">Export JSON</button>
                <button onclick="exportData('csv')">Export CSV</button>
                <span class="last-updated">Last updated: <span id="lastUpdated">-</span></span>
            </div>
        </header>

        <div class="metrics-grid">
            <!-- Metric Cards -->
            <div class="metric-card">
                <h3>Total API Calls</h3>
                <p class="metric-value" id="totalCalls">-</p>
                <p class="metric-change" id="callsChange">-</p>
            </div>
            <div class="metric-card">
                <h3>Active Licenses</h3>
                <p class="metric-value" id="activeLicenses">-</p>
                <p class="metric-change" id="licensesChange">-</p>
            </div>
            <div class="metric-card">
                <h3>Est. Revenue</h3>
                <p class="metric-value" id="estRevenue">-</p>
                <p class="metric-change" id="revenueChange">-</p>
            </div>
            <div class="metric-card">
                <h3>Avg Calls/Day</h3>
                <p class="metric-value" id="avgCalls">-</p>
            </div>
        </div>

        <div class="charts-section">
            <!-- API Calls Chart -->
            <div class="chart-container">
                <h2>API Call Volume</h2>
                <div id="apiCallsChart" class="chart"></div>
            </div>
        </div>

        <div class="tables-section">
            <!-- Active Licenses -->
            <div class="table-container">
                <h2>Active Licenses by Tier</h2>
                <table id="licensesTable">
                    <thead>
                        <tr>
                            <th>Tier</th>
                            <th>Active</th>
                            <th>Usage</th>
                            <th>% of Total</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>

            <!-- Top Endpoints -->
            <div class="table-container">
                <h2>Top Endpoints</h2>
                <table id="endpointsTable">
                    <thead>
                        <tr>
                            <th>Endpoint</th>
                            <th>Calls</th>
                            <th>Avg Duration</th>
                            <th>% of Total</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    </div>

    <script src="/static/js/dashboard.js"></script>
</body>
</html>
```

### 4.2 CSS Styles

```css
/* src/api/dashboard/static/css/dashboard.css */
:root {
    --primary: #22c55e;
    --secondary: #3b82f6;
    --bg: #0f172a;
    --card-bg: #1e293b;
    --text: #f1f5f9;
    --text-muted: #94a3b8;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    padding: 20px;
}

.dashboard { max-width: 1400px; margin: 0 auto; }

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid #334155;
}

.controls {
    display: flex;
    gap: 15px;
    align-items: center;
}

.controls button {
    background: var(--primary);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
}

.metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.metric-card {
    background: var(--card-bg);
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #334155;
}

.metric-value {
    font-size: 2.5rem;
    font-weight: bold;
    color: var(--primary);
    margin: 10px 0;
}

.metric-change {
    color: var(--text-muted);
    font-size: 0.9rem;
}

.charts-section, .tables-section {
    background: var(--card-bg);
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 20px;
}

.chart { height: 400px; }

table {
    width: 100%;
    border-collapse: collapse;
}

th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #334155;
}

th { color: var(--text-muted); font-weight: 600; }
```

### 4.3 JavaScript Dashboard Logic

```javascript
// src/api/dashboard/static/js/dashboard.js
/**
 * Dashboard JavaScript — Real-time Analytics
 */

const API_BASE = '/api';
let chart;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    loadMetrics();
    setupAutoRefresh();
});

// Initialize lightweight-charts
function initChart() {
    const chartContainer = document.getElementById('apiCallsChart');
    chart = LightweightCharts.createChart(chartContainer, {
        width: chartContainer.clientWidth,
        height: 400,
        layout: {
            background: { color: '#1e293b' },
            textColor: '#f1f5f9',
        },
        grid: {
            vertLines: { color: '#334155' },
            horzLines: { color: '#334155' },
        },
    });

    const series = chart.addSeries(
        LightweightCharts.AreaSeries,
        {
            lineColor: '#22c55e',
            topColor: '#22c55e40',
            bottomColor: '#22c55e00',
        }
    );

    // Store series reference for updates
    window.chartSeries = series;
}

// Load metrics from API
async function loadMetrics() {
    const rangeDays = document.getElementById('rangeSelect').value;

    try {
        const response = await fetch(`${API_BASE}/metrics?range_days=${rangeDays}`);
        const result = await response.json();

        if (result.success) {
            updateDashboard(result.data);
        }
    } catch (error) {
        console.error('Failed to load metrics:', error);
    }
}

// Update dashboard UI
function updateDashboard(data) {
    // Update metric cards
    document.getElementById('totalCalls').textContent =
        formatNumber(data.api_calls.reduce((sum, d) => sum + d.calls, 0));
    document.getElementById('activeLicenses').textContent =
        formatNumber(data.active_licenses.total);
    document.getElementById('estRevenue').textContent =
        formatCurrency(data.estimated_revenue.total);

    // Update chart
    if (window.chartSeries) {
        window.chartSeries.setData(
            data.api_calls.map(d => ({
                time: d.date,
                value: d.calls,
            }))
        );
    }

    // Update tables
    updateLicensesTable(data.active_licenses.by_tier);
    updateEndpointsTable(data.top_endpoints);

    // Update timestamp
    document.getElementById('lastUpdated').textContent =
        new Date(data.last_updated).toLocaleString('vi-VN');
}

// Helper functions
function formatNumber(num) {
    return new Intl.NumberFormat('vi-VN').format(num);
}

function formatCurrency(num) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'USD'
    }).format(num);
}

function updateLicensesTable(byTier) {
    const tbody = document.querySelector('#licensesTable tbody');
    tbody.innerHTML = Object.entries(byTier).map(([tier, count]) => `
        <tr>
            <td>${tier.toUpperCase()}</td>
            <td>${formatNumber(count)}</td>
            <td>-</td>
            <td>-</td>
        </tr>
    `).join('');
}

function updateEndpointsTable(endpoints) {
    const tbody = document.querySelector('#endpointsTable tbody');
    tbody.innerHTML = endpoints.map(ep => `
        <tr>
            <td><code>${ep.endpoint}</code></td>
            <td>${formatNumber(ep.calls)}</td>
            <td>${ep.avg_duration || '-'}ms</td>
            <td>${ep.percentage || '-'}%</td>
        </tr>
    `).join('');
}

// Auto-refresh every 30 seconds
function setupAutoRefresh() {
    setInterval(loadMetrics, 30000);
}

// Export data
async function exportData(format) {
    const rangeDays = document.getElementById('rangeSelect').value;
    const url = `${API_BASE}/export?format=${format}&range_days=${rangeDays}`;

    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `mekong-analytics-${new Date().toISOString().split('T')[0]}.${format}`;
    a.click();

    window.URL.revokeObjectURL(downloadUrl);
}
```

## Success Criteria

- [ ] Dashboard hiển thị đúng layout
- [ ] Chart render với dữ liệu thực
- [ ] Tables hiển thị active licenses và top endpoints
- [ ] Export buttons hoạt động
- [ ] Auto-refresh mỗi 30s

## Dependencies

- Phase 3: FastAPI endpoints
- lightweight-charts CDN

## Risk Assessment

- **Risk:** Browser compatibility issues
- **Mitigation:** Test trên Chrome, Firefox, Safari
