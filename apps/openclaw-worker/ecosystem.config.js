/**
 * PM2 Ecosystem Configuration for OpenClaw
 *
 * Apps:
 *   tom-hum         — Autonomous task dispatch daemon (restarts every 6h)
 *   openclaw-bridge — Bridge HTTP server
 *   openclaw-tunnel — Serveo.net tunnel manager
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 logs tom-hum
 *   pm2 monit
 */

module.exports = {
  apps: [
    {
      name: 'tom-hum',
      script: 'task-watcher.js',
      cwd: __dirname,
      max_memory_restart: '200M',
      restart_delay: 5000,
      autorestart: true,
      watch: false,
      cron_restart: '0 */6 * * *',
      max_restarts: 50,
      min_uptime: '10s',
      kill_timeout: 10000,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/Users/macbookprom1/tom_hum_pm2_error.log',
      out_file: '/Users/macbookprom1/tom_hum_pm2_out.log',
      env: {
        NODE_ENV: 'production',
        MEKONG_DIR: '/Users/macbookprom1/mekong-cli',
        TOM_HUM_LOG: '/Users/macbookprom1/tom_hum_cto.log',
      },
    },
    {
      name: 'openclaw-bridge',
      script: 'bridge-server.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        PORT: 8765,
      },
    },
    {
      name: 'openclaw-tunnel',
      script: 'tunnel-manager.sh',
      cwd: __dirname,
      interpreter: '/bin/bash',
      instances: 1,
      autorestart: true,
      watch: false,
      restart_delay: 5000,
    },
    {
      // 🔒 ĐIỀU 56: PORT 9191 — KHÓA CỨNG, CẤM THAY ĐỔI
      name: 'antigravity-proxy',
      script: 'antigravity-claude-proxy',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        PORT: 9191,
        FALLBACK: 'true',
        NODE_ENV: 'production',
      },
    },
  ],
};
