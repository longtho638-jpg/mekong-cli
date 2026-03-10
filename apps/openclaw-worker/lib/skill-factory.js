/**
 * Skill Factory — Auto-generate .claude/skills/ from high-value mission diffs
 *
 * TASK 15/22: CTO Brain Upgrade
 *
 * After successful complex missions, generates ClaudeKit-format SKILL.md
 * files that can be reused by CC CLI for similar tasks.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

const SKILLS_AUTO_DIR = path.join(config.MEKONG_DIR || '.', '.claude', 'skills', 'auto-generated');

function log(msg) {
	const ts = new Date().toISOString().slice(11, 19);
	const line = `[${ts}] [skill-factory] ${msg}\n`;
	try {
		fs.appendFileSync(config.LOG_FILE, line);
	} catch (_) {}
}

/**
 * Generate a skill from a successful mission
 * @param {{ missionId: string, prompt: string, logContent: string, project: string, category: string }} opts
 * @returns {Promise<string|null>} - Path to generated SKILL.md
 */
async function generateSkill({ missionId, prompt, logContent, project, category }) {
	try {
		const { callLLM } = require('./proxy-client');
		const content = await callLLM({
			system: `You are a skill creator for ClaudeKit Engineer.
Generate a SKILL.md file with this exact format:

---
name: [kebab-case-name]
description: [One line description of what this skill does]
---

# [Skill Title]

## When to Use
[When this skill should be activated]

## Steps
1. [Step 1]
2. [Step 2]
...

## Prompt Template
\`\`\`
[A reusable prompt template with {{PLACEHOLDER}} variables]
\`\`\`

## Common Gotchas
- [Gotcha 1]
- [Gotcha 2]`,
			user: `Create a reusable skill from this successful mission:\n\nPROJECT: ${project}\nCATEGORY: ${category || 'general'}\nMISSION:\n${prompt.slice(0, 2000)}\n\nEXECUTION LOG (tail):\n${(logContent || '').slice(-1500)}`,
			maxTokens: 600,
			temperature: 0.1,
			timeoutMs: 15000,
		});

		if (!content || content.length < 100) return null;

		// Extract skill name from frontmatter
		const nameMatch = content.match(/name:\s*([a-z0-9-]+)/);
		const skillName = nameMatch ? nameMatch[1] : `auto-${Date.now()}`;

		const skillDir = path.join(SKILLS_AUTO_DIR, skillName);
		if (!fs.existsSync(skillDir)) fs.mkdirSync(skillDir, { recursive: true });

		const skillPath = path.join(skillDir, 'SKILL.md');
		fs.writeFileSync(skillPath, content);

		log(`🧩 Skill generated: ${skillName} → ${skillPath}`);
		return skillPath;
	} catch (err) {
		log(`Skill generation error: ${err.message}`);
		return null;
	}
}

/**
 * List auto-generated skills
 * @returns {Array<{ name: string, path: string, description: string }>}
 */
function listAutoSkills() {
	const skills = [];
	try {
		if (!fs.existsSync(SKILLS_AUTO_DIR)) return skills;
		for (const name of fs.readdirSync(SKILLS_AUTO_DIR)) {
			const skillPath = path.join(SKILLS_AUTO_DIR, name, 'SKILL.md');
			if (fs.existsSync(skillPath)) {
				const content = fs.readFileSync(skillPath, 'utf-8');
				const descMatch = content.match(/description:\s*(.+)/);
				skills.push({
					name,
					path: skillPath,
					description: descMatch ? descMatch[1] : 'Auto-generated skill',
				});
			}
		}
	} catch (e) {
		/* skip */
	}
	return skills;
}

module.exports = { generateSkill, listAutoSkills };
