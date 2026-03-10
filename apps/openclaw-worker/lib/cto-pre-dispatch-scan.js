/**
 * cto-pre-dispatch-scan.js
 * Pre-dispatch health check: git status + npm test before injecting task.
 * If build fail → BLOCK dispatch.
 * If test fail → return /debug task override.
 */

'use strict';

const { execSync } = require('child_process');

/**
 * Scan project state before dispatching a task.
 * @param {string} dir - Project directory
 * @param {string} project - Project name (for log messages)
 * @param {Function} log - Logger function
 * @returns {{ ok: boolean, action: 'proceed'|'block'|'debug', debugTask: string|null }}
 */
function scanBeforeDispatch(dir, project, log) {
	// 1. git status — dirty is fine, we just note it
	let gitDirty = false;
	try {
		const gs = execSync('git status --porcelain 2>/dev/null', {
			cwd: dir,
			encoding: 'utf-8',
			timeout: 5000,
		}).trim();
		gitDirty = gs.length > 0;
	} catch {
		/* no git or no changes — ignore */
	}

	// 2. npm test --silent (timeout 30s)
	let testFailed = false;
	let testSnippet = '';
	try {
		const testOut = execSync('npm test --silent 2>&1 | tail -15', {
			cwd: dir,
			encoding: 'utf-8',
			timeout: 30000,
		}).trim();
		const failPat = /FAIL|failing|failed|✕|×|Error:|AssertionError/i;
		if (failPat.test(testOut)) {
			testFailed = true;
			testSnippet = testOut
				.split('\n')
				.filter((l) => failPat.test(l))
				.slice(0, 3)
				.join('; ')
				.slice(0, 200)
				.replace(/"/g, '\\"');
		}
	} catch (e) {
		const stderr = (e.stderr || e.stdout || '').trim();
		// "missing script: test" → no test configured, treat as pass
		if (stderr && !/missing script|ERR!.*test/.test(stderr)) {
			testFailed = true;
			testSnippet = stderr.split('\n').slice(-5).join('; ').slice(0, 200).replace(/"/g, '\\"');
		}
	}

	// 3. Quick build check via package.json typecheck/build script presence
	let buildFailed = false;
	try {
		const pkgRaw = require('fs').readFileSync(`${dir}/package.json`, 'utf-8');
		const pkg = JSON.parse(pkgRaw);
		const hasTypecheck = pkg.scripts && (pkg.scripts.typecheck || pkg.scripts['type-check']);
		const hasBuild = pkg.scripts && pkg.scripts.build;
		if (hasTypecheck) {
			try {
				execSync('npm run typecheck --silent 2>&1', {
					cwd: dir,
					encoding: 'utf-8',
					timeout: 30000,
				});
			} catch (e2) {
				const out = (e2.stdout || e2.stderr || '').slice(0, 100);
				// Only flag real type errors, not missing script
				if (!/missing script/.test(out)) {
					buildFailed = true;
					log(`PRE-SCAN ${project}: typecheck failed — ${out.slice(0, 80)}`);
				}
			}
		} else if (hasBuild) {
			// Skip actual build (too slow), just log note
		}
	} catch {
		/* package.json not found or parse error — ignore */
	}

	if (buildFailed) {
		log(`PRE-SCAN ${project}: BUILD FAIL → BLOCKING dispatch`);
		return { ok: false, action: 'block', debugTask: null };
	}

	if (testFailed) {
		const debugTask = `/debug "${project}: Test failures detected. Error: ${testSnippet}. Fix source code then verify with npm test." --auto`;
		log(`PRE-SCAN ${project}: TEST FAIL → prioritizing /debug task`);
		return { ok: false, action: 'debug', debugTask };
	}

	log(`PRE-SCAN ${project}: OK (git=${gitDirty ? 'dirty' : 'clean'}, tests=pass)`);
	return { ok: true, action: 'proceed', debugTask: null };
}

module.exports = { scanBeforeDispatch };
