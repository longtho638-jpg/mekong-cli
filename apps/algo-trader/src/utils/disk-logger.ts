/**
 * Disk Usage Logger for RaaS Telemetry
 * Logs disk metrics to Winston logger
 */
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/disk-usage.log' })
  ]
});

export function logDiskUsage(context: string): void {
  const output = require('node:child_process').execSync('df -k / | tail -1').toString().trim();
  const parts = output.split(/\s+/);

  logger.info({
    context,
    timestamp: new Date().toISOString(),
    disk: {
      total_kb: parseInt(parts[1]),
      used_kb: parseInt(parts[2]),
      free_kb: parseInt(parts[3]),
      percent_used: Math.round((parseInt(parts[2]) / parseInt(parts[1])) * 100)
    }
  });
}

export { logger };
