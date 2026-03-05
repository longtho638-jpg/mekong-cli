import * as winston from 'winston';

const logFormat = winston.format.printf((info: winston.Logform.TransformableInfo) => {
  const { level, message, timestamp } = info;
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

export const logger = winston.createLogger({
  level: 'info',
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
}) as winston.Logger & { critical: (message: string) => void };

// Add critical alias for emergencies
logger.critical = (message: string) => logger.error(`[CRITICAL] ${message}`);
