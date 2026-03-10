/**
 * Knowledge Synthesizer — Extract reusable patterns from successful missions
 *
 * TASK 14/22: CTO Brain Upgrade
 *
 * Analyzes completed missions and generates knowledge artifacts
 * for patterns that can be reused across projects.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

const KNOWLEDGE_DIR = path.join(config.MEKONG_DIR || process.env.HOME, '.openclaw', 'knowledge');

function log(msg) {
	const ts = new Date().toISOString().slice(11, 19);
	const line = `[${ts}] [knowledge] ${msg}\n`;
	try {
		fs.appendFileSync(config.LOG_FILE, line);
	} catch (_) {}
}

/**
 * Determine if a mission is worth synthesizing knowledge from
 * @param {{ prompt: string, result: string, elapsed: number, complexity: string }} mission
 * @returns {boolean}
 */
function isLearnableMission(mission) {
	if (!mission.result || mission.result !== 'success') return false;
	if (mission.elapsed < 60) return false; // Too short = too simple

	// Complex missions are more likely to have reusable patterns
	const complexityHints = [
		/refactor/i,
		/migration/i,
		/upgrade/i,
		/integration/i,
		/authentication/i,
		/deployment/i,
		/security/i,
		/performance/i,
		/i18n/i,
		/api/i,
		/database/i,
		/test.*suite/i,
	];

	const isComplex =
		mission.complexity === 'complex' || mission.complexity === 'critical' || complexityHints.some((p) => p.test(mission.prompt));

	return isComplex;
}

/**
 * Generate a knowledge artifact from a successful mission
 * @param {{ missionId: string, prompt: string, logContent: string, project: string }} opts
 * @returns {Promise<string|null>} - Path to generated knowledge file
 */
async function synthesizeKnowledge({ missionId, prompt, logContent, project }) {
	try {
		const { callLLM } = require('./proxy-client');
		const content = await callLLM({
			system: `You are a knowledge extraction engine. Analyze this successful mission and extract a REUSABLE PATTERN.
Output format:
TITLE: [Short descriptive title]
CATEGORY: [One of: refactoring, testing, deployment, security, performance, integration, migration, i18n, debugging]
PROBLEM: [What problem was solved - 1-2 sentences]
SOLUTION: [Step-by-step solution - numbered list]
REUSABLE_PROMPT: [A template prompt that could solve similar problems]
GOTCHAS: [Common pitfalls to avoid]`,
			user: `PROJECT: ${project}\nMISSION:\n${prompt.slice(0, 2000)}\n\nEXECUTION LOG (tail):\n${(logContent || '').slice(-2000)}`,
			maxTokens: 800,
			temperature: 0.1,
			timeoutMs: 15000,
		});

		if (!content || content.length < 100) return null;

		// Save knowledge artifact
		const timestamp = new Date().toISOString().slice(0, 10);
		const slug = (missionId || 'unknown').replace(/[^a-z0-9]/gi, '_').slice(0, 50);
		const filename = `${timestamp}_${slug}.md`;
		const filePath = path.join(KNOWLEDGE_DIR, project || 'general', filename);

		const dir = path.dirname(filePath);
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

		const artifact = `# Knowledge: ${missionId}\n\n> Generated: ${new Date().toISOString()}\n> Project: ${project}\n> Source: Mission auto-synthesis\n\n${content}\n`;

		fs.writeFileSync(filePath, artifact);
		log(`📚 Knowledge synthesized: ${filename}`);
		return filePath;
	} catch (err) {
		log(`Knowledge synthesis error: ${err.message}`);
		return null;
	}
}

/**
 * List existing knowledge for a project
 * @param {string} project
 * @returns {string[]} - List of knowledge file paths
 */
function listKnowledge(project) {
	const dir = path.join(KNOWLEDGE_DIR, project || 'general');
	try {
		if (!fs.existsSync(dir)) return [];
		return fs
			.readdirSync(dir)
			.filter((f) => f.endsWith('.md'))
			.map((f) => path.join(dir, f));
	} catch (e) {
		return [];
	}
}

/**
 * Search knowledge base for relevant entries
 * @param {string} query - Search terms
 * @returns {Array<{ file: string, snippet: string }>}
 */
function searchKnowledge(query) {
	const results = [];
	const queryLower = query.toLowerCase();

	try {
		const baseDir = KNOWLEDGE_DIR;
		if (!fs.existsSync(baseDir)) return results;

		const projects = fs.readdirSync(baseDir).filter((f) => {
			const stat = fs.statSync(path.join(baseDir, f));
			return stat.isDirectory();
		});

		for (const project of projects) {
			const files = listKnowledge(project);
			for (const file of files.slice(-50)) {
				// Last 50 per project
				try {
					const content = fs.readFileSync(file, 'utf-8');
					if (content.toLowerCase().includes(queryLower)) {
						const lines = content.split('\n');
						const matchLine = lines.findIndex((l) => l.toLowerCase().includes(queryLower));
						results.push({
							file,
							project,
							snippet: lines.slice(Math.max(0, matchLine - 1), matchLine + 3).join('\n'),
						});
					}
				} catch (e) {
					/* skip unreadable */
				}
			}
		}
	} catch (e) {
		/* skip */
	}

	return results.slice(0, 10); // Top 10 results
}

module.exports = {
	isLearnableMission,
	synthesizeKnowledge,
	listKnowledge,
	searchKnowledge,
};
