#!/usr/bin/env node
/**
 * OpenClaw Bridge Server
 * Receives commands from OpenClaw Worker and executes via CC CLI
 * Also allows Antigravity to send messages back to Telegram
 */

const http = require('http');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 8765;
const TELEGRAM_BOT_TOKEN = '8405197398:AAHuuykECSxEGZaBZVhtvwyIWM84LtGLO5I';
const TELEGRAM_CHAT_ID = 5503922921;
const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN || '';

// Validate Bearer token on mutating endpoints
function authenticateRequest(req, res) {
  if (!BRIDGE_TOKEN) return true; // No token configured = open (dev mode)
  const auth = req.headers['authorization'] || '';
  if (auth === `Bearer ${BRIDGE_TOKEN}`) return true;
  res.writeHead(401, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Unauthorized' }));
  return false;
}

// Task queue
const tasks = [];
const results = new Map();

// Send message to Telegram
async function sendTelegram(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'Markdown'
      })
    });
    console.log('📤 Telegram:', text.slice(0, 50) + '...');
  } catch (error) {
    console.error('Telegram error:', error.message);
  }
}

// Execute command via CC CLI
function executeTask(task, taskId) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔧 Executing task ${taskId}: ${task.slice(0, 50)}...`);
    
    // For simple commands, use exec
    if (task.startsWith('!')) {
      const cmd = task.slice(1);
      exec(cmd, { cwd: '/Users/macbookprom1/mekong-cli' }, (error, stdout, stderr) => {
        if (error) {
          resolve({ success: false, error: stderr || error.message });
        } else {
          resolve({ success: true, output: stdout });
        }
      });
      return;
    }
    
    // For CC CLI tasks, write to task file
    const taskFile = `/tmp/openclaw_task_${taskId}.txt`;
    fs.writeFileSync(taskFile, task);
    
    resolve({
      success: true,
      output: `Task queued: ${taskId}\nTask file: ${taskFile}\nManual execution required.`
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (url.pathname === '/' || url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      name: 'OpenClaw Bridge',
      version: '1.0.0',
      tasks: tasks.length,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Receive task from OpenClaw (auth required)
  if (url.pathname === '/task' && req.method === 'POST') {
    if (!authenticateRequest(req, res)) return;
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const taskId = `task_${Date.now()}`;
        
        tasks.push({ id: taskId, task: data.task, status: 'pending' });
        
        // Send acknowledgment to Telegram
        await sendTelegram(`📥 Task received: ${data.task.slice(0, 100)}\n\n🔑 ID: ${taskId}`);
        
        // Execute
        const result = await executeTask(data.task, taskId);
        results.set(taskId, result);
        
        // Send result to Telegram
        const status = result.success ? '✅ Success' : '❌ Failed';
        await sendTelegram(`${status}\n\n${result.output?.slice(0, 500) || result.error?.slice(0, 500)}`);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ taskId, status: 'completed', result }));
        
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // Send message to Telegram (from Antigravity, auth required)
  if (url.pathname === '/telegram' && req.method === 'POST') {
    if (!authenticateRequest(req, res)) return;
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        await sendTelegram(data.message);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // Get task status
  if (url.pathname.startsWith('/task/')) {
    const taskId = url.pathname.split('/')[2];
    const result = results.get(taskId);
    if (result) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ taskId, result }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Task not found' }));
    }
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`\n🌉 OpenClaw Bridge Server`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`📱 Telegram: ${TELEGRAM_CHAT_ID}`);
  console.log(`\nEndpoints:`);
  console.log(`  POST /task     - Receive task from OpenClaw`);
  console.log(`  POST /telegram - Send message to Telegram`);
  console.log(`  GET  /health   - Health check\n`);
  
  // Send startup notification
  sendTelegram('🌉 OpenClaw Bridge started!\n\nReady to receive commands.');
});
