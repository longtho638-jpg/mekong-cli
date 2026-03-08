import * as winston from 'winston';

const logFormat = winston.format.printf((info: winston.Logform.TransformableInfo) => {
  const { level, message, timestamp } = info;
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

// Determine log level based on environment
const logLevel = process.env.NODE_ENV === 'test' || process.env.LOG_LEVEL === 'quiet'
  ? 'error'
  : (process.env.LOG_LEVEL || 'info');

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    ...(process.env.NODE_ENV !== 'test'
      ? [
          new winston.transports.File({
            filename: 'error.log',
            level: 'error',
            dirname: 'logs'
          }),
          new winston.transports.File({
            filename: 'combined.log',
            dirname: 'logs'
          })
        ]
      : [])
  ]
}) as winston.Logger & { critical: (message: string) => void };

// Add critical alias for emergencies
logger.critical = (message: string) => logger.error(`[CRITICAL] ${message}`);
