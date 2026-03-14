/**
 * PM2 Ecosystem — Mekong CLI Full Platform
 * Usage: pm2 start mekong/daemon/ecosystem.config.js
 * Or:    mekong up (wrapper command)
 */
const path = require('path');
const ROOT = process.env.MEKONG_ROOT || path.resolve(__dirname, '../..');

// Profiles: minimal (3 apps), standard (8), full (all)
const PROFILE = process.env.MEKONG_PROFILE || 'standard';

const INFRA = [
  {
    name: 'gateway',
    script: 'uvicorn',
    args: 'src.gateway:app --host 0.0.0.0 --port 8000 --workers 1',
    cwd: ROOT,
    interpreter: 'none',
    max_memory_restart: '300M',
    env: { PYTHONPATH: ROOT },
  },
  {
    name: 'license-server',
    script: 'uvicorn',
    args: 'src.api.license_server:app --host 0.0.0.0 --port 8787',
    cwd: ROOT,
    interpreter: 'none',
    max_memory_restart: '200M',
    env: { PYTHONPATH: ROOT },
  },
];

const DAEMONS_STANDARD = [
  {
    name: 'heartbeat-scheduler',
    script: 'python3',
    args: '-m src.daemon.heartbeat_scheduler',
    cwd: ROOT,
    max_memory_restart: '200M',
    cron_restart: '0 */6 * * *',
    env: { PYTHONPATH: ROOT },
  },
  {
    name: 'cto-daemon',
    script: 'cto-daemon.sh',
    cwd: ROOT,
    interpreter: '/bin/bash',
    max_memory_restart: '100M',
    cron_restart: '0 */6 * * *',
  },
  {
    name: 'mission-control',
    script: 'python3',
    args: '-c "from src.daemon.mission_control import get_status_summary; import json; print(json.dumps(get_status_summary(), indent=2))"',
    cwd: ROOT,
    max_memory_restart: '100M',
    cron_restart: '0 */5 * * *',  // Update every 5 minutes
    env: { PYTHONPATH: ROOT },
  },
];

const DAEMONS_FULL = [
  {
    name: 'daemon-router',
    script: 'mekong/daemon/daemons/dispatcher-daemon.js',
    cwd: ROOT,
    node_args: '--max_old_space_size=256',
    max_memory_restart: '300M',
  },
  {
    name: 'daemon-builder',
    script: 'mekong/daemon/daemons/builder-daemon.js',
    cwd: ROOT,
    node_args: '--max_old_space_size=256',
    max_memory_restart: '300M',
  },
  {
    name: 'daemon-reviewer',
    script: 'mekong/daemon/daemons/reviewer-daemon.js',
    cwd: ROOT,
    node_args: '--max_old_space_size=256',
    max_memory_restart: '300M',
  },
  {
    name: 'daemon-intel',
    script: 'mekong/daemon/daemons/hunter-daemon.js',
    cwd: ROOT,
    node_args: '--max_old_space_size=256',
    max_memory_restart: '300M',
  },
  {
    name: 'daemon-health',
    script: 'mekong/daemon/daemons/operator-daemon.js',
    cwd: ROOT,
    node_args: '--max_old_space_size=256',
    max_memory_restart: '300M',
  },
];

const BOTS = [
  {
    name: 'telegram-bot',
    script: 'python3',
    args: '-m src.core.telegram_bot',
    cwd: ROOT,
    max_memory_restart: '200M',
    env: { PYTHONPATH: ROOT },
  },
];

// Build app list based on profile
let apps = [];
if (PROFILE === 'minimal') {
  apps = [...INFRA.slice(0, 1), ...DAEMONS_STANDARD.slice(0, 1)];
} else if (PROFILE === 'standard') {
  apps = [...INFRA, ...DAEMONS_STANDARD, ...BOTS];
} else {
  apps = [...INFRA, ...DAEMONS_STANDARD, ...DAEMONS_FULL, ...BOTS];
}

// Common settings for all apps
apps = apps.map(app => ({
  ...app,
  autorestart: true,
  watch: false,
  merge_logs: true,
  log_date_format: 'YYYY-MM-DD HH:mm:ss',
  error_file: path.join(ROOT, '.mekong', 'logs', `${app.name}-error.log`),
  out_file: path.join(ROOT, '.mekong', 'logs', `${app.name}-out.log`),
}));

module.exports = { apps };
