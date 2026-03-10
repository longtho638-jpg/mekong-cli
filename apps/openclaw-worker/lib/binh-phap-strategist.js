/**
 * 🐉 BINH PHÁP STRATEGIST — AGI Level 7: The Wise Soul
 *
 * 📜 Binh Pháp Ch.1 始計: 「夫未戰而廟算勝者，得算多也」
 *    "The general who wins a battle makes many calculations in his temple before the battle is fought"
 *
 * This module performs deep strategic assessment (始計) using LLM Vision
 * to transform a "Smart" task into a "Wise" (Trí tuệ) mission.
 *
 * DNA FUSION: Sun Tzu's 13 Chapters + ClaudeKit Agents + BMAD Workflows
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const config = require('../config');

const PROXY_PORT = config.PROXY_PORT || 20128;
const MODEL = 'gemini-3-pro'; // Wisdom requires depth (9router)
const DATA_DIR = path.join(config.MEKONG_DIR, 'apps/openclaw-worker/data');
const STRATEGY_HISTORY_FILE = path.join(DATA_DIR, 'strategy-history.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function log(msg) {
	const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
	const line = `[${ts}] [tom-hum] [WISDOM] ${msg}`;
	try {
		fs.appendFileSync('/Users/macbookprom1/tom_hum_cto.log', line + '\n');
	} catch (e) {}
}

/**
 * Perform a Binh Phap Strategic Assessment (始計)
 * @param {string} task - The task description
 * @param {string} project - The project name
 * @returns {Promise<Object>} The strategist's output
 */
async function strategize(task, project) {
	// 📡用間 (Yong Jian): Pull historical intel before thinking
	const { getRelevantLessons } = require('./learning-engine');
	const lessons = getRelevantLessons(project, task);
	const intelBlock = lessons.map((l) => `- ${l}`).join('\n');

	const prompt = `You are Sun Tzu (Tôn Tử), the legendary military strategist. Analyze this mission for project "${project}" through the lens of the 13 Chapters of Binh Phap (The Art of War).

MISSION: ${task}

BATTLEFIELD INTEL (Historical Lessons):
${intelBlock}

ASSIGN:
1. FIVE ESSENTIALS (Ngũ Sự): Identify ĐẠO (Alignment), THIÊN (Timing), ĐỊA (Environment), TƯỚNG (Leadership), PHÁP (Process).
2. NINE SITUATIONS (Cữu Địa): Classify the terrain (e.g. 散地 Tản Địa = Local dev, 死地 Tử Địa = Prod down).
3. COMBAT MODE (Phong Lâm Hỏa Sơn): Choose GIÓ (Speed), RỪNG (Discipline), LỬA (Power), or NÚI (Strategic).
4. STRATEGIC MANEUVER (Kế Sách): Choose one of the 36 Stratagems (e.g. "Man thiên quá hải" or "Sấn hỏa đả kiếp").
5. MANDATE (Mệnh lệnh): Write a brief, wise command in VIETNAMESE that gives the agent "Wisdom" (Trí tuệ). Use Sun Tzu's voice. Take the Battlefield Intel into account.

Format your response as a valid JSON object:
{
  "essentials": { "dao": "", "thien": "", "dia": "", "tuong": "", "phap": "" },
  "situation": "string",
  "mode": "GIÓ|RỪNG|LỬA|NÚI",
  "stratagem": "string",
  "mandate": "string in Vietnamese",
  "agi_level": 7,
  "reasoning": "string"
}`;

	log(`STRATEGIZING: "${task.slice(0, 50)}..." for ${project}`);

	return new Promise((resolve) => {
		const body = JSON.stringify({
			model: MODEL,
			max_tokens: 1024,
			system: 'You are Tôn Tử (Sun Tzu), the legendary general. Return ONLY valid JSON.',
			messages: [{ role: 'user', content: prompt }],
		});

		const timer = setTimeout(() => {
			log(`TIMEOUT: Strategic assessment failed for mission`);
			resolve(fallbackStrategy(task));
		}, 30000); // 30s timeout for wisdom

		const req = http.request(
			{
				hostname: '127.0.0.1',
				port: PROXY_PORT,
				path: '/v1/messages',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': 'ollama',
					'anthropic-version': '2023-06-01',
				},
			},
			(res) => {
				let data = '';
				res.on('data', (chunk) => (data += chunk));
				res.on('end', () => {
					clearTimeout(timer);
					try {
						const response = JSON.parse(data);
						const text = (response.content || []).find((c) => c.type === 'text')?.text || '';
						if (!text) throw new Error('Empty response');

						const result = JSON.parse(
							text
								.replace(/```json?\n?/g, '')
								.replace(/```/g, '')
								.trim(),
						);
						log(`WISDOM GAINED: Mode=${result.mode}, Stratagem=${result.stratagem}`);

						// Save to history
						try {
							let history = [];
							if (fs.existsSync(STRATEGY_HISTORY_FILE)) history = JSON.parse(fs.readFileSync(STRATEGY_HISTORY_FILE, 'utf-8'));
							history.push({ ...result, task, project, timestamp: new Date().toISOString() });
							if (history.length > 100) history = history.slice(-100);
							fs.writeFileSync(STRATEGY_HISTORY_FILE, JSON.stringify(history, null, 2));
						} catch (e) {}

						resolve(result);
					} catch (e) {
						log(`JSON Parse Error: ${e.message}`);
						resolve(fallbackStrategy(task));
					}
				});
			},
		);

		req.on('error', (e) => {
			clearTimeout(timer);
			log(`HTTP Error: ${e.message}`);
			resolve(fallbackStrategy(task));
		});

		req.write(body);
		req.end();
	});
}

/**
 * Fallback to manual heuristics if LLM wisdom is offline
 */
function fallbackStrategy(task) {
	const isCritical = task.toLowerCase().includes('critical') || task.toLowerCase().includes('prod down');
	return {
		essentials: { dao: 'Bảo vệ thành quả', thien: 'Khẩn cấp', dia: 'Khu vực lõi', tuong: 'Dũng mãnh', phap: 'Tối thiẻu hóa rủi ro' },
		situation: isCritical ? '死地 Tử Địa' : 'Khinh Địa',
		mode: isCritical ? 'LỬA' : 'RỪNG',
		stratagem: 'Dĩ dật đãi lao',
		mandate: isCritical
			? 'Quân hỏa tốc, đánh trực diện vào tâm lỗi. Không lùi bước.'
			: 'Hành quân chậm rãi, thận trọng như rừng. Giữ vững kỷ luật.',
		agi_level: 6,
		reasoning: 'Fallback logic',
	};
}

module.exports = { strategize };
