const fs = require('fs');
const { execSync } = require('child_process');
const crypto = require('crypto');

const BLACKBOX_API_KEY = "sk-ELEERyI0MyROHMJY27q-Sg";
const BLACKBOX_API_URL = "https://api.blackbox.ai/v1/chat/completions";

function log(msg) {
  const line = `[${new Date().toISOString().split('T')[1].slice(0,8)}] [KIMI-GUARDIAN] ${msg}`;
  console.log(line);
  fs.appendFileSync('/Users/macbookprom1/ram-guardian.log', line + '\n');
}

function getSystemStats() {
  let freeRAM = '?', usedSwap = '?', freeSSD = '?';
  try {
    const rawRam = execSync("top -l 1 -s 0 2>/dev/null | grep PhysMem | grep -o '[0-9]*M'").toString().trim().split('\n');
    if (rawRam.length >= 2) freeRAM = rawRam[1].replace('M', ''); // Second match is usually free
    
    const rawSwap = execSync("sysctl vm.swapusage").toString();
    const swapMatch = rawSwap.match(/used = ([0-9]+)\.[0-9]+M/);
    if (swapMatch) usedSwap = swapMatch[1];
    
    const rawDisk = execSync("df -h / | tail -1").toString();
    const diskMatch = rawDisk.trim().split(/\s+/);
    if (diskMatch.length >= 4) freeSSD = diskMatch[3];
  } catch (e) { log("Error getting stats: " + e.message); }
  
  return { freeRAM, usedSwap, freeSSD };
}

async function askKimi(stats) {
  const prompt = `You are the M1 System Guardian. 
Current Stats: RAM Free: ${stats.freeRAM}MB, Swap Used: ${stats.usedSwap}MB, SSD Free: ${stats.freeSSD}.
Thresholds: Free RAM under 1000MB or Swap over 12000MB or SSD under 5GB is CRITICAL.
Are we in danger? If yes, respond ONLY with "PURGE". If no, respond ONLY with "SAFE". Do not explain.`;

  try {
    const response = await fetch(BLACKBOX_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${BLACKBOX_API_KEY}` },
      body: JSON.stringify({
        model: "blackboxai/moonshotai/kimi-k2-thinking",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 10
      })
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "SAFE";
  } catch (e) {
    log("Kimi API failed: " + e.message);
    return "SAFE";
  }
}

function executePurge() {
  log("�� KIMI DECLARED CRITICAL STATE. EXECUTING PURGE ACTION.");
  try {
    execSync("sync && purge 2>/dev/null");
    execSync('pkill -9 -f "jest.*worker" || true');
    execSync('pkill -9 -f "vitest" || true');
    execSync('pkill -9 -f "turbo.*run" || true');
    // We do NOT clear node/tmux to preserve state, just the dead ones
  } catch (e) {}
}

async function guardianLoop() {
  log("🦞 Kimi M1 Guardian Online.");
  while (true) {
    const stats = getSystemStats();
    log(`Stats check — RAM: ${stats.freeRAM}MB | SWAP: ${stats.usedSwap}MB | SSD: ${stats.freeSSD}`);
    
    if (parseInt(stats.freeRAM) < 1500 || parseInt(stats.usedSwap) > 5000) {
      log("Threshold crossed. Asking Kimi...");
      const KimiDecision = await askKimi(stats);
      log(`Kimi Decision: ${KimiDecision}`);
      
      if (KimiDecision.includes("PURGE")) {
        executePurge();
        await new Promise(r => setTimeout(r, 10000)); // wait 10s after purge
      }
    }
    
    await new Promise(r => setTimeout(r, 30000)); // check every 30s
  }
}

guardianLoop();
