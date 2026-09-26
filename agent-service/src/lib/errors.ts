import type { Response } from 'express';

export interface AgentServiceError {
  code: string;
  message: string;
  details?: unknown;
}

export function sendAgentError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown
) {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
      details: details || null,
    },
  });
}
