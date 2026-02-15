# Telegram Auto Task Watcher

## Goal

Implement file watcher daemon that:

1. Watches `/tmp/openclaw_task_*.txt` for new tasks
2. Reads task content
3. Executes task via CC CLI
4. Sends result back to Telegram

## Implementation

### File: `apps/openclaw-worker/task-watcher.js`

```javascript
const fs = require('fs');
const { exec, spawn } = require('child_process');
const path = require('path');

const WATCH_DIR = '/tmp';
const TASK_PATTERN = /^openclaw_task_.*\.txt$/;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const PROCESSED_DIR = '/tmp/openclaw_processed';

// Ensure processed dir exists
if (!fs.existsSync(PROCESSED_DIR)) {
	fs.mkdirSync(PROCESSED_DIR, { recursive: true });
}

// Send message to Telegram
async function sendTelegram(text) {
	const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
	await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'Markdown' }),
	});
}

// Execute task via CC CLI
function executeTask(taskContent, taskFile) {
	return new Promise((resolve, reject) => {
		console.log(`\n📋 Executing: ${taskContent.slice(0, 50)}...`);

		// For shell commands (prefix !)
		if (taskContent.startsWith('!')) {
			const cmd = taskContent.slice(1);
			exec(cmd, { cwd: '/Users/macbookprom1/mekong-cli' }, (error, stdout, stderr) => {
				resolve({ success: !error, output: stdout || stderr || error?.message });
			});
			return;
		}

		// For Claude tasks - spawn CC CLI with task
		const claude = spawn('claude', ['-p', taskContent], {
			cwd: '/Users/macbookprom1/mekong-cli',
			stdio: ['pipe', 'pipe', 'pipe'],
		});

		let output = '';
		claude.stdout.on('data', (data) => (output += data.toString()));
		claude.stderr.on('data', (data) => (output += data.toString()));

		claude.on('close', (code) => {
			resolve({ success: code === 0, output: output.slice(-2000) });
		});

		// Timeout after 5 minutes
		setTimeout(
			() => {
				claude.kill();
				resolve({ success: false, output: 'Timeout after 5 minutes' });
			},
			5 * 60 * 1000,
		);
	});
}

// Process new task file
async function processTask(taskFile) {
	const filePath = path.join(WATCH_DIR, taskFile);

	try {
		const content = fs.readFileSync(filePath, 'utf-8').trim();
		console.log(`\n🔔 New task: ${taskFile}`);

		await sendTelegram(`⏳ Processing task...\n\n"${content.slice(0, 200)}"`);

		const result = await executeTask(content, taskFile);

		const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
		await sendTelegram(`${status}\n\n${result.output.slice(0, 3500)}`);

		// Move to processed
		fs.renameSync(filePath, path.join(PROCESSED_DIR, taskFile));
	} catch (error) {
		console.error('Task error:', error);
		await sendTelegram(`❌ Error: ${error.message}`);
	}
}

// Watch for new files
console.log('👀 Watching for Telegram tasks...');
console.log(`📁 Directory: ${WATCH_DIR}`);

fs.watch(WATCH_DIR, (eventType, filename) => {
	if (eventType === 'rename' && filename && TASK_PATTERN.test(filename)) {
		const filePath = path.join(WATCH_DIR, filename);
		if (fs.existsSync(filePath)) {
			setTimeout(() => processTask(filename), 500); // Small delay for file write
		}
	}
});

// Initial scan for existing files
fs.readdirSync(WATCH_DIR)
	.filter((f) => TASK_PATTERN.test(f))
	.forEach((f) => processTask(f));

console.log('✅ Task watcher ready!\n');
```

### Integration with launchd

Update `openclaw-service.sh` to include task watcher.

### Verification

1. Send `/delegate test task` from Telegram
2. Check logs: `tail -f /tmp/openclaw-watcher.log`
3. Verify response in Telegram
