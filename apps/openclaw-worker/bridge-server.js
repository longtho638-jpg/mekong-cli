const http = require("http");
const { spawn, exec } = require("child_process");
const fs = require("fs");

const PORT = 8765;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Helper: Send Telegram Notification
async function sendTelegram(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: text })
    });
    // Silent fail if network error, don't crash bridge
  } catch (e) {
    console.error("Telegram notification failed:", e.message);
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS handles requests from the Worker
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url.pathname === "/task" && req.method === "POST") {
    // Handle delegation to CC CLI / Antigravity
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        const taskId = `task_${Date.now()}`;

        // Send acknowledgment to Telegram
        await sendTelegram(
          `📥 Task received: ${data.task ? data.task.slice(0, 100) : 'No content'}\n\n🔑 ID: ${taskId}`
        );

        // Execute shell or write to task file
        if (data.task && data.task.startsWith("!")) {
          const cmd = data.task.slice(1);
          exec(cmd, (error, stdout, stderr) => {
            sendTelegram(`Executed: ${cmd}\n\n${stdout || stderr || 'No output'}`);
          });
        } else if (data.task) {
          // Write to /tmp for Task Watcher to pick up? 
          // Task Watcher watches `config.WATCH_DIR` (/Users/macbookprom1/mekong-cli/tasks)
          // `bridge_server.md` said `/tmp/openclaw_task_...`?
          // I should verify where `task-watcher.js` looks.
          // config.js says `WATCH_DIR: path.join(MEKONG_DIR, 'tasks')`.
          // So I should write to `tasks/` folder!
          const taskDir = process.env.MEKONG_DIR ? `${process.env.MEKONG_DIR}/tasks` : path.join(__dirname, '../../tasks');
          const taskFile = `${taskDir}/mission_${taskId}.txt`;
          fs.writeFileSync(taskFile, data.task);
          console.log(`Task written to ${taskFile}`);
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, taskId }));
      } catch (e) {
        console.error("Error processing task:", e);
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  }

  else if (url.pathname === "/telegram" && req.method === "POST") {
    // Internal tools send messages back to Telegram
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        if (data.message) {
            await sendTelegram(data.message);
        }
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500);
        res.end();
      }
    });
  } else if (url.pathname === "/health" && req.method === "GET") {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: "online", timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => console.log(`Bridge listening on ${PORT}`));
