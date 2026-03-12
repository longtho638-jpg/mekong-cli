/**
 * PM2 Ecosystem Configuration
 *
 * Runs 3 Polymarket strategies in parallel with:
 * - Memory limits (512MB each)
 * - Auto-restart on crash
 * - Log rotation (daily)
 * - Environment isolation
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 start ecosystem.config.js --only=strategy-complementary
 *   pm2 stop ecosystem.config.js
 *   pm2 monit
 */

module.exports = {
  apps: [
    {
      name: 'strategy-complementary',
      script: 'dist/index.js',
      args: 'polymarket:strategy ComplementaryArb',
      instances: 1,
      exec_mode: 'fork',
      watch: false,

      // Memory & Performance
      max_memory_restart: '512M',
      kill_timeout: 3000,
      wait_ready: true,
      listen_timeout: 5000,

      // Auto-restart
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s',

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      log_file: 'logs/pm2/strategy-complementary-out.log',
      error_file: 'logs/pm2/strategy-complementary-error.log',
      merge_logs: true,

      // Environment
      env: {
        NODE_ENV: 'production',
        STRATEGY_NAME: 'ComplementaryArb',
        PORT: '3001',
      },
    },
    {
      name: 'strategy-maker',
      script: 'dist/index.js',
      args: 'polymarket:strategy MakerBot',
      instances: 1,
      exec_mode: 'fork',
      watch: false,

      // Memory & Performance
      max_memory_restart: '512M',
      kill_timeout: 3000,
      wait_ready: true,
      listen_timeout: 5000,

      // Auto-restart
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s',

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      log_file: 'logs/pm2/strategy-maker-out.log',
      error_file: 'logs/pm2/strategy-maker-error.log',
      merge_logs: true,

      // Environment
      env: {
        NODE_ENV: 'production',
        STRATEGY_NAME: 'MakerBot',
        PORT: '3002',
      },
    },
    {
      name: 'strategy-weather',
      script: 'dist/index.js',
      args: 'polymarket:strategy WeatherBot',
      instances: 1,
      exec_mode: 'fork',
      watch: false,

      // Memory & Performance
      max_memory_restart: '512M',
      kill_timeout: 3000,
      wait_ready: true,
      listen_timeout: 5000,

      // Auto-restart
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s',

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      log_file: 'logs/pm2/strategy-weather-out.log',
      error_file: 'logs/pm2/strategy-weather-error.log',
      merge_logs: true,

      // Environment
      env: {
        NODE_ENV: 'production',
        STRATEGY_NAME: 'WeatherBot',
        PORT: '3003',
      },
    },
    {
      name: 'daemon-manager',
      script: 'dist/daemon/daemon-manager.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,

      // Memory & Performance
      max_memory_restart: '256M',
      kill_timeout: 3000,
      wait_ready: true,
      listen_timeout: 5000,

      // Auto-restart
      restart_delay: 1000,
      max_restarts: 5,
      min_uptime: '5s',

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      log_file: 'logs/pm2/daemon-manager-out.log',
      error_file: 'logs/pm2/daemon-manager-error.log',
      merge_logs: true,

      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
        HEALTH_CHECK_INTERVAL: '30000',
        STRATEGIES: 'ComplementaryArb,MakerBot,WeatherBot',
      },
    },
  ],
};
