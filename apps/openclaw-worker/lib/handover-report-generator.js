/**
 * Handover Report Generator — Tự động tạo báo cáo bàn giao khi pipeline hoàn thành
 *
 * Tạo 2 file trong thư mục gốc project:
 *   - HANDOVER_REPORT.md   : Tóm tắt toàn bộ kết quả ship
 *   - PRODUCTION_CHECKLIST.md : Checklist pre/post launch
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Chạy lệnh shell an toàn, trả về stdout hoặc chuỗi rỗng nếu thất bại
 */
function safeExec(cmd, cwd) {
	try {
		return execSync(cmd, { cwd, encoding: 'utf-8', timeout: 15000 }).trim();
	} catch (e) {
		return '';
	}
}

/**
 * Đọc thông tin từ package.json
 */
function readPackageJson(projectDir) {
	try {
		return JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf-8'));
	} catch (e) {
		return {};
	}
}

/**
 * Lấy danh sách commit gần đây (tối đa 10) để trích xuất features
 */
function getRecentCommits(projectDir, limit) {
	const raw = safeExec(`git log --oneline -${limit || 10} --no-merges`, projectDir);
	if (!raw) return [];
	return raw
		.split('\n')
		.filter(Boolean)
		.map((line) => {
			const [hash, ...rest] = line.split(' ');
			return { hash, message: rest.join(' ') };
		});
}

/**
 * Lấy branch và commit cuối cùng
 */
function getGitInfo(projectDir) {
	return {
		branch: safeExec('git rev-parse --abbrev-ref HEAD', projectDir) || 'unknown',
		lastHash: safeExec('git rev-parse --short HEAD', projectDir) || 'unknown',
		lastMessage: safeExec('git log -1 --pretty=%s', projectDir) || '',
	};
}

/**
 * Đếm test pass/fail từ output npm test (hỗ trợ Jest/Vitest format)
 */
function parseTestStats(projectDir) {
	try {
		const output = execSync('npm test 2>&1', {
			cwd: projectDir,
			encoding: 'utf-8',
			timeout: 120000,
		});
		// Jest: "Tests: 5 passed, 0 failed"
		const jestMatch = output.match(/Tests:\s+(\d+)\s+passed(?:,\s+(\d+)\s+failed)?/i);
		if (jestMatch) {
			return {
				total: parseInt(jestMatch[1]) + (parseInt(jestMatch[2]) || 0),
				pass: parseInt(jestMatch[1]),
				fail: parseInt(jestMatch[2]) || 0,
			};
		}
		// Vitest: "✓ 5 tests passed"
		const vitestMatch = output.match(/(\d+)\s+tests?\s+passed/i);
		if (vitestMatch) {
			return { total: parseInt(vitestMatch[1]), pass: parseInt(vitestMatch[1]), fail: 0 };
		}
	} catch (e) {
		/* test chạy thất bại */
	}
	return null;
}

/**
 * Trích xuất production URL từ package.json hoặc vercel.json
 */
function getProductionUrl(projectDir, pkg) {
	if (pkg.homepage && pkg.homepage.startsWith('http')) return pkg.homepage;
	try {
		const vcfg = JSON.parse(fs.readFileSync(path.join(projectDir, 'vercel.json'), 'utf-8'));
		const aliases = vcfg.alias || vcfg.aliases || [];
		if (aliases.length > 0) return `https://${aliases[0]}`;
	} catch (e) {
		/* không có vercel.json */
	}
	return null;
}

/**
 * Sinh nội dung HANDOVER_REPORT.md
 */
function buildHandoverReport(projectDir, healthScore, scoutIssues) {
	const pkg = readPackageJson(projectDir);
	const git = getGitInfo(projectDir);
	const commits = getRecentCommits(projectDir, 10);
	const testStats = parseTestStats(projectDir);
	const prodUrl = getProductionUrl(projectDir, pkg);
	const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

	// Trích xuất features từ commit messages (lọc bỏ fix/chore)
	const features =
		commits
			.filter((c) => /^feat:|^add:|^implement/i.test(c.message))
			.map((c) => `- ${c.message}`)
			.join('\n') || '- (không có commit feat gần đây)';

	const testSection = testStats
		? `- Total: ${testStats.total} tests\n- Pass: ${testStats.pass} | Fail: ${testStats.fail}`
		: '- Không có test hoặc không thể đọc kết quả';

	const recentCommitList =
		commits
			.slice(0, 5)
			.map((c) => `- \`${c.hash}\` ${c.message}`)
			.join('\n') || '- (không có commit)';

	const issuesSection =
		scoutIssues && scoutIssues.length > 0
			? scoutIssues.map((i) => `- ${i}`).join('\n')
			: '- Không có vấn đề nghiêm trọng nào được ghi nhận';

	return `# Handover Report — ${pkg.name || path.basename(projectDir)}
Generated: ${now}

## Project Summary
- Name: ${pkg.name || path.basename(projectDir)}
- Version: ${pkg.version || 'N/A'}
- Health Score: ${healthScore !== undefined ? healthScore + '/100' : 'N/A'}

## Test Results
${testSection}

## Features Delivered
${features}

## Recent Commits
${recentCommitList}

## Deployment
- Branch: ${git.branch}
- Last commit: \`${git.lastHash}\` — ${git.lastMessage}
- Production URL: ${prodUrl || 'N/A'}

## Known Issues
${issuesSection}
`;
}

/**
 * Sinh nội dung PRODUCTION_CHECKLIST.md
 */
function buildProductionChecklist(projectName) {
	return `# Production Checklist — ${projectName}

## Pre-Launch
- [ ] All tests passing
- [ ] No critical security issues
- [ ] Environment variables configured
- [ ] API keys rotated for production
- [ ] Database migrations applied
- [ ] SSL certificate valid
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Error tracking configured (Sentry)
- [ ] Logging configured

## Post-Launch
- [ ] Production smoke test passed
- [ ] Monitoring dashboards set up
- [ ] Alerting configured
- [ ] Backup schedule verified
- [ ] Documentation updated
- [ ] Team notified
- [ ] Customer-facing changelog updated

## Security
- [ ] No secrets in codebase
- [ ] CSP headers configured
- [ ] HTTPS enforced
`;
}

/**
 * Tạo cả 2 file báo cáo vào thư mục gốc project.
 * @param {string} projectDir - Đường dẫn tuyệt đối tới thư mục project
 * @param {number} healthScore - Điểm sức khỏe từ project-health-scorer
 * @param {string[]} scoutIssues - Danh sách vấn đề tìm được ở phase SCOUT
 */
function generateHandoverDocs(projectDir, healthScore, scoutIssues) {
	const projectName = path.basename(projectDir);

	const handoverContent = buildHandoverReport(projectDir, healthScore, scoutIssues);
	const checklistContent = buildProductionChecklist(projectName);

	const handoverPath = path.join(projectDir, 'HANDOVER_REPORT.md');
	const checklistPath = path.join(projectDir, 'PRODUCTION_CHECKLIST.md');

	fs.writeFileSync(handoverPath, handoverContent, 'utf-8');
	fs.writeFileSync(checklistPath, checklistContent, 'utf-8');

	return { handoverPath, checklistPath };
}

module.exports = { generateHandoverDocs, buildHandoverReport, buildProductionChecklist };
