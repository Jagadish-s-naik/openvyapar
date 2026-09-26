import type { Response } from 'express';

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  details?: unknown
): void {
  res.status(statusCode).json({
    success: false,
    error: {
      code: statusCode,
      message,
      details: details || null,
    },
  });
}
