const fs = require('fs');
const path = require('path');
const config = require('./config');
const { chromium } = require('playwright');
const { generateHunterMission } = require('./lib/hunter-scanner');
const QL = require('./lib/quan-luat-enforcer');

// ═══════════════════════════════════════════════════════════════
// 🏯 HUNTER DAEMON — 獵人 (Liệp Nhân)
// ═══════════════════════════════════════════════════════════════
// Rank: TRINH_SÁT (Trinh Sát — Scout)
// Territory: code_scanning
// 36 Kế: #7 Vô Trung Sinh Hữu, #13 Đả Thảo Kinh Xà
// Điều 2: Phát hiện → Báo cáo chuẩn Signal Protocol
// Điều 3: KHÔNG FIX, CHỈ SCAN → chuyển Builder
// ═══════════════════════════════════════════════════════════════

const DAEMON_NAME = 'hunter';
const DAEMON_RANK = QL.RANKS[DAEMON_NAME];
const POLL_INTERVAL = 60000;
const MAX_QUEUE_SIZE = 3;

function sendSignal(type, payload, priority = 'MEDIUM', to = 'builder') {
    // Quân Luật Điều 2: Signal chuẩn
    const signal = QL.createSignal(DAEMON_NAME, to, type, payload, priority);
    const signalPath = path.join(config.MEKONG_DIR, 'signals', 'inbox', `${signal.id}.json`);
    try {
      fs.mkdirSync(path.dirname(signalPath), { recursive: true });
      fs.writeFileSync(signalPath, JSON.stringify(signal, null, 2));
    } catch (e) { /* silent */ }
    QL.logQuanLuat(DAEMON_NAME, `💨 Signal: ${type} → ${to} (${priority})`);
}

async function verifyDeployment(url, screenshotPath) {
    let browser = null;
    try {
        browser = await chromium.launch();
        const page = await browser.newPage();
        const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        
        if (!response || !response.ok()) {
            throw new Error(`HTTP Error: ${response ? response.status() : 'No Response'}`);
        }
        
        await page.screenshot({ path: screenshotPath, fullPage: true });
        const title = await page.title();
        
        await browser.close();
        return { success: true, title };
    } catch (e) {
        if (browser) await browser.close();
        return { success: false, error: e.message };
    }
}

async function startHunterDaemon() {
  QL.logQuanLuat(DAEMON_NAME, '🏹 Tôm Thợ Săn STARTED');
  QL.logQuanLuat(DAEMON_NAME, 'Running in background. Monitoring task queue...');

  setInterval(async () => {
    if (!QL.checkTerritory(DAEMON_NAME, 'scan')) return;
    try {
      // 1. Check Queue Size
      try {
          const files = fs.readdirSync(path.join(config.MEKONG_DIR, 'tasks'));
          const missions = files.filter(f => f.startsWith('mission_') && f.endsWith('.txt'));
          if (missions.length >= MAX_QUEUE_SIZE) return;
      } catch (e) {
          // Ignore if tasks dir doesn't exist yet
      }

      // 2. Pick a Target Project
      const allProjects = [...config.DNA_PROJECTS, ...config.SATELLITE_PROJECTS];
      const targetProject = allProjects[Math.floor(Math.random() * allProjects.length)];
      
      let projectDir = path.join(config.MEKONG_DIR, 'apps', targetProject);
      if (targetProject === 'wellnexus') projectDir = '/Users/macbookprom1/Well';
      if (!fs.existsSync(projectDir)) return;

      // 3. Hunt! (Active Verification)
      // Simulate verifying localhost or staging URL
      // In production, we would map project -> URL from config
      const devUrl = `http://localhost:3000`; // Placeholder
      const screenshotPath = `/tmp/hunter_verify_${targetProject}_${Date.now()}.png`;
      
      const verification = await verifyDeployment(devUrl, screenshotPath);
      
      if (!verification.success) {
          // Alert! Deployment might be broken
          if (!verification.error.includes('ECONNREFUSED')) {
             // Emit Signal (Pheromone)
             sendSignal('BUG_REPORT', {
                 issue: `Deployment Verification Failed: ${verification.error}`,
                 file: devUrl,
                 project: targetProject,
                 evidence: screenshotPath
             }, 'HIGH', 'builder');
          }
      } else {
             QL.logQuanLuat(DAEMON_NAME, `✅ Verified ${targetProject}: ${verification.title}`);
      }
      
      // 4. Hunt! (Code Scanning - Async)
      // Only scan if verification didn't fail catastrophically (or scan anyway to find the bug)
      generateHunterMission(targetProject, projectDir).then(hunterMission => {
        if (hunterMission) {
          // For standard code issues, we can still use missions OR signals.
          // Let's use Mission Files for now to keep legacy compat, but we could upgrade this later.
          const filename = `mission_${targetProject}_hunter_${hunterMission.pattern.toLowerCase()}_${Date.now()}.txt`;
          const missionPath = path.join(config.MEKONG_DIR, 'tasks', filename);
          
          if (!QL.checkQueueDiscipline(DAEMON_NAME)) return;
          fs.writeFileSync(missionPath, hunterMission.content);
          QL.logQuanLuat(DAEMON_NAME, `🎯 Generated mission: ${filename}`);
          QL.createSignal(DAEMON_NAME, 'dispatcher', 'MISSION_READY', { project: targetProject, file: filename }, 'MEDIUM');
        }
      }).catch(err => {
         QL.logQuanLuat(DAEMON_NAME, `❌ Scan error: ${err.message}`);
      });

    } catch (err) {
      QL.logQuanLuat(DAEMON_NAME, `❌ Loop Error: ${err.message}`);
    }
  }, POLL_INTERVAL);
}

startHunterDaemon();
