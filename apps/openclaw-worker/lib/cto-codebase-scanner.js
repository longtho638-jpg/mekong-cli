/**
 * cto-codebase-scanner.js
 * Lightweight project intel scanner: git status, recent commits, TODO count, file count.
 * Used for pre-dispatch reporting and dashboard logging.
 */

'use strict';

const { execSync } = require('child_process');

/**
 * Scan a project directory for basic health intel.
 * @param {{ dir: string, project: string }} pane
 * @returns {{ project: string, gitStatus: string, dirtyFiles: string, recentCommits: string, todoCount: number, fileCount: number }}
 */
function scanCodebase(pane) {
	const { dir, project } = pane;
	const intel = { project, gitStatus: 'CLEAN', dirtyFiles: '', recentCommits: '', todoCount: 0, fileCount: 0 };

	try {
		const gs = execSync('git status --porcelain 2>/dev/null | head -10', { cwd: dir, encoding: 'utf-8', timeout: 5000 }).trim();
		intel.gitStatus = gs ? 'DIRTY' : 'CLEAN';
		intel.dirtyFiles = gs.split('\n').filter(Boolean).slice(0, 5).join(', ');
	} catch {}

	try {
		intel.recentCommits = execSync('git log --oneline -5 2>/dev/null', { cwd: dir, encoding: 'utf-8', timeout: 5000 }).trim();
	} catch {}

	try {
		const count = execSync('grep -rE "TODO|FIXME|HACK" . --exclude-dir={node_modules,dist,.next,.claude,.git} 2>/dev/null | wc -l', {
			cwd: dir,
			encoding: 'utf-8',
			timeout: 5000,
		}).trim();
		intel.todoCount = parseInt(count) || 0;
	} catch {}

	try {
		const fc = execSync('find . \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\) | grep -v node_modules | wc -l', {
			cwd: dir,
			encoding: 'utf-8',
			timeout: 5000,
		}).trim();
		intel.fileCount = parseInt(fc) || 0;
	} catch {}

	return intel;
}

module.exports = { scanCodebase };
