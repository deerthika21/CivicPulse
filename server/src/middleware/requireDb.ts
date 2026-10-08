import type { NextFunction, Request, Response } from 'express';
import { dbState } from '../config/db.js';

/** Routes that work without MongoDB. */
const DB_FREE = new Set(['/health', '/meta']);

/**
 * Fail fast with 503 while MongoDB is unreachable, instead of letting Mongoose
 * buffer the query for ~10 s and then throw a confusing 500.
 */
export function requireDb(req: Request, res: Response, next: NextFunction): void {
  if (DB_FREE.has(req.path) || dbState() === 'connected') return next();
  res.status(503).json({ error: 'Database unavailable right now. Please try again in a moment.' });
}
