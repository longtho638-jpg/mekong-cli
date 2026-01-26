import { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import Logger from '../utils/logger';

const stream = {
  write: (message: string) => Logger.http(message.trim()),
};

const skip = () => {
  const env = process.env.NODE_ENV || 'development';
  return env !== 'development';
};

export const loggingMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream, skip }
);

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  Logger.info(`Incoming Request: ${req.method} ${req.url}`);
  next();
};
