/**
 * Revenue Health Scanner — 第二篇 作戰: Quản lý tài nguyên chiến tranh
 *
 * Tích hợp vào Auto-CTO loop để:
 *   1. Kiểm tra RaaS credit system health
 *   2. Monitor billing webhook status
 *   3. Phát hiện revenue bottlenecks
 *   4. Tự tạo optimization missions
 *
 * Cooldown: 60 phút — không spam scan
 */

const fs = require('fs');
const path = require('path');
const { log } = require('./brain-process-manager');
const config = require('../config');

const RAAS_DB_PATH = path.join(
  process.env.HOME || '/tmp',
  '.mekong/raas/tenants.db'
);
const REVENUE_STATE_FILE = path.join(
  config.MEKONG_DIR,
  'apps/openclaw-worker/data/revenue-health.json'
);
const COOLDOWN_MS = 60 * 60 * 1000; // 60 phút

// --- State ---

function loadRevenueState() {
  try {
    if (fs.existsSync(REVENUE_STATE_FILE)) {
      return JSON.parse(fs.readFileSync(REVENUE_STATE_FILE, 'utf-8'));
    }
  } catch (e) { /* ignore */ }
  return { lastScan: 0, issues: [], metrics: {} };
}

function saveRevenueState(state) {
  try {
    const dir = path.dirname(REVENUE_STATE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(REVENUE_STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    log(`[REVENUE] Lỗi lưu state: ${e.message}`);
  }
}

// --- Health Checks ---

function checkRaaSModules() {
  const issues = [];
  const raasDir = path.join(config.MEKONG_DIR, 'src/raas');

  if (!fs.existsSync(raasDir)) {
    issues.push({ severity: 'critical', module: 'raas', message: 'src/raas/ không tồn tại' });
    return issues;
  }

  // Kiểm tra các module bắt buộc
  const requiredModules = [
    'auth.py', 'billing.py', 'credits.py', 'missions.py',
    'tenant.py', 'dashboard.py', 'registry.py', 'sse.py'
  ];

  for (const mod of requiredModules) {
    const modPath = path.join(raasDir, mod);
    if (!fs.existsSync(modPath)) {
      issues.push({ severity: 'critical', module: mod, message: `Module ${mod} thiếu` });
    }
  }

  return issues;
}

function checkGateway() {
  const issues = [];
  const gwPath = path.join(config.MEKONG_DIR, 'apps/raas-gateway/index.js');

  if (!fs.existsSync(gwPath)) {
    issues.push({ severity: 'high', module: 'gateway', message: 'raas-gateway/index.js thiếu' });
    return issues;
  }

  const content = fs.readFileSync(gwPath, 'utf-8');

  // Kiểm tra security patterns
  if (!content.includes('X-Telegram-Bot-Api-Secret-Token')) {
    issues.push({ severity: 'high', module: 'gateway', message: 'Thiếu Telegram webhook security' });
  }
  if (!/sql.{0,10}injection/i.test(content)) {
    issues.push({ severity: 'medium', module: 'gateway', message: 'Thiếu SQL injection protection' });
  }

  return issues;
}

function checkDashboard() {
  const issues = [];
  const webDir = path.join(config.MEKONG_DIR, 'apps/agencyos-web');

  if (!fs.existsSync(webDir)) {
    issues.push({ severity: 'medium', module: 'dashboard', message: 'agencyos-web không tồn tại' });
    return issues;
  }

  // Kiểm tra revenue routes
  const revDir = path.join(webDir, 'app/dashboard/revenue');
  if (!fs.existsSync(revDir)) {
    issues.push({
      severity: 'medium',
      module: 'dashboard',
      message: 'Thiếu revenue dashboard routes (app/dashboard/revenue/)'
    });
  }

  return issues;
}

// --- Main Scanner ---

/**
 * Scan toàn bộ revenue pipeline health.
 * Trả về { healthy: boolean, issues: Array, metrics: Object }
 */
function scanRevenueHealth() {
  const state = loadRevenueState();

  // Cooldown check
  if (Date.now() - state.lastScan < COOLDOWN_MS) {
    return null; // Chưa đến lúc scan
  }

  log('[REVENUE 作戰]: Bắt đầu scan revenue health...');

  const issues = [
    ...checkRaaSModules(),
    ...checkGateway(),
    ...checkDashboard()
  ];

  // Đếm actual module count
  const raasDir = path.join(config.MEKONG_DIR, 'src/raas');
  let actualModuleCount = 0;
  try {
    actualModuleCount = fs.readdirSync(raasDir).filter(f => f.endsWith('.py')).length;
  } catch (e) { /* ignore */ }

  const metrics = {
    raasModuleCount: actualModuleCount,
    gatewayStatus: issues.some(i => i.module === 'gateway') ? 'degraded' : 'healthy',
    dashboardStatus: issues.some(i => i.module === 'dashboard') ? 'missing' : 'healthy',
    dbExists: fs.existsSync(RAAS_DB_PATH),
    totalIssues: issues.length,
    criticalCount: issues.filter(i => i.severity === 'critical').length,
    scanTimestamp: new Date().toISOString()
  };

  const result = {
    healthy: issues.length === 0,
    issues,
    metrics
  };

  // Lưu state
  state.lastScan = Date.now();
  state.issues = issues;
  state.metrics = metrics;
  saveRevenueState(state);

  if (issues.length === 0) {
    log('[REVENUE 作戰]: Pipeline healthy ✅');
  } else {
    log(`[REVENUE 作戰]: ${issues.length} vấn đề phát hiện (${metrics.criticalCount} critical)`);
    for (const i of issues.slice(0, 3)) {
      log(`  [${i.severity.toUpperCase()}] ${i.module}: ${i.message}`);
    }
  }

  return result;
}

/**
 * Tạo fix mission cho revenue issues.
 * Gọi từ auto-cto-pilot khi revenue scan phát hiện vấn đề.
 */
function generateRevenueMission(issue) {
  const prompt = `/cook "Trả lời bằng TIẾNG VIỆT. Fix revenue pipeline: ${issue.message} trong module ${issue.module}. Verify bằng python3 -m pytest tests/test_raas_integration.py sau khi sửa." --auto`;
  const filename = `HIGH_mission_revenue_fix_${issue.module}_${Date.now()}.txt`;
  return { prompt, filename };
}

module.exports = { scanRevenueHealth, generateRevenueMission };
