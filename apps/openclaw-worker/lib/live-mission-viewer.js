#!/usr/bin/env node
/**
 * Live Mission Viewer — real-time colored tail of Tôm Hùm log
 *
 * Run in VS Code terminal to watch mission progress:
 *   node apps/openclaw-worker/lib/live-mission-viewer.js
 */

const fs = require('fs');
const path = require('path');

const LOG_FILE = process.env.TOM_HUM_LOG || '/Users/macbookprom1/tom_hum_cto.log';
const C = {
	reset: '\x1b[0m',
	dim: '\x1b[2m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	red: '\x1b[31m',
	cyan: '\x1b[36m',
	bold: '\x1b[1m',
	magenta: '\x1b[35m',
};

function colorize(line) {
	if (line.includes('MISSION #')) return `${C.bold}${C.cyan}${line}${C.reset}`;
	if (line.includes('COMPLETE')) return `${C.bold}${C.green}${line}${C.reset}`;
	if (line.includes('FAILED') || line.includes('ERROR')) return `${C.bold}${C.red}${line}${C.reset}`;
	if (line.includes('TIMEOUT')) return `${C.yellow}${line}${C.reset}`;
	if (line.includes('working --')) return `${C.dim}${line}${C.reset}`;
	if (line.includes('PROJECT:')) return `${C.magenta}${line}${C.reset}`;
	return line;
}

console.log(`${C.bold}${C.cyan}--- TOM HUM Live Viewer ---${C.reset}`);
console.log(`${C.dim}Tailing: ${LOG_FILE}${C.reset}\n`);

// Show last 20 lines on start
try {
	const content = fs.readFileSync(LOG_FILE, 'utf-8');
	const lines = content.split('\n').filter(Boolean).slice(-20);
	lines.forEach((l) => process.stdout.write(colorize(l) + '\n'));
	console.log(`${C.dim}--- live tail starts ---${C.reset}\n`);
} catch (e) {
	console.log(`${C.dim}(log file will appear when first mission runs)${C.reset}`);
}

// Watch for new content
let pos = 0;
try {
	pos = fs.statSync(LOG_FILE).size;
} catch (e) {}

fs.watchFile(LOG_FILE, { interval: 500 }, () => {
	try {
		const stat = fs.statSync(LOG_FILE);
		if (stat.size <= pos) {
			pos = 0;
		}
		const stream = fs.createReadStream(LOG_FILE, { start: pos, encoding: 'utf-8' });
		let buf = '';
		stream.on('data', (chunk) => {
			buf += chunk;
		});
		stream.on('end', () => {
			pos = stat.size;
			buf
				.split('\n')
				.filter(Boolean)
				.forEach((l) => process.stdout.write(colorize(l) + '\n'));
		});
	} catch (e) {}
});

process.on('SIGINT', () => {
	fs.unwatchFile(LOG_FILE);
	process.exit(0);
});
