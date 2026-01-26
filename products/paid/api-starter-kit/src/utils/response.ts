import { Response } from 'express';

export const sendResponse = (
  res: Response,
  statusCode: number,
  success: boolean,
  data: any = null,
  message: string = ''
) => {
  const response = {
    success,
    message,
    data,
  };

  return res.status(statusCode).json(response);
};

export const sendSuccess = (
  res: Response,
  data: any,
  message: string = 'Success',
  statusCode: number = 200
) => {
  return sendResponse(res, statusCode, true, data, message);
};

export const sendError = (
  res: Response,
  message: string = 'Error',
  statusCode: number = 500,
  error: any = null
) => {
  return sendResponse(res, statusCode, false, error, message);
};
