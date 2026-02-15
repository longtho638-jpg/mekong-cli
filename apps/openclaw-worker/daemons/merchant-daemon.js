const fs = require('fs');
const path = require('path');
const config = require('./config');
const QL = require('./lib/quan-luat-enforcer');
const { emit, SIGNALS } = require('./lib/signal-bus');

// ═══════════════════════════════════════════════════════════════
// 🏯 MERCHANT DAEMON — 軍需 (Quân Nhu)
// ═══════════════════════════════════════════════════════════════
// Rank: QUAN_NHU (Quân Nhu — Quartermaster)
// Territory: revenue
// 36 Kế: #20 Hỗn Thủy Mô Ngư, #23 Viễn Giao Cận Công
// Điều 3: CHỈ TRACK REVENUE, KHÔNG DEPLOY → chuyển Scribe
// Điều 4: Gemini Flash tier (FREE)
// ═══════════════════════════════════════════════════════════════

const DAEMON_NAME = 'merchant';
const DAEMON_RANK = QL.RANKS[DAEMON_NAME];
const MERCHANT_INTERVAL = 60 * 60 * 1000;

async function callGeminiFlash(prompt) {
  const MODEL = 'gemini-2.5-flash';
  if (!QL.validateModelTier(DAEMON_NAME, MODEL)) return null;

  try {
    const PROXY_URL = 'http://127.0.0.1:8080/v1/messages';
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "user", content: `You are the Revenue Architect of AgencyOS. Analyze financial data. Return JSON: { summary: string, alert: boolean, mission: string }. Focus on MRR growth. \n\n${prompt}` }
        ],
        max_tokens: 4096,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    let content = data.content[0].text;
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(content);

  } catch (e) {
    QL.logQuanLuat(DAEMON_NAME, `❌ API Call Failed: ${e.message}`);
    return { summary: "API Error, manual check required.", alert: false };
  }
}

function getMockRevenueData() {
  return {
    mrr: 15200, new_subs: 12, churn_subs: 2,
    transactions: [
      { id: 'tx_1', amount: 1200, plan: 'Sophia Factory', status: 'succeeded' },
      { id: 'tx_2', amount: 49, plan: 'Vibe Dev', status: 'succeeded' }
    ]
  };
}

async function merchantLoop() {
  QL.logQuanLuat(DAEMON_NAME, '💰 Merchant Daemon STARTED');

  setInterval(async () => {
    try {
      if (!QL.checkTerritory(DAEMON_NAME, 'track_payment')) return;

      QL.logQuanLuat(DAEMON_NAME, 'Syncing Revenue Data...');
      const data = getMockRevenueData();

      const prompt = `Financial Snapshot:\nMRR: $${data.mrr}\nNew Subs: ${data.new_subs}\nChurn: ${data.churn_subs}\nRecent Tx: ${JSON.stringify(data.transactions)}\n\nGenerate a brief report. If churn > 5, trigger ALERT.`;
      const report = await callGeminiFlash(prompt);

      if (report && report.summary) {
        QL.logQuanLuat(DAEMON_NAME, `📊 Report: ${report.summary}`);
        QL.createSignal(DAEMON_NAME, 'scribe', 'REVENUE_ALERT', { summary: report.summary, mrr: data.mrr }, report.alert ? 'HIGH' : 'LOW');
        emit(SIGNALS.REVENUE_ALERT, { source: DAEMON_NAME, detail: report.summary, mrr: data.mrr });

        if (report.alert) {
          QL.logQuanLuat(DAEMON_NAME, '🚨 CHURN ALERT! Generating Mission...');
          if (!QL.checkQueueDiscipline(DAEMON_NAME)) return;

          const missionContent = `COMPLEXITY: MEDIUM\nTIMEOUT: 30\nPROJECT: all\n\n/cook "MERCHANT AGENT: Revenue Alert!\n${report.summary}\nAction: Investigate churn spikes. Check Stripe logs." --auto\n`;
          const filename = `mission_merchant_alert_${Date.now()}.txt`;
          fs.writeFileSync(path.join(config.MEKONG_DIR, 'tasks', filename), missionContent);
          QL.logQuanLuat(DAEMON_NAME, `💸 Generated Alert Mission: ${filename}`);
        }
      }
    } catch (err) {
      QL.logQuanLuat(DAEMON_NAME, `❌ Sync error: ${err.message}`);
    }
  }, MERCHANT_INTERVAL);
}

merchantLoop();
