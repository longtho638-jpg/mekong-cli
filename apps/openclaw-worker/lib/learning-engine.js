/**
 * AGI Level 5: Self-Learning Engine — 知彼知己 (Know enemy, know self)
 *
 * Phân tích lịch sử mission để rút ra bài học và tối ưu hóa chiến lược.
 * Trọng tâm:
 * 1. Phân tích tỷ lệ thành công theo loại task.
 * 2. Nhận diện các lỗi phổ biến (failure modes).
 * 3. Đề xuất cải thiện cho Binh Pháp tasks.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');
const { log } = require('./brain-tmux');

const HISTORY_FILE = path.join(config.MEKONG_DIR, 'apps/openclaw-worker/data/mission-history.json');
const INSIGHTS_FILE = path.join(config.MEKONG_DIR, 'apps/openclaw-worker/data/learning-insights.json');

let learningInterval = null;

async function generateLearningInsights() {
  if (!fs.existsSync(HISTORY_FILE)) {
    log('[LEARNING] No mission history found. Skipping analysis.');
    return;
  }

  log('[LEARNING] Analyzing mission history for patterns...');

  try {
    const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    if (history.length < 5) {
      log('[LEARNING] Not enough history (min 5 missions). Skipping.');
      return;
    }

    // Lấy 20 missions gần nhất để phân tích
    const recentHistory = history.slice(-20);

    const summary = {
      total: recentHistory.length,
      success: recentHistory.filter(m => m.success).length,
      failed: recentHistory.filter(m => !m.success).length,
      avgTokens: Math.round(recentHistory.reduce((a, b) => a + (b.tokensUsed || 0), 0) / recentHistory.length),
      failureReasons: recentHistory.filter(m => !m.success).map(m => m.missionId)
    };

    // AI Analysis (用間 - Intelligence)
    const response = await fetch(`${config.CLOUD_BRAIN_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.FALLBACK_MODEL_NAME,
        messages: [
          {
            role: "system",
            content: "You are an AI Strategist (Sun Tzu style). Analyze mission history and provide 'Lessons Learned' and 'Strategy Adjustments'. Respond in TIẾNG VIỆT. Format as JSON: { lessons: [string], adjustments: [string], top_failure_mode: string }"
          },
          {
            role: "user",
            content: `Recent History Summary:\n${JSON.stringify(summary, null, 2)}`
          }
        ],
        temperature: 0.3
      })
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
      const insights = JSON.parse(content);

      const report = {
        timestamp: new Date().toISOString(),
        stats: summary,
        insights
      };

      fs.writeFileSync(INSIGHTS_FILE, JSON.stringify(report, null, 2));
      log(`[LEARNING] AGI Level 5 Insights generated: ${insights.top_failure_mode}`);
    }
  } catch (e) {
    log(`[LEARNING] Analysis failed: ${e.message}`);
  }
}

function startLearningEngine() {
  if (learningInterval) return;

  // Chạy ngay lần đầu
  generateLearningInsights();

  // Chạy mỗi 4 tiếng (Learning is a slow process)
  learningInterval = setInterval(generateLearningInsights, 4 * 60 * 60 * 1000);
}

function stopLearningEngine() {
  if (learningInterval) {
    clearInterval(learningInterval);
    learningInterval = null;
  }
}

module.exports = { startLearningEngine, stopLearningEngine };
