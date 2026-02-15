#!/usr/bin/env node

const path = require('path');
const { PerceptionDashboard } = require('../packages/core/perception/dist');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const logDir = path.join(rootDir, 'logs');
  const pidFile = path.join(rootDir, 'brain_pid.txt');
  
  console.log(`${colors.cyan}${colors.bright}🧠 AGI EVOLUTION - PERCEPTION ENGINE${colors.reset}`);
  console.log(`${colors.gray}Scanning ecosystem at ${rootDir}...${colors.reset}\n`);

  try {
    const dashboard = new PerceptionDashboard(rootDir, logDir, pidFile);
    const report = await dashboard.generateReport();
    
    // 1. Service Status
    const statusColor = report.serviceStatus.status === 'healthy' ? colors.green : colors.red;
    console.log(`${colors.bright}SERVICE STATUS: ${statusColor}${report.serviceStatus.status.toUpperCase()}${colors.reset}`);
    if (report.serviceStatus.details.pid) {
        console.log(`PID: ${report.serviceStatus.details.pid}`);
    }
    if (report.serviceStatus.details.logError) {
        console.log(`Log Status: ${colors.red}${report.serviceStatus.details.logError}${colors.reset}`);
    } else if (report.serviceStatus.details.lastLogTime) {
        const ago = Math.round((Date.now() - report.serviceStatus.details.lastLogTime) / 1000);
        console.log(`Last Heartbeat: ${ago}s ago`);
    }
    console.log('');

    // 2. Summary
    console.log(`${colors.bright}ECOSYSTEM HEALTH${colors.reset}`);
    console.log(`Total Projects:  ${report.summary.totalProjects}`);
    console.log(`Built Projects:  ${colors.green}${report.summary.builtProjects}${colors.reset}`);
    console.log(`Healthy Projects: ${colors.cyan}${report.summary.healthyProjects}${colors.reset}`);
    console.log(`Tech Debt Index: ${colors.yellow}${report.summary.totalTechDebt.anyType + report.summary.totalTechDebt.tsIgnore}${colors.reset} (any + @ts-ignore)`);
    console.log('');

    // 3. Top Tech Debt
    console.log(`${colors.bright}TOP TECH DEBT OFFENDERS${colors.reset}`);
    const sortedByDebt = [...report.projects].sort((a, b) => 
        (b.techDebt.anyCount + b.techDebt.tsIgnoreCount) - (a.techDebt.anyCount + a.techDebt.tsIgnoreCount)
    );
    
    // Header
    console.log(`${colors.gray}Project                        Any    Ignore   TODO   Status${colors.reset}`);
    
    sortedByDebt.slice(0, 10).forEach(p => {
        const name = p.name.padEnd(30);
        const anyC = p.techDebt.anyCount.toString().padStart(6);
        const ignC = p.techDebt.tsIgnoreCount.toString().padStart(8);
        const todo = p.techDebt.todoCount.toString().padStart(6);
        const status = p.isBuilt ? `${colors.green}BUILT${colors.reset}` : `${colors.red}FAIL ${colors.reset}`;
        
        // Highlight high numbers
        const anyDisplay = p.techDebt.anyCount > 50 ? `${colors.red}${anyC}${colors.reset}` : anyC;
        
        console.log(`${name} ${anyDisplay} ${ignC} ${todo}   ${status}`);
    });
    
    console.log(`\n${colors.gray}Run 'npm run build' in failing projects to restore health.${colors.reset}`);

  } catch (e) {
    console.error(`${colors.red}Dashboard Failed:${colors.reset}`, e);
    process.exit(1);
  }
}

main().catch(console.error);
