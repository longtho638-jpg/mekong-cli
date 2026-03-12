#!/usr/bin/env node
// Quick one-shot task dropper — drops all 21 scope-locked tasks at once
const fs = require('fs');
const path = require('path');
const TASKS_DIR = '/Users/macbookprom1/mekong-cli/tasks';
const PROCESSED_DIR = path.join(TASKS_DIR, 'processed');

const SCOPE_LOCK = `PROJECT: /Users/macbookprom1/mekong-cli/apps/openclaw-worker

🔒 SCOPE LOCK — ĐỌC KỸ:
- CHỈ ĐƯỢC sửa files trong apps/openclaw-worker/
- CẤM TUYỆT ĐỐI đụng vào: anima119, 84tea, wellnexus, apex-os, sophia-*, agencyos-*, raas-*, com-anh-duong-*
- Build RED do project khác → BỎ QUA, KHÔNG fix
- Vi phạm = PHẢN QUÂN

`;

const tasks = [];
for (let i = 1; i <= 7; i++) {
    const f = path.join(PROCESSED_DIR, `CRITICAL_brain_upgrade_batch_${i}_1771431979.txt`);
    if (!fs.existsSync(f)) continue;
    const content = fs.readFileSync(f, 'utf-8');
    const re = /==========\s*\[Task \d+:\s*([^\]]+)\]\s*==========/g;
    const segments = content.split(re);
    for (let j = 1; j < segments.length; j += 2) {
        const rawName = segments[j].trim().replace('.txt', '');
        const cleanName = rawName.replace(/^(HIGH_|MEDIUM_|CRITICAL_)/, '');
        const taskContent = segments[j + 1] ? segments[j + 1].trim() : '';
        if (!taskContent) continue;
        const priority = rawName.startsWith('HIGH') ? 'HIGH' : 'MEDIUM';
        tasks.push({ name: cleanName, priority, content: taskContent });
    }
}

let count = 0;
for (const t of tasks) {
    const filename = `${t.priority}_brain_${t.name}_v2.txt`;
    const filepath = path.join(TASKS_DIR, filename);
    const processedPath = path.join(PROCESSED_DIR, filename);
    if (fs.existsSync(processedPath)) fs.unlinkSync(processedPath);
    fs.writeFileSync(filepath, SCOPE_LOCK + t.content);
    count++;
}
