import type { Request, Response, NextFunction } from 'express';

export function apiKeyAuth(expectedKey: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const provided = req.header('X-API-Key');
    if (!provided || provided !== expectedKey) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    next();
  };
}
