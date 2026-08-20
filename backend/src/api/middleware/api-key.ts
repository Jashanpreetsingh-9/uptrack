import type { Request, Response, NextFunction } from 'express';

/** Prefer X-Uptrack-Key - API Gateway reserves X-API-Key for its own usage-plan keys. */
export function apiKeyAuth(expectedKey: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const provided =
      req.header('X-Uptrack-Key')?.trim() ||
      req.header('X-API-Key')?.trim();

    if (!provided || provided !== expectedKey.trim()) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    next();
  };
}
