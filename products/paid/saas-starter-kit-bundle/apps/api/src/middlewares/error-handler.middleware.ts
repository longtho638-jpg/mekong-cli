import { NextFunction, Request, Response } from 'express';
import { AppError, InternalServerError } from '../utils/errors';
import Logger from '../utils/logger';
import { sendError } from '../utils/response';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Logger.error(err.message, { stack: err.stack });

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  // Handle SyntaxError (e.g. invalid JSON)
  if (err instanceof SyntaxError && 'body' in err) {
    return sendError(res, 'Invalid JSON payload', 400);
  }

  // Handle default Error
  const internalError = new InternalServerError();
  return sendError(res, internalError.message, internalError.statusCode);
};
