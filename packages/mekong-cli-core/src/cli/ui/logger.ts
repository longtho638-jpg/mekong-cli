import winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

const cliFormat = printf(({ level, message, timestamp: ts }) => {
  return `${ts} [${level}] ${message}`;
});

/** CLI logger instance */
export const logger = winston.createLogger({
  level: process.env.MEKONG_LOG_LEVEL ?? 'info',
  format: combine(
    timestamp({ format: 'HH:mm:ss' }),
    cliFormat,
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'HH:mm:ss' }),
        cliFormat,
      ),
    }),
  ],
});

/** Set log level at runtime */
export function setLogLevel(level: string): void {
  logger.level = level;
}
